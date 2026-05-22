import { NextRequest, NextResponse } from "next/server";

// Triggered by Vercel cron daily.
// Fires all three scrapers in parallel — each webhooks results to /api/ingest?source=<name>.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Apify not configured" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const webhookSecret = process.env.APIFY_WEBHOOK_SECRET;

  function webhook(source: string) {
    return [
      {
        eventTypes: ["ACTOR.RUN.SUCCEEDED"],
        requestUrl: `${siteUrl}/api/ingest?source=${source}`,
        headersTemplate: `{"x-webhook-secret": "${webhookSecret}"}`,
        payloadTemplate: `{"results": {{outputBody}}}`,
      },
    ];
  }

  async function runActor(actorId: string, input: Record<string, unknown>, source: string) {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actorId.replace("/", "~")}/runs?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, webhooks: webhook(source) }),
      }
    );
    const text = await res.text();
    if (!res.ok) return { source, error: text };
    const data = JSON.parse(text);
    return { source, runId: data.data?.id };
  }

  // ── Indeed ──────────────────────────────────────────────────────────────────
  const indeedUrls = [
    "https://www.indeed.com/jobs?q=accountant%2C+CPA%2C+controller%2C+CFO%2C+finance+manager&sc=0kf%3Aattr%28NJXCK%29%3B&sort=date",
    "https://www.indeed.com/jobs?q=bookkeeper%2C+accounts+payable%2C+accounts+receivable%2C+billing+specialist&sc=0kf%3Aattr%28NJXCK%29%3B&sort=date",
    "https://www.indeed.com/jobs?q=tax+accountant%2C+tax+preparer%2C+auditor%2C+audit%2C+tax+manager&sc=0kf%3Aattr%28NJXCK%29%3B&sort=date",
    "https://www.indeed.com/jobs?q=payroll%2C+cost+accountant%2C+financial+analyst%2C+budget+analyst%2C+grant+accountant&sc=0kf%3Aattr%28NJXCK%29%3B&sort=date",
  ];

  // ── LinkedIn (curious_coder/linkedin-jobs-scraper) ───────────────────────────
  // f_JT=C = Contract, f_TPR=r86400 = posted last 24h, sortBy=DD = newest first
  const linkedInUrls = [
    "https://www.linkedin.com/jobs/search/?keywords=accountant+CPA+controller+CFO&f_JT=C&f_TPR=r86400&sortBy=DD",
    "https://www.linkedin.com/jobs/search/?keywords=bookkeeper+accounts+payable+accounts+receivable&f_JT=C&f_TPR=r86400&sortBy=DD",
    "https://www.linkedin.com/jobs/search/?keywords=tax+accountant+auditor+payroll&f_JT=C&f_TPR=r86400&sortBy=DD",
    "https://www.linkedin.com/jobs/search/?keywords=financial+analyst+cost+accountant+budget+analyst&f_JT=C&f_TPR=r86400&sortBy=DD",
  ];

  // ── ZipRecruiter (bebity/ziprecruiter-scraper) ───────────────────────────────
  const zipQueries = [
    { search: "accountant CPA controller CFO contract", location: "" },
    { search: "bookkeeper accounts payable accounts receivable contract", location: "" },
    { search: "tax accountant auditor payroll contract", location: "" },
    { search: "financial analyst cost accountant budget analyst contract", location: "" },
  ];

  const [indeedResult, linkedInResult] = await Promise.all([
    runActor("borderline/indeed-scraper", { urls: indeedUrls, maxItems: 800 }, "indeed"),
    runActor("curious_coder/linkedin-jobs-scraper", { urls: linkedInUrls, maxResults: 500 }, "linkedin"),
  ]);

  return NextResponse.json({ sources: [indeedResult, linkedInResult] });
}
