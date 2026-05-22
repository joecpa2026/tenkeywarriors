"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const ROLE_OPTIONS = [
  { value: "cpa", label: "CPA" },
  { value: "controller", label: "Controller" },
  { value: "bookkeeper", label: "Bookkeeper" },
  { value: "cfo", label: "CFO / Fractional CFO" },
  { value: "tax", label: "Tax" },
  { value: "audit", label: "Audit" },
  { value: "payroll", label: "Payroll" },
];

const SKILL_OPTIONS = [
  "QuickBooks", "NetSuite", "Xero", "Sage", "SAP", "Oracle",
  "Excel", "Tax prep", "Payroll", "Financial reporting",
  "Budgeting", "Accounts payable", "Accounts receivable",
];

const STATE_OPTIONS = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID",
  "IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT",
  "NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

type FormState = {
  full_name: string;
  email: string;
  role_types: string[];
  skills: string[];
  rate_min: string;
  rate_max: string;
  rate_type: string;
  location_state: string;
  remote_ok: boolean;
  on_site_ok: boolean;
  email_alerts: boolean;
  alert_frequency: string;
};

const DEFAULT_FORM: FormState = {
  full_name: "",
  email: "",
  role_types: [],
  skills: [],
  rate_min: "",
  rate_max: "",
  rate_type: "hourly",
  location_state: "",
  remote_ok: true,
  on_site_ok: true,
  email_alerts: true,
  alert_frequency: "daily",
};

const inputClass =
  "w-full border border-tkw-hairline rounded-md px-3 py-2.5 text-sm bg-tkw-paper text-tkw-ink focus:outline-none focus:border-tkw-battle focus:ring-2 focus:ring-tkw-battle-soft transition-colors";

const selectClass =
  "border border-tkw-hairline rounded-md px-3 py-2.5 text-sm bg-tkw-paper text-tkw-ink focus:outline-none focus:border-tkw-battle focus:ring-2 focus:ring-tkw-battle-soft transition-colors";

const sectionHeadingClass =
  "font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-tkw-ink-mute mb-3";

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileForm />
    </Suspense>
  );
}

function ProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get("new") === "1";

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isExistingProfile, setIsExistingProfile] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      setAuthEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setIsExistingProfile(true);
        setForm({
          full_name: profile.full_name ?? "",
          email: profile.email ?? user.email ?? "",
          role_types: profile.role_types ?? [],
          skills: profile.skills ?? [],
          rate_min: profile.rate_min?.toString() ?? "",
          rate_max: profile.rate_max?.toString() ?? "",
          rate_type: profile.rate_type ?? "hourly",
          location_state: profile.location_state ?? "",
          remote_ok: profile.remote_ok ?? true,
          on_site_ok: profile.on_site_ok ?? true,
          email_alerts: profile.email_alerts ?? true,
          alert_frequency: profile.alert_frequency ?? "daily",
        });
      } else {
        setForm((f) => ({ ...f, email: user.email ?? "" }));
      }
    });
  }, []);

  const toggle = (field: "role_types" | "skills", value: string) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v) => v !== value)
        : [...f[field], value],
    }));
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").upsert({
      id: userId,
      email: authEmail,
      full_name: form.full_name || null,
      role_types: form.role_types.length ? form.role_types : null,
      skills: form.skills.length ? form.skills : null,
      rate_min: form.rate_min ? parseFloat(form.rate_min) : null,
      rate_max: form.rate_max ? parseFloat(form.rate_max) : null,
      rate_type: form.rate_type,
      location_state: form.location_state || null,
      remote_ok: form.remote_ok,
      on_site_ok: form.on_site_ok,
      email_alerts: form.email_alerts,
      alert_frequency: form.alert_frequency,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (!isExistingProfile) {
      router.push("/matches");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="text-center py-16 text-tkw-ink-mute">
        Add your Supabase keys to{" "}
        <code className="bg-tkw-paper-deep px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code>{" "}
        to enable profiles.
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="text-center py-16">
        <p className="text-tkw-ink-mute mb-6">You need to be signed in to set up your profile.</p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 bg-tkw-battle text-tkw-paper-soft px-6 py-3 rounded-md font-semibold text-sm hover:bg-tkw-battle-deep transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {(isNewUser || !isExistingProfile) && (
        <div className="bg-tkw-battle-soft border border-[#F2BFB6] rounded-lg px-5 py-4 mb-8">
          <p className="text-tkw-battle-deep font-semibold text-sm">Welcome to Ten Key Warriors!</p>
          <p className="text-tkw-battle text-sm mt-0.5">
            Fill out your profile below and we&apos;ll match you to the best contract roles daily.
          </p>
        </div>
      )}

      <p className="font-mono text-xs font-medium tracking-[0.12em] uppercase text-tkw-battle mb-2">
        Your account
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-tkw-ink mb-1">
        {isExistingProfile ? "Your Profile" : "Set up your profile"}
      </h1>
      <p className="text-tkw-ink-mute text-sm mb-10">
        Tell us what you&apos;re looking for and we&apos;ll surface the best-fit contract roles.
      </p>

      <div className="space-y-10">
        {/* Basic info */}
        <section>
          <h2 className={sectionHeadingClass}>About you</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full name"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className={inputClass}
            />
            <input
              type="email"
              value={authEmail}
              disabled
              className="w-full border border-tkw-hairline rounded-md px-3 py-2.5 text-sm bg-tkw-paper-deep text-tkw-ink-mute cursor-not-allowed"
            />
          </div>
        </section>

        {/* Role types */}
        <section>
          <h2 className={sectionHeadingClass}>Role types</h2>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggle("role_types", value)}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  form.role_types.includes(value)
                    ? "bg-tkw-ink text-tkw-paper-soft border-tkw-ink"
                    : "bg-tkw-paper text-tkw-ink-soft border-tkw-hairline hover:border-tkw-ink hover:bg-tkw-paper-deep"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section>
          <h2 className={sectionHeadingClass}>Skills</h2>
          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map((skill) => (
              <button
                key={skill}
                onClick={() => toggle("skills", skill)}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  form.skills.includes(skill)
                    ? "bg-tkw-ink text-tkw-paper-soft border-tkw-ink"
                    : "bg-tkw-paper text-tkw-ink-soft border-tkw-hairline hover:border-tkw-ink hover:bg-tkw-paper-deep"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </section>

        {/* Rate */}
        <section>
          <h2 className={sectionHeadingClass}>Rate expectations</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={form.rate_type}
              onChange={(e) => setForm((f) => ({ ...f, rate_type: e.target.value }))}
              className={selectClass}
            >
              <option value="hourly">Hourly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input
              type="number"
              placeholder={form.rate_type === "hourly" ? "Min $/hr" : "Min $k"}
              value={form.rate_min}
              onChange={(e) => setForm((f) => ({ ...f, rate_min: e.target.value }))}
              className="border border-tkw-hairline rounded-md px-3 py-2.5 text-sm w-28 bg-tkw-paper text-tkw-ink focus:outline-none focus:border-tkw-battle focus:ring-2 focus:ring-tkw-battle-soft transition-colors"
            />
            <span className="text-tkw-ink-mute">–</span>
            <input
              type="number"
              placeholder={form.rate_type === "hourly" ? "Max $/hr" : "Max $k"}
              value={form.rate_max}
              onChange={(e) => setForm((f) => ({ ...f, rate_max: e.target.value }))}
              className="border border-tkw-hairline rounded-md px-3 py-2.5 text-sm w-28 bg-tkw-paper text-tkw-ink focus:outline-none focus:border-tkw-battle focus:ring-2 focus:ring-tkw-battle-soft transition-colors"
            />
          </div>
        </section>

        {/* Location */}
        <section>
          <h2 className={sectionHeadingClass}>Location</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={form.location_state}
              onChange={(e) => setForm((f) => ({ ...f, location_state: e.target.value }))}
              className={selectClass}
            >
              <option value="">Select state</option>
              {STATE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-tkw-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={form.remote_ok}
                onChange={(e) => setForm((f) => ({ ...f, remote_ok: e.target.checked }))}
                className="rounded accent-tkw-battle"
              />
              Open to remote
            </label>
            <label className="flex items-center gap-2 text-sm text-tkw-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={form.on_site_ok}
                onChange={(e) => setForm((f) => ({ ...f, on_site_ok: e.target.checked }))}
                className="rounded accent-tkw-battle"
              />
              Open to on-site
            </label>
          </div>
        </section>

        {/* Alerts */}
        <section>
          <h2 className={sectionHeadingClass}>Email alerts</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 text-sm text-tkw-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={form.email_alerts}
                onChange={(e) => setForm((f) => ({ ...f, email_alerts: e.target.checked }))}
                className="rounded accent-tkw-battle"
              />
              Send me new match alerts
            </label>
            {form.email_alerts && (
              <select
                value={form.alert_frequency}
                onChange={(e) => setForm((f) => ({ ...f, alert_frequency: e.target.value }))}
                className={selectClass}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            )}
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-tkw-battle text-tkw-paper-soft px-6 py-3 rounded-md font-semibold text-sm hover:bg-tkw-battle-deep disabled:opacity-50 transition-colors"
        >
          {saving
            ? "Saving..."
            : saved
            ? "Saved!"
            : isExistingProfile
            ? "Save profile"
            : "Save & see my matches →"}
        </button>
      </div>
    </div>
  );
}
