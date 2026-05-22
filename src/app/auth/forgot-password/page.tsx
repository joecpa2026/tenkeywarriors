"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full border border-tkw-hairline rounded-md px-4 py-3 text-sm bg-tkw-paper text-tkw-ink focus:outline-none focus:border-tkw-battle focus:ring-2 focus:ring-tkw-battle-soft transition-colors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-xl font-bold tracking-tight text-tkw-ink mb-2">Check your email</h2>
          <p className="text-tkw-ink-mute text-sm">
            We sent a password reset link to <strong className="text-tkw-ink">{email}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-tkw-ink">Reset your password</h1>
          <p className="text-tkw-ink-mute text-sm mt-1">
            We&apos;ll send a reset link to your email.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          {error && <p className="text-sm text-tkw-battle">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tkw-battle text-tkw-paper-soft py-3 rounded-md font-semibold text-sm hover:bg-tkw-battle-deep disabled:opacity-50 transition-colors"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-sm text-tkw-ink-mute mt-6">
          <Link href="/auth/login" className="text-tkw-battle font-semibold hover:text-tkw-battle-deep transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
