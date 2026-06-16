"use client";

import dynamic from "next/dynamic";
import ResumePDF from "@/components/ResumePDF";
import type { CustomizeResult } from "@/lib/types";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <span className="font-sans-ui text-sm" style={{ color: "var(--ink-soft)" }}>Preparing…</span> }
);

const STATUS = {
  matched: { dot: "var(--good)", label: "Matched" },
  partial: { dot: "var(--warn)", label: "Partial" },
  missing: { dot: "var(--bad)", label: "Missing" },
} as const;

function ScoreDial({ value }: { value: number }) {
  const color = value >= 80 ? "var(--good)" : value >= 60 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-28 h-28 rounded-full flex items-center justify-center"
        style={{ background: `conic-gradient(${color} ${value * 3.6}deg, var(--paper-2) 0deg)` }}
      >
        <div className="w-[5.5rem] h-[5.5rem] rounded-full bg-white flex flex-col items-center justify-center">
          <span className="text-3xl font-medium" style={{ color }}>{value}</span>
          <span className="font-sans-ui text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>/ 100</span>
        </div>
      </div>
      <span className="eyebrow mt-2">Overall match</span>
    </div>
  );
}

function SubScore({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between font-sans-ui text-xs mb-1">
        <span style={{ color: "var(--ink-soft)" }}>{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--paper-2)" }}>
        <div className="h-1.5 rounded-full bar-fill" style={{ width: `${value}%`, background: "var(--accent)" }} />
      </div>
    </div>
  );
}

export default function ReportView({
  result,
  fileLabel,
  animate = true,
}: {
  result: CustomizeResult;
  fileLabel?: string;
  animate?: boolean;
}) {
  const r = animate ? "rise" : "";
  const r2 = animate ? "rise-2" : "";
  const r3 = animate ? "rise-3" : "";

  return (
    <>
      <div className={`card p-6 flex items-center gap-7 ${r}`}>
        <ScoreDial value={result.match_score.overall} />
        <div className="flex-1 space-y-2.5">
          <SubScore label="Keyword coverage" value={result.match_score.keyword_coverage} />
          <SubScore label="Skills alignment" value={result.match_score.skills_alignment} />
          <SubScore label="Seniority fit" value={result.match_score.seniority_fit} />
          <p className="font-sans-ui text-xs pt-1" style={{ color: "var(--ink-soft)" }}>
            {result.match_score.rationale}
          </p>
        </div>
      </div>

      <div className={`card p-5 ${r2}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="eyebrow">Tailored</p>
            <h2 className="text-lg font-medium">Summary</h2>
          </div>
          <PDFDownloadLink
            document={<ResumePDF data={result} />}
            fileName={`resume-${(fileLabel || "tailored").replace(/\s+/g, "-").toLowerCase()}.pdf`}
            className="btn-primary px-4 py-2 text-sm"
          >
            {({ loading: l }: { loading: boolean }) => (l ? "Preparing…" : "Download PDF")}
          </PDFDownloadLink>
        </div>
        <p className="text-[15px] leading-relaxed">{result.tailored_resume.summary}</p>
      </div>

      <div className={`card p-5 ${r2}`}>
        <p className="eyebrow mb-3">Keyword map</p>
        <div className="space-y-2 max-h-60 overflow-auto pr-1">
          {result.keyword_map.map((k, i) => {
            const meta = STATUS[k.status] ?? STATUS.missing;
            return (
              <div key={i} className="flex items-start gap-2.5 font-sans-ui text-sm">
                <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: meta.dot }} />
                <span className="font-medium shrink-0">{k.keyword}</span>
                <span className="text-xs truncate" style={{ color: "var(--ink-soft)" }}>
                  {k.evidence || meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {result.gaps?.length ? (
        <div className={`card p-5 ${r3}`} style={{ background: "#FBF6EE", borderColor: "#EADfce" }}>
          <p className="eyebrow mb-2" style={{ color: "var(--warn)" }}>Worth addressing</p>
          <ul className="space-y-1.5 font-sans-ui text-sm">
            {result.gaps.map((g, i) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: "var(--warn)" }}>—</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.changes_made?.length ? (
        <details className={`card p-5 ${r3}`}>
          <summary className="eyebrow cursor-pointer">What changed</summary>
          <ul className="space-y-1.5 font-sans-ui text-sm mt-3">
            {result.changes_made.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>+</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}
