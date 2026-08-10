import type { AnalysisResult } from "@/lib/ir/schema";

/**
 * Provider-Abstraktion (LLM-Gateway).
 *
 * Der Rest der App kennt nur dieses Interface. Austauschbare Backends:
 *  - anthropic  Claude (Cloud, kostenpflichtig)
 *  - gemini     Google Gemini (Free-Tier)
 *  - groq       Groq (Free-Tier)
 *  - openai     beliebiges OpenAI-kompatibles Backend (vLLM/Ollama → On-Prem)
 *  - mock       Offline-Heuristik (kein Key)
 */
export interface LlmProvider {
  readonly name: string;
  analyze(transcript: string): Promise<AnalysisResult>;
}

export type ProviderKind = "anthropic" | "gemini" | "groq" | "openai" | "mock";

export function resolveProviderKind(): ProviderKind {
  const explicit = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (explicit === "mock") return "mock";
  if (explicit === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (explicit === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (explicit === "groq" && process.env.GROQ_API_KEY) return "groq";
  if (explicit === "openai" && process.env.OPENAI_COMPAT_BASE_URL) return "openai";

  // Auto: den ersten Provider nehmen, für den eine Konfiguration vorhanden ist.
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_COMPAT_BASE_URL) return "openai";
  return "mock";
}
