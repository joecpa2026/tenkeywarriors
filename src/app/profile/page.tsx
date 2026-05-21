"use client";

import { useEffect, useState } from "react";
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

export default function ProfilePage() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

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
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="text-center py-16 text-gray-500">
        Add your Supabase keys to <code className="bg-gray-100 px-1 rounded">.env.local</code> to enable profiles.
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="text-center py-16 text-gray-500">
        You need to be signed in to set up your profile.
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Profile</h1>
      <p className="text-gray-500 text-sm mb-8">
        Tell us what you're looking for and we'll surface the best-fit contract roles.
      </p>

      <div className="space-y-8">
        {/* Basic info */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            About you
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full name"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="email"
              value={authEmail}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
            />
          </div>
        </section>

        {/* Role types */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Role types
          </h2>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggle("role_types", value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.role_types.includes(value)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map((skill) => (
              <button
                key={skill}
                onClick={() => toggle("skills", skill)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.skills.includes(skill)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </section>

        {/* Rate */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Rate expectations
          </h2>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={form.rate_type}
              onChange={(e) => setForm((f) => ({ ...f, rate_type: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="hourly">Hourly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input
              type="number"
              placeholder={form.rate_type === "hourly" ? "Min $/hr" : "Min $k"}
              value={form.rate_min}
              onChange={(e) => setForm((f) => ({ ...f, rate_min: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <span className="text-gray-400">–</span>
            <input
              type="number"
              placeholder={form.rate_type === "hourly" ? "Max $/hr" : "Max $k"}
              value={form.rate_max}
              onChange={(e) => setForm((f) => ({ ...f, rate_max: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </section>

        {/* Location */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Location
          </h2>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={form.location_state}
              onChange={(e) => setForm((f) => ({ ...f, location_state: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">Select state</option>
              {STATE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.remote_ok}
                onChange={(e) => setForm((f) => ({ ...f, remote_ok: e.target.checked }))}
                className="rounded"
              />
              Open to remote
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.on_site_ok}
                onChange={(e) => setForm((f) => ({ ...f, on_site_ok: e.target.checked }))}
                className="rounded"
              />
              Open to on-site
            </label>
          </div>
        </section>

        {/* Alerts */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Email alerts
          </h2>
          <div className="flex flex-wrap gap-3 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.email_alerts}
                onChange={(e) => setForm((f) => ({ ...f, email_alerts: e.target.checked }))}
                className="rounded"
              />
              Send me new match alerts
            </label>
            {form.email_alerts && (
              <select
                value={form.alert_frequency}
                onChange={(e) => setForm((f) => ({ ...f, alert_frequency: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save profile"}
        </button>
      </div>
    </div>
  );
}
