"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { JobCard } from "@/components/JobCard";
import type { Job } from "@/lib/types";

const PAGE_SIZE = 25;

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
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");

  // Track current filter fingerprint so we can reset on filter change
  const filterKey = `${search}|${role}|${location}`;
  const prevFilterKey = useRef(filterKey);

  const buildQuery = useCallback((supabase: ReturnType<typeof createClient>, from: number) => {
    let q = supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("expired", false)
      .order("published_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
    if (role) q = q.ilike("title", `%${role}%`);
    if (location === "Remote") q = q.eq("is_remote", true);
    else if (location) q = q.eq("location_state", location);

    return q;
  }, [search, role, location]);

  // Initial load + filter changes → reset list
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setPage(0);
    setHasMore(true);
    prevFilterKey.current = filterKey;

    const supabase = createClient();
    buildQuery(supabase, 0).then(({ data, count }) => {
      setJobs((data as Job[]) ?? []);
      setTotal(count ?? null);
      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      setLoading(false);
    });
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    if (loadingMore || !hasMore || !isSupabaseConfigured) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const supabase = createClient();
    const { data } = await buildQuery(supabase, nextPage * PAGE_SIZE);
    const newJobs = (data as Job[]) ?? [];
    setJobs((prev) => [...prev, ...newJobs]);
    setPage(nextPage);
    setHasMore(newJobs.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  return (
    <div>
      <p className="font-mono text-xs font-medium tracking-[0.12em] uppercase text-tkw-battle mb-2">
        Contract roles
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-tkw-ink mb-1">
        Browse Contract Jobs
      </h1>
      <p className="text-tkw-ink-mute text-sm mb-1">
        Contract accounting &amp; finance roles, updated daily.
      </p>
      {total !== null && (
        <p className="font-mono text-sm font-bold text-tkw-ink mb-8">
          {total.toLocaleString()} contract roles in the database
        </p>
      )}

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
          {(search || role || location) && total !== null && (
            <p className="font-mono text-xs text-tkw-ink-mute tracking-wide mb-4">
              {total.toLocaleString()} matching roles
            </p>
          )}

          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 border border-tkw-hairline bg-tkw-paper-soft text-tkw-ink text-sm font-semibold px-6 py-3 rounded-md hover:bg-tkw-paper-deep disabled:opacity-50 transition-colors"
              >
                {loadingMore ? "Loading..." : `Load more · showing ${jobs.length} of ${total?.toLocaleString() ?? "?"}`}
              </button>
            </div>
          )}

          {!hasMore && jobs.length > PAGE_SIZE && (
            <p className="text-center mt-8 font-mono text-xs text-tkw-ink-mute tracking-wide">
              All {jobs.length.toLocaleString()} roles loaded
            </p>
          )}
        </>
      )}
    </div>
  );
}
