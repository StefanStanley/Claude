import Anthropic from "@anthropic-ai/sdk";
import { AnalysisResultSchema, type AnalysisResult } from "@/lib/ir/schema";
import type { LlmProvider } from "@/lib/llm/provider";

const SYSTEM_PROMPT = `Du bist ein Prozessanalyst für Energieversorger und Netzbetreiber (DE, KRITIS).
Aus einem Interview-Transkript extrahierst du (1) ein strukturiertes Prozessmodell (Process IR)
und (2) eine fundierte Bewertung.

Gib AUSSCHLIESSLICH ein einziges JSON-Objekt zurück – keine Erklärungen, kein Markdown, kein Codeblock.
Struktur:

{
  "ir": {
    "name": string,                         // prägnanter Prozessname
    "description": string,
    "roles": [{ "id": string, "name": string }],       // beteiligte Rollen (Lanes)
    "systems": [{ "id": string, "name": string }],     // IT-Systeme (SAP, GIS, ...)
    "elements": [                            // mind. 1 startEvent und 1 endEvent
      { "id": string, "type": "startEvent"|"endEvent"|"task"|"userTask"|"serviceTask"|"exclusiveGateway"|"parallelGateway",
        "name": string, "roleId": string?, "systemIds": string[] }
    ],
    "flows": [{ "id": string, "source": string, "target": string, "name": string? }],  // name = Bedingung an Gateways ("ja"/"nein")
    "openQuestions": string[]                // im Transkript ungeklärte Punkte
  },
  "assessment": {
    "summary": string,
    "overallScore": number,                  // 0..100
    "dimensions": [
      { "key": "maturity"|"mediaBreaks"|"automation"|"cycleTime"|"compliance"|"roleClarity",
        "score": number, "findings": string[], "recommendations": string[] }
    ],
    "quickWins": string[]
  }
}

Regeln:
- IDs sind kurz und eindeutig (z.B. "start", "t1", "gw1", "end").
- Jedes Nicht-Start-Element hat mindestens einen eingehenden, jedes Nicht-End-Element mindestens einen ausgehenden Flow.
- Manuelle Schritte = userTask, automatische/System-Schritte = serviceTask, Entscheidungen = exclusiveGateway.
- Erfinde nichts dazu; ist etwas unklar, nimm es in openQuestions auf.
- Nutze alle sechs Bewertungsdimensionen. Scores realistisch, Findings konkret mit Bezug zum Transkript.
- Antworte auf Deutsch.`;

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Keine JSON-Struktur in der Antwort gefunden.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

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
      const first = await callModel(
        `Analysiere das folgende Prozess-Interview und gib das JSON zurück.\n\n--- TRANSKRIPT ---\n${transcript}`,
      );

      try {
        return AnalysisResultSchema.parse(extractJsonObject(first));
      } catch (err) {
        // Ein Reparaturversuch mit der konkreten Fehlermeldung.
        const second = await callModel(
          `Deine vorige Antwort war kein gültiges JSON gemäß Schema. Fehler:\n${
            err instanceof Error ? err.message : String(err)
          }\n\nGib das korrigierte, vollständige JSON-Objekt erneut zurück – nur JSON.\n\nVorige Antwort:\n${first}`,
        );
        return AnalysisResultSchema.parse(extractJsonObject(second));
      }
    },
  };
}
