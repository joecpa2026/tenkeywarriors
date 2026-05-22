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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse Contract Jobs</h1>
      <p className="text-gray-500 text-sm mb-6">
        Contract accounting roles updated daily from Indeed.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search titles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-40 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">All locations</option>
          {STATE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No jobs found. Try adjusting your filters.
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-3">{jobs.length} role{jobs.length !== 1 ? "s" : ""} found</p>
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
