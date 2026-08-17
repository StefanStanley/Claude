/**
 * Transkriptions-Gateway (Audio → Text).
 *
 * Austauschbares Backend über die OpenAI-kompatible `/audio/transcriptions`-API,
 * die sowohl Groq Whisper (Cloud, Free-Tier) als auch ein lokales
 * faster-whisper-Server (on-prem, air-gap) sprechen:
 *
 *  - TRANSCRIBE_PROVIDER = groq | openai | local | mock  (Standard: auto)
 *  - groq:   base https://api.groq.com/openai/v1, GROQ_API_KEY,
 *            Modell whisper-large-v3-turbo (kostenlos, schnell)
 *  - openai/local: TRANSCRIBE_BASE_URL + TRANSCRIBE_API_KEY + TRANSCRIBE_MODEL
 *            (z. B. faster-whisper-server, vLLM-Whisper, LocalAI)
 *  - mock:   kein Backend – gibt einen deutlichen Platzhalter zurück
 */

export interface TranscribeProvider {
  readonly name: string;
  transcribe(buf: Buffer, filename: string, mime: string): Promise<string>;
}

type Kind = "groq" | "openai" | "local" | "mock";

function resolveKind(): Kind {
  const explicit = (process.env.TRANSCRIBE_PROVIDER || "").toLowerCase();
  if (explicit === "mock") return "mock";
  if (explicit === "groq" && process.env.GROQ_API_KEY) return "groq";
  if ((explicit === "openai" || explicit === "local") && process.env.TRANSCRIBE_BASE_URL) return explicit as Kind;

  // Auto: erst on-prem/Custom-Endpunkt, dann Groq, sonst mock.
  if (process.env.TRANSCRIBE_BASE_URL) return "local";
  if (process.env.GROQ_API_KEY) return "groq";
  return "mock";
}

/** Ein Provider, der einen OpenAI-kompatiblen Transkriptions-Endpunkt anspricht. */
function createOpenAiCompatibleTranscriber(opts: {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
}): TranscribeProvider {
  return {
    name: opts.name,
    async transcribe(buf, filename, mime) {
      const form = new FormData();
      const blob = new Blob([new Uint8Array(buf)], { type: mime || "application/octet-stream" });
      form.append("file", blob, filename || "audio");
      form.append("model", opts.model);
      form.append("language", "de");
      form.append("response_format", "json");

      const headers: Record<string, string> = {};
      if (opts.apiKey) headers.Authorization = `Bearer ${opts.apiKey}`;

      const res = await fetch(`${opts.baseUrl.replace(/\/$/, "")}/audio/transcriptions`, {
        method: "POST",
        headers,
        body: form,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Transkription (${opts.name}) fehlgeschlagen ${res.status}: ${body.slice(0, 300)}`);
      }
      const data = (await res.json()) as { text?: string };
      return (data.text || "").trim();
    },
  };
}

export function getTranscribeProvider(): TranscribeProvider {
  switch (resolveKind()) {
    case "groq":
      return createOpenAiCompatibleTranscriber({
        name: `groq:${process.env.TRANSCRIBE_MODEL || "whisper-large-v3-turbo"}`,
        baseUrl: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.TRANSCRIBE_MODEL || "whisper-large-v3-turbo",
      });
    case "openai":
    case "local":
      return createOpenAiCompatibleTranscriber({
        name: `whisper:${process.env.TRANSCRIBE_MODEL || "whisper-1"}`,
        baseUrl: process.env.TRANSCRIBE_BASE_URL || "",
        apiKey: process.env.TRANSCRIBE_API_KEY,
        model: process.env.TRANSCRIBE_MODEL || "whisper-1",
      });
    default:
      return {
        name: "mock",
        async transcribe(_buf, filename) {
          return `[Audio „${filename}" empfangen – keine Transkription konfiguriert. Für echte Transkription GROQ_API_KEY setzen (kostenlos) oder einen faster-whisper-Server über TRANSCRIBE_BASE_URL anbinden.]`;
        },
      };
  }
}
