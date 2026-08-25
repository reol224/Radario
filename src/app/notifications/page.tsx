"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Rule = { interval: string; score: number; applicants: number; hours: number; remoteEurope: boolean; email: boolean };
const defaults: Rule = { interval: "3", score: 80, applicants: 25, hours: 48, remoteEurope: true, email: false };

export default function NotificationsPage() {
  const [rule, setRule] = useState<Rule>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem("radario-discovery-rule");
    if (stored) { try { setRule({ ...defaults, ...JSON.parse(stored) }); } catch { /* Keep safe defaults. */ } }
    fetch("/api/schedules").then(async (response) => {
      if (!response.ok) return;
      const result = await response.json() as { schedule?: Record<string, unknown> };
      if (!result.schedule) return;
      setRule({ interval: String(result.schedule.interval_hours ?? 3), score: Number(result.schedule.minimum_score ?? 80), applicants: Number(result.schedule.maximum_applicants ?? 25), hours: Number(result.schedule.posted_within_hours ?? 48), remoteEurope: result.schedule.remote_europe !== false, email: result.schedule.email_enabled === true });
      setSynced(true);
    }).catch(() => undefined).finally(() => setHydrated(true));
  }, []);
  const nextRun = useMemo(() => new Date(Date.now() + Number(rule.interval) * 3_600_000).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }), [rule.interval]);
  async function save() {
    setSaving(true); setMessage("");
    window.localStorage.setItem("radario-discovery-rule", JSON.stringify(rule));
    try {
      const response = await fetch("/api/schedules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intervalHours: Number(rule.interval), minimumScore: rule.score, maximumApplicants: rule.applicants, postedWithinHours: rule.hours, remoteEurope: rule.remoteEurope, emailEnabled: rule.email }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not sync schedule.");
      setSynced(true); setMessage("Schedule synced to your account.");
    } catch (error) {
      setSynced(false); setMessage(error instanceof Error && error.message === "Failed to fetch" ? "Saved locally. Sign in and configure Supabase to sync." : error instanceof Error ? error.message : "Saved locally.");
    } finally { setSaving(false); }
  }
  return <main className="min-h-screen bg-[#f7f8fa] p-6 text-slate-950 sm:p-10"><div className="mx-auto max-w-3xl"><Link href="/settings" className="text-sm font-bold text-[#d84320]">← Preferences</Link><div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff5b35]">Automation</p><h1 className="mt-2 text-3xl font-black">Discovery schedule</h1><p className="mt-2 text-slate-500">Tell Radario when to look and which opportunities deserve an alert.</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${synced ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{synced ? "Synced" : "Local fallback"}</span></div><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-black">Run discovery</h2><p className="mt-1 text-sm text-slate-500">The saved schedule is ready for a background worker to execute.</p><label className="mt-5 block text-sm font-bold">Check every<select value={rule.interval} onChange={(event) => setRule({ ...rule, interval: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2.5 font-normal sm:w-56"><option value="1">1 hour</option><option value="3">3 hours</option><option value="6">6 hours</option><option value="12">12 hours</option><option value="24">Once a day</option></select></label><p className="mt-3 text-xs text-slate-400">Example next run: {hydrated ? nextRun : "calculating…"}</p></section><section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-black">Notify me when</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Opportunity score is at least<input type="number" min="0" max="100" value={rule.score} onChange={(event) => setRule({ ...rule, score: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-200 p-2.5 font-normal" /></label><label className="text-sm font-bold">Applicants are below<input type="number" min="1" value={rule.applicants} onChange={(event) => setRule({ ...rule, applicants: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-200 p-2.5 font-normal" /></label><label className="text-sm font-bold">Posted within<input type="number" min="1" value={rule.hours} onChange={(event) => setRule({ ...rule, hours: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-200 p-2.5 font-normal" /></label><label className="flex items-center gap-2 self-end pb-3 text-sm font-bold"><input type="checkbox" checked={rule.remoteEurope} onChange={(event) => setRule({ ...rule, remoteEurope: event.target.checked })} /> Remote in Europe</label></div><div className="mt-5 border-t border-slate-100 pt-5"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={rule.email} onChange={(event) => setRule({ ...rule, email: event.target.checked })} /> Email me when a rule matches</label><p className="mt-2 text-xs text-slate-400">Email delivery still requires a configured provider.</p></div></section><div className="mt-5 flex items-center justify-end gap-3"><span role="status" className="text-sm font-medium text-emerald-700">{message}</span><button onClick={save} disabled={saving} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save schedule"}</button></div></div></main>;
}
