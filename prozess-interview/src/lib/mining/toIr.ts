/**
 * DFG → Process IR: die gemine Prozesslandkarte in die bestehende IR gießen,
 * damit sie der vorhandene BPMN-Generator zeichnen kann. Kanten tragen die
 * Häufigkeit als Label. Selbstschleifen werden ausgeblendet (als Rework in den
 * Kennzahlen sichtbar), und bei sehr dichten Graphen filtern wir seltene Kanten
 * heraus ("Spaghetti" vermeiden).
 */
import type { ProcessIr } from "@/lib/ir/schema";
import type { MiningResult } from "@/lib/mining/types";

export interface ToIrOptions {
  /** Kanten mit count < minEdgeCount weglassen (Standard: automatisch). */
  minEdgeCount?: number;
  /** Höchstzahl gezeichneter Kanten (Standard 40). */
  maxEdges?: number;
}

export function miningToIr(result: MiningResult, opts: ToIrOptions = {}): { ir: ProcessIr; keptEdges: number; droppedEdges: number } {
  const maxEdges = opts.maxEdges ?? 40;
  const maxCount = result.edges.reduce((m, e) => Math.max(m, e.count), 1);
  const minEdgeCount = opts.minEdgeCount ?? Math.max(1, Math.ceil(maxCount * 0.03));

  // Selbstschleifen raus, nach Filter + Kappung die häufigsten Kanten behalten.
  const filtered = result.edges.filter((e) => e.from !== e.to && e.count >= minEdgeCount);
  const kept = filtered.slice(0, maxEdges);
  const droppedEdges = result.edges.filter((e) => e.from !== e.to).length - kept.length;

  // Knotenmenge = alle Aktivitäten aus behaltenen Kanten + Start/End-Aktivitäten.
  const nodeNames = new Set<string>();
  kept.forEach((e) => {
    nodeNames.add(e.from);
    nodeNames.add(e.to);
  });
  result.startActivities.forEach((s) => nodeNames.add(s.name));
  result.endActivities.forEach((s) => nodeNames.add(s.name));

  // Stabile IDs vergeben.
  const idOf = new Map<string, string>();
  let n = 0;
  for (const name of nodeNames) idOf.set(name, `a${n++}`);

  const elements: ProcessIr["elements"] = [
    { id: "start", type: "startEvent", name: "Start", systemIds: [] },
    { id: "end", type: "endEvent", name: "Ende", systemIds: [] },
    ...[...nodeNames].map((name) => ({
      id: idOf.get(name)!,
      type: "task" as const,
      name,
      systemIds: [],
    })),
  ];

  const flows: ProcessIr["flows"] = [];
  let f = 0;
  // Start → Startaktivitäten (nur die tatsächlich häufigsten, damit die Map lesbar bleibt).
  for (const s of result.startActivities) {
    if (!idOf.has(s.name)) continue;
    flows.push({ id: `f${f++}`, source: "start", target: idOf.get(s.name)!, name: String(s.count) });
  }
  // Directly-Follows-Kanten mit Häufigkeit als Label.
  for (const e of kept) {
    flows.push({ id: `f${f++}`, source: idOf.get(e.from)!, target: idOf.get(e.to)!, name: String(e.count) });
  }
  // Endaktivitäten → Ende.
  for (const s of result.endActivities) {
    if (!idOf.has(s.name)) continue;
    flows.push({ id: `f${f++}`, source: idOf.get(s.name)!, target: "end", name: String(s.count) });
  }

  const ir: ProcessIr = {
    name: "Gemine Prozesslandkarte",
    description: `${result.caseCount} Fälle · ${result.eventCount} Ereignisse · ${result.activityCount} Aktivitäten`,
    roles: [],
    systems: [],
    elements,
    flows,
    openQuestions: [],
  };

  return { ir, keptEdges: kept.length, droppedEdges };
}
