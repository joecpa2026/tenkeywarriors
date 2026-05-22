import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApifyJobResult } from "@/lib/types";

const CONTRACT_JOB_TYPES = new Set([
  "contract", "contractor", "freelance", "temp", "temporary",
  "1099", "1099 contract", "1099 contractor",
]);

const CONTRACT_TITLE_TERMS = ["contract", "contractor", "freelance", "1099", "fractional"];

function isContract(job: ApifyJobResult): boolean {
  if (job.jobType?.length) {
    const types = job.jobType.map((t) => t.toLowerCase().trim());
    if (types.some((t) => CONTRACT_JOB_TYPES.has(t) || t.startsWith("1099"))) return true;
  }
  const title = job.title?.toLowerCase() ?? "";
  return CONTRACT_TITLE_TERMS.some((t) => title.includes(t));
}

function extractJobTypes(job: ApifyJobResult): string[] {
  return job.jobType ?? [];
}

// Extract state abbreviation from "City, ST" or "City, ST 12345"
function parseState(formattedAddress?: string): string | null {
  if (!formattedAddress) return null;
  const match = formattedAddress.match(/,\s*([A-Z]{2})/);
  return match ? match[1] : null;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.APIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items: ApifyJobResult[] = Array.isArray(body)
    ? (body as ApifyJobResult[])
    : ((body as { results?: ApifyJobResult[] }).results ?? []);

  if (!items.length) {
    return NextResponse.json({ upserted: 0, filtered: 0 });
  }

  const contractOnly = items.filter(isContract);

  if (!contractOnly.length) {
    return NextResponse.json({ upserted: 0, filtered: items.length });
  }

  const supabase = createServiceClient();

  const rows = contractOnly.map((job) => {
    const city = job.location?.city ?? null;
    const state = parseState(job.location?.formattedAddressShort);
    const formattedLocation = job.location?.formattedAddressShort ?? null;

    return {
      jobkey: job.jobKey,
      title: job.title,
      normalized_title: null,
      company: job.companyName ?? null,
      company_id: null,
      company_rating: job.rating?.rating ?? null,
      location_city: city,
      location_state: state,
      formatted_location: formattedLocation,
      is_remote: job.isRemote ?? false,
      salary_min: null,
      salary_max: null,
      salary_type: job.salary?.salaryType ?? null,
      salary_snippet: job.salary?.salaryText ?? null,
      job_types: extractJobTypes(job),
      snippet: job.descriptionText?.slice(0, 500) ?? null,
      apply_url: job.applyUrl ?? job.jobUrl ?? null,
      indeed_apply: false,
      sponsored: false,
      urgently_hiring: job.hiringDemand?.isUrgentHire ?? false,
      apply_count: null,
      published_at: job.datePublished ?? null,
      expired: job.expired ?? false,
      scraped_at: new Date().toISOString(),
      raw: job,
    };
  });

  // Drop rows with no usable jobkey, then deduplicate within this batch
  const seen = new Set<string>();
  const validRows = rows.filter((r) => {
    if (!r.jobkey || seen.has(r.jobkey)) return false;
    seen.add(r.jobkey);
    return true;
  });

  const { error } = await supabase
    .from("jobs")
    .upsert(validRows, { onConflict: "jobkey", ignoreDuplicates: false });

  if (error) {
    console.error("Ingest error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    upserted: validRows.length,
    filtered: items.length - contractOnly.length,
  });
}
