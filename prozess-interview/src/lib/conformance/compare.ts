/**
 * Soll-Ist-Abgleich (Conformance Checking).
 *
 * Vergleicht ein dokumentiertes Prozessmodell (Soll — Process IR aus dem
 * Interview) mit dem tatsächlich gelebten Prozess (Ist — gemine DFG aus dem
 * Event-Log). Ergebnis: Abdeckung, Fitness und – am wichtigsten – die konkreten
 * Abweichungen: beobachtete, aber nicht modellierte Übergänge; modellierte, aber
 * nie gelebte Übergänge; undokumentierte bzw. tote Aktivitäten.
 *
 * Rein deterministisch (Mengen-/String-Operationen), läuft im Browser.
 */
import type { ProcessIr } from "@/lib/ir/schema";
import type { MiningResult } from "@/lib/mining/types";

const SEP = String.fromCharCode(1);
const TASK_TYPES = new Set(["task", "userTask", "serviceTask"]);

export interface Deviation {
  from: string;
  to: string;
  count: number;
}
export interface ConformanceResult {
  score: number; // 0..100 Gesamt
  fitness: number; // Anteil konformer Übergangs-Vorkommen (0..1)
  activityCoverage: number; // Anteil gemeinsamer Aktivitäten (0..1)
  matched: string[]; // gemeinsame Aktivitäten (Soll-Namen)
  istOnly: string[]; // beobachtet, aber nicht modelliert
  sollOnly: string[]; // modelliert, aber nie beobachtet
  undesired: Deviation[]; // beobachtete Übergänge ohne Modell-Deckung
  unobserved: { from: string; to: string }[]; // modellierte Übergänge, nie beobachtet
  mapping: { ist: string; soll: string }[]; // erkannte Namenszuordnung
  sollActivityCount: number;
  istActivityCount: number;
}

/** Namen normalisieren (Kleinschreibung, Diakritika/Satzzeichen weg). */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // kombinierende Diakritika entfernen
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(s: string): Set<string> {
  return new Set(norm(s).split(" ").filter(Boolean));
}

/** Token-Jaccard für unscharfe Zuordnung. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Aktivitäts-Namen der Task-Knoten des Soll-Modells. */
function sollActivities(ir: ProcessIr): string[] {
  return ir.elements.filter((e) => TASK_TYPES.has(e.type)).map((e) => e.name).filter(Boolean);
}

/**
 * Aktivitäts-Ebenen-„directly-follows" des Soll-Modells: Nicht-Task-Knoten
 * (Start/Ende/Gateways) werden durchgereicht, sodass Task→Task-Relationen
 * entstehen (Gateways erzeugen mehrere zulässige Nachfolger).
 */
function sollFollows(ir: ProcessIr): Set<string> {
  const nameById = new Map(ir.elements.map((e) => [e.id, e.name]));
  const typeById = new Map(ir.elements.map((e) => [e.id, e.type]));
  const out = new Map<string, string[]>();
  for (const f of ir.flows) {
    (out.get(f.source) ?? out.set(f.source, []).get(f.source)!).push(f.target);
  }
  const follows = new Set<string>();
  for (const el of ir.elements) {
    if (!TASK_TYPES.has(el.type)) continue;
    const seen = new Set<string>();
    const stack = [...(out.get(el.id) ?? [])];
    while (stack.length) {
      const n = stack.pop()!;
      if (seen.has(n)) continue;
      seen.add(n);
      if (TASK_TYPES.has(typeById.get(n) || "")) {
        follows.add(`${el.name}${SEP}${nameById.get(n)}`);
      } else {
        stack.push(...(out.get(n) ?? []));
      }
    }
  }
  return follows;
}

export function compareConformance(ir: ProcessIr, mining: MiningResult): ConformanceResult {
  const sollNames = Array.from(new Set(sollActivities(ir)));
  const istNames = mining.activities.map((a) => a.name);

  // Ist-Aktivität → Soll-Aktivität zuordnen (exakt-normalisiert, dann unscharf).
  const sollByNorm = new Map(sollNames.map((n) => [norm(n), n]));
  const sollTokens = sollNames.map((n) => ({ name: n, tok: tokens(n) }));
  const mapIstToSoll = new Map<string, string>();
  const mapping: { ist: string; soll: string }[] = [];
  const istOnly: string[] = [];

  for (const ist of istNames) {
    const exact = sollByNorm.get(norm(ist));
    if (exact) {
      mapIstToSoll.set(ist, exact);
      mapping.push({ ist, soll: exact });
      continue;
    }
    const it = tokens(ist);
    let best = { name: "", score: 0 };
    for (const s of sollTokens) {
      const j = jaccard(it, s.tok);
      if (j > best.score) best = { name: s.name, score: j };
    }
    if (best.score >= 0.6) {
      mapIstToSoll.set(ist, best.name);
      mapping.push({ ist, soll: best.name });
    } else {
      istOnly.push(ist);
    }
  }

  const matchedSoll = new Set(mapping.map((m) => m.soll));
  const sollOnly = sollNames.filter((n) => !matchedSoll.has(n));

  const follows = sollFollows(ir);

  // Ist-Kanten prüfen (nur zwischen zugeordneten Aktivitäten).
  let conformingOccur = 0;
  let deviationOccur = 0;
  const undesired: Deviation[] = [];
  const observedSollPairs = new Set<string>();

  for (const e of mining.edges) {
    if (e.from === e.to) continue; // Selbstschleifen separat (Rework)
    const sf = mapIstToSoll.get(e.from);
    const st = mapIstToSoll.get(e.to);
    if (!sf || !st) continue; // Kante mit unbekannter Aktivität → via istOnly abgedeckt
    const key = `${sf}${SEP}${st}`;
    observedSollPairs.add(key);
    if (follows.has(key)) {
      conformingOccur += e.count;
    } else {
      deviationOccur += e.count;
      undesired.push({ from: e.from, to: e.to, count: e.count });
    }
  }
  undesired.sort((a, b) => b.count - a.count);

  // Modellierte Übergänge zwischen zugeordneten Aktivitäten, die nie auftraten.
  const unobserved: { from: string; to: string }[] = [];
  for (const key of follows) {
    const [x, y] = key.split(SEP);
    if (matchedSoll.has(x) && matchedSoll.has(y) && !observedSollPairs.has(key)) {
      unobserved.push({ from: x, to: y });
    }
  }

  const totalMatchedOccur = conformingOccur + deviationOccur;
  const fitness = totalMatchedOccur > 0 ? conformingOccur / totalMatchedOccur : 1;
  // Abdeckung = gemeinsame Aktivitäten / alle distinkten Aktivitäten (Soll ∪ Ist).
  const unionActivities = matchedSoll.size + istOnly.length + sollOnly.length;
  const activityCoverage = unionActivities > 0 ? matchedSoll.size / unionActivities : 1;
  const score = Math.round((fitness * 0.7 + activityCoverage * 0.3) * 100);

  return {
    score,
    fitness,
    activityCoverage,
    matched: mapping.map((m) => m.soll),
    istOnly,
    sollOnly,
    undesired,
    unobserved,
    mapping,
    sollActivityCount: sollNames.length,
    istActivityCount: istNames.length,
  };
}

/**
 * Beispiel-Sollmodell (Netzanschluss) – entspricht dem dokumentierten Interview:
 * Bei unvollständigen Unterlagen wird eine Nachforderung gesendet und der Vorgang
 * ABGEBROCHEN. Im echten Log (Beispiel-Log) läuft die Nachforderung dagegen ZURÜCK
 * zur Prüfung (Rework) – genau diese Abweichung deckt der Abgleich auf.
 */
export const SAMPLE_SOLL_IR: ProcessIr = {
  name: "Netzanschluss (Soll / Interview)",
  description: "Dokumentierter Soll-Prozess aus dem Interview.",
  roles: [],
  systems: [],
  elements: [
    { id: "start", type: "startEvent", name: "Antrag geht ein", systemIds: [] },
    { id: "t_antrag", type: "task", name: "Antrag eingegangen", systemIds: [] },
    { id: "t_pruef", type: "userTask", name: "Unterlagen prüfen", systemIds: [] },
    { id: "gw", type: "exclusiveGateway", name: "Unterlagen vollständig?", systemIds: [] },
    { id: "t_nach", type: "task", name: "Nachforderung senden", systemIds: [] },
    { id: "t_sap", type: "serviceTask", name: "Vorgang in SAP anlegen", systemIds: [] },
    { id: "t_mach", type: "userTask", name: "Machbarkeit prüfen", systemIds: [] },
    { id: "t_ang", type: "task", name: "Angebot erstellen", systemIds: [] },
    { id: "end_ok", type: "endEvent", name: "Anschluss beauftragt", systemIds: [] },
    { id: "end_ab", type: "endEvent", name: "Vorgang abgebrochen", systemIds: [] },
  ],
  flows: [
    { id: "s1", source: "start", target: "t_antrag" },
    { id: "s2", source: "t_antrag", target: "t_pruef" },
    { id: "s3", source: "t_pruef", target: "gw" },
    { id: "s4", source: "gw", target: "t_nach", name: "nein" },
    { id: "s5", source: "gw", target: "t_sap", name: "ja" },
    { id: "s6", source: "t_nach", target: "end_ab" },
    { id: "s7", source: "t_sap", target: "t_mach" },
    { id: "s8", source: "t_mach", target: "t_ang" },
    { id: "s9", source: "t_ang", target: "end_ok" },
  ],
  openQuestions: [],
};
