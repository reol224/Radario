"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSending(true); setMessage(null); const response = await fetch("/api/auth/magic-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); const body = await response.json() as { error?: string }; setMessage(response.ok ? "Check your inbox for the secure sign-in link." : body.error ?? "Could not send sign-in link."); setSending(false); }
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fa] p-6 text-slate-950"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><Link href="/" className="text-sm font-bold text-[#d84320]">← Radario</Link><p className="mt-7 text-sm font-black uppercase tracking-[.18em] text-[#d84320]">Personal job intelligence</p><h1 className="mt-2 text-3xl font-black">Sign in to Radario</h1><p className="mt-2 text-sm leading-5 text-slate-500">We&apos;ll send a passwordless sign-in link. Your job-search profile stays private to your account.</p><label className="mt-6 block text-sm font-bold">Email address<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none ring-[#ff5b35] focus:ring-2" placeholder="you@example.com"/></label><button disabled={sending} className="mt-5 w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{sending ? "Sending…" : "Email me a sign-in link"}</button>{message && <p className={`mt-4 rounded-lg p-3 text-sm ${message.startsWith("Check") ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{message}</p>}<p className="mt-5 text-xs leading-5 text-slate-400">Before configuration, the form will tell you exactly which Supabase variables are missing.</p></form></main>;
}
