"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  remote: "Fully remote" | "Remote · Europe" | "Hybrid" | "On-site";
  postedHours: number;
  applicants: number | null;
  score: number;
  technologies: string[];
  level: "Junior" | "Graduate" | "Mid";
  status: "New" | "Saved" | "Applied" | "Ignored";
};

const seedJobs: Job[] = [
  { id: 1, title: "Junior Java Developer", company: "northstar", location: "Milan, Italy", remote: "Fully remote", postedHours: 5, applicants: 8, score: 93, technologies: ["Java", "Spring Boot", "PostgreSQL"], level: "Junior", status: "New" },
  { id: 2, title: "Backend Engineer — Java", company: "Factorial", location: "Barcelona, Spain", remote: "Remote · Europe", postedHours: 12, applicants: 18, score: 87, technologies: ["Java", "Spring", "SQL"], level: "Junior", status: "New" },
  { id: 3, title: "Graduate Software Developer", company: "Mollie", location: "Amsterdam, Netherlands", remote: "Hybrid", postedHours: 20, applicants: 22, score: 82, technologies: ["Java", "TypeScript", "REST"], level: "Graduate", status: "Saved" },
  { id: 4, title: "Software Engineer, Platform", company: "Qonto", location: "Paris, France", remote: "Remote · Europe", postedHours: 31, applicants: 11, score: 79, technologies: ["Java", "Spring Boot", "AWS"], level: "Mid", status: "New" },
  { id: 5, title: "Java Application Developer", company: "Pleo", location: "Copenhagen, Denmark", remote: "Fully remote", postedHours: 46, applicants: null, score: 74, technologies: ["Java", "React", "MySQL"], level: "Junior", status: "New" },
];

function scoreReasons(job: Job) {
  const freshness = job.postedHours < 6 ? 30 : job.postedHours < 24 ? 25 : job.postedHours < 72 ? 15 : 5;
  const applicantPoints = job.applicants === null ? 0 : job.applicants < 10 ? 30 : job.applicants <= 25 ? 25 : 15;
  const remotePoints = job.remote === "Fully remote" ? 20 : job.remote === "Remote · Europe" ? 10 : 3;
  return [`+${freshness} posted ${age(job.postedHours)}`, ...(job.applicants === null ? ["Applicants unavailable — no score invented"] : [`+${applicantPoints} only ${job.applicants} applicants`]), `+${remotePoints} ${job.remote.toLowerCase()}`, `+15 ${job.level.toLowerCase()} role`, ...job.technologies.slice(0, 2).map((technology) => `+${technology === "Java" || technology.includes("Spring") ? 10 : 3} ${technology}`)];
}

function age(hours: number) {
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

export default function Home() {
  const [jobs, setJobs] = useState(seedJobs);
  const [query, setQuery] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [lowApplicants, setLowApplicants] = useState(false);
  const [selected, setSelected] = useState<Job | null>(null);
  const [showAddJob, setShowAddJob] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [sort, setSort] = useState<"score" | "newest" | "applicants">("score");

  const visible = useMemo(() => jobs.filter((job) => {
    const matchesQuery = `${job.title} ${job.company} ${job.technologies.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    const matchesRemote = !remoteOnly || job.remote !== "On-site";
    const matchesApplicants = !lowApplicants || (job.applicants !== null && job.applicants < 25);
    return matchesQuery && matchesRemote && matchesApplicants && job.status !== "Ignored";
  }).sort((a, b) => sort === "score" ? b.score - a.score : sort === "newest" ? a.postedHours - b.postedHours : (a.applicants ?? 999) - (b.applicants ?? 999)), [jobs, query, remoteOnly, lowApplicants, sort]);

  function updateStatus(id: number, status: Job["status"]) {
    setJobs((current) => current.map((job) => job.id === id ? { ...job, status } : job));
  }

  function addJobToInbox() {
    const trimmed = jobUrl.trim();
    if (!trimmed) return;
    setJobs((current) => [{ id: Date.now(), title: "New opportunity to review", company: "Manual inbox", location: "Location pending", remote: "Remote · Europe", postedHours: 0, applicants: null, score: 0, technologies: ["Needs review"], level: "Mid", status: "New" }, ...current]);
    setJobUrl("");
    setShowAddJob(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[230px_1fr]">
        <aside className="border-b border-slate-200 bg-white px-6 py-7 lg:min-h-screen lg:border-r lg:border-b-0">
          <div className="mb-10 flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-[#ff5b35] text-lg">◉</div><span className="text-xl font-black tracking-tight">radario</span></div>
          <nav className="flex gap-2 overflow-auto lg:flex-col">
            <Link href="/" className="whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-left text-sm font-medium text-white">Today’s Radar</Link>
            <Link href="/apply-early" className="whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100">🚨 Apply Early</Link>
            <span className="whitespace-nowrap px-3 py-2 text-sm text-slate-400">Saved & activity — coming with persistence</span>
            <Link href="/analytics" className="whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100">Analytics</Link>
          </nav>
          <div className="mt-10 hidden rounded-xl bg-orange-50 p-4 text-sm text-orange-950 lg:block"><p className="font-bold">Your edge is time.</p><p className="mt-1 leading-5 text-orange-800">6 roles are still quiet enough to act on today.</p></div>
          <Link href="/settings" className="mt-8 text-sm font-medium text-slate-500">⚙ Preferences</Link>
        </aside>

        <section className="p-5 sm:p-8 lg:p-10">
          <header className="flex flex-col justify-between gap-6 md:flex-row md:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5b35]">Friday · 15 August</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Today&apos;s Job Radar</h1><p className="mt-2 text-slate-500">A focused queue for your next 15 minutes.</p></div><button onClick={() => setShowAddJob(true)} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">+ Add job URL</button></header>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[["37", "New jobs"], ["6", "Very promising"], ["9", "Under 25 applicants"], ["14", "Posted in 24h"], ["21", "Remote"]].map(([number, label], i) => <div key={label} className={`rounded-xl border p-4 ${i === 1 ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-white"}`}><p className="text-2xl font-black">{number}</p><p className="mt-1 text-xs font-medium text-slate-500">{label}</p></div>)}
          </div>

          <div className="mt-10 rounded-2xl border border-orange-200 bg-[#fff8f5] p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-black text-[#d84320]">🔥 APPLY EARLY</p><h2 className="mt-1 text-xl font-black">The window is open</h2><p className="mt-1 text-sm text-slate-600">Fresh listings with low competition and a strong signal match.</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#d84320]">6 opportunities</span></div></div>

          <div className="mt-7 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex flex-wrap gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search roles, companies, skills…" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-[#ff5b35] focus:ring-2 sm:w-72"/><button onClick={() => setRemoteOnly(!remoteOnly)} className={`rounded-lg border px-3 py-2 text-sm font-medium ${remoteOnly ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white"}`}>Remote</button><button onClick={() => setLowApplicants(!lowApplicants)} className={`rounded-lg border px-3 py-2 text-sm font-medium ${lowApplicants ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white"}`}>Under 25 applicants</button></div><label className="text-sm text-slate-500">Sort <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="ml-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-800"><option value="score">Opportunity score</option><option value="newest">Newest</option><option value="applicants">Fewest applicants</option></select></label></div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="hidden grid-cols-[1.8fr_1fr_0.8fr_0.7fr] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 md:grid"><span>Opportunity</span><span>Location</span><span>Competition</span><span>Score</span></div>{visible.map((job) => <article key={job.id} className="grid gap-4 border-b border-slate-100 p-5 last:border-0 md:grid-cols-[1.8fr_1fr_0.8fr_0.7fr] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{job.title}</h3>{job.score >= 85 && <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-black text-[#d84320]">VERY HOT</span>}</div><p className="mt-1 text-sm text-slate-500">{job.company} · <span className="font-medium text-slate-700">{age(job.postedHours)}</span></p><div className="mt-3 flex flex-wrap gap-1.5">{job.technologies.map((tech) => <span key={tech} className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">{tech}</span>)}</div></div><div className="text-sm"><p className="font-medium">{job.location}</p><p className="mt-1 text-slate-500">{job.remote}</p></div><div><p className={`text-lg font-black ${job.applicants !== null && job.applicants < 25 ? "text-[#d84320]" : ""}`}>{job.applicants === null ? "Unknown" : `${job.applicants} applicants`}</p><p className="text-xs text-slate-400">via {job.id === 1 ? "LinkedIn" : "Company site"}</p></div><div className="flex items-center justify-between gap-3"><button onClick={() => setSelected(job)} className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-950 text-lg font-black text-white" aria-label={`Explain score ${job.score}`}>{job.score}</button><div className="flex gap-1"><button onClick={() => updateStatus(job.id, job.status === "Saved" ? "New" : "Saved")} className="rounded px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100">{job.status === "Saved" ? "Saved" : "Save"}</button><button onClick={() => updateStatus(job.id, "Applied")} className="rounded bg-slate-950 px-2 py-1 text-xs font-bold text-white">{job.status === "Applied" ? "Applied" : "Apply"}</button></div></div></article>)}</div>
        </section>
      </div>
      {selected && <div className="fixed inset-0 grid place-items-center bg-slate-950/30 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-[#d84320]">OPPORTUNITY SCORE</p><h2 className="mt-1 text-4xl font-black">{selected.score}<span className="text-lg text-slate-400"> / 100</span></h2></div><button onClick={() => setSelected(null)} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm">Close</button></div><p className="mt-5 text-sm font-bold">{selected.title} · {selected.company}</p><ul className="mt-4 space-y-2 text-sm text-slate-600">{scoreReasons(selected).map((reason) => <li key={reason} className={reason.startsWith("+") ? "text-emerald-700" : "text-slate-500"}>{reason}</li>)}</ul><p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm leading-5 text-slate-600">Why this is ranked highly: it is recent, has relatively few applicants, and matches your technology and work-model preferences.</p></div></div>}
      {showAddJob && <div className="fixed inset-0 grid place-items-center bg-slate-950/30 p-4"><form onSubmit={(event) => { event.preventDefault(); addJobToInbox(); }} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><p className="text-sm font-bold text-[#d84320]">MANUAL INTAKE</p><h2 className="mt-1 text-2xl font-black">Add a job URL</h2><p className="mt-2 text-sm leading-5 text-slate-500">This adds the listing to your local review inbox. Automated extraction is not connected yet, so it will be clearly marked for review.</p><input autoFocus type="url" required value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} placeholder="https://company.com/careers/job" className="mt-5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-[#ff5b35] focus:ring-2"/><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowAddJob(false)} className="rounded-lg px-3 py-2 text-sm font-bold text-slate-500">Cancel</button><button className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white">Add to inbox</button></div></form></div>}
    </main>
  );
}
