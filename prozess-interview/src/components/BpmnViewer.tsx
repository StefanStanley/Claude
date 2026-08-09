"use client";

import { useEffect, useRef } from "react";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";

/**
 * Rendert BPMN 2.0 XML mit bpmn-js (Open Source, läuft komplett im Browser —
 * on-prem-tauglich). Der Viewer wird einmal erzeugt und bei XML-Änderung neu befüllt.
 */
export default function BpmnViewer({ xml }: { xml: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // bpmn-js liefert keine strengen Typen für den Default-Export → any.
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;

    (async () => {
      const mod = await import("bpmn-js/lib/NavigatedViewer");
      const NavigatedViewer = mod.default;
      if (disposed || !containerRef.current) return;

      if (!viewerRef.current) {
        viewerRef.current = new NavigatedViewer({ container: containerRef.current });
      }
      if (!xml) return;

      try {
        await viewerRef.current.importXML(xml);
        viewerRef.current.get("canvas").zoom("fit-viewport", "auto");
      } catch (err) {
        console.error("BPMN konnte nicht gerendert werden:", err);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [xml]);

  useEffect(() => {
    return () => {
      viewerRef.current?.destroy?.();
      viewerRef.current = null;
    };
  }, []);

  return <div className="bpmn-canvas" ref={containerRef} aria-label="BPMN-Diagramm" />;
}
