import { NextResponse } from "next/server";
import { mineEventLog } from "@/lib/mining";
import type { ColumnMapping } from "@/lib/mining/types";

// bpmn-auto-layout braucht die Node-Runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Keine Log-Datei übermittelt." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Datei zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB, max. 25 MB).` },
        { status: 413 },
      );
    }

    let mapping: ColumnMapping | undefined;
    const rawMapping = form.get("mapping");
    if (typeof rawMapping === "string" && rawMapping.trim()) {
      try {
        mapping = JSON.parse(rawMapping);
      } catch {
        /* ungültiges Mapping ignorieren – Auto-Erkennung greift */
      }
    }

    const text = await file.text();
    const response = await mineEventLog(text, file.name, mapping);
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Process Mining fehlgeschlagen.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
