import { NextResponse } from "next/server";
import { SavePayloadSchema, listProcesses, createProcess } from "@/lib/processes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ processes: await listProcesses() });
  } catch (err) {
    return NextResponse.json({ error: dbError(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = SavePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Daten: " + parsed.error.issues[0]?.message }, { status: 400 });
    }
    const detail = await createProcess(parsed.data);
    return NextResponse.json(detail, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: dbError(err) }, { status: 500 });
  }
}

function dbError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/database|connect|ECONNREFUSED|P1001|relation .* does not exist/i.test(msg)) {
    return "Datenbank nicht erreichbar oder nicht migriert. Läuft Postgres und wurde `prisma migrate` ausgeführt?";
  }
  return msg;
}
