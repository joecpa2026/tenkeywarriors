"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const links = [
  { href: "/jobs", label: "Browse Jobs" },
  { href: "/matches", label: "My Matches" },
  { href: "/profile", label: "Profile" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <nav className="border-b border-tkw-hairline bg-tkw-paper sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/jobs" className="flex items-center shrink-0">
          <svg
            viewBox="0 0 700 100"
            height="34"
            width="238"
            aria-label="Ten Key Warriors"
            role="img"
          >
            <rect x="0" y="0" width="100" height="100" rx="14" fill="#0E0F12" />
            <rect x="10" y="10" width="80" height="20" rx="3" fill="#C9F26D" />
            <rect x="10" y="36" width="22" height="18" rx="3" fill="#2B2E34" />
            <rect x="39" y="36" width="22" height="18" rx="3" fill="#2B2E34" />
            <rect x="68" y="36" width="22" height="18" rx="3" fill="#2B2E34" />
            <rect x="10" y="60" width="22" height="18" rx="3" fill="#2B2E34" />
            <rect x="39" y="60" width="22" height="18" rx="3" fill="#2B2E34" />
            <rect x="68" y="60" width="22" height="18" rx="3" fill="#2B2E34" />
            <rect x="10" y="84" width="22" height="6" rx="2" fill="#2B2E34" />
            <rect x="39" y="84" width="22" height="6" rx="2" fill="#2B2E34" />
            <rect x="68" y="84" width="22" height="6" rx="2" fill="#E5392B" />
            <text
              x="120"
              y="72"
              fontFamily="Cabinet Grotesk, system-ui, sans-serif"
              fontSize="56"
              fontWeight="700"
              fill="#0E0F12"
              letterSpacing="-2.2"
            >
              TEN KEY{" "}
              <tspan fill="#E5392B">WARRIORS</tspan>
            </text>
          </svg>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? "bg-tkw-paper-deep text-tkw-ink"
                  : "text-tkw-ink-mute hover:text-tkw-ink hover:bg-tkw-paper-deep"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="ml-3 pl-3 border-l border-tkw-hairline">
            {email ? (
              <button
                onClick={handleSignOut}
                className="text-sm text-tkw-ink-mute hover:text-tkw-ink transition-colors"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm font-semibold text-tkw-battle hover:text-tkw-battle-deep transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
