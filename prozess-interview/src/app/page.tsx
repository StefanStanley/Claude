"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { AnalysisResponse } from "@/lib/analyze";
import IrSummary from "@/components/IrSummary";
import AssessmentPanel from "@/components/AssessmentPanel";

// bpmn-js läuft nur im Browser → ohne SSR laden.
const BpmnViewer = dynamic(() => import("@/components/BpmnViewer"), { ssr: false });

const SAMPLE = `Wenn ein Kunde einen Netzanschluss beantragt, geht der Antrag über unser Kundenportal ein.
Die Sachbearbeitung prüft zuerst, ob die Unterlagen vollständig sind.
Sind die Unterlagen nicht vollständig, senden wir eine Nachforderung an den Kunden und der Vorgang wird zunächst abgebrochen.
Bei vollständigen Unterlagen legen wir den Vorgang in SAP an und übernehmen die Kundendaten aus dem Portal.
Anschließend prüft die Netzplanung im GIS die technische Machbarkeit am Anschlusspunkt.
Danach erstellen wir ein Angebot und schicken es per E-Mail an den Kunden.
Nach Auftragsbestätigung wird der Anschluss terminiert und der Bauauftrag ausgelöst.`;

export default function Page() {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Analyse fehlgeschlagen.");
      setResult(data as AnalysisResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function downloadBpmn() {
    if (!result) return;
    const blob = new Blob([result.bpmnXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.ir.name.replace(/[^\wäöüß-]+/gi, "_").slice(0, 40) || "prozess"}.bpmn`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <header className="masthead">
        <div className="inner">
          <div className="brand">
            <svg className="glyph" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="24" height="24" rx="6" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.2" />
              <path d="M14.5 4 7 14h5l-1.5 8L19 12h-5z" fill="var(--accent-fill)" />
            </svg>
            <span>ProzessLupe</span>
          </div>
          <span className="provider-tag">{result ? result.provider : "Phase-1 MVP"}</span>
        </div>
      </header>

      <main className="wrap">
        <div className="grid">
          <section className="panel">
            <p className="eyebrow">Interview / Transkript</p>
            <h2>Prozess beschreiben</h2>
            <p className="hint">
              Transkript oder freie Beschreibung einfügen — die KI extrahiert Struktur, zeichnet das BPMN-Modell und bewertet den Prozess.
            </p>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="z. B. „Wenn ein Kunde einen Netzanschluss beantragt, prüft die Sachbearbeitung zuerst …“"
            />
            <div className="row">
              <button className="primary" onClick={analyze} disabled={loading || transcript.trim().length < 20}>
                {loading ? "Analysiere …" : "Analysieren"}
              </button>
              <button className="ghost" onClick={() => setTranscript(SAMPLE)} disabled={loading}>
                Beispiel einfügen
              </button>
              {transcript && (
                <button className="link-btn" onClick={() => setTranscript("")} disabled={loading}>
                  leeren
                </button>
              )}
            </div>
            {error && <div className="error">{error}</div>}
          </section>

          <div className="results">
            {!result && !loading && (
              <div className="empty">
                Noch kein Ergebnis. Beschreibung einfügen und <b>Analysieren</b> klicken —
                oder <b>Beispiel einfügen</b> für einen Netzanschluss-Prozess.
              </div>
            )}
            {loading && <div className="empty">Pipeline läuft: Transkript → IR → BPMN → Bewertung …</div>}

            {result && (
              <>
                <section className="panel">
                  <div className="panel-head">
                    <h2>BPMN-Modell</h2>
                    <button className="ghost" onClick={downloadBpmn}>
                      .bpmn herunterladen
                    </button>
                  </div>
                  <BpmnViewer xml={result.bpmnXml} />
                </section>

                <IrSummary ir={result.ir} />
                <AssessmentPanel assessment={result.assessment} />
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
