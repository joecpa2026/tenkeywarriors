import { NextRequest, NextResponse } from "next/server";

// Triggered by Vercel cron at 2am daily.
// Kicks off the Apify Indeed scraper, which webhooks results to /api/ingest.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // borderline/indeed-scraper
  const actorId = process.env.APIFY_ACTOR_ID ?? "borderline/indeed-scraper";
  const token = process.env.APIFY_API_TOKEN;

  if (!actorId || !token) {
    return NextResponse.json({ error: "Apify not configured" }, { status: 500 });
  }

  // Indeed search URLs with contract filter (NJXCK) pre-applied, sorted by date.
  // Four queries cover the full accounting/finance domain.
  const searchUrls = [
    // Core accounting & leadership
    "https://www.indeed.com/jobs?q=accountant%2C+CPA%2C+controller%2C+CFO%2C+finance+manager&sc=0kf%3Aattr%28NJXCK%29%3B&sort=date",
    // Bookkeeping, AP/AR, billing
    "https://www.indeed.com/jobs?q=bookkeeper%2C+accounts+payable%2C+accounts+receivable%2C+billing+specialist&sc=0kf%3Aattr%28NJXCK%29%3B&sort=date",
    // Tax, audit, compliance
    "https://www.indeed.com/jobs?q=tax+accountant%2C+tax+preparer%2C+auditor%2C+audit%2C+tax+manager&sc=0kf%3Aattr%28NJXCK%29%3B&sort=date",
    // Payroll, FP&A, cost, specialty
    "https://www.indeed.com/jobs?q=payroll%2C+cost+accountant%2C+financial+analyst%2C+budget+analyst%2C+grant+accountant&sc=0kf%3Aattr%28NJXCK%29%3B&sort=date",
  ];

  const ingestUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/ingest`;

  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId.replace("/", "~")}/runs?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: searchUrls,
        maxItems: 800,
        webhooks: [
          {
            eventTypes: ["ACTOR.RUN.SUCCEEDED"],
            requestUrl: ingestUrl,
            headersTemplate: `{"x-webhook-secret": "${process.env.APIFY_WEBHOOK_SECRET}"}`,
            payloadTemplate: `{"results": {{outputBody}}}`,
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: "Apify error", detail: text }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ started: true, runId: data.data?.id });
}
