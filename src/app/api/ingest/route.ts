import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApifyJobResult } from "@/lib/types";

const CONTRACT_TERMS = ["contract", "contractor", "freelance", "temp", "temporary", "1099"];

function isContract(job: ApifyJobResult): boolean {
  // Check attribute values (e.g. "CF3CP": "Contract")
  if (job.attributes) {
    const attrValues = Object.values(job.attributes).map((v) => v.toLowerCase());
    if (attrValues.some((v) => CONTRACT_TERMS.some((t) => v.includes(t)))) return true;
  }
  // Fall back to title
  const title = job.title?.toLowerCase() ?? "";
  return CONTRACT_TERMS.some((t) => title.includes(t));
}

function extractJobTypes(job: ApifyJobResult): string[] {
  if (!job.attributes) return [];
  const typeKeywords = [
    "contract", "full-time", "part-time", "temporary", "freelance",
    "internship", "remote", "hybrid", "on-site",
  ];
  return Object.values(job.attributes).filter((v) =>
    typeKeywords.some((k) => v.toLowerCase().includes(k))
  );
}

function normalizeSalaryType(unitOfWork?: string): string | null {
  if (!unitOfWork) return null;
  const u = unitOfWork.toUpperCase();
  if (u === "YEAR") return "yearly";
  if (u === "HOUR") return "hourly";
  return unitOfWork.toLowerCase();
}

function isRemote(job: ApifyJobResult): boolean {
  if (job.attributes) {
    const vals = Object.values(job.attributes).map((v) => v.toLowerCase());
    if (vals.some((v) => v.includes("remote"))) return true;
  }
  return job.title?.toLowerCase().includes("remote") ?? false;
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
    const jobkey = job.key ?? job.refNum ?? job.url ?? job.jobUrl ?? "";
    const city = job.location?.city ?? null;
    const state = job.location?.admin1Code ?? null;
    const formattedLocation = [city, state].filter(Boolean).join(", ") || null;

    return {
      jobkey,
      title: job.title,
      normalized_title: null,
      company: job.employer?.name ?? null,
      company_id: null,
      company_rating: job.employer?.ratingsValue ?? null,
      location_city: city,
      location_state: state,
      formatted_location: formattedLocation,
      is_remote: isRemote(job),
      salary_min: job.baseSalary?.min ?? null,
      salary_max: job.baseSalary?.max ?? null,
      salary_type: normalizeSalaryType(job.baseSalary?.unitOfWork),
      salary_snippet: null,
      job_types: extractJobTypes(job),
      snippet: job.description?.text?.slice(0, 500) ?? null,
      apply_url: job.jobUrl ?? job.url ?? null,
      indeed_apply: false,
      sponsored: job.isPlacement ?? false,
      urgently_hiring: job.isUrgentHire ?? false,
      apply_count: null,
      published_at: job.datePublished ?? job.dateOnIndeed ?? null,
      expired: job.expired ?? false,
      scraped_at: new Date().toISOString(),
      raw: job,
    };
  });

  // Drop rows with no usable jobkey
  const validRows = rows.filter((r) => r.jobkey.length > 0);

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
