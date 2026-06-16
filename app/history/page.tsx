"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import ReportView from "@/components/ReportView";
import type { CustomizeResult } from "@/lib/types";

type Row = {
  id: string;
  job_title: string | null;
  match_score: number | null;
  created_at: string;
  result: CustomizeResult;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function scoreColor(v: number | null) {
  if (v === null) return "var(--ink-soft)";
  return v >= 80 ? "var(--good)" : v >= 60 ? "var(--warn)" : "var(--bad)";
}

export default function History() {
  const router = useRouter();
  const supabase = createClient();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.push("/"); return; }
    const { data, error } = await supabase
      .from("customizations")
      .select("id, job_title, match_score, created_at, result")
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    else setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    // optimistic
    const prev = rows;
    setRows(rows.filter((r) => r.id !== id));
    setConfirmId(null);
    if (openId === id) setOpenId(null);
    const { error } = await supabase.from("customizations").delete().eq("id", id);
    if (error) { setErr("Couldn't delete that entry. Try again."); setRows(prev); }
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
          <Link href="/dashboard" style={{ color: "var(--ink-soft)" }}>New tailor</Link>
          <button onClick={signOut} style={{ color: "var(--ink-soft)" }}>Sign out</button>
        </nav>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <p className="eyebrow mb-1">Your runs</p>
        <h1 className="text-2xl font-medium tracking-tight mb-6">History</h1>

        {err ? <p className="font-sans-ui text-sm mb-4" style={{ color: "var(--bad)" }}>{err}</p> : null}

        {loading ? (
          <p className="font-sans-ui text-sm" style={{ color: "var(--ink-soft)" }}>Loading…</p>
        ) : rows.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-lg font-medium">Nothing here yet</p>
            <p className="font-sans-ui text-sm mt-2" style={{ color: "var(--ink-soft)" }}>
              Tailor a resume and it&apos;ll show up here, ready to revisit or re-download.
            </p>
            <Link href="/dashboard" className="btn-primary inline-block mt-5 px-5 py-2.5 text-sm">
              Tailor a resume
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const open = openId === row.id;
              return (
                <div key={row.id} className="card overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    <button
                      onClick={() => setOpenId(open ? null : row.id)}
                      className="flex-1 text-left flex items-center gap-4"
                    >
                      <span
                        className="w-11 h-11 rounded-full flex items-center justify-center font-sans-ui text-sm font-semibold shrink-0"
                        style={{ background: "var(--paper-2)", color: scoreColor(row.match_score) }}
                      >
                        {row.match_score ?? "–"}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium truncate">
                          {row.job_title || "Untitled role"}
                        </span>
                        <span className="block font-sans-ui text-xs" style={{ color: "var(--ink-soft)" }}>
                          {fmtDate(row.created_at)} · {open ? "Hide report" : "View report"}
                        </span>
                      </span>
                    </button>

                    {confirmId === row.id ? (
                      <span className="flex items-center gap-2 font-sans-ui text-sm">
                        <button onClick={() => remove(row.id)} style={{ color: "var(--bad)" }} className="font-medium">
                          Delete
                        </button>
                        <button onClick={() => setConfirmId(null)} style={{ color: "var(--ink-soft)" }}>
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmId(row.id)}
                        className="font-sans-ui text-sm shrink-0"
                        style={{ color: "var(--ink-soft)" }}
                        aria-label="Delete entry"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {open ? (
                    <div className="px-4 pb-4 pt-1 space-y-5 border-t" style={{ borderColor: "var(--line)" }}>
                      <div className="pt-4">
                        <ReportView
                          result={row.result}
                          fileLabel={row.job_title || "tailored"}
                          animate={false}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
