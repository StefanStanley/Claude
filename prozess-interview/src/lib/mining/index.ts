/**
 * Process-Mining-Orchestrierung: Event-Log → DFG/Kennzahlen → Prozesslandkarte.
 */
import { parseEventLog } from "@/lib/mining/parse";
import { mine } from "@/lib/mining/mine";
import { miningToIr } from "@/lib/mining/toIr";
import { generateLayoutedBpmn } from "@/lib/bpmn/generate";
import type { ColumnMapping, MiningResult } from "@/lib/mining/types";

export interface MiningResponse {
  result: MiningResult;
  bpmnXml: string;
  keptEdges: number;
  droppedEdges: number;
}

export async function mineEventLog(
  text: string,
  filename: string,
  mapping?: ColumnMapping,
): Promise<MiningResponse> {
  const parsed = parseEventLog(text, filename, mapping);
  const result = mine(parsed);
  const { ir, keptEdges, droppedEdges } = miningToIr(result);
  const bpmnXml = await generateLayoutedBpmn(ir);
  if (droppedEdges > 0) {
    result.warnings.push(`${droppedEdges} seltene Kante(n) in der Landkarte ausgeblendet (Lesbarkeit).`);
  }
  return { result, bpmnXml, keptEdges, droppedEdges };
}
