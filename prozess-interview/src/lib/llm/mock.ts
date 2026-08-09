import {
  type AnalysisResult,
  type IrElement,
  type IrFlow,
  type Role,
  type SystemRef,
  type ElementType,
} from "@/lib/ir/schema";
import type { LlmProvider } from "@/lib/llm/provider";

/**
 * Offline-Provider ohne API-Key. Eine bewusst einfache, deterministische
 * Heuristik: sie zerlegt das Transkript in Schritte, erkennt eine Entscheidung
 * und ein paar IT-Systeme. Zweck: die Pipeline end-to-end demofähig machen –
 * kein Ersatz für die echte LLM-Extraktion.
 */

const SYSTEM_KEYWORDS: Record<string, string> = {
  sap: "SAP",
  gis: "GIS",
  excel: "Excel",
  crm: "CRM",
  portal: "Portal",
  "e-mail": "E-Mail",
  email: "E-Mail",
  outlook: "E-Mail",
  ivu: "IVU",
  kis: "KIS",
};

const DECISION_HINTS = ["?", "ob ", "falls ", "wenn ", "prüf", "entscheid", "genehmig", "vollständig"];
const SERVICE_HINTS = ["automatisch", "system", "generiert", "sap", "schnittstelle", "importiert"];

function splitSteps(text: string): string[] {
  const byLine = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*\d.)]+\s*/, "").trim())
    .filter((l) => l.length > 0);
  const source = byLine.length >= 2 ? byLine : text.split(/(?<=[.!?])\s+/);
  return source
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
    .slice(0, 12);
}

function truncate(s: string, n = 60): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n - 1).trimEnd() + "…" : clean;
}

function isDecision(text: string): boolean {
  const t = text.toLowerCase();
  return DECISION_HINTS.some((h) => t.includes(h));
}

function detectSystems(text: string): SystemRef[] {
  const found = new Map<string, SystemRef>();
  const lower = text.toLowerCase();
  for (const [kw, name] of Object.entries(SYSTEM_KEYWORDS)) {
    if (lower.includes(kw)) {
      const id = `sys_${name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      found.set(id, { id, name });
    }
  }
  return [...found.values()];
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function createMockProvider(): LlmProvider {
  return {
    name: "mock:offline-heuristik",
    async analyze(transcript: string): Promise<AnalysisResult> {
      const steps = splitSteps(transcript);
      const systems = detectSystems(transcript);
      const systemById = (text: string) =>
        systems.filter((s) => text.toLowerCase().includes(s.name.toLowerCase())).map((s) => s.id);

      const role: Role = { id: "role_sachbearbeitung", name: "Sachbearbeitung" };
      const roles: Role[] = [role];

      const elements: IrElement[] = [
        { id: "start", type: "startEvent", name: "Prozessstart", roleId: role.id, systemIds: [] },
      ];
      const flows: IrFlow[] = [];
      let prev = "start";
      let pendingLabel: string | undefined;
      let flowN = 0;
      let hasDecision = false;

      const addFlow = (source: string, target: string, name?: string) => {
        flows.push({ id: `flow_${++flowN}`, source, target, name });
      };

      steps.forEach((text, i) => {
        if (!hasDecision && isDecision(text) && i > 0 && i < steps.length - 1) {
          // Genau eine Entscheidung modellieren: XOR-Gateway mit ja/nein-Zweig.
          hasDecision = true;
          const gwId = `gw_${i + 1}`;
          elements.push({
            id: gwId,
            type: "exclusiveGateway",
            name: truncate(text.replace(/\?+$/, ""), 40),
            roleId: role.id,
            systemIds: [],
          });
          addFlow(prev, gwId, pendingLabel);
          pendingLabel = undefined;

          const rejectEnd = `end_reject_${i + 1}`;
          elements.push({
            id: rejectEnd,
            type: "endEvent",
            name: "Vorgang abgebrochen",
            roleId: role.id,
            systemIds: [],
          });
          addFlow(gwId, rejectEnd, "nein");

          prev = gwId;
          pendingLabel = "ja";
          return;
        }

        const sysIds = systemById(text);
        const type: ElementType = SERVICE_HINTS.some((h) => text.toLowerCase().includes(h))
          ? "serviceTask"
          : "userTask";
        const taskId = `t_${i + 1}`;
        elements.push({
          id: taskId,
          type,
          name: truncate(text),
          roleId: role.id,
          systemIds: sysIds,
        });
        addFlow(prev, taskId, pendingLabel);
        pendingLabel = undefined;
        prev = taskId;
      });

      elements.push({
        id: "end",
        type: "endEvent",
        name: "Prozessende",
        roleId: role.id,
        systemIds: [],
      });
      addFlow(prev, "end", pendingLabel);

      const processName = truncate(steps[0] ?? "Erfasster Prozess", 48);

      // --- Heuristische Bewertung ---
      const stepCount = steps.length;
      const systemCount = systems.length;
      const manualCount = elements.filter((e) => e.type === "userTask").length;
      const mediaBreaks = Math.max(0, systemCount - 1) + (transcript.toLowerCase().includes("papier") ? 1 : 0);

      const dimensions: AnalysisResult["assessment"]["dimensions"] = [
        {
          key: "maturity",
          score: clamp(70 - (hasDecision ? 0 : 10) - Math.max(0, stepCount - 8) * 2),
          findings: [
            `${stepCount} Prozessschritte erkannt${hasDecision ? ", inkl. einer Entscheidung" : ", ohne modellierte Entscheidung"}.`,
          ],
          recommendations: ["Prozess dokumentieren und Sonderfälle explizit erfassen."],
        },
        {
          key: "mediaBreaks",
          score: clamp(85 - mediaBreaks * 18),
          findings: [
            systemCount
              ? `Beteiligte Systeme: ${systems.map((s) => s.name).join(", ")} (${mediaBreaks} potenzielle Medien-/Systembrüche).`
              : "Keine IT-Systeme im Transkript erkannt – Datenflüsse prüfen.",
          ],
          recommendations: mediaBreaks > 0 ? ["Schnittstellen zwischen den Systemen prüfen, Doppelerfassung vermeiden."] : [],
        },
        {
          key: "automation",
          score: clamp(40 + manualCount * 4),
          findings: [`${manualCount} überwiegend manuelle Schritte – Kandidaten für Automatisierung.`],
          recommendations: ["Regelbasierte Prüf-/Erfassungsschritte automatisieren."],
        },
        {
          key: "cycleTime",
          score: clamp(65 - Math.max(0, stepCount - 6) * 3),
          findings: [hasDecision ? "Entscheidung als möglicher Freigabe-Engpass identifiziert." : "Linearer Ablauf ohne erkennbare Rückschleifen."],
          recommendations: ["Wartezeiten an Übergaben und Freigaben messen."],
        },
        {
          key: "compliance",
          score: 60,
          findings: ["Vier-Augen-Prinzip und Nachvollziehbarkeit im Transkript nicht belegt (KRITIS)."],
          recommendations: ["Freigaben, Protokollierung und Zugriffsrechte dokumentieren."],
        },
        {
          key: "roleClarity",
          score: clamp(55 + (roles.length > 1 ? 20 : 0)),
          findings: [`Nur ${roles.length} Rolle(n) sicher zuordenbar – Verantwortlichkeiten schärfen (RACI).`],
          recommendations: ["Pro Schritt eine verantwortliche Rolle festlegen."],
        },
      ];

      const overall = clamp(dimensions.reduce((a, d) => a + d.score, 0) / dimensions.length);

      return {
        ir: {
          name: processName,
          description: "Automatisch aus dem Interview extrahiert (Offline-Heuristik).",
          roles,
          systems,
          elements,
          flows,
          openQuestions: [
            "Wer genehmigt/gibt frei, und nach welchen Kriterien?",
            "Welche Systeme sind an welchem Schritt beteiligt?",
            hasDecision ? "Was passiert im Abbruch-/Nein-Zweig genau?" : "Gibt es Ausnahme-/Sonderfälle?",
          ],
        },
        assessment: {
          summary: `„${processName}“: ${stepCount} Schritte, ${systemCount} System(e), ${mediaBreaks} potenzielle Medienbrüche. Reifegrad ${overall}/100.`,
          overallScore: overall,
          dimensions,
          quickWins: [
            mediaBreaks > 0 ? "Doppelerfassung zwischen Systemen abstellen." : "Prozessschritte verbindlich dokumentieren.",
            "Verantwortliche Rolle je Schritt festlegen.",
          ],
        },
      };
    },
  };
}
