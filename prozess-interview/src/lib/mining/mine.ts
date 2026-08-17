/**
 * Der eigentliche Miner: aus Ereignissen einen Directly-Follows-Graph (DFG)
 * plus Kennzahlen berechnen. Rein deterministisch, kein LLM – gleiche Eingabe,
 * gleiches Ergebnis.
 */
import type { LogEvent, MinedEdge, MiningResult, NamedCount } from "@/lib/mining/types";
import type { ParseResult } from "@/lib/mining/parse";

/** Trenner für Map-Schlüssel – ein Steuerzeichen, das in Aktivitätsnamen nicht vorkommt. */
const SEP = String.fromCharCode(1);

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function toSortedCounts(map: Map<string, number>): NamedCount[] {
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function mine(parsed: ParseResult): MiningResult {
  const { events } = parsed;

  // Nach Fall gruppieren.
  const byCase = new Map<string, LogEvent[]>();
  for (const e of events) {
    (byCase.get(e.caseId) ?? byCase.set(e.caseId, []).get(e.caseId)!).push(e);
  }

  const hasTimestamps = events.some((e) => e.ts !== null);
  const hasResources = events.some((e) => e.resource);

  const activity = new Map<string, number>();
  const startAct = new Map<string, number>();
  const endAct = new Map<string, number>();
  const resource = new Map<string, number>();
  const edgeCount = new Map<string, number>();
  const edgeDur = new Map<string, number[]>();
  const variants = new Map<string, number>();
  const reworkCases = new Map<string, number>();
  const selfLoops = new Map<string, number>();
  const caseDurations: number[] = [];

  for (const [, evs] of byCase) {
    // Innerhalb des Falls sortieren: nach Zeitstempel, sonst Ursprungsreihenfolge.
    evs.sort((a, b) => {
      if (a.ts !== null && b.ts !== null && a.ts !== b.ts) return a.ts - b.ts;
      return a.order - b.order;
    });

    const seq = evs.map((e) => e.activity);
    seq.forEach((a) => activity.set(a, (activity.get(a) ?? 0) + 1));
    startAct.set(seq[0], (startAct.get(seq[0]) ?? 0) + 1);
    endAct.set(seq[seq.length - 1], (endAct.get(seq[seq.length - 1]) ?? 0) + 1);
    for (const e of evs) if (e.resource) resource.set(e.resource, (resource.get(e.resource) ?? 0) + 1);

    // Rework: Aktivitäten, die im selben Fall mehrfach vorkommen.
    const seen = new Set<string>();
    const repeated = new Set<string>();
    for (const a of seq) {
      if (seen.has(a)) repeated.add(a);
      seen.add(a);
    }
    repeated.forEach((a) => reworkCases.set(a, (reworkCases.get(a) ?? 0) + 1));

    // Kanten (Directly-Follows).
    for (let i = 0; i < evs.length - 1; i++) {
      const a = evs[i].activity;
      const b = evs[i + 1].activity;
      const key = `${a}${SEP}${b}`;
      edgeCount.set(key, (edgeCount.get(key) ?? 0) + 1);
      if (a === b) selfLoops.set(a, (selfLoops.get(a) ?? 0) + 1);
      if (evs[i].ts !== null && evs[i + 1].ts !== null) {
        const d = (evs[i + 1].ts as number) - (evs[i].ts as number);
        if (d >= 0) (edgeDur.get(key) ?? edgeDur.set(key, []).get(key)!).push(d);
      }
    }

    // Variante = Aktivitätsfolge.
    const vkey = seq.join(SEP);
    variants.set(vkey, (variants.get(vkey) ?? 0) + 1);

    // Durchlaufzeit des Falls.
    const times = evs.map((e) => e.ts).filter((t): t is number => t !== null);
    if (times.length >= 2) caseDurations.push(Math.max(...times) - Math.min(...times));
  }

  const edges: MinedEdge[] = [...edgeCount.entries()]
    .map(([key, count]) => {
      const [from, to] = key.split(SEP);
      const durs = edgeDur.get(key) ?? [];
      const meanMs = durs.length ? durs.reduce((s, d) => s + d, 0) / durs.length : null;
      return { from, to, count, meanMs };
    })
    .sort((a, b) => b.count - a.count);

  const variantList = [...variants.entries()]
    .map(([key, count]) => ({ sequence: key.split(SEP), count }))
    .sort((a, b) => b.count - a.count);

  const throughput =
    caseDurations.length > 0
      ? {
          medianMs: median(caseDurations),
          meanMs: caseDurations.reduce((s, d) => s + d, 0) / caseDurations.length,
          minMs: Math.min(...caseDurations),
          maxMs: Math.max(...caseDurations),
        }
      : null;

  const bottlenecks = edges
    .filter((e) => e.meanMs !== null && e.from !== e.to)
    .sort((a, b) => (b.meanMs as number) - (a.meanMs as number))
    .slice(0, 8);

  return {
    caseCount: byCase.size,
    eventCount: events.length,
    activityCount: activity.size,
    variantCount: variantList.length,
    activities: toSortedCounts(activity),
    startActivities: toSortedCounts(startAct),
    endActivities: toSortedCounts(endAct),
    edges,
    variants: variantList,
    throughput,
    bottlenecks,
    rework: toSortedCounts(reworkCases),
    selfLoops: toSortedCounts(selfLoops),
    resources: toSortedCounts(resource),
    hasTimestamps,
    hasResources,
    columnsUsed: parsed.columnsUsed,
    format: parsed.format,
    delimiter: parsed.delimiter,
    warnings: parsed.warnings,
  };
}

/** Millisekunden menschenlesbar (DE): min / h / Tage. */
export function formatDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "–";
  const s = ms / 1000;
  if (s < 60) return `${Math.round(s)} s`;
  const min = s / 60;
  if (min < 60) return `${min.toFixed(min < 10 ? 1 : 0)} min`;
  const h = min / 60;
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)} h`;
  const d = h / 24;
  return `${d.toFixed(d < 10 ? 1 : 0)} Tage`;
}
