import { NextRequest, NextResponse } from "next/server";
import { callLLMJson } from "@/lib/llm";
import { ANALYZE_JD_SYSTEM, ANALYZE_JD_USER } from "@/lib/prompts";
import type { SignalMap } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { jd } = await req.json();
    if (!jd || typeof jd !== "string" || jd.trim().length < 30) {
      return NextResponse.json({ error: "Job description too short." }, { status: 400 });
    }
    const signalMap = await callLLMJson<SignalMap>({
      system: ANALYZE_JD_SYSTEM,
      user: ANALYZE_JD_USER(jd),
      maxTokens: 2048,
      temperature: 0.2,
    });
    return NextResponse.json({ signalMap });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
