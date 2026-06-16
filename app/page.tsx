"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.push("/dashboard");
    });
  }, [router, supabase]);

  async function signIn() {
    setErr("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* top bar */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tracking-tight">Tailor</span>
          <span className="eyebrow">JD → Resume</span>
        </div>
        <span className="font-sans-ui text-xs" style={{ color: "var(--ink-soft)" }}>
          Truthful · ATS-ready
        </span>
      </header>

      <div className="max-w-6xl w-full mx-auto px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center flex-1 py-10">
        {/* LEFT — thesis */}
        <section className="rise">
          <p className="eyebrow mb-4">One resume, every role</p>
          <h1 className="text-[clamp(2.4rem,5vw,4rem)] leading-[1.04] font-medium tracking-tight">
            Rewrite your resume to fit the job —{" "}
            <span style={{ color: "var(--accent)" }}>without inventing</span> a
            single thing.
          </h1>
          <p
            className="mt-6 text-lg leading-relaxed max-w-xl"
            style={{ color: "var(--ink-soft)" }}
          >
            Paste a job description. Tailor reads it the way a recruiter does,
            re-emphasises the experience you actually have, and shows you the
            exact keywords you match — and the ones you don&apos;t.
          </p>

          {/* alignment signature strip */}
          <div className="mt-10 card p-5 max-w-md">
            <div className="flex items-center justify-between mb-3">
              <span className="eyebrow">Match preview</span>
              <span className="font-sans-ui text-sm font-semibold" style={{ color: "var(--good)" }}>
                86
              </span>
            </div>
            {[
              { k: "Product strategy", w: "94%", s: "var(--good)" },
              { k: "A/B testing", w: "78%", s: "var(--warn)" },
              { k: "SQL", w: "40%", s: "var(--bad)" },
            ].map((row, i) => (
              <div key={i} className="mb-2.5 last:mb-0">
                <div className="flex justify-between font-sans-ui text-xs mb-1">
                  <span>{row.k}</span>
                  <span style={{ color: "var(--ink-soft)" }}>{row.w}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "var(--paper-2)" }}>
                  <div
                    className="h-1.5 rounded-full bar-fill"
                    style={{ width: row.w, background: row.s }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT — sign in */}
        <section className="rise-2">
          <div className="card p-7">
            <h2 className="text-2xl font-medium tracking-tight">Start tailoring</h2>
            <p className="mt-1 font-sans-ui text-sm" style={{ color: "var(--ink-soft)" }}>
              We email you a one-time sign-in link. No password to remember.
            </p>

            {sent ? (
              <div className="mt-6 rounded-xl p-5" style={{ background: "var(--paper-2)" }}>
                <p className="font-medium">Check your inbox</p>
                <p className="font-sans-ui text-sm mt-1" style={{ color: "var(--ink-soft)" }}>
                  A sign-in link is on its way to {email}.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && email && signIn()}
                  className="input-field w-full px-4 py-3 text-[15px]"
                />
                <button
                  onClick={signIn}
                  disabled={loading || !email}
                  className="btn-primary w-full py-3 text-[15px]"
                >
                  {loading ? "Sending…" : "Email me a link"}
                </button>
                {err ? (
                  <p className="font-sans-ui text-sm" style={{ color: "var(--bad)" }}>
                    {err}
                  </p>
                ) : null}
              </div>
            )}

            <hr className="rule my-6" />
            <ol className="space-y-3 font-sans-ui text-sm" style={{ color: "var(--ink-soft)" }}>
              <li><b style={{ color: "var(--ink)" }}>1.</b> Save your resume once.</li>
              <li><b style={{ color: "var(--ink)" }}>2.</b> Paste any job description.</li>
              <li><b style={{ color: "var(--ink)" }}>3.</b> Download an ATS-ready PDF.</li>
            </ol>
          </div>
        </section>
      </div>

      <footer className="max-w-6xl w-full mx-auto px-6 py-6 font-sans-ui text-xs" style={{ color: "var(--ink-soft)" }}>
        Your resume never leaves your account. Rewrites stay truthful — gaps are flagged, never faked.
      </footer>
    </main>
  );
}
