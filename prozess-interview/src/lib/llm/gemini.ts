import { AnalysisResultSchema, type AnalysisResult } from "@/lib/ir/schema";
import type { LlmProvider } from "@/lib/llm/provider";
import { SYSTEM_PROMPT, USER_PREFIX, extractJsonObject, repairPrompt } from "@/lib/llm/prompt";

/**
 * Google-Gemini-Provider über die Generative-Language-REST-API.
 * Kostenloser API-Key aus Google AI Studio (aistudio.google.com) — Free-Tier
 * ohne Billing. Nutzt `responseMimeType: application/json`, damit reines JSON
 * zurückkommt (ideal für die IR-Extraktion).
 */
export function createGeminiProvider(): LlmProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY fehlt.");
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  async function callModel(userContent: string): Promise<string> {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey!,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gemini-API-Fehler ${res.status}: ${body.slice(0, 400)}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      promptFeedback?: { blockReason?: string };
    };
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Gemini hat die Anfrage blockiert: ${data.promptFeedback.blockReason}`);
    }
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p?.text ?? "").join("") ?? "";
    if (!text.trim()) throw new Error("Leere Antwort von Gemini.");
    return text;
  }

  return {
    name: `gemini:${model}`,
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
