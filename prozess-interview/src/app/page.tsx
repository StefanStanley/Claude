"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import IrSummary from "@/components/IrSummary";
import AssessmentPanel from "@/components/AssessmentPanel";
import MicButton from "@/components/MicButton";
import Uploader from "@/components/Uploader";
import type { ProcessListItem, ProcessDetail } from "@/lib/processes";
import type { ProcessIr, Assessment } from "@/lib/ir/schema";

const BpmnViewer = dynamic(() => import("@/components/BpmnViewer"), { ssr: false });

/** Was angezeigt/gespeichert wird — gemeinsame Form aus Vorschau und DB-Version. */
interface Analysis {
  ir: ProcessIr;
  assessment: Assessment;
  bpmnXml: string;
  provider: string;
}

const SAMPLE = `Wenn ein Kunde einen Netzanschluss beantragt, geht der Antrag über unser Kundenportal ein.
Die Sachbearbeitung prüft zuerst, ob die Unterlagen vollständig sind.
Sind die Unterlagen nicht vollständig, senden wir eine Nachforderung an den Kunden und der Vorgang wird zunächst abgebrochen.
Bei vollständigen Unterlagen legen wir den Vorgang in SAP an und übernehmen die Kundendaten aus dem Portal.
Anschließend prüft die Netzplanung im GIS die technische Machbarkeit am Anschlusspunkt.
Danach erstellen wir ein Angebot und schicken es per E-Mail an den Kunden.
Nach Auftragsbestätigung wird der Anschluss terminiert und der Bauauftrag ausgelöst.`;

export default function Page() {
  const [processes, setProcesses] = useState<ProcessListItem[]>([]);
  const [current, setCurrent] = useState<ProcessDetail | null>(null);

  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [dirty, setDirty] = useState(false); // Vorschau stammt aus frischer Analyse (speicherbar)

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch("/api/processes");
      const data = await res.json();
      if (res.ok) setProcesses(data.processes ?? []);
    } catch {
      /* Liste ist optional; Fehler nicht blockierend */
    }
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  function newProcess() {
    setCurrent(null);
    setTranscript("");
    setAnalysis(null);
    setDirty(false);
    setError(null);
    setFlash(null);
  }

  async function openProcess(id: string, version?: number) {
    setError(null);
    setFlash(null);
    try {
      const url = version ? `/api/processes/${id}?version=${version}` : `/api/processes/${id}`;
      const res = await fetch(url);
      const data: ProcessDetail = await res.json();
      if (!res.ok) throw new Error((data as any)?.error || "Konnte Prozess nicht laden.");
      setCurrent(data);
      setTranscript(data.current.transcript);
      setAnalysis({
        ir: data.current.ir,
        assessment: data.current.assessment,
        bpmnXml: data.current.bpmnXml,
        provider: data.current.provider,
      });
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden.");
    }
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    setFlash(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Analyse fehlgeschlagen.");
      setAnalysis(data as Analysis);
      setDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!analysis) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { transcript, analysis };
      const res = current
        ? await fetch(`/api/processes/${current.id}/versions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/processes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Speichern fehlgeschlagen.");
      setCurrent(data as ProcessDetail);
      setDirty(false);
      setFlash(`Version ${(data as ProcessDetail).current.version} gespeichert`);
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!current) return;
    if (!confirm(`Prozess „${current.name}“ mit allen Versionen löschen?`)) return;
    try {
      const res = await fetch(`/api/processes/${current.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen.");
      newProcess();
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Löschen.");
    }
  }

  // Diktiertes Sprach-Ergebnis ans Transkript hängen (mit sauberem Trennzeichen).
  const appendSpoken = useCallback((text: string) => {
    setTranscript((prev) => (prev && !/\s$/.test(prev) ? prev + " " : prev) + text);
  }, []);

  // Extrahierten Beleg-Block als eigenen Absatz anhängen (Leerzeile davor).
  const appendBlock = useCallback((block: string) => {
    setTranscript((prev) => (prev.trim() ? prev.replace(/\s*$/, "") + "\n\n" : "") + block);
  }, []);

  function downloadBpmn() {
    if (!analysis) return;
    const blob = new Blob([analysis.bpmnXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.ir.name.replace(/[^\wäöüß-]+/gi, "_").slice(0, 40) || "prozess"}.bpmn`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const providerTag = analysis ? analysis.provider : "Phase-2 · Persistenz";

  return (
    <>
      <header className="masthead">
        <div className="inner">
          <div className="brand">
            <svg className="glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="10.25" cy="10.25" r="6.5" stroke="var(--tint)" strokeWidth="1.6" />
              <path d="M15.4 15.4 20.5 20.5" stroke="var(--tint)" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="7.9" cy="10.25" r="1.15" fill="var(--tint)" />
              <circle cx="12.6" cy="10.25" r="1.15" fill="var(--tint)" />
              <path d="M9.05 10.25h2.4" stroke="var(--tint)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span>ProzessLupe</span>
          </div>
          <span className="provider-tag">{providerTag}</span>
        </div>
      </header>

      <main className="wrap">
        <div className="layout">
          {/* Sidebar: gespeicherte Prozesse */}
          <aside className="sidebar">
            <div className="panel">
              <div className="sidebar-head">
                <h2>Prozesse</h2>
                <button className="btn-new" onClick={newProcess}>
                  + Neu
                </button>
              </div>
              <div className="proc-list">
                {processes.length === 0 && <div className="proc-empty">Noch nichts gespeichert.</div>}
                {processes.map((p) => (
                  <button
                    key={p.id}
                    className={`proc-item${current?.id === p.id ? " active" : ""}`}
                    onClick={() => openProcess(p.id)}
                  >
                    <span className="nm">{p.name}</span>
                    <span className="pmeta">
                      v{p.latestVersion} · {p.versionCount} Version{p.versionCount === 1 ? "" : "en"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Arbeitsbereich */}
          <section className="workarea">
            {current && (
              <div className="version-bar" style={{ marginBottom: 22 }}>
                <span className="vtitle">{current.name}</span>
                <label className="badge" htmlFor="ver">
                  Version
                </label>
                <select
                  id="ver"
                  value={analysis && !dirty ? current.current.version : "dirty"}
                  onChange={(e) => openProcess(current.id, Number(e.target.value))}
                >
                  {dirty && <option value="dirty">• ungespeicherte Analyse</option>}
                  {current.versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      v{v.version} — {new Date(v.createdAt).toLocaleString("de-DE")}
                    </option>
                  ))}
                </select>
                <button className="btn-danger" onClick={remove}>
                  Löschen
                </button>
              </div>
            )}

            <div className="grid">
              <section className="panel">
                <p className="eyebrow">Interview / Transkript</p>
                <h2>Prozess beschreiben</h2>
                <p className="hint">
                  Transkript einfügen oder diktieren — die KI extrahiert die Struktur, zeichnet das
                  BPMN-Modell und bewertet den Prozess. Speichern legt eine neue, versionierte Fassung an.
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
                  <button className="ghost" onClick={() => { setTranscript(SAMPLE); setDirty(false); }} disabled={loading}>
                    Beispiel einfügen
                  </button>
                  <MicButton onAppend={appendSpoken} disabled={loading} />
                  {analysis && dirty && (
                    <button className="primary" onClick={save} disabled={saving}>
                      {saving ? "Speichere …" : current ? "Als neue Version speichern" : "Speichern"}
                    </button>
                  )}
                  {flash && <span className="saved-flash">{flash}</span>}
                </div>
                <Uploader onExtracted={appendBlock} disabled={loading} />
                {error && <div className="error">{error}</div>}
              </section>

              <div className="results">
                {!analysis && !loading && (
                  <div className="empty">
                    Noch kein Ergebnis. Beschreibung einfügen und <b>Analysieren</b> klicken — oder links einen
                    gespeicherten Prozess öffnen.
                  </div>
                )}
                {loading && <div className="empty">Pipeline läuft: Transkript → IR → BPMN → Bewertung …</div>}

                {analysis && (
                  <>
                    <section className="panel">
                      <div className="panel-head">
                        <h2>BPMN-Modell</h2>
                        <button className="ghost" onClick={downloadBpmn}>
                          .bpmn herunterladen
                        </button>
                      </div>
                      <BpmnViewer xml={analysis.bpmnXml} />
                    </section>

                    <IrSummary ir={analysis.ir} />
                    <AssessmentPanel assessment={analysis.assessment} />
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
