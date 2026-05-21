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

// Apify scraper output shape (relevant fields only)
export type ApifyJobResult = {
  jobkey: string;
  title: string;
  normalized_title?: string;
  company: string;
  company_id?: string;
  company_rating?: number;
  job_location_city?: string;
  job_location_state?: string;
  formatted_location?: string;
  remote_location?: boolean;
  extracted_salary?: {
    min?: number;
    max?: number;
    type?: string;
  };
  salary_snippet?: string;
  job_types?: string[];
  snippet?: string;
  link?: string;
  third_party_apply_url?: string;
  indeed_apply_enabled?: boolean;
  sponsored?: boolean;
  urgently_hiring?: boolean;
  organic_apply_start_count?: number;
  publication_date?: string;
  create_date?: string;
  expired?: boolean;
};
