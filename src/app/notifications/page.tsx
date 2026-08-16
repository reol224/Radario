"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Rule = { interval: string; score: number; applicants: number; hours: number; remoteEurope: boolean; email: boolean };
const defaults: Rule = { interval: "3", score: 80, applicants: 25, hours: 48, remoteEurope: true, email: false };

export default function NotificationsPage() {
  const [rule, setRule] = useState<Rule>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem("radario-discovery-rule");
    if (stored) {
      try { setRule({ ...defaults, ...JSON.parse(stored) }); } catch { /* Keep the safe defaults. */ }
    }
    setHydrated(true);
  }, []);
  const nextRun = useMemo(() => new Date(Date.now() + Number(rule.interval) * 3_600_000).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }), [rule.interval]);
  function save() {
    window.localStorage.setItem("radario-discovery-rule", JSON.stringify(rule));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }
  return <main className="min-h-screen bg-[#f7f8fa] p-6 text-slate-950 sm:p-10"><div className="mx-auto max-w-3xl"><Link href="/settings" className="text-sm font-bold text-[#d84320]">← Preferences</Link><div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff5b35]">Automation</p><h1 className="mt-2 text-3xl font-black">Discovery schedule</h1><p className="mt-2 text-slate-500">Tell Radario when to look and which opportunities deserve an alert.</p></div><span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">Local preview</span></div><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-black">Run discovery</h2><p className="mt-1 text-sm text-slate-500">A background worker will use this rule after Supabase authentication is connected.</p><label className="mt-5 block text-sm font-bold">Check every<select value={rule.interval} onChange={(event) => setRule({ ...rule, interval: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2.5 font-normal sm:w-56"><option value="1">1 hour</option><option value="3">3 hours</option><option value="6">6 hours</option><option value="12">12 hours</option><option value="24">Once a day</option></select></label><p className="mt-3 text-xs text-slate-400">Example next run: {hydrated ? nextRun : "calculating…"}</p></section><section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-black">Notify me when</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Opportunity score is at least<input type="number" min="0" max="100" value={rule.score} onChange={(event) => setRule({ ...rule, score: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-200 p-2.5 font-normal"/></label><label className="text-sm font-bold">Applicants are below<input type="number" min="1" value={rule.applicants} onChange={(event) => setRule({ ...rule, applicants: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-200 p-2.5 font-normal"/></label><label className="text-sm font-bold">Posted within<input type="number" min="1" value={rule.hours} onChange={(event) => setRule({ ...rule, hours: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-200 p-2.5 font-normal"/></label><label className="flex items-center gap-2 self-end pb-3 text-sm font-bold"><input type="checkbox" checked={rule.remoteEurope} onChange={(event) => setRule({ ...rule, remoteEurope: event.target.checked })}/> Remote in Europe</label></div><div className="mt-5 border-t border-slate-100 pt-5"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={rule.email} onChange={(event) => setRule({ ...rule, email: event.target.checked })}/> Email me when a rule matches</label><p className="mt-2 text-xs text-slate-400">Email delivery will activate when an authenticated account and provider are configured.</p></div></section><div className="mt-5 flex items-center justify-end gap-3"><span className="text-sm font-medium text-emerald-700">{saved ? "Saved locally" : ""}</span><button onClick={save} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Save schedule</button></div></div></main>;
}
