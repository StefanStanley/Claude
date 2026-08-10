import { NextResponse } from "next/server";
import { ingestFile, formatIngestBlock } from "@/lib/ingest";

// Transkription, PDF-Parsing und Vision brauchen die Node-Runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Obergrenze pro Datei (Groq-Whisper-Free-Tier verträgt ~25 MB Audio). */
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Datei zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB, max. 25 MB).` },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await ingestFile({ buffer, filename: file.name, mime: file.type });

    return NextResponse.json({ ...result, block: formatIngestBlock(result) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erfassung fehlgeschlagen.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
