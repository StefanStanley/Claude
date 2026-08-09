import { AnalysisResultSchema, type AnalysisResult } from "@/lib/ir/schema";
import { resolveProviderKind, type LlmProvider } from "@/lib/llm/provider";
import { createAnthropicProvider } from "@/lib/llm/anthropic";
import { createMockProvider } from "@/lib/llm/mock";
import { generateLayoutedBpmn } from "@/lib/bpmn/generate";

export interface AnalysisResponse extends AnalysisResult {
  bpmnXml: string;
  provider: string;
}

function getProvider(): LlmProvider {
  return resolveProviderKind() === "anthropic" ? createAnthropicProvider() : createMockProvider();
}

/**
 * Orchestriert den Durchstich: Transkript -> (LLM) IR + Bewertung -> BPMN-XML.
 * Validiert das LLM-Ergebnis final gegen das Zod-Schema.
 */
export async function analyzeTranscript(transcript: string): Promise<AnalysisResponse> {
  const trimmed = transcript.trim();
  if (trimmed.length < 20) {
    throw new Error("Bitte mindestens ein paar Sätze Prozessbeschreibung eingeben.");
  }

  const provider = getProvider();
  const raw = await provider.analyze(trimmed);
  const result = AnalysisResultSchema.parse(raw);
  const bpmnXml = await generateLayoutedBpmn(result.ir);

  return { ...result, bpmnXml, provider: provider.name };
}
