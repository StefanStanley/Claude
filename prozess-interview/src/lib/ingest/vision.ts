/**
 * Vision-/OCR-Extraktion (Foto/Bild → Text).
 *
 * Nutzt ein vision-fähiges LLM, um aus Belegfotos (Formulare, Schaltschränke,
 * Checklisten, System-Screenshots) den lesbaren Text und den prozessrelevanten
 * Kontext zu ziehen. Backends: Anthropic Claude oder Google Gemini (beide
 * vision-fähig). On-prem ließe sich hier ein lokales VLM / Tesseract einhängen.
 */
import Anthropic from "@anthropic-ai/sdk";

export interface VisionProvider {
  readonly name: string;
  describe(buf: Buffer, mime: string): Promise<string>;
}

const VISION_PROMPT =
  "Du erhältst ein Foto oder gescanntes Dokument aus einer Prozessaufnahme im " +
  "Energiesektor. Extrahiere allen lesbaren Text (OCR) möglichst wörtlich und " +
  "beschreibe in ein bis zwei Sätzen, was prozessrelevant zu sehen ist (z. B. " +
  "Formular, Schaltschrank, Checkliste, System-Screenshot). Antworte auf Deutsch, " +
  "gib nur den extrahierten Inhalt zurück – keine Einleitung, keine Meta-Kommentare.";

type Kind = "anthropic" | "gemini" | "mock";

function resolveKind(): Kind {
  const explicit = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (explicit === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (explicit === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  // Auto: erstes vision-fähiges Backend mit Key.
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "mock";
}

function normalizeMime(mime: string): string {
  const m = (mime || "").toLowerCase();
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(m)) return m;
  return "image/jpeg"; // sichere Voreinstellung für unklare/HEIC-Typen
}

function createAnthropicVision(): VisionProvider {
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  return {
    name: `anthropic:${model}`,
    async describe(buf, mime) {
      const msg = await client.messages.create({
        model,
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: normalizeMime(mime) as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                  data: buf.toString("base64"),
                },
              },
              { type: "text", text: VISION_PROMPT },
            ],
          },
        ],
      });
      return msg.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("\n")
        .trim();
    },
  };
}

function createGeminiVision(): VisionProvider {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  return {
    name: `gemini:${model}`,
    async describe(buf, mime) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { inline_data: { mime_type: normalizeMime(mime), data: buf.toString("base64") } },
                { text: VISION_PROMPT },
              ],
            },
          ],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Gemini-Vision-Fehler ${res.status}: ${body.slice(0, 300)}`);
      }
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      return (data.candidates?.[0]?.content?.parts?.map((p) => p?.text ?? "").join("") ?? "").trim();
    },
  };
}

export function getVisionProvider(): VisionProvider {
  switch (resolveKind()) {
    case "anthropic":
      return createAnthropicVision();
    case "gemini":
      return createGeminiVision();
    default:
      return {
        name: "mock",
        async describe() {
          return "[Bild empfangen – keine Vision-Extraktion konfiguriert. Für OCR/Bildanalyse ANTHROPIC_API_KEY oder GEMINI_API_KEY setzen.]";
        },
      };
  }
}
