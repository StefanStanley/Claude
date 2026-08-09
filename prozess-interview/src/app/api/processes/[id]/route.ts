import { NextResponse } from "next/server";
import { getProcess, deleteProcess } from "@/lib/processes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url);
    const vParam = url.searchParams.get("version");
    const version = vParam ? Number(vParam) : undefined;
    const detail = await getProcess(params.id, Number.isFinite(version) ? version : undefined);
    if (!detail) return NextResponse.json({ error: "Prozess nicht gefunden." }, { status: 404 });
    return NextResponse.json(detail);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Fehler." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const ok = await deleteProcess(params.id);
    if (!ok) return NextResponse.json({ error: "Prozess nicht gefunden." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Fehler." }, { status: 500 });
  }
}
