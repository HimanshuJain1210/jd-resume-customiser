"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import ReportView from "@/components/ReportView";
import type { CustomizeResult } from "@/lib/types";

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [resume, setResume] = useState("");
  const [resumeSaved, setResumeSaved] = useState(false);
  const [jd, setJd] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CustomizeResult | null>(null);
  const [err, setErr] = useState("");
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(""); setParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't read that file.");
      setResume(data.text);
      setResumeSaved(false);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Couldn't read that file.");
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const loadResume = useCallback(async (uid: string) => {
    const { data } = await supabase.from("resumes").select("raw_text").eq("user_id", uid).single();
    if (data?.raw_text) { setResume(data.raw_text); setResumeSaved(true); }
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/"); return; }
      setUserId(data.user.id);
      loadResume(data.user.id);
    });
  }, [router, supabase, loadResume]);

  async function saveResume() {
    if (!userId) return;
    await supabase.from("resumes").upsert({ user_id: userId, raw_text: resume, updated_at: new Date().toISOString() });
    setResumeSaved(true);
  }

  async function customize() {
    setErr(""); setResult(null);
    if (resume.trim().length < 50) { setErr("Add your resume first."); return; }
    if (jd.trim().length < 30) { setErr("Paste a fuller job description."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/customize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jd, jobTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data.result);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main className="min-h-screen">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight">Tailor</span>
          <span className="eyebrow">JD → Resume</span>
        </div>
        <nav className="flex items-center gap-5 font-sans-ui text-sm">
          <Link href="/history" style={{ color: "var(--ink-soft)" }}>History</Link>
          <button onClick={signOut} style={{ color: "var(--ink-soft)" }}>Sign out</button>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-[0.95fr_1.05fr] gap-7">
        {/* LEFT — inputs */}
        <section className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="eyebrow">Step 1</p>
                <h2 className="text-lg font-medium">Your resume</h2>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".docx,.pdf"
                  onChange={handleFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={parsing}
                  className="font-sans-ui text-sm px-3 py-1.5 rounded-[10px] border"
                  style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
                >
                  {parsing ? "Reading…" : "Upload .docx / .pdf"}
                </button>
                <button onClick={saveResume} className="btn-primary px-4 py-1.5 text-sm">
                  {resumeSaved ? "Saved ✓" : "Save"}
                </button>
              </div>
            </div>
            <textarea
              value={resume}
              onChange={(e) => { setResume(e.target.value); setResumeSaved(false); }}
              placeholder="Paste your full resume as plain text…"
              className="input-field w-full h-52 p-3 text-sm resize-y"
            />
            <p className="font-sans-ui text-xs mt-2" style={{ color: "var(--ink-soft)" }}>
              Saved once to your account. Reused for every job you target.
            </p>
          </div>

          <div className="card p-5">
            <p className="eyebrow">Step 2</p>
            <h2 className="text-lg font-medium mb-3">The job</h2>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Job title — optional (e.g. Senior PM, Fintech)"
              className="input-field w-full px-3 py-2 text-sm mb-2"
            />
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description…"
              className="input-field w-full h-40 p-3 text-sm resize-y"
            />
            <button onClick={customize} disabled={loading} className="btn-primary w-full mt-3 py-3 text-[15px]">
              {loading ? "Tailoring…" : "Tailor my resume"}
            </button>
            {err ? <p className="font-sans-ui text-sm mt-2" style={{ color: "var(--bad)" }}>{err}</p> : null}
          </div>
        </section>

        {/* RIGHT — results */}
        <section className="space-y-5">
          {!result && !loading ? (
            <div className="card p-10 text-center">
              <p className="text-xl font-medium tracking-tight">Your match report appears here</p>
              <p className="font-sans-ui text-sm mt-2 max-w-sm mx-auto" style={{ color: "var(--ink-soft)" }}>
                A tailored resume, an honest match score, a keyword-by-keyword map, and the gaps worth addressing.
              </p>
            </div>
          ) : null}

          {loading ? (
            <div className="card p-10 text-center">
              <div className="inline-flex gap-1.5 mb-3">
                <span className="w-2 h-2 rounded-full bar-fill" style={{ background: "var(--accent)", animationDelay: "0s" }} />
                <span className="w-2 h-2 rounded-full bar-fill" style={{ background: "var(--accent)", animationDelay: "0.15s" }} />
                <span className="w-2 h-2 rounded-full bar-fill" style={{ background: "var(--accent)", animationDelay: "0.3s" }} />
              </div>
              <p className="font-sans-ui text-sm" style={{ color: "var(--ink-soft)" }}>
                Reading the JD → re-emphasising your experience → scoring the match…
              </p>
            </div>
          ) : null}

          {result ? <ReportView result={result} fileLabel={jobTitle || "tailored"} /> : null}
        </section>
      </div>
    </main>
  );
}
