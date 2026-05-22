"use client";

import type { Job, MatchedJob } from "@/lib/types";

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
  const companyInitial = job.company ? job.company.charAt(0).toUpperCase() : "?";

  return (
    <div className="bg-tkw-paper-soft border border-tkw-hairline rounded-md p-6 flex flex-col gap-3 hover:shadow-tkw-card transition-shadow">
      {/* Company row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-tkw-paper-deep flex items-center justify-center text-xs font-bold text-tkw-ink shrink-0">
            {companyInitial}
          </div>
          <span className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-tkw-ink-mute">
            {job.company ?? "Company not listed"}
            {job.company_rating ? (
              <span className="ml-2 text-amber-600">★ {job.company_rating}</span>
            ) : null}
          </span>
        </div>
        {showScore && score != null && (
          <span
            className={`text-xs font-mono font-semibold px-2 py-1 rounded ${
              score >= 70
                ? "bg-tkw-black-green-soft text-tkw-black-green"
                : score >= 50
                ? "bg-tkw-paper-deep text-tkw-ink-mute"
                : "bg-tkw-paper-deep text-tkw-ink-mute"
            }`}
          >
            {score}% match
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold leading-snug tracking-tight text-tkw-ink">
        {job.title}
      </h3>

      {/* Salary */}
      {salary && (
        <p className="font-mono font-bold text-lg text-tkw-battle tracking-wide">
          {salary}
        </p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px] text-tkw-ink-mute tracking-wide">
        {job.formatted_location && (
          <span>{job.formatted_location}</span>
        )}
        {job.is_remote && (
          <span className="text-tkw-ink-mute">Remote</span>
        )}
        {job.job_types
          ?.filter((t) => DISPLAY_TAGS.has(t.toLowerCase()))
          .map((t) => (
            <span key={t} className="capitalize">{t}</span>
          ))}
        {job.urgently_hiring && (
          <span className="text-tkw-battle font-semibold">Urgently hiring</span>
        )}
      </div>

      {job.snippet && (
        <p className="text-sm text-tkw-ink-mute line-clamp-2 leading-relaxed">
          {job.snippet}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-dashed border-tkw-hairline mt-auto">
        <span className="font-mono text-[11px] text-tkw-ink-mute tracking-wide">
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
            className="text-sm font-semibold text-tkw-battle hover:text-tkw-battle-deep transition-colors"
          >
            Apply →
          </a>
        )}
      </div>
    </div>
  );
}
