import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { IndeedJobResult, LinkedInJobResult, ZipRecruiterJobResult } from "@/lib/types";

// ── Contract detection ───────────────────────────────────────────────────────

const CONTRACT_TYPES = new Set([
  "contract", "contractor", "freelance", "temp", "temporary",
  "1099", "1099 contract", "1099 contractor",
]);
const CONTRACT_TITLE_TERMS = ["contract", "contractor", "freelance", "1099", "fractional"];

function isContractType(type: string) {
  const t = type.toLowerCase().trim();
  return CONTRACT_TYPES.has(t) || t.startsWith("1099");
}

function isContractByTitle(title: string) {
  const t = title.toLowerCase();
  return CONTRACT_TITLE_TERMS.some((kw) => t.includes(kw));
}

// ── State parser ─────────────────────────────────────────────────────────────

function parseState(location?: string | null): string | null {
  if (!location) return null;
  const match = location.match(/,\s*([A-Z]{2})(\s|$|\d)/);
  return match ? match[1] : null;
}

// ── Row shape ────────────────────────────────────────────────────────────────

type JobRow = {
  jobkey: string;
  source: string;
  title: string;
  normalized_title: null;
  company: string | null;
  company_id: null;
  company_rating: null;
  location_city: string | null;
  location_state: string | null;
  formatted_location: string | null;
  is_remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  salary_type: string | null;
  salary_snippet: string | null;
  job_types: string[];
  snippet: string | null;
  apply_url: string | null;
  indeed_apply: boolean;
  sponsored: boolean;
  urgently_hiring: boolean;
  apply_count: null;
  published_at: string | null;
  expired: boolean;
  scraped_at: string;
  raw: unknown;
};

// ── Normalizers ──────────────────────────────────────────────────────────────

function normalizeIndeed(job: IndeedJobResult): JobRow | null {
  if (!job.jobKey || !job.title) return null;

  const types = job.jobType ?? [];
  const isContract = types.some(isContractType) || isContractByTitle(job.title);
  if (!isContract) return null;

  return {
    jobkey: `ind_${job.jobKey}`,
    source: "indeed",
    title: job.title,
    normalized_title: null,
    company: job.companyName ?? null,
    company_id: null,
    company_rating: null,
    location_city: job.location?.city ?? null,
    location_state: parseState(job.location?.formattedAddressShort),
    formatted_location: job.location?.formattedAddressShort ?? null,
    is_remote: job.isRemote ?? false,
    salary_min: null,
    salary_max: null,
    salary_type: job.salary?.salaryType ?? null,
    salary_snippet: job.salary?.salaryText ?? null,
    job_types: types,
    snippet: job.descriptionText?.slice(0, 500) ?? null,
    apply_url: job.applyUrl ?? job.jobUrl ?? null,
    indeed_apply: !job.applyUrl && !!job.jobUrl,
    sponsored: false,
    urgently_hiring: job.hiringDemand?.isUrgentHire ?? false,
    apply_count: null,
    published_at: job.datePublished ?? null,
    expired: job.expired ?? false,
    scraped_at: new Date().toISOString(),
    raw: job,
  };
}

function normalizeLinkedIn(job: LinkedInJobResult): JobRow | null {
  if (!job.id || !job.title) return null;

  const empType = job.employmentType ?? "";
  const isContract = isContractType(empType) || isContractByTitle(job.title);
  if (!isContract) return null;

  const location = job.location ?? null;
  const isRemote = job.workRemoteAllowed ?? /remote/i.test(location ?? "");

  return {
    jobkey: `li_${job.id}`,
    source: "linkedin",
    title: job.title,
    normalized_title: null,
    company: job.companyName ?? null,
    company_id: null,
    company_rating: null,
    location_city: null,
    location_state: parseState(location),
    formatted_location: location,
    is_remote: isRemote,
    salary_min: null,
    salary_max: null,
    salary_type: null,
    salary_snippet: typeof job.salary === "string" ? job.salary : null,
    job_types: empType ? [empType] : [],
    snippet: job.descriptionText?.slice(0, 500) ?? null,
    apply_url: job.applyUrl ?? job.link ?? null,
    indeed_apply: false,
    sponsored: false,
    urgently_hiring: false,
    apply_count: null,
    published_at: job.postedAt ?? null,
    expired: false,
    scraped_at: new Date().toISOString(),
    raw: job,
  };
}

function normalizeZipRecruiter(job: ZipRecruiterJobResult): JobRow | null {
  if (!job.id || !job.title) return null;

  const jobType = job.jobType ?? "";
  const isContract = isContractType(jobType) || isContractByTitle(job.title);
  if (!isContract) return null;

  const location = (job.location ?? [job.city, job.state].filter(Boolean).join(", ")) || null;
  const isRemote = /remote/i.test(location ?? "");

  return {
    jobkey: `zr_${job.id}`,
    source: "ziprecruiter",
    title: job.title,
    normalized_title: null,
    company: job.company ?? null,
    company_id: null,
    company_rating: null,
    location_city: job.city ?? null,
    location_state: job.state ?? parseState(location),
    formatted_location: location,
    is_remote: isRemote,
    salary_min: job.salaryMin ?? null,
    salary_max: job.salaryMax ?? null,
    salary_type: job.salaryInterval ?? null,
    salary_snippet: job.salary ?? null,
    job_types: jobType ? [jobType] : [],
    snippet: job.description?.slice(0, 500) ?? null,
    apply_url: job.url ?? null,
    indeed_apply: false,
    sponsored: false,
    urgently_hiring: false,
    apply_count: null,
    published_at: job.postedDate ?? null,
    expired: false,
    scraped_at: new Date().toISOString(),
    raw: job,
  };
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.APIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const source = new URL(req.url).searchParams.get("source") ?? "indeed";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw: unknown[] = Array.isArray(body)
    ? body
    : ((body as { results?: unknown[] }).results ?? []);

  if (!raw.length) {
    return NextResponse.json({ upserted: 0, filtered: 0, source });
  }

  // Normalize based on source
  let rows: (JobRow | null)[];
  if (source === "linkedin") {
    rows = (raw as LinkedInJobResult[]).map(normalizeLinkedIn);
  } else if (source === "ziprecruiter") {
    rows = (raw as ZipRecruiterJobResult[]).map(normalizeZipRecruiter);
  } else {
    rows = (raw as IndeedJobResult[]).map(normalizeIndeed);
  }

  const filtered = rows.filter((r): r is JobRow => r !== null);

  if (!filtered.length) {
    return NextResponse.json({ upserted: 0, filtered: raw.length, source });
  }

  // Deduplicate within batch
  const seen = new Set<string>();
  const validRows = filtered.filter((r) => {
    if (seen.has(r.jobkey)) return false;
    seen.add(r.jobkey);
    return true;
  });

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("jobs")
    .upsert(validRows, { onConflict: "jobkey", ignoreDuplicates: false });

  if (error) {
    console.error(`Ingest error (${source}):`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Expire jobs from this source not seen in 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: expiredRows } = await supabase
    .from("jobs")
    .update({ expired: true })
    .eq("source", source)
    .lt("scraped_at", cutoff)
    .eq("expired", false)
    .select("id");

  return NextResponse.json({
    source,
    upserted: validRows.length,
    filtered: raw.length - filtered.length,
    expired: expiredRows?.length ?? 0,
  });
}
