import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { matchJobsToProfile } from "@/lib/matcher";
import { sendMatchDigest } from "@/lib/email";
import type { Job, Profile, MatchedJob } from "@/lib/types";

function isAuthorized(req: NextRequest): boolean {
  // Vercel cron sends: Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  // Manual POST with header
  return req.headers.get("x-cron-secret") === process.env.CRON_SECRET;
}

// GET — called by Vercel cron scheduler
export async function GET(req: NextRequest) {
  return POST(req);
}

// POST — called manually or via webhook
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();

  // Fetch all profiles that want alerts
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .eq("email_alerts", true);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const results: { email: string; sent: number; error?: string }[] = [];

  for (const profile of (profiles as Profile[])) {
    try {
      // Determine the lookback window based on alert frequency
      const hoursBack = profile.alert_frequency === "weekly" ? 168 : 24;
      const since = new Date(now.getTime() - hoursBack * 60 * 60 * 1000).toISOString();

      // Skip if already alerted recently enough
      if (profile.last_alerted_at) {
        const lastAlert = new Date(profile.last_alerted_at);
        const hoursSince = (now.getTime() - lastAlert.getTime()) / (1000 * 60 * 60);
        if (hoursSince < hoursBack * 0.9) {
          results.push({ email: profile.email, sent: 0 });
          continue;
        }
      }

      // Fetch jobs published since last alert
      const { data: jobs } = await supabase
        .from("jobs")
        .select("*")
        .eq("expired", false)
        .gte("published_at", since)
        .order("published_at", { ascending: false })
        .limit(200);

      if (!jobs?.length) {
        results.push({ email: profile.email, sent: 0 });
        continue;
      }

      // Match and filter to top 10
      const matched: MatchedJob[] = matchJobsToProfile(jobs as Job[], profile).slice(0, 10);

      if (!matched.length) {
        results.push({ email: profile.email, sent: 0 });
        continue;
      }

      // Check which jobs we've already emailed this profile about
      const { data: alreadySent } = await supabase
        .from("match_log")
        .select("job_id")
        .eq("profile_id", profile.id)
        .eq("emailed", true)
        .in("job_id", matched.map((j) => j.id));

      const sentIds = new Set((alreadySent ?? []).map((r: { job_id: string }) => r.job_id));
      const newMatches = matched.filter((j) => !sentIds.has(j.id));

      if (!newMatches.length) {
        results.push({ email: profile.email, sent: 0 });
        continue;
      }

      // Send the email
      await sendMatchDigest({
        to: profile.email,
        name: profile.full_name,
        matches: newMatches,
        frequency: profile.alert_frequency,
      });

      // Log sent matches
      await supabase.from("match_log").upsert(
        newMatches.map((j) => ({
          profile_id: profile.id,
          job_id: j.id,
          matched_at: now.toISOString(),
          emailed: true,
        })),
        { onConflict: "profile_id,job_id" }
      );

      // Update last_alerted_at
      await supabase
        .from("profiles")
        .update({ last_alerted_at: now.toISOString() })
        .eq("id", profile.id);

      results.push({ email: profile.email, sent: newMatches.length });
    } catch (err) {
      results.push({
        email: profile.email,
        sent: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
  return NextResponse.json({ profiles: results.length, totalSent, results });
}
