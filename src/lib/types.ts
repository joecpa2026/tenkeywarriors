export type Job = {
  id: string;
  jobkey: string;
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

// valig/indeed-jobs-scraper output shape
export type ApifyJobResult = {
  key?: string;
  url?: string;
  title: string;
  jobUrl?: string;
  refNum?: string;
  datePublished?: string;
  dateOnIndeed?: string;
  expired?: boolean;
  isUrgentHire?: boolean;
  isHighVolumeHiring?: boolean;
  isPlacement?: boolean;
  location?: {
    city?: string;
    admin1Code?: string;  // state abbreviation e.g. "NY"
    countryCode?: string;
  };
  employer?: {
    name?: string;
    ratingsValue?: number;
    ratingsCount?: number;
  };
  // Flat key-value pairs with obfuscated keys; values are human-readable
  // e.g. { "CF3CP": "Full-time", "AWHEP": "Paid holidays" }
  attributes?: Record<string, string>;
  baseSalary?: {
    min?: number;
    max?: number;
    unitOfWork?: string;  // "YEAR" | "HOUR"
    currencyCode?: string;
  };
  description?: {
    text?: string;
    html?: string;
  };
};
