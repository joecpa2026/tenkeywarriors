import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = ["/profile", "/matches"];

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = req.nextUrl.pathname;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/profile/:path*", "/matches/:path*"],
};
