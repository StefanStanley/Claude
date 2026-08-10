/**
 * Gemeinsame Typen für das Ingestion-Gateway (multimodale Erfassung).
 *
 * Spiegelbildlich zum LLM-Gateway: Die App kennt nur diese Formen, die
 * konkreten Backends (Whisper-Transkription, PDF-Extraktion, Vision/OCR)
 * sind über Env austauschbar – Cloud jetzt, on-prem später.
 */

export type IngestKind = "audio" | "video" | "pdf" | "image" | "text" | "unknown";

export interface IngestResult {
  /** Erkannte Belegart. */
  kind: IngestKind;
  /** Ursprünglicher Dateiname (für die Beschriftung im Transkript). */
  filename: string;
  /** Extrahierter Klartext, der ins Transkript einfließt (kann leer sein). */
  text: string;
  /** Kurzer Hinweis für die UI (z. B. „Transkribiert via Groq Whisper"). */
  note?: string;
  /** Verwendetes Backend (Provider-Name), für Transparenz/Debug. */
  provider: string;
}

/** Deutsches Label je Belegart – für die Trennmarke im Transkript. */
export const KIND_LABEL: Record<IngestKind, string> = {
  audio: "Audio-Aufnahme",
  video: "Video",
  pdf: "PDF-Dokument",
  image: "Foto/Bild",
  text: "Textdatei",
  unknown: "Datei",
};

/** Grobe Belegart aus MIME-Typ und Dateiendung ableiten. */
export function detectKind(mime: string, filename: string): IngestKind {
  const m = (mime || "").toLowerCase();
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (m.startsWith("audio/") || ["m4a", "mp3", "wav", "ogg", "flac", "webm", "aac"].includes(ext)) return "audio";
  if (m.startsWith("video/") || ["mp4", "mov", "mkv", "avi", "m4v"].includes(ext)) return "video";
  if (m === "application/pdf" || ext === "pdf") return "pdf";
  if (m.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "heic"].includes(ext)) return "image";
  if (m.startsWith("text/") || ["txt", "md", "csv"].includes(ext)) return "text";
  return "unknown";
}
