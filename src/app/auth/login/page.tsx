"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full border border-tkw-hairline rounded-md px-4 py-3 text-sm bg-tkw-paper text-tkw-ink focus:outline-none focus:border-tkw-battle focus:ring-2 focus:ring-tkw-battle-soft transition-colors";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push("/matches");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-tkw-ink">Welcome back</h1>
          <p className="text-tkw-ink-mute text-sm mt-1">Sign in to see your matches</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />
          {error && <p className="text-sm text-tkw-battle">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tkw-battle text-tkw-paper-soft py-3 rounded-md font-semibold text-sm hover:bg-tkw-battle-deep disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          <Link href="/auth/forgot-password" className="text-tkw-ink-mute hover:text-tkw-ink text-sm transition-colors">
            Forgot password?
          </Link>
        </p>

        <p className="text-center text-sm text-tkw-ink-mute mt-3">
          No account?{" "}
          <Link href="/auth/signup" className="text-tkw-battle font-semibold hover:text-tkw-battle-deep transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
