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
    return <div className="text-center py-16 text-gray-400">Finding your matches...</div>;
  }

  if (error === "Unauthorized") {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Sign in to see your personalized matches.</p>
        <Link
          href="/profile"
          className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700"
        >
          Create your profile
        </Link>
      </div>
    );
  }

  if (error === "Profile not found") {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">
          Set up your profile so we can match you to jobs.
        </p>
        <Link
          href="/profile"
          className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700"
        >
          Set up profile
        </Link>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-16 text-red-500">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Matches</h1>
      <p className="text-gray-500 text-sm mb-6">
        {matches.length} job{matches.length !== 1 ? "s" : ""} ranked by fit to your profile.
      </p>

      {matches.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No matches yet — check back after the next daily scrape, or{" "}
          <Link href="/profile" className="text-indigo-600 underline">
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
