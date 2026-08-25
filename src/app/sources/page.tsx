"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { sourceDescriptors } from "@/lib/sources/registry";

export default function SourcesPage() {
  const [enabled, setEnabled] = useState<string[]>(["manual"]);
  const [boardToken, setBoardToken] = useState("");
  const [term, setTerm] = useState("Java Developer");
  const [indeedRunning, setIndeedRunning] = useState(false);
  const [running, setRunning] = useState(false);
  const [greenhouseMessage, setGreenhouseMessage] = useState("");
  const [indeedMessage, setIndeedMessage] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Browser storage is the source of truth for these client-only connector toggles.
  useEffect(() => {
    const storedSources = window.localStorage.getItem("radario-enabled-sources");
    const storedToken = window.localStorage.getItem("radario-greenhouse-board-token");
    if (storedSources) { try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnabled(JSON.parse(storedSources) as string[]);
    } catch { /* Keep manual intake enabled. */ } }
    if (storedToken) setBoardToken(storedToken);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("radario-enabled-sources", JSON.stringify(enabled));
    if (boardToken.trim()) window.localStorage.setItem("radario-greenhouse-board-token", boardToken.trim());
  }, [boardToken, enabled, hydrated]);

  function toggle(id: string) {
    setEnabled((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function runGreenhouse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunning(true);
    setGreenhouseMessage("");
    try {
      const response = await fetch("/api/discovery/greenhouse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boardToken, term }) });
      const result = await response.json() as { error?: string; discovered?: number; persisted?: number; failures?: Array<{ message: string }> };
      if (!response.ok) throw new Error(result.error ?? "Discovery failed.");
      const failureText = result.failures?.length ? ` ${result.failures.length} record(s) failed.` : "";
      setGreenhouseMessage(`Found ${result.discovered ?? 0} matching jobs and persisted ${result.persisted ?? 0}.${failureText}${result.failures?.[0]?.message ? ` First failure: ${result.failures[0].message}` : ""}`);
      setEnabled((current) => current.includes("greenhouse") ? current : [...current, "greenhouse"]);
    } catch (error) {
      setGreenhouseMessage(error instanceof Error ? error.message : "Discovery failed.");
    } finally { setRunning(false); }
  }

  async function runIndeed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIndeedRunning(true); setIndeedMessage("");
    try {
      const response = await fetch("/api/discovery/indeed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ term }) });
      const result = await response.json() as { error?: string; discovered?: number; persisted?: number; failures?: Array<{ message: string }> };
      if (!response.ok) throw new Error(result.error ?? "Indeed discovery failed.");
      setIndeedMessage(`Indeed via Apify found ${result.discovered ?? 0} jobs and persisted ${result.persisted ?? 0}. Applicant counts remain Unknown.${result.failures?.[0]?.message ? ` First failure: ${result.failures[0].message}` : ""}`);
      setEnabled((current) => current.includes("indeed") ? current : [...current, "indeed"]);
    } catch (error) { setIndeedMessage(error instanceof Error ? error.message : "Indeed discovery failed."); }
    finally { setIndeedRunning(false); }
  }


  return <main className="min-h-screen bg-[#f7f8fa] p-6 text-slate-950 sm:p-10"><div className="mx-auto max-w-4xl">
    <Link href="/" className="text-sm font-bold text-[#d84320]">← Today&apos;s Radar</Link>
    <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff5b35]">Data sources</p><h1 className="mt-2 text-3xl font-black">Source management</h1><p className="mt-2 text-slate-500">Connect compliant sources and keep unavailable data explicitly unknown.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">{enabled.length} enabled</span></div>

    <section className="mt-8 rounded-2xl border border-orange-200 bg-[#fff8f5] p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#d84320]">Public board discovery</p><h2 className="mt-1 text-xl font-black">Greenhouse</h2><p className="mt-2 max-w-2xl text-sm leading-5 text-slate-600">Use the public board token from a company&apos;s Greenhouse careers URL, such as <code className="rounded bg-white px-1.5 py-0.5 text-xs font-bold">stripe</code>. This is not a private Greenhouse API key.</p></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">Applicant counts unavailable</span></div><form onSubmit={runGreenhouse} className="mt-5 grid gap-3 sm:grid-cols-[0.8fr_1.4fr_auto] sm:items-end"><label className="text-xs font-bold text-slate-600">Board token<input required value={boardToken} onChange={(event) => setBoardToken(event.target.value)} placeholder="stripe" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none ring-[#ff5b35] focus:ring-2" /></label><label className="text-xs font-bold text-slate-600">Search term<input required value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Java Developer" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none ring-[#ff5b35] focus:ring-2" /></label><button disabled={running} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{running ? "Discovering…" : "Run discovery"}</button></form>{greenhouseMessage && <p role="status" className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">{greenhouseMessage}{greenhouseMessage.includes("Sign in") && <> <Link href="/login" className="ml-1 font-black text-[#d84320] underline">Sign in to continue</Link></>}</p>}<p className="mt-3 text-xs leading-5 text-slate-500">Discovery requires Supabase authentication. The source only calls Greenhouse&apos;s public board endpoint and never invents applicant counts.</p></section>

    <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Apify actor</p><h2 className="mt-1 text-xl font-black">Indeed</h2><p className="mt-2 max-w-2xl text-sm leading-5 text-slate-600">Uses the referenced <code className="rounded bg-white px-1.5 py-0.5 text-xs font-bold">orgupdate/indeed-jobs-scraper</code> actor. Add <code className="rounded bg-white px-1.5 py-0.5 text-xs font-bold">APIFY_API_TOKEN</code> to the server environment; it never enters the browser.</p></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">Applicant counts unavailable</span></div><form onSubmit={runIndeed} className="mt-5 flex gap-3"><input required value={term} onChange={(event) => setTerm(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-900" /><button disabled={indeedRunning} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{indeedRunning ? "Discovering…" : "Run Indeed discovery"}</button></form>{indeedMessage && <p role="status" className="mt-4 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">{indeedMessage}{indeedMessage.includes("Sign in") && <> <Link href="/login" className="ml-1 font-black text-[#d84320] underline">Sign in to continue</Link></>}</p>}<p className="mt-3 text-xs leading-5 text-slate-500">The actor returns listing metadata only. Radario stores missing applicant counts as Unknown.</p></section>


    <div className="mt-6 grid gap-4 md:grid-cols-2">{sourceDescriptors.map((source) => { const isEnabled = enabled.includes(source.id); return <article key={source.id} className={`rounded-2xl border bg-white p-5 ${isEnabled ? "border-orange-200" : "border-slate-200"}`}><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-black">{source.name}</h2><span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${source.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{source.status}</span></div><p className="mt-2 text-sm leading-5 text-slate-500">{source.complianceNote}</p></div><button disabled={source.status !== "active"} onClick={() => toggle(source.id)} className={`rounded-lg px-3 py-2 text-xs font-bold ${source.status !== "active" ? "cursor-not-allowed bg-slate-100 text-slate-400" : isEnabled ? "bg-slate-950 text-white" : "border border-slate-200 text-slate-600"}`}>{source.status !== "active" ? "Planned" : isEnabled ? "Enabled" : "Enable"}</button></div><div className="mt-5 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">Applicant counts: <span className="font-bold text-slate-700">{source.applicantCounts === "available" ? "Available" : source.applicantCounts === "unavailable" ? "Unavailable" : "Source-dependent"}</span></div></article>; })}</div>
    <p className="mt-6 text-xs leading-5 text-slate-400">Connectors honor robots.txt, terms, authentication requirements, and rate limits. Missing applicant counts remain Unknown and never become zero.</p>
  </div></main>;
}
