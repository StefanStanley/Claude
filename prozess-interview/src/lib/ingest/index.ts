/**
 * Ingestion-Gateway – zentrale Dispatch-Stelle.
 *
 * Nimmt eine hochgeladene Datei entgegen, erkennt die Belegart und leitet an
 * das passende Backend weiter (Transkription / PDF / Vision / Text). Ergebnis
 * ist stets Klartext, der beschriftet ins Transkript einfließt – so verarbeitet
 * die bestehende Pipeline (IR → BPMN → Bewertung) Belege ohne Sonderfälle.
 */
import { detectKind, KIND_LABEL, type IngestResult } from "@/lib/ingest/types";
import { getTranscribeProvider } from "@/lib/ingest/transcribe";
import { extractPdfText } from "@/lib/ingest/pdf";
import { getVisionProvider } from "@/lib/ingest/vision";

export interface IngestInput {
  buffer: Buffer;
  filename: string;
  mime: string;
}

export async function ingestFile(input: IngestInput): Promise<IngestResult> {
  const kind = detectKind(input.mime, input.filename);
  const filename = input.filename || "Datei";

  switch (kind) {
    case "audio": {
      const p = getTranscribeProvider();
      const text = await p.transcribe(input.buffer, filename, input.mime);
      return { kind, filename, text, note: `Transkribiert via ${p.name}`, provider: p.name };
    }
    case "video": {
      // Reine Audio-Transkriptions-Endpunkte nehmen keine Video-Container an.
      // Ehrlicher Hinweis statt stillem Fehlschlag – Audioextraktion (ffmpeg) folgt.
      return {
        kind,
        filename,
        text: "",
        note: "Video erkannt – bitte die Audiospur als m4a/mp3 hochladen. Serverseitige Audioextraktion (ffmpeg) ist als nächster Schritt vorgesehen.",
        provider: "none",
      };
    }
    case "pdf": {
      const text = await extractPdfText(input.buffer);
      return {
        kind,
        filename,
        text,
        note: text ? "Text aus PDF extrahiert" : "PDF ohne eingebetteten Text (evtl. Scan – OCR folgt).",
        provider: "pdf-parse",
      };
    }
    case "image": {
      const p = getVisionProvider();
      const text = await p.describe(input.buffer, input.mime);
      return { kind, filename, text, note: `Bild analysiert via ${p.name}`, provider: p.name };
    }
    case "text": {
      const text = input.buffer.toString("utf8").trim();
      return { kind, filename, text, note: "Textdatei übernommen", provider: "text" };
    }
    default:
      return {
        kind,
        filename,
        text: "",
        note: `Nicht unterstützter Dateityp (${input.mime || "unbekannt"}).`,
        provider: "none",
      };
  }
}

/** Extrahierten Beleg als beschrifteten Transkript-Block formatieren. */
export function formatIngestBlock(r: IngestResult): string {
  const head = `[${KIND_LABEL[r.kind]}: ${r.filename}]`;
  return r.text ? `${head}\n${r.text}` : head;
}
