import type { AnalysisResult } from "@/lib/ir/schema";

/**
 * Provider-Abstraktion (LLM-Gateway).
 *
 * Der Rest der App kennt nur dieses Interface. So ist das Backend austauschbar:
 * Anthropic Claude (Cloud), Google Gemini (kostenloses Free-Tier), ein
 * Offline-Mock (kein Key) — später ein On-Prem-Modell (vLLM/Ollama).
 */
export interface LlmProvider {
  readonly name: string;
  analyze(transcript: string): Promise<AnalysisResult>;
}

export type ProviderKind = "anthropic" | "gemini" | "mock";

export function resolveProviderKind(): ProviderKind {
  const explicit = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (explicit === "mock") return "mock";
  if (explicit === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (explicit === "gemini" && process.env.GEMINI_API_KEY) return "gemini";

  // Auto: den ersten Provider nehmen, für den ein Key vorhanden ist, sonst Mock.
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "mock";
}
