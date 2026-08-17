import { AnalysisResultSchema, type AnalysisResult } from "@/lib/ir/schema";
import type { LlmProvider } from "@/lib/llm/provider";
import { SYSTEM_PROMPT, USER_PREFIX, extractJsonObject, repairPrompt } from "@/lib/llm/prompt";

/**
 * Generischer Provider für OpenAI-kompatible Chat-APIs.
 * Deckt gleich mehrere Backends ab:
 *  - Groq (kostenloses Free-Tier, sehr großzügig)
 *  - später On-Prem: vLLM / Ollama (gleiche API, andere Base-URL) → KRITIS-Weg
 */
interface CompatOptions {
  baseUrl: string; // z.B. https://api.groq.com/openai/v1
  apiKey?: string; // lokale Server (Ollama) brauchen oft keinen Key
  model: string;
  label: string; // für provider.name
}

function createOpenAiCompatible(opts: CompatOptions): LlmProvider {
  const url = `${opts.baseUrl.replace(/\/+$/, "")}/chat/completions`;

  async function callModel(userContent: string): Promise<string> {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: opts.model,
        temperature: 0.2,
        max_tokens: 8192,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`LLM-API-Fehler ${res.status}: ${body.slice(0, 400)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new Error("Leere Antwort vom LLM.");
    return text;
  }

  return {
    name: opts.label,
    async analyze(transcript: string): Promise<AnalysisResult> {
      const first = await callModel(`${USER_PREFIX}\n\n--- TRANSKRIPT ---\n${transcript}`);
      try {
        return AnalysisResultSchema.parse(extractJsonObject(first));
      } catch (err) {
        const second = await callModel(repairPrompt(first, err));
        return AnalysisResultSchema.parse(extractJsonObject(second));
      }
    },
  };
}

/** Groq — kostenloses Free-Tier. Key von https://console.groq.com */
export function createGroqProvider(): LlmProvider {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY fehlt.");
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  return createOpenAiCompatible({
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey,
    model,
    label: `groq:${model}`,
  });
}

/** Beliebiges OpenAI-kompatibles Backend (vLLM/Ollama/…): OPENAI_COMPAT_BASE_URL setzen. */
export function createOpenAiCompatProvider(): LlmProvider {
  const baseUrl = process.env.OPENAI_COMPAT_BASE_URL;
  if (!baseUrl) throw new Error("OPENAI_COMPAT_BASE_URL fehlt.");
  const model = process.env.OPENAI_COMPAT_MODEL || "llama-3.3-70b";
  return createOpenAiCompatible({
    baseUrl,
    apiKey: process.env.OPENAI_COMPAT_API_KEY,
    model,
    label: `openai-compat:${model}`,
  });
}
