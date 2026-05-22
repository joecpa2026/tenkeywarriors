"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { JobCard } from "@/components/JobCard";
import type { Job } from "@/lib/types";

const ROLE_OPTIONS = [
  "Accountant",
  "CPA",
  "Controller",
  "CFO",
  "Finance Manager",
  "Bookkeeper",
  "Tax",
  "Audit",
  "Payroll",
  "Accounts Payable",
  "Accounts Receivable",
  "Cost Accounting",
  "Financial Analyst",
  "Budget Analyst",
  "Grant Accounting",
  "Treasury",
  "Billing",
];
const STATE_OPTIONS = [
  "Remote", "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID",
  "IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT",
  "NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const inputClass =
  "border border-tkw-hairline rounded-md px-3 py-2 text-sm bg-tkw-paper text-tkw-ink focus:outline-none focus:border-tkw-battle focus:ring-2 focus:ring-tkw-battle-soft transition-colors";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setJobs([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();

    let query = supabase
      .from("jobs")
      .select("*")
      .eq("expired", false)
      .order("published_at", { ascending: false })
      .limit(250);

    if (search.trim()) {
      query = query.ilike("title", `%${search.trim()}%`);
    }
    if (role) {
      query = query.ilike("title", `%${role}%`);
    }
    if (location === "Remote") {
      query = query.eq("is_remote", true);
    } else if (location) {
      query = query.eq("location_state", location);
    }

    const { data } = await query;
    setJobs((data as Job[]) ?? []);
    setLoading(false);
  }, [search, role, location]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div>
      <p className="font-mono text-xs font-medium tracking-[0.12em] uppercase text-tkw-battle mb-2">
        Contract roles
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-tkw-ink mb-1">
        Browse Contract Jobs
      </h1>
      <p className="text-tkw-ink-mute text-sm mb-8">
        Accounting &amp; finance roles updated daily from Indeed.
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          placeholder="Search titles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} flex-1 min-w-40`}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={inputClass}
        >
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputClass}
        >
          <option value="">All locations</option>
          {STATE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-tkw-ink-mute font-mono text-sm tracking-wide">
          Loading jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-tkw-ink-mute">
          No jobs found. Try adjusting your filters.
        </div>
      ) : (
        <>
          <p className="font-mono text-xs text-tkw-ink-mute tracking-wide mb-4">
            {jobs.length} role{jobs.length !== 1 ? "s" : ""} found
          </p>
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
