import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ProcessIrSchema, AssessmentSchema, type ProcessIr, type Assessment } from "@/lib/ir/schema";

/** Nutzlast zum Speichern einer Analyse (aus der bereits berechneten Vorschau). */
export const SavePayloadSchema = z.object({
  name: z.string().trim().min(1).max(140).optional(),
  transcript: z.string().min(1),
  analysis: z.object({
    ir: ProcessIrSchema,
    assessment: AssessmentSchema,
    bpmnXml: z.string().min(1),
    provider: z.string().min(1),
  }),
});
export type SavePayload = z.infer<typeof SavePayloadSchema>;

export interface ProcessListItem {
  id: string;
  name: string;
  latestVersion: number;
  versionCount: number;
  updatedAt: string;
}

export interface VersionMeta {
  version: number;
  provider: string;
  createdAt: string;
}

export interface FullVersion extends VersionMeta {
  transcript: string;
  ir: ProcessIr;
  assessment: Assessment;
  bpmnXml: string;
}

export interface ProcessDetail {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  versions: VersionMeta[];
  current: FullVersion;
}

function toFullVersion(v: {
  version: number;
  provider: string;
  createdAt: Date;
  transcript: string;
  ir: unknown;
  assessment: unknown;
  bpmnXml: string;
}): FullVersion {
  return {
    version: v.version,
    provider: v.provider,
    createdAt: v.createdAt.toISOString(),
    transcript: v.transcript,
    ir: v.ir as ProcessIr,
    assessment: v.assessment as Assessment,
    bpmnXml: v.bpmnXml,
  };
}

export async function listProcesses(): Promise<ProcessListItem[]> {
  const rows = await prisma.process.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      versions: { orderBy: { version: "desc" }, select: { version: true } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    latestVersion: p.versions[0]?.version ?? 0,
    versionCount: p.versions.length,
    updatedAt: p.updatedAt.toISOString(),
  }));
}

/** Legt einen neuen Process mit Version 1 an. */
export async function createProcess(payload: SavePayload): Promise<ProcessDetail> {
  const { analysis } = payload;
  const name = (payload.name || analysis.ir.name || "Unbenannter Prozess").slice(0, 140);

  const created = await prisma.process.create({
    data: {
      name,
      versions: {
        create: {
          version: 1,
          transcript: payload.transcript,
          provider: analysis.provider,
          ir: analysis.ir as unknown as Prisma.InputJsonValue,
          assessment: analysis.assessment as unknown as Prisma.InputJsonValue,
          bpmnXml: analysis.bpmnXml,
        },
      },
    },
  });
  return (await getProcess(created.id))!;
}

/** Hängt eine neue Version an einen bestehenden Process an (atomar). */
export async function addVersion(processId: string, payload: SavePayload): Promise<ProcessDetail | null> {
  const { analysis } = payload;

  const ok = await prisma.$transaction(async (tx) => {
    const proc = await tx.process.findUnique({ where: { id: processId } });
    if (!proc) return false;

    const last = await tx.processVersion.findFirst({
      where: { processId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const nextVersion = (last?.version ?? 0) + 1;

    await tx.processVersion.create({
      data: {
        processId,
        version: nextVersion,
        transcript: payload.transcript,
        provider: analysis.provider,
        ir: analysis.ir as unknown as Prisma.InputJsonValue,
        assessment: analysis.assessment as unknown as Prisma.InputJsonValue,
        bpmnXml: analysis.bpmnXml,
      },
    });
    // Optionale Umbenennung + updatedAt anstoßen.
    await tx.process.update({
      where: { id: processId },
      data: { name: payload.name ? payload.name.slice(0, 140) : proc.name },
    });
    return true;
  });

  return ok ? getProcess(processId) : null;
}

/** Lädt einen Process inkl. Versionsliste; `version` wählt die angezeigte Version (Standard: neueste). */
export async function getProcess(id: string, version?: number): Promise<ProcessDetail | null> {
  const proc = await prisma.process.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { version: "desc" },
        select: {
          version: true,
          provider: true,
          createdAt: true,
          transcript: true,
          ir: true,
          assessment: true,
          bpmnXml: true,
        },
      },
    },
  });
  if (!proc || proc.versions.length === 0) return null;

  const current = version
    ? proc.versions.find((v) => v.version === version) ?? proc.versions[0]
    : proc.versions[0];

  return {
    id: proc.id,
    name: proc.name,
    createdAt: proc.createdAt.toISOString(),
    updatedAt: proc.updatedAt.toISOString(),
    versions: proc.versions.map((v) => ({
      version: v.version,
      provider: v.provider,
      createdAt: v.createdAt.toISOString(),
    })),
    current: toFullVersion(current),
  };
}

export async function deleteProcess(id: string): Promise<boolean> {
  try {
    await prisma.process.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
