import { NextRequest, NextResponse } from "next/server";

// Triggered by Vercel cron at 2am daily.
// Kicks off the Apify Indeed scraper, which webhooks results to /api/ingest.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorId = process.env.APIFY_ACTOR_ID;
  const token = process.env.APIFY_API_TOKEN;

  if (!actorId || !token) {
    return NextResponse.json({ error: "Apify not configured" }, { status: 500 });
  }

  // Accounting-focused search URLs to scrape
  const searchUrls = [
    "https://www.indeed.com/jobs?q=contract+accountant&l=&sc=0kf%3Aattr%28DSQF7%29%3B&sort=date",
    "https://www.indeed.com/jobs?q=contract+CPA&l=&sc=0kf%3Aattr%28DSQF7%29%3B&sort=date",
    "https://www.indeed.com/jobs?q=fractional+CFO+contract&l=&sort=date",
    "https://www.indeed.com/jobs?q=contract+controller&l=&sc=0kf%3Aattr%28DSQF7%29%3B&sort=date",
    "https://www.indeed.com/jobs?q=contract+bookkeeper&l=&sc=0kf%3Aattr%28DSQF7%29%3B&sort=date",
    "https://www.indeed.com/jobs?q=contract+tax+accountant&l=&sc=0kf%3Aattr%28DSQF7%29%3B&sort=date",
    "https://www.indeed.com/jobs?q=remote+contract+accountant&l=Remote&sort=date",
  ];

  const ingestUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/ingest`;

  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: searchUrls.map((url) => ({ url })),
        max_items_per_url: 50,
        ignore_url_failures: true,
        proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
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
