import { layoutProcess } from "bpmn-auto-layout";
import type { ProcessIr, IrElement, ElementType } from "@/lib/ir/schema";

/**
 * Deterministischer Generator: Process IR -> BPMN 2.0 XML.
 *
 * Bewusst regelbasiert (kein LLM): gleiche IR -> gleiches XML. Das Layout
 * (Diagram Interchange / DI) wird anschließend von `bpmn-auto-layout` ergänzt,
 * damit bpmn-js das Diagramm rendern kann.
 */

const BPMN_TAG: Record<ElementType, string> = {
  startEvent: "bpmn:startEvent",
  endEvent: "bpmn:endEvent",
  task: "bpmn:task",
  userTask: "bpmn:userTask",
  serviceTask: "bpmn:serviceTask",
  exclusiveGateway: "bpmn:exclusiveGateway",
  parallelGateway: "bpmn:parallelGateway",
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Erzeugt eine gültige BPMN-ID (NCName): keine Leerzeichen, nicht mit Ziffer beginnend. */
function safeId(raw: string): string {
  let id = raw.trim().replace(/[^A-Za-z0-9_-]/g, "_");
  if (id === "" || /^[0-9-]/.test(id)) id = `id_${id}`;
  return id;
}

export function generateBpmnXml(ir: ProcessIr): string {
  // IDs vereinheitlichen und eine Umschlüsselungstabelle aufbauen.
  const idMap = new Map<string, string>();
  for (const el of ir.elements) idMap.set(el.id, safeId(el.id));

  const flows = ir.flows
    .filter((f) => idMap.has(f.source) && idMap.has(f.target))
    .map((f, i) => ({
      id: safeId(f.id || `Flow_${i + 1}`),
      source: idMap.get(f.source)!,
      target: idMap.get(f.target)!,
      name: f.name?.trim() || "",
    }));

  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const f of flows) {
    (outgoing.get(f.source) ?? outgoing.set(f.source, []).get(f.source)!).push(f.id);
    (incoming.get(f.target) ?? incoming.set(f.target, []).get(f.target)!).push(f.id);
  }

  const elementXml = ir.elements
    .map((el: IrElement) => {
      const id = idMap.get(el.id)!;
      const tag = BPMN_TAG[el.type];
      const nameAttr = el.name ? ` name="${escapeXml(el.name)}"` : "";
      const ins = (incoming.get(id) ?? [])
        .map((r) => `      <bpmn:incoming>${r}</bpmn:incoming>`)
        .join("\n");
      const outs = (outgoing.get(id) ?? [])
        .map((r) => `      <bpmn:outgoing>${r}</bpmn:outgoing>`)
        .join("\n");
      const inner = [ins, outs].filter(Boolean).join("\n");
      if (!inner) return `    <${tag} id="${id}"${nameAttr} />`;
      return `    <${tag} id="${id}"${nameAttr}>\n${inner}\n    </${tag.replace(/^bpmn:/, "bpmn:")}>`;
    })
    .join("\n");

  const flowXml = flows
    .map((f) => {
      const nameAttr = f.name ? ` name="${escapeXml(f.name)}"` : "";
      return `    <bpmn:sequenceFlow id="${f.id}" sourceRef="${f.source}" targetRef="${f.target}"${nameAttr} />`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
${elementXml}
${flowXml}
  </bpmn:process>
</bpmn:definitions>`;
}

/**
 * Erzeugt BPMN inkl. Layout (DI). Fällt bei Layout-Fehlern auf das reine
 * Semantik-XML zurück (bpmn-js zeigt dann eine Fehlermeldung statt Absturz).
 */
export async function generateLayoutedBpmn(ir: ProcessIr): Promise<string> {
  const xml = generateBpmnXml(ir);
  try {
    return await layoutProcess(xml);
  } catch (err) {
    console.error("bpmn-auto-layout fehlgeschlagen:", err);
    return xml;
  }
}
