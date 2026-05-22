"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import type { MatchedJob } from "@/lib/types";

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setMatches(data.matches ?? []);
        }
      })
      .catch(() => setError("Failed to load matches."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16 text-tkw-ink-mute font-mono text-sm tracking-wide">
        Finding your matches...
      </div>
    );
  }

  if (error === "Unauthorized" || error === "Profile not found") {
    const isUnauth = error === "Unauthorized";
    return (
      <div className="text-center py-16">
        <p className="text-tkw-ink-mute mb-6">
          {isUnauth
            ? "Sign in to see your personalized matches."
            : "Set up your profile so we can match you to jobs."}
        </p>
        <Link
          href={isUnauth ? "/auth/login" : "/profile"}
          className="inline-flex items-center gap-2 bg-tkw-battle text-tkw-paper-soft px-6 py-3 rounded-md font-semibold text-sm hover:bg-tkw-battle-deep transition-colors"
        >
          {isUnauth ? "Sign in" : "Set up profile"}
        </Link>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-16 text-tkw-battle">{error}</div>;
  }

  return (
    <div>
      <p className="font-mono text-xs font-medium tracking-[0.12em] uppercase text-tkw-battle mb-2">
        Personalized
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-tkw-ink mb-1">
        Your Matches
      </h1>
      <p className="text-tkw-ink-mute text-sm mb-8">
        {matches.length} job{matches.length !== 1 ? "s" : ""} ranked by fit to your profile.
      </p>

      {matches.length === 0 ? (
        <div className="text-center py-16 text-tkw-ink-mute">
          No matches yet — check back after the next daily scrape, or{" "}
          <Link href="/profile" className="text-tkw-battle hover:underline">
            update your profile
          </Link>{" "}
          to broaden your criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((job) => (
            <JobCard key={job.id} job={job} showScore />
          ))}
        </div>
      )}
    </div>
  );
}
