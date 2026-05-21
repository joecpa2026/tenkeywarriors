import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { matchJobsToProfile } from "@/lib/matcher";
import type { Job, Profile } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  const [{ data: profile }, { data: jobs }] = await Promise.all([
    service.from("profiles").select("*").eq("id", user.id).single(),
    service
      .from("jobs")
      .select("*")
      .eq("expired", false)
      .order("published_at", { ascending: false })
      .limit(500),
  ]);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const matched = matchJobsToProfile(jobs as Job[], profile as Profile);

  return NextResponse.json({ matches: matched });
}
