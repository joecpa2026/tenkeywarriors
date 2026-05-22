"use client";

import type { Job, MatchedJob } from "@/lib/types";

// Only show tags that add info beyond "it's a contract role" — which is already the whole site
const DISPLAY_TAGS = new Set([
  "part-time", "full-time", "hybrid", "seasonal", "internship",
]);

type Props = {
  job: Job | MatchedJob;
  showScore?: boolean;
};

export function JobCard({ job, showScore = false }: Props) {
  const score = "match_score" in job ? job.match_score : null;

  const salaryLabel = () => {
    if (!job.salary_min && !job.salary_max) return job.salary_snippet ?? null;
    const fmt = (n: number) =>
      job.salary_type === "yearly"
        ? `$${(n / 1000).toFixed(0)}k`
        : `$${n}/hr`;
    if (job.salary_min && job.salary_max)
      return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
    if (job.salary_max) return `Up to ${fmt(job.salary_max)}`;
    return null;
  };

  const salary = salaryLabel();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base leading-snug truncate">
            {job.title}
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">
            {job.company ?? "Company not listed"}
            {job.company_rating ? (
              <span className="text-yellow-500 ml-2">★ {job.company_rating}</span>
            ) : null}
          </p>
        </div>
        {showScore && score != null && (
          <div
            className={`shrink-0 text-sm font-bold px-2.5 py-1 rounded-full ${
              score >= 70
                ? "bg-green-100 text-green-700"
                : score >= 50
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {score}% match
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
        {job.formatted_location && (
          <span className="flex items-center gap-1">
            📍 {job.formatted_location}
          </span>
        )}
        {job.is_remote && (
          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
            Remote
          </span>
        )}
        {job.job_types
          ?.filter((t) => DISPLAY_TAGS.has(t.toLowerCase()))
          .map((t) => (
            <span
              key={t}
              className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize"
            >
              {t}
            </span>
          ))}
        {job.urgently_hiring && (
          <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
            Urgently hiring
          </span>
        )}
      </div>

      {salary && (
        <p className="mt-2 text-sm font-medium text-gray-700">{salary}</p>
      )}

      {job.snippet && (
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{job.snippet}</p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {job.published_at
            ? new Date(job.published_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "Recently posted"}
        </span>
        {job.apply_url && (
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Apply →
          </a>
        )}
      </div>
    </div>
  );
}
