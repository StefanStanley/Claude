import { NextResponse } from "next/server";
import { SavePayloadSchema, addVersion } from "@/lib/processes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = SavePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Daten: " + parsed.error.issues[0]?.message }, { status: 400 });
    }
    const detail = await addVersion(params.id, parsed.data);
    if (!detail) return NextResponse.json({ error: "Prozess nicht gefunden." }, { status: 404 });
    return NextResponse.json(detail, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Fehler." }, { status: 500 });
  }
}
