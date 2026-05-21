import type { Job, Profile, MatchedJob } from "@/lib/types";

// Keywords that map each role type to relevant job title terms
const ROLE_KEYWORDS: Record<string, string[]> = {
  cpa: ["cpa", "certified public accountant", "public accountant"],
  controller: ["controller", "financial controller", "accounting manager"],
  bookkeeper: ["bookkeeper", "bookkeeping", "accounts payable", "accounts receivable"],
  cfo: ["cfo", "chief financial officer", "fractional cfo", "vp finance"],
  tax: ["tax", "tax accountant", "tax preparer", "tax specialist", "tax manager"],
  audit: ["auditor", "audit", "internal audit", "external audit"],
  payroll: ["payroll", "payroll specialist", "payroll manager", "payroll administrator"],
};

// Score a single job against a profile (0–100)
export function scoreJob(job: Job, profile: Profile): number {
  let score = 0;

  // ── Role match (0–40 pts) ──────────────────────────────────────────────────
  if (profile.role_types?.length) {
    const titleLower = (job.title + " " + (job.normalized_title ?? "")).toLowerCase();
    const roleMatches = profile.role_types.filter((role) =>
      ROLE_KEYWORDS[role]?.some((kw) => titleLower.includes(kw))
    );
    score += Math.min(40, roleMatches.length * 20);
  }

  // ── Skills match (0–25 pts) ───────────────────────────────────────────────
  if (profile.skills?.length && job.snippet) {
    const snippetLower = job.snippet.toLowerCase();
    const matchedSkills = profile.skills.filter((skill) =>
      snippetLower.includes(skill.toLowerCase())
    );
    score += Math.min(25, matchedSkills.length * 5);
  }

  // ── Remote / location (0–20 pts) ─────────────────────────────────────────
  if (job.is_remote && profile.remote_ok) {
    score += 20;
  } else if (!job.is_remote && profile.on_site_ok) {
    if (
      profile.location_state &&
      job.location_state?.toLowerCase() === profile.location_state.toLowerCase()
    ) {
      score += 15;
    } else {
      score += 5; // on-site but different state — low bonus
    }
  }

  // ── Rate match (0–15 pts) ─────────────────────────────────────────────────
  if (profile.rate_min != null && job.salary_min != null && job.salary_max != null) {
    const normalize = (amount: number, type: string | null) => {
      // Normalize everything to hourly for comparison
      if (profile.rate_type === "yearly" && type === "yearly") return amount;
      if (profile.rate_type === "hourly" && type === "hourly") return amount;
      if (profile.rate_type === "hourly" && type === "yearly") return amount / 2080;
      if (profile.rate_type === "yearly" && type === "hourly") return amount * 2080;
      return amount;
    };

    const jobMax = normalize(job.salary_max, job.salary_type);
    const profileMin = profile.rate_min;

    if (jobMax >= profileMin) {
      score += 15;
    } else if (jobMax >= profileMin * 0.9) {
      score += 8; // within 10% — still worth surfacing
    }
  } else {
    // No salary listed — give partial credit so undisclosed jobs still surface
    score += 8;
  }

  return Math.min(100, score);
}

export function matchJobsToProfile(jobs: Job[], profile: Profile): MatchedJob[] {
  return jobs
    .map((job) => ({ ...job, match_score: scoreJob(job, profile) }))
    .filter((j) => j.match_score >= 30)
    .sort((a, b) => b.match_score - a.match_score);
}
