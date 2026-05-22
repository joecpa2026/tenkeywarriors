export type Job = {
  id: string;
  jobkey: string;
  source: string;
  title: string;
  normalized_title: string | null;
  company: string | null;
  company_id: string | null;
  company_rating: number | null;
  location_city: string | null;
  location_state: string | null;
  formatted_location: string | null;
  is_remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  salary_type: string | null;
  salary_snippet: string | null;
  job_types: string[] | null;
  snippet: string | null;
  apply_url: string | null;
  indeed_apply: boolean;
  sponsored: boolean;
  urgently_hiring: boolean;
  apply_count: number | null;
  published_at: string | null;
  scraped_at: string;
  expired: boolean;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role_types: string[] | null;
  skills: string[] | null;
  rate_min: number | null;
  rate_max: number | null;
  rate_type: string;
  location_city: string | null;
  location_state: string | null;
  remote_ok: boolean;
  on_site_ok: boolean;
  email_alerts: boolean;
  alert_frequency: string;
  last_alerted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MatchedJob = Job & { match_score: number };

// ── Indeed (misceres/indeed-scraper) ────────────────────────────────────────
export type IndeedJobResult = {
  id: string;
  positionName: string;
  company?: string;
  location?: string;
  jobType?: string[];
  salary?: string;
  description?: string;
  externalApplyLink?: string | null;
  url?: string;
  postingDateParsed?: string;
  isExpired?: boolean | string;
};

// ── LinkedIn (curious_coder/linkedin-jobs-scraper) ───────────────────────────
export type LinkedInJobResult = {
  id?: string;
  title?: string;
  companyName?: string;
  location?: string;
  descriptionText?: string;
  link?: string;
  applyUrl?: string;
  employmentType?: string;
  postedAt?: string;
  salary?: string | null;
  workRemoteAllowed?: boolean;
};

// ── ZipRecruiter (bebity/ziprecruiter-scraper) ───────────────────────────────
export type ZipRecruiterJobResult = {
  id?: string;
  title?: string;
  company?: string;
  city?: string;
  state?: string;
  location?: string;
  description?: string;
  url?: string;
  jobType?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryInterval?: string | null;
  salary?: string | null;
  postedDate?: string | null;
};

// Legacy alias kept for any references that haven't been updated
export type ApifyJobResult = IndeedJobResult;
