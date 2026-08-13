"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { formatDuration } from "@/lib/mining/mine";
import type { MiningResult } from "@/lib/mining/types";

const BpmnViewer = dynamic(() => import("@/components/BpmnViewer"), { ssr: false });

interface MiningResponse {
  result: MiningResult;
  bpmnXml: string;
  keptEdges: number;
  droppedEdges: number;
}

/** Kleines Beispiel-Log (Netzanschluss) inkl. Rework-Schleife – zum Ausprobieren ohne eigene Datei. */
const SAMPLE_LOG = `Fall;Aktivität;Zeitstempel;Bearbeiter
1000;Antrag eingegangen;2026-01-05 08:00;Portal
1000;Unterlagen prüfen;2026-01-05 09:30;Sachbearbeitung
1000;Vorgang in SAP anlegen;2026-01-05 11:00;Sachbearbeitung
1000;Machbarkeit prüfen;2026-01-06 10:00;Netzplanung
1000;Angebot erstellen;2026-01-07 14:00;Sachbearbeitung
1001;Antrag eingegangen;2026-01-05 08:10;Portal
1001;Unterlagen prüfen;2026-01-05 10:00;Sachbearbeitung
1001;Nachforderung senden;2026-01-05 12:00;Sachbearbeitung
1001;Unterlagen prüfen;2026-01-08 09:00;Sachbearbeitung
1001;Vorgang in SAP anlegen;2026-01-08 11:00;Sachbearbeitung
1001;Machbarkeit prüfen;2026-01-09 10:00;Netzplanung
1001;Angebot erstellen;2026-01-10 16:00;Sachbearbeitung
1002;Antrag eingegangen;2026-01-06 08:00;Portal
1002;Unterlagen prüfen;2026-01-06 09:00;Sachbearbeitung
1002;Vorgang in SAP anlegen;2026-01-06 09:30;Sachbearbeitung
1002;Machbarkeit prüfen;2026-01-06 15:00;Netzplanung
1002;Angebot erstellen;2026-01-07 09:00;Sachbearbeitung`;

export default function MiningView() {
  const [data, setData] = useState<MiningResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runMine = useCallback(async (file: File | Blob, name: string) => {
    setLoading(true);
    setError(null);
    setFileName(name);
    try {
      const fd = new FormData();
      fd.append("file", file, name);
      const res = await fetch("/api/mine", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Process Mining fehlgeschlagen.");
      setData(json as MiningResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSample = useCallback(() => {
    runMine(new Blob([SAMPLE_LOG], { type: "text/csv" }), "beispiel-log.csv");
  }, [runMine]);

  function downloadMap() {
    if (!data) return;
    const blob = new Blob([data.bpmnXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prozesslandkarte.bpmn";
    a.click();
    URL.revokeObjectURL(url);
  }

  const r = data?.result;
  const maxAct = r ? Math.max(...r.activities.map((a) => a.count), 1) : 1;

  return (
    <div className="mining">
      <section className="panel">
        <p className="eyebrow">Process Mining · Ist-Prozess aus Daten</p>
        <h2>Event-Log analysieren</h2>
        <p className="hint">
          Lade ein Event-Log (CSV oder XES) mit <b>Fall-ID</b>, <b>Aktivität</b> und – für Durchlaufzeiten –
          einem <b>Zeitstempel</b>. Der Miner rekonstruiert den tatsächlich gelebten Prozess: Varianten,
          Engpässe, Rework.
        </p>
        <div
          className={`dropzone${dragOver ? " over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!loading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f && !loading) runMine(f, f.name);
          }}
          onClick={() => !loading && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !loading) inputRef.current?.click();
          }}
          aria-disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 20V10m5 10V4m5 16v-7m5 7V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <span>
            <b>Event-Log wählen</b> — CSV oder XES ablegen oder auswählen
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xes,.txt,text/csv,text/xml,application/xml"
          hidden
          disabled={loading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) runMine(f, f.name);
            e.target.value = "";
          }}
        />
        <div className="row">
          <button className="ghost" onClick={loadSample} disabled={loading}>
            Beispiel-Log laden
          </button>
          {loading && <span className="hint" style={{ margin: 0 }}>Mine {fileName} …</span>}
        </div>
        {error && <div className="error">{error}</div>}
      </section>

      {r && (
        <>
          <section className="panel">
            <div className="meta-grid mining-kpis">
              <div className="stat">
                <b>{r.caseCount}</b>
                <span>Fälle</span>
              </div>
              <div className="stat">
                <b>{r.eventCount}</b>
                <span>Ereignisse</span>
              </div>
              <div className="stat">
                <b>{r.activityCount}</b>
                <span>Aktivitäten</span>
              </div>
              <div className="stat">
                <b>{r.variantCount}</b>
                <span>Varianten</span>
              </div>
              <div className="stat">
                <b>{r.throughput ? formatDuration(r.throughput.medianMs) : "–"}</b>
                <span>Ø Durchlaufzeit (Median)</span>
              </div>
            </div>
            {(r.columnsUsed || r.warnings.length > 0) && (
              <p className="mining-meta">
                Spalten: <code>{r.columnsUsed.case}</code> · <code>{r.columnsUsed.activity}</code>
                {r.columnsUsed.timestamp ? (
                  <> · <code>{r.columnsUsed.timestamp}</code></>
                ) : null}
                {r.columnsUsed.resource ? (
                  <> · <code>{r.columnsUsed.resource}</code></>
                ) : null}
                {r.format === "csv" && r.delimiter ? <> · Trenner „{r.delimiter === "\t" ? "Tab" : r.delimiter}"</> : null}
              </p>
            )}
            {r.warnings.map((w, i) => (
              <div className="mining-warn" key={i}>{w}</div>
            ))}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Prozesslandkarte (Ist)</h2>
              <button className="ghost" onClick={downloadMap}>.bpmn herunterladen</button>
            </div>
            <p className="hint" style={{ marginTop: -6 }}>
              Kantenbeschriftung = Häufigkeit (Anzahl Übergänge). {data?.droppedEdges ? "Seltene Kanten ausgeblendet." : ""}
            </p>
            <BpmnViewer xml={data!.bpmnXml} />
          </section>

          <div className="mining-cols">
            <section className="panel">
              <p className="eyebrow">Varianten</p>
              <p className="hint">Distinkte Prozesspfade, nach Häufigkeit.</p>
              <ul className="variant-list">
                {r.variants.slice(0, 8).map((v, i) => {
                  const pct = Math.round((v.count / r.caseCount) * 100);
                  return (
                    <li key={i} className="variant">
                      <div className="variant-top">
                        <span className="variant-rank">#{i + 1}</span>
                        <span className="variant-count">
                          {v.count} {v.count === 1 ? "Fall" : "Fälle"} · {pct}%
                        </span>
                      </div>
                      <div className="variant-seq">
                        {v.sequence.map((a, j) => (
                          <span key={j} className="vstep">
                            {a}
                            {j < v.sequence.length - 1 && <span className="varrow">›</span>}
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="panel">
              <p className="eyebrow">Engpässe {r.hasTimestamps ? "" : "(keine Zeitstempel)"}</p>
              <p className="hint">Übergänge mit der längsten mittleren Wartezeit.</p>
              {r.hasTimestamps && r.bottlenecks.length > 0 ? (
                <ul className="bottleneck-list">
                  {r.bottlenecks.map((e, i) => (
                    <li key={i} className="bottleneck">
                      <span className="bn-edge">
                        {e.from} <span className="varrow">›</span> {e.to}
                      </span>
                      <span className="bn-dur">{formatDuration(e.meanMs)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hint">Für Engpass-Analyse wird eine Zeitstempel-Spalte benötigt.</p>
              )}

              {r.rework.length > 0 && (
                <>
                  <p className="subhead">Rework (Wiederholungen)</p>
                  <div className="chips">
                    {r.rework.map((a) => (
                      <span className="chip" key={a.name}>
                        {a.name} <b>{a.count}×</b>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>

          <section className="panel">
            <p className="eyebrow">Aktivitäten nach Häufigkeit</p>
            <div className="freq">
              {r.activities.map((a) => (
                <div className="freq-row" key={a.name}>
                  <span className="freq-name">{a.name}</span>
                  <div className="bar">
                    <i style={{ width: `${Math.round((a.count / maxAct) * 100)}%`, background: "var(--tint-fill)" }} />
                  </div>
                  <span className="freq-num">{a.count}</span>
                </div>
              ))}
            </div>
            {r.hasResources && r.resources.length > 0 && (
              <>
                <p className="subhead">Ressourcen / Rollen</p>
                <div className="chips">
                  {r.resources.map((res) => (
                    <span className="chip" key={res.name}>
                      {res.name} <b>{res.count}</b>
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
