import { NextResponse } from "next/server";
import { analyzeTranscript } from "@/lib/analyze";

// bpmn-auto-layout und das Anthropic-SDK brauchen die Node-Runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const transcript = typeof body?.transcript === "string" ? body.transcript : "";
    const result = await analyzeTranscript(transcript);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler bei der Analyse.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
