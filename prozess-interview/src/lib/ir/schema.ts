import { z } from "zod";

/**
 * Process IR — die strukturierte Zwischenform ("Single Source of Truth").
 *
 * Sie trennt das *Verstehen* (LLM extrahiert diese Struktur aus dem Transkript)
 * vom *Zeichnen* (ein deterministischer Generator erzeugt daraus BPMN 2.0 XML).
 * Dadurch ist das Ergebnis validierbar, versionierbar und reproduzierbar.
 */

export const ElementTypeEnum = z.enum([
  "startEvent",
  "endEvent",
  "task", // generische Aktivität
  "userTask", // manueller Schritt durch eine Person
  "serviceTask", // System-/automatisierter Schritt
  "exclusiveGateway", // Entweder-oder-Entscheidung (XOR)
  "parallelGateway", // gleichzeitige Zweige (AND)
]);
export type ElementType = z.infer<typeof ElementTypeEnum>;

export const RoleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});
export type Role = z.infer<typeof RoleSchema>;

export const SystemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});
export type SystemRef = z.infer<typeof SystemSchema>;

export const ElementSchema = z.object({
  id: z.string().min(1),
  type: ElementTypeEnum,
  name: z.string().default(""),
  /** Verantwortliche Rolle (Lane) — verweist auf RoleSchema.id */
  roleId: z.string().optional(),
  /** Beteiligte Systeme — verweisen auf SystemSchema.id */
  systemIds: z.array(z.string()).default([]),
});
export type IrElement = z.infer<typeof ElementSchema>;

export const FlowSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  /** Bedingungslabel, v.a. an Gateways: "ja" / "nein" / "vollständig" … */
  name: z.string().optional(),
});
export type IrFlow = z.infer<typeof FlowSchema>;

export const ProcessIrSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  roles: z.array(RoleSchema).default([]),
  systems: z.array(SystemSchema).default([]),
  elements: z.array(ElementSchema).min(2),
  flows: z.array(FlowSchema).default([]),
  /** Offene Punkte, die die KI im Transkript nicht klären konnte (Human-in-the-loop). */
  openQuestions: z.array(z.string()).default([]),
});
export type ProcessIr = z.infer<typeof ProcessIrSchema>;

/* ----------------------------- Bewertung / Assessment ----------------------------- */

export const AssessmentDimensionKeyEnum = z.enum([
  "maturity", // Reifegrad & Standardisierung
  "mediaBreaks", // Medien- & Systembrüche
  "automation", // Automatisierungspotenzial
  "cycleTime", // Durchlaufzeit & Engpässe
  "compliance", // Risiken & Compliance (KRITIS)
  "roleClarity", // Rollen-Klarheit (RACI)
]);
export type AssessmentDimensionKey = z.infer<typeof AssessmentDimensionKeyEnum>;

export const DIMENSION_LABELS: Record<AssessmentDimensionKey, string> = {
  maturity: "Reifegrad & Standardisierung",
  mediaBreaks: "Medien- & Systembrüche",
  automation: "Automatisierungspotenzial",
  cycleTime: "Durchlaufzeit & Engpässe",
  compliance: "Risiken & Compliance",
  roleClarity: "Rollen-Klarheit (RACI)",
};

export const AssessmentDimensionSchema = z.object({
  key: AssessmentDimensionKeyEnum,
  score: z.number().min(0).max(100),
  findings: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});
export type AssessmentDimension = z.infer<typeof AssessmentDimensionSchema>;

export const AssessmentSchema = z.object({
  summary: z.string().default(""),
  overallScore: z.number().min(0).max(100),
  dimensions: z.array(AssessmentDimensionSchema).default([]),
  quickWins: z.array(z.string()).default([]),
});
export type Assessment = z.infer<typeof AssessmentSchema>;

/* ----------------------------- Kombiniertes Analyse-Ergebnis ----------------------------- */

export const AnalysisResultSchema = z.object({
  ir: ProcessIrSchema,
  assessment: AssessmentSchema,
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
