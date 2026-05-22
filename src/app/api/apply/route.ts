import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let body: { job_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.job_id) {
    return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
  }

  // Auth is optional — track if logged in, silently skip if not
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const service = createServiceClient();
    await service.from("applications").upsert(
      { user_id: user.id, job_id: body.job_id },
      { onConflict: "user_id,job_id", ignoreDuplicates: true }
    );
  }

  return NextResponse.json({ ok: true });
}
