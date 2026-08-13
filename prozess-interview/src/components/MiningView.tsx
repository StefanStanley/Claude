"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { formatDuration } from "@/lib/mining/mine";
import type { MiningResult } from "@/lib/mining/types";
import { compareConformance, SAMPLE_SOLL_IR, type ConformanceResult } from "@/lib/conformance/compare";
import type { ProcessIr } from "@/lib/ir/schema";

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

  // Soll-Ist-Abgleich
  const [conf, setConf] = useState<ConformanceResult | null>(null);
  const [sollList, setSollList] = useState<{ id: string; name: string }[]>([]);
  const [sollChoice, setSollChoice] = useState("sample");
  const [confLoading, setConfLoading] = useState(false);
  const [confErr, setConfErr] = useState<string | null>(null);

  // Gespeicherte Prozesse als mögliche Soll-Modelle laden (falls DB vorhanden).
  useEffect(() => {
    fetch("/api/processes")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.processes)) {
          setSollList(d.processes.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
        }
      })
      .catch(() => {});
  }, []);

  const runMine = useCallback(async (file: File | Blob, name: string) => {
    setLoading(true);
    setError(null);
    setConf(null);
    setConfErr(null);
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

  const runConformance = useCallback(async () => {
    if (!data) return;
    setConfLoading(true);
    setConfErr(null);
    try {
      let ir: ProcessIr;
      if (sollChoice === "sample") {
        ir = SAMPLE_SOLL_IR;
      } else {
        const res = await fetch(`/api/processes/${sollChoice}`);
        const d = await res.json();
        if (!res.ok) throw new Error(d?.error || "Sollmodell konnte nicht geladen werden.");
        ir = d.current.ir as ProcessIr;
      }
      setConf(compareConformance(ir, data.result));
    } catch (e) {
      setConfErr(e instanceof Error ? e.message : "Abgleich fehlgeschlagen.");
      setConf(null);
    } finally {
      setConfLoading(false);
    }
  }, [data, sollChoice]);

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

          <section className="panel">
            <p className="eyebrow">Soll-Ist-Abgleich · Conformance</p>
            <h2>Modell vs. Realität</h2>
            <p className="hint">
              Vergleicht ein dokumentiertes Prozessmodell (Soll, aus dem Interview) mit dem gemine
              Ist-Prozess und deckt Abweichungen auf.
            </p>
            <div className="row">
              <select
                className="soll-select"
                value={sollChoice}
                onChange={(e) => setSollChoice(e.target.value)}
              >
                <option value="sample">Beispiel-Sollmodell (Netzanschluss)</option>
                {sollList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button className="primary" onClick={runConformance} disabled={confLoading}>
                {confLoading ? "Gleiche ab …" : "Abgleichen"}
              </button>
            </div>
            {confErr && <div className="error">{confErr}</div>}

            {conf && (
              <>
                <div className="meta-grid conf-kpis">
                  <div className="stat">
                    <b style={{ color: conf.score >= 70 ? "var(--good)" : conf.score >= 45 ? "var(--warn)" : "var(--risk)" }}>
                      {conf.score}
                    </b>
                    <span>Konformität</span>
                  </div>
                  <div className="stat">
                    <b>{Math.round(conf.fitness * 100)}%</b>
                    <span>Fitness (Übergänge)</span>
                  </div>
                  <div className="stat">
                    <b>{Math.round(conf.activityCoverage * 100)}%</b>
                    <span>Aktivitäts-Abdeckung</span>
                  </div>
                  <div className="stat">
                    <b>{conf.undesired.length}</b>
                    <span>Abweichungen</span>
                  </div>
                </div>

                {conf.undesired.length > 0 && (
                  <>
                    <p className="subhead">Abweichung: beobachtet, aber nicht modelliert</p>
                    <ul className="bottleneck-list">
                      {conf.undesired.map((d, i) => (
                        <li key={i} className="bottleneck">
                          <span className="bn-edge">
                            {d.from} <span className="varrow">›</span> {d.to}
                          </span>
                          <span className="bn-dur">{d.count}×</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {conf.unobserved.length > 0 && (
                  <>
                    <p className="subhead">Modelliert, aber nie gelebt</p>
                    <ul className="conf-plain">
                      {conf.unobserved.map((d, i) => (
                        <li key={i}>
                          {d.from} <span className="varrow">›</span> {d.to}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {conf.istOnly.length > 0 && (
                  <>
                    <p className="subhead">Undokumentierte Aktivitäten (nur im Ist)</p>
                    <div className="chips">
                      {conf.istOnly.map((a) => (
                        <span className="chip conf-extra" key={a}>{a}</span>
                      ))}
                    </div>
                  </>
                )}

                {conf.sollOnly.length > 0 && (
                  <>
                    <p className="subhead">Tote Schritte (modelliert, nie ausgeführt)</p>
                    <div className="chips">
                      {conf.sollOnly.map((a) => (
                        <span className="chip" key={a}>{a}</span>
                      ))}
                    </div>
                  </>
                )}

                <p className="mining-meta" style={{ marginTop: 12 }}>
                  {conf.mapping.length} von {conf.istActivityCount} Ist-Aktivitäten dem Sollmodell zugeordnet.
                </p>
              </>
            )}
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
