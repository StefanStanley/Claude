import type { AnalysisResult } from "@/lib/ir/schema";

/**
 * Provider-Abstraktion (LLM-Gateway).
 *
 * Der Rest der App kennt nur dieses Interface. So ist das Backend austauschbar:
 * heute Anthropic (Cloud), später ein On-Prem-Modell (vLLM/Ollama, OpenAI-kompatibel).
 */
export interface LlmProvider {
  readonly name: string;
  analyze(transcript: string): Promise<AnalysisResult>;
}

export type ProviderKind = "anthropic" | "mock";

export function resolveProviderKind(): ProviderKind {
  const explicit = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (explicit === "mock") return "mock";
  if (explicit === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  // Auto: Anthropic nur wenn ein Key vorhanden ist, sonst Offline-Mock.
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "mock";
}
