// ============================================================
// LLM client — Groq (free tier, OpenAI-compatible endpoint).
// Hardened JSON path: extract → parse → on failure, one repair retry.
// ============================================================

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export type ChatArgs = {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
};

async function rawCall(args: ChatArgs & { jsonMode?: boolean }): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: args.maxTokens ?? 4096,
      temperature: args.temperature ?? 0.4,
      ...(args.jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

// Plain text completion.
export async function callLLM(args: ChatArgs): Promise<string> {
  return rawCall(args);
}

// Extract the first balanced JSON object from a string, tolerating
// stray prose or code fences around it.
function extractJsonBlock(raw: string): string {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  if (start === -1) return cleaned;
  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "{") depth++;
    else if (cleaned[i] === "}") {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }
  return cleaned.slice(start); // unbalanced; let parse throw
}

function tryParse<T>(raw: string): T | null {
  try {
    return JSON.parse(extractJsonBlock(raw)) as T;
  } catch {
    return null;
  }
}

// JSON completion with one self-repair retry. Uses Groq's json_object
// mode first; if the model still emits something unparseable, it asks
// the model to fix its own output rather than erroring the request.
export async function callLLMJson<T>(args: ChatArgs): Promise<T> {
  const first = await rawCall({ ...args, jsonMode: true });
  const parsed = tryParse<T>(first);
  if (parsed !== null) return parsed;

  // Repair pass: feed the broken output back and demand valid JSON only.
  const repair = await rawCall({
    system:
      "You fix malformed JSON. Return ONLY the corrected, valid JSON object. No prose, no code fences.",
    user: `This should be a single valid JSON object but failed to parse. Fix it and return only the JSON:\n\n${first}`,
    maxTokens: args.maxTokens,
    temperature: 0,
    jsonMode: true,
  });
  const repaired = tryParse<T>(repair);
  if (repaired !== null) return repaired;

  throw new Error("Model returned unparseable JSON after retry.");
}
