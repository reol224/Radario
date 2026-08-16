"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sourceDescriptors } from "@/lib/sources/registry";

export default function SourcesPage() {
  const [enabled, setEnabled] = useState<string[]>(["manual"]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem("radario-enabled-sources");
    if (stored) { try { setEnabled(JSON.parse(stored) as string[]); } catch { /* Keep manual intake enabled. */ } }
    setHydrated(true);
  }, []);
  function toggle(id: string) {
    setEnabled((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  useEffect(() => { if (hydrated) window.localStorage.setItem("radario-enabled-sources", JSON.stringify(enabled)); }, [enabled, hydrated]);
  return <main className="min-h-screen bg-[#f7f8fa] p-6 text-slate-950 sm:p-10"><div className="mx-auto max-w-4xl"><Link href="/" className="text-sm font-bold text-[#d84320]">← Today&apos;s Radar</Link><div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff5b35]">Data sources</p><h1 className="mt-2 text-3xl font-black">Source management</h1><p className="mt-2 text-slate-500">Choose which compliant connectors can contribute opportunities to your radar.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">{enabled.length} enabled</span></div><div className="mt-8 grid gap-4 md:grid-cols-2">{sourceDescriptors.map((source) => { const isEnabled = enabled.includes(source.id); return <article key={source.id} className={`rounded-2xl border bg-white p-5 ${isEnabled ? "border-orange-200" : "border-slate-200"}`}><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-black">{source.name}</h2><span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${source.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{source.status}</span></div><p className="mt-2 text-sm leading-5 text-slate-500">{source.complianceNote}</p></div><button disabled={source.status !== "active"} onClick={() => toggle(source.id)} className={`rounded-lg px-3 py-2 text-xs font-bold ${source.status !== "active" ? "cursor-not-allowed bg-slate-100 text-slate-400" : isEnabled ? "bg-slate-950 text-white" : "border border-slate-200 text-slate-600"}`}>{source.status !== "active" ? "Planned" : isEnabled ? "Enabled" : "Enable"}</button></div><div className="mt-5 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">Applicant counts: <span className="font-bold text-slate-700">{source.applicantCounts === "available" ? "Available" : source.applicantCounts === "unavailable" ? "Unavailable" : "Source-dependent"}</span></div></article>; })}</div><p className="mt-6 text-xs leading-5 text-slate-400">Connectors will honor robots.txt, terms, authentication requirements, and rate limits. Missing applicant counts remain Unknown and never become zero.</p></div></main>;
}
