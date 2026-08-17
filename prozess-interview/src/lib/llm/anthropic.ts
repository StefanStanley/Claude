import Anthropic from "@anthropic-ai/sdk";
import { AnalysisResultSchema, type AnalysisResult } from "@/lib/ir/schema";
import type { LlmProvider } from "@/lib/llm/provider";
import { SYSTEM_PROMPT, USER_PREFIX, extractJsonObject, repairPrompt } from "@/lib/llm/prompt";

export function createAnthropicProvider(): LlmProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt.");
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const client = new Anthropic({ apiKey });

  async function callModel(userContent: string): Promise<string> {
    const msg = await client.messages.create({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });
    return msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");
  }

  return {
    name: `anthropic:${model}`,
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
