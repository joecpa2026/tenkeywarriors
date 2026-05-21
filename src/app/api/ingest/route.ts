import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApifyJobResult } from "@/lib/types";

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

  // Apify sends either the dataset items directly or wraps them
  const items: ApifyJobResult[] = Array.isArray(body)
    ? (body as ApifyJobResult[])
    : ((body as { results?: ApifyJobResult[] }).results ?? []);

  if (!items.length) {
    return NextResponse.json({ inserted: 0, updated: 0 });
  }

  const supabase = createServiceClient();

  const rows = items.map((job) => ({
    jobkey: job.jobkey,
    title: job.title,
    normalized_title: job.normalized_title ?? null,
    company: job.company ?? null,
    company_id: job.company_id ?? null,
    company_rating: job.company_rating ?? null,
    location_city: job.job_location_city ?? null,
    location_state: job.job_location_state ?? null,
    formatted_location: job.formatted_location ?? null,
    is_remote: job.remote_location ?? false,
    salary_min: job.extracted_salary?.min ?? null,
    salary_max: job.extracted_salary?.max ?? null,
    salary_type: job.extracted_salary?.type ?? null,
    salary_snippet: job.salary_snippet ?? null,
    job_types: job.job_types ?? null,
    snippet: job.snippet ?? null,
    apply_url: job.third_party_apply_url ?? job.link ?? null,
    indeed_apply: job.indeed_apply_enabled ?? false,
    sponsored: job.sponsored ?? false,
    urgently_hiring: job.urgently_hiring ?? false,
    apply_count: job.organic_apply_start_count ?? null,
    published_at: job.publication_date ?? job.create_date ?? null,
    expired: job.expired ?? false,
    scraped_at: new Date().toISOString(),
    raw: job,
  }));

  const { error } = await supabase
    .from("jobs")
    .upsert(rows, { onConflict: "jobkey", ignoreDuplicates: false });

  if (error) {
    console.error("Ingest error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ upserted: rows.length });
}
