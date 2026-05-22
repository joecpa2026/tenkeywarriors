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

  function webhook(source: string, useDataset = false) {
    return [
      {
        eventTypes: ["ACTOR.RUN.SUCCEEDED"],
        requestUrl: `${siteUrl}/api/ingest?source=${source}`,
        headersTemplate: `{"x-webhook-secret": "${webhookSecret}"}`,
        payloadTemplate: useDataset
          ? `{"datasetId": "{{resource.defaultDatasetId}}"}`
          : `{"results": {{outputBody}}}`,
      },
    ];
  }

  async function runActor(actorId: string, input: Record<string, unknown>, source: string, useDataset = false) {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actorId.replace("/", "~")}/runs?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, webhooks: webhook(source, useDataset) }),
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
    "https://www.indeed.com/jobs?q=staff+accountant%2C+senior+accountant%2C+accounting+manager%2C+comptroller&sc=0kf%3Aattr%28NJXCK%29%3B&sort=date",
    "https://www.indeed.com/jobs?q=treasury+analyst%2C+revenue+accountant%2C+GL+accountant%2C+fixed+assets&sc=0kf%3Aattr%28NJXCK%29%3B&sort=date",
    "https://www.indeed.com/jobs?q=internal+auditor%2C+forensic+accountant%2C+fund+accountant%2C+property+accountant&sc=0kf%3Aattr%28NJXCK%29%3B&sort=date",
    "https://www.indeed.com/jobs?q=director+of+finance%2C+VP+finance%2C+FP%26A%2C+finance+director%2C+credit+analyst&sc=0kf%3Aattr%28NJXCK%29%3B&sort=date",
  ];

  // ── LinkedIn (curious_coder/linkedin-jobs-scraper) ───────────────────────────
  // f_JT=C = Contract, f_TPR=r604800 = posted last week, sortBy=DD = newest first
  const linkedInUrls = [
    "https://www.linkedin.com/jobs/search/?keywords=accountant+CPA+controller+CFO&f_JT=C&f_TPR=r604800&sortBy=DD",
    "https://www.linkedin.com/jobs/search/?keywords=bookkeeper+accounts+payable+accounts+receivable&f_JT=C&f_TPR=r604800&sortBy=DD",
    "https://www.linkedin.com/jobs/search/?keywords=tax+accountant+auditor+payroll&f_JT=C&f_TPR=r604800&sortBy=DD",
    "https://www.linkedin.com/jobs/search/?keywords=financial+analyst+cost+accountant+budget+analyst&f_JT=C&f_TPR=r604800&sortBy=DD",
    "https://www.linkedin.com/jobs/search/?keywords=staff+accountant+senior+accountant+accounting+manager&f_JT=C&f_TPR=r604800&sortBy=DD",
    "https://www.linkedin.com/jobs/search/?keywords=finance+manager+director+finance+VP+finance+FP%26A&f_JT=C&f_TPR=r604800&sortBy=DD",
    "https://www.linkedin.com/jobs/search/?keywords=billing+specialist+billing+manager+collections+credit+analyst&f_JT=C&f_TPR=r604800&sortBy=DD",
    "https://www.linkedin.com/jobs/search/?keywords=treasury+analyst+grant+accountant+revenue+accountant+GL+accountant&f_JT=C&f_TPR=r604800&sortBy=DD",
    "https://www.linkedin.com/jobs/search/?keywords=internal+auditor+tax+manager+forensic+accountant+fund+accountant&f_JT=C&f_TPR=r604800&sortBy=DD",
    "https://www.linkedin.com/jobs/search/?keywords=fixed+assets+accountant+property+accountant+cost+accounting+comptroller&f_JT=C&f_TPR=r604800&sortBy=DD",
  ];

  const [indeedResult, linkedInResult] = await Promise.all([
    runActor("misceres/indeed-scraper", { startUrls: indeedUrls.map(url => ({ url })), maxItems: 200 }, "indeed"),
    runActor("curious_coder/linkedin-jobs-scraper", { urls: linkedInUrls, maxResults: 500 }, "linkedin", true),
  ]);

  return NextResponse.json({ sources: [indeedResult, linkedInResult] });
}
