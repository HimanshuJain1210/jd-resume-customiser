import { NextRequest, NextResponse } from "next/server";
import { callLLMJson } from "@/lib/llm";
import {
  ANALYZE_JD_SYSTEM,
  ANALYZE_JD_USER,
  CUSTOMIZE_SYSTEM,
  CUSTOMIZE_USER,
} from "@/lib/prompts";
import { createServerSupabase } from "@/lib/supabase-server";
import type { SignalMap, CustomizeResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { resume, jd, jobTitle } = await req.json();
    if (!resume || typeof resume !== "string" || resume.trim().length < 50) {
      return NextResponse.json({ error: "Add your resume first." }, { status: 400 });
    }
    if (!jd || typeof jd !== "string" || jd.trim().length < 30) {
      return NextResponse.json({ error: "Paste a fuller job description." }, { status: 400 });
    }

    // Pass 1 — analyze the JD into a signal map
    const signalMap = await callLLMJson<SignalMap>({
      system: ANALYZE_JD_SYSTEM,
      user: ANALYZE_JD_USER(jd),
      maxTokens: 2048,
      temperature: 0.2,
    });

    // Pass 2 — surgical rewrite against the signal map
    const result = await callLLMJson<CustomizeResult>({
      system: CUSTOMIZE_SYSTEM,
      user: CUSTOMIZE_USER(resume, JSON.stringify(signalMap)),
      maxTokens: 4096,
      temperature: 0.4,
    });

    // Persist history (best-effort; never fail the request on a DB hiccup)
    try {
      const supabase = await createServerSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("customizations").insert({
          user_id: user.id,
          job_title: jobTitle || result?.tailored_resume?.summary?.slice(0, 60) || "Untitled",
          jd_text: jd,
          signal_map: signalMap,
          result,
          match_score: result?.match_score?.overall ?? null,
        });
      }
    } catch {
      // history save is non-critical
    }

    return NextResponse.json({ signalMap, result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Customization failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
