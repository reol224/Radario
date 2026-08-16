"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { generateSearchQueries } from "@/lib/jobs/search-queries";
import type { RemoteType } from "@/lib/jobs/types";

type PreferenceState = {
  desiredRoles: string[];
  positiveKeywords: string[];
  negativeKeywords: string[];
  preferredCountries: string[];
  allowedRemoteTypes: RemoteType[];
};

const defaults: PreferenceState = {
  desiredRoles: ["Junior Java Developer", "Java Developer", "Backend Developer", "Software Engineer"],
  positiveKeywords: ["Java", "Spring", "Spring Boot", "SQL", "REST", "React", "TypeScript", "PostgreSQL", "MySQL"],
  negativeKeywords: ["Senior", "Staff", "Principal", "Lead", "Manager", "Director", "Architect"],
  preferredCountries: ["Italy", "Germany", "France", "Czechia", "Romania", "Poland", "Netherlands", "Spain", "Portugal", "Sweden", "Denmark", "Finland", "Ireland"],
  allowedRemoteTypes: ["fully_remote", "restricted_remote", "hybrid"],
};

const countries = defaults.preferredCountries;
const remoteOptions: { id: RemoteType; label: string; hint: string }[] = [
  { id: "fully_remote", label: "Fully remote", hint: "No office attendance expected." },
  { id: "restricted_remote", label: "Remote with restrictions", hint: "Preserves country or region limits." },
  { id: "hybrid", label: "Hybrid", hint: "Some office time is expected." },
  { id: "on_site", label: "On-site", hint: "Office-based roles are included." },
];

function ListEditor({ title, hint, values, onChange, tone = "slate" }: { title: string; hint: string; values: string[]; onChange: (values: string[]) => void; tone?: "slate" | "orange" }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const value = draft.trim();
    if (value && !values.some((item) => item.toLowerCase() === value.toLowerCase())) onChange([...values, value]);
    setDraft("");
  };
  return <section className="rounded-2xl border border-slate-200 bg-white p-6">
    <h2 className="text-lg font-black">{title}</h2><p className="mt-1 text-sm text-slate-500">{hint}</p>
    <div className="mt-4 flex flex-wrap gap-2">{values.map((item) => <button type="button" key={item} onClick={() => onChange(values.filter((value) => value !== item))} className={`rounded-full px-3 py-1.5 text-sm ${tone === "orange" ? "bg-orange-50 text-orange-900" : "bg-slate-100 text-slate-700"}`}>{item} ×</button>)}</div>
    <div className="mt-4 flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} placeholder={`Add ${title.toLowerCase().replace(/s$/, "")}`} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /><button type="button" onClick={add} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white">Add</button></div>
  </section>;
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<PreferenceState>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [queries, setQueries] = useState<string[]>(() => generateSearchQueries(defaults));
  const update = <K extends keyof PreferenceState>(key: K, value: PreferenceState[K]) => setPreferences((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const local = window.localStorage.getItem("radario-preferences-v2");
    const storedQueries = window.localStorage.getItem("radario-search-queries");
    if (local) { try { setPreferences({ ...defaults, ...JSON.parse(local) }); } catch { /* Use defaults. */ } }
    if (storedQueries) { try { setQueries(JSON.parse(storedQueries) as string[]); } catch { /* Regenerate queries. */ } }
    fetch("/api/preferences").then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      const remote = data.preferences;
      if (remote) setPreferences({ desiredRoles: remote.desired_roles ?? [], positiveKeywords: remote.positive_keywords ?? [], negativeKeywords: remote.negative_keywords ?? [], preferredCountries: remote.preferred_countries ?? [], allowedRemoteTypes: remote.allowed_remote_types ?? defaults.allowedRemoteTypes });
    }).catch(() => undefined).finally(() => setHydrated(true));
  }, []);

  useEffect(() => { if (hydrated) window.localStorage.setItem("radario-preferences-v2", JSON.stringify(preferences)); }, [hydrated, preferences]);

  const save = async () => {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(preferences) });
      window.localStorage.setItem("radario-search-queries", JSON.stringify(activeQueries));
      if (!response.ok) throw new Error((await response.json()).error ?? "Could not save preferences.");
      setMessage("Saved to your Radario profile.");
    } catch (error) {
      setMessage(error instanceof Error && error.message === "Failed to fetch" ? "Saved locally. Sign in and configure Supabase to sync across devices." : error instanceof Error ? error.message : "Saved locally.");
    } finally { setSaving(false); }
  };

  const activeSummary = useMemo(() => `${preferences.desiredRoles.length} roles · ${preferences.positiveKeywords.length} positive signals · ${preferences.preferredCountries.length} countries`, [preferences]);
  const generatedQueries = useMemo(() => generateSearchQueries({ ...preferences, allowedRemoteTypes: preferences.allowedRemoteTypes as RemoteType[] }), [preferences]);
  const activeQueries = queries.length > 0 ? queries : generatedQueries;

  return <main className="min-h-screen bg-[#f7f8fa] p-6 text-slate-950 sm:p-10"><div className="mx-auto max-w-3xl">
    <Link href="/" className="text-sm font-bold text-[#d84320]">← Today&apos;s Radar</Link>
    <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-black">Search preferences</h1><p className="mt-2 text-slate-500">Tune discovery recall and ranking without hard-coding your search profile.</p><p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">{activeSummary}</p></div><button onClick={save} disabled={saving} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save preferences"}</button></div>
    {message && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{message}</p>}
    <div className="mt-8 space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-black">Search queries</h2><p className="mt-1 text-sm text-slate-500">Generated for high recall from your roles and positive keywords. Remove noisy terms or add a missing title.</p></div><span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-800">{activeQueries.length} active</span></div><div className="mt-4 space-y-2">{activeQueries.map((query, index) => <div key={`${query}-${index}`} className="flex items-center gap-2"><input value={query} onChange={(event) => setQueries((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /><button type="button" onClick={() => setQueries((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg px-2 py-2 text-sm font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Remove ${query}`}>×</button></div>)}</div><button type="button" onClick={() => setQueries((current) => [...(current.length ? current : generatedQueries), "New search term"])} className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">+ Add query</button></section>
      <ListEditor title="Desired roles" hint="Use several title variations to maximize discovery recall." values={preferences.desiredRoles} onChange={(value) => update("desiredRoles", value)} />
      <ListEditor title="Positive keywords" hint="Technologies and signals that should boost an opportunity." values={preferences.positiveKeywords} onChange={(value) => update("positiveKeywords", value)} tone="orange" />
      <ListEditor title="Negative keywords" hint="Roles containing these terms are strongly de-prioritized." values={preferences.negativeKeywords} onChange={(value) => update("negativeKeywords", value)} />
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-black">Preferred countries</h2><p className="mt-1 text-sm text-slate-500">Choose the markets you want Radario to prioritize.</p><div className="mt-4 flex flex-wrap gap-2">{countries.map((country) => { const selected = preferences.preferredCountries.includes(country); return <button type="button" key={country} onClick={() => update("preferredCountries", selected ? preferences.preferredCountries.filter((item) => item !== country) : [...preferences.preferredCountries, country])} className={`rounded-full px-3 py-1.5 text-sm font-medium ${selected ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}>{country}</button>; })}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-black">Work model</h2><p className="mt-1 text-sm text-slate-500">Remote geography stays distinct: Germany-only is not the same as Europe-wide.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{remoteOptions.map((option) => { const selected = preferences.allowedRemoteTypes.includes(option.id); return <button type="button" key={option.id} onClick={() => update("allowedRemoteTypes", selected ? preferences.allowedRemoteTypes.filter((item) => item !== option.id) : [...preferences.allowedRemoteTypes, option.id])} className={`rounded-xl border p-4 text-left ${selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white"}`}><p className="font-bold">{option.label}</p><p className={`mt-1 text-xs ${selected ? "text-slate-300" : "text-slate-500"}`}>{option.hint}</p></button>; })}</div></section>
    </div>
  </div></main>;
}
