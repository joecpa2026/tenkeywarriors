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

// ── Indeed (borderline/indeed-scraper) ──────────────────────────────────────
export type IndeedJobResult = {
  jobKey: string;
  title: string;
  jobType?: string[];
  descriptionText?: string;
  companyName?: string;
  location?: {
    city?: string;
    formattedAddressShort?: string;
  };
  salary?: {
    salaryText?: string;
    salaryType?: string;
  };
  rating?: { rating?: number; count?: number };
  hiringDemand?: { isHighVolumeHiring?: boolean; isUrgentHire?: boolean };
  isRemote?: boolean;
  datePublished?: string;
  expired?: boolean;
  jobUrl?: string;
  applyUrl?: string;
};

// ── LinkedIn (curious_coder/linkedin-jobs-scraper) ───────────────────────────
export type LinkedInJobResult = {
  id?: string;
  title?: string;
  company?: string | { name?: string };
  location?: string;
  description?: string;
  url?: string;
  applyUrl?: string;
  employmentType?: string;
  contractType?: string;
  postedAt?: string;
  salary?: string | null;
  isRemote?: boolean;
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
