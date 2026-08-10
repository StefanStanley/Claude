/**
 * Gemeinsame Extraktions-Bausteine für alle Cloud-LLM-Provider
 * (Anthropic, Gemini, …). Ein Prompt, ein JSON-Parser — damit jeder Provider
 * dasselbe Process-IR-/Assessment-Format liefert.
 */

export const SYSTEM_PROMPT = `Du bist ein Prozessanalyst für Energieversorger und Netzbetreiber (DE, KRITIS).
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

/** Extrahiert das erste JSON-Objekt aus einer (evtl. umschlossenen) LLM-Antwort. */
export function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Keine JSON-Struktur in der Antwort gefunden.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

export const USER_PREFIX = "Analysiere das folgende Prozess-Interview und gib das JSON zurück.";

/** Reparatur-Prompt, wenn die erste Antwort kein gültiges JSON war. */
export function repairPrompt(previous: string, error: unknown): string {
  return `Deine vorige Antwort war kein gültiges JSON gemäß Schema. Fehler:\n${
    error instanceof Error ? error.message : String(error)
  }\n\nGib das korrigierte, vollständige JSON-Objekt erneut zurück – nur JSON.\n\nVorige Antwort:\n${previous}`;
}
