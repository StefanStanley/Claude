/**
 * Typen für den Process Miner.
 *
 * Ein Event-Log (Fall-ID, Aktivität, Zeitstempel, optional Ressource) wird zu
 * einem Directly-Follows-Graph (DFG) verdichtet und um Kennzahlen angereichert:
 * Varianten, Durchlaufzeiten, Engpässe, Rework. Der DFG lässt sich als
 * Process-Map (BPMN) rendern – der Prozess, *wie er tatsächlich läuft*.
 */

/** Ein einzelnes Ereignis nach dem Parsen. */
export interface LogEvent {
  caseId: string;
  activity: string;
  ts: number | null; // Epoch-ms; null wenn ohne/parsbarer Zeitstempel
  resource?: string;
  order: number; // Ursprungsreihenfolge (Fallback-Sortierung ohne Zeitstempel)
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface MinedEdge {
  from: string;
  to: string;
  count: number;
  meanMs: number | null; // mittlere Übergangsdauer (nur mit Zeitstempeln)
}

export interface MinedVariant {
  sequence: string[];
  count: number;
}

export interface Throughput {
  medianMs: number;
  meanMs: number;
  minMs: number;
  maxMs: number;
}

export interface MiningResult {
  caseCount: number;
  eventCount: number;
  activityCount: number;
  variantCount: number;
  activities: NamedCount[];
  startActivities: NamedCount[];
  endActivities: NamedCount[];
  edges: MinedEdge[];
  variants: MinedVariant[];
  throughput: Throughput | null;
  bottlenecks: MinedEdge[];
  rework: NamedCount[]; // Aktivität -> Anzahl Fälle mit Wiederholung
  selfLoops: NamedCount[]; // a -> a (direkte Wiederholung)
  resources: NamedCount[];
  hasTimestamps: boolean;
  hasResources: boolean;
  columnsUsed: { case: string; activity: string; timestamp?: string; resource?: string };
  format: "csv" | "xes";
  delimiter?: string;
  warnings: string[];
}

/** Optionale manuelle Spaltenzuordnung (überschreibt die Auto-Erkennung). */
export interface ColumnMapping {
  case?: string;
  activity?: string;
  timestamp?: string;
  resource?: string;
}
