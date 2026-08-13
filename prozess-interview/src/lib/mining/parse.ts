/**
 * Event-Log-Parser: CSV (mit Auto-Delimiter) und XES (Basis).
 * Erkennt Fall-ID / Aktivität / Zeitstempel / Ressource automatisch anhand
 * gängiger Spaltennamen (DE/EN) – manuell überschreibbar per ColumnMapping.
 */
import type { ColumnMapping, LogEvent } from "@/lib/mining/types";

export interface ParseResult {
  events: LogEvent[];
  format: "csv" | "xes";
  delimiter?: string;
  columnsUsed: { case: string; activity: string; timestamp?: string; resource?: string };
  warnings: string[];
}

const CANDIDATES = {
  case: ["case", "caseid", "case_id", "case id", "fall", "fallid", "fall_id", "vorgang", "vorgangsnummer", "process instance", "trace", "id", "concept:instance"],
  activity: ["activity", "aktivität", "aktivitaet", "task", "schritt", "event", "ereignis", "action", "concept:name", "vorgangsschritt"],
  timestamp: ["timestamp", "time", "zeit", "zeitstempel", "datum", "date", "starttime", "startzeit", "time:timestamp", "completetime", "endzeit", "start"],
  resource: ["resource", "ressource", "rolle", "role", "user", "benutzer", "bearbeiter", "agent", "org:resource"],
};

/** Zeitstempel robust parsen: ISO zuerst, dann dd.mm.yyyy[ HH:MM[:SS]]. */
export function parseTs(raw: string | undefined): number | null {
  const s = (raw || "").trim();
  if (!s) return null;
  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) return iso;
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const [, d, mo, y, h, mi, se] = m;
    return new Date(+y, +mo - 1, +d, +(h || 0), +(mi || 0), +(se || 0)).getTime();
  }
  return null;
}

/** Delimiter anhand der Kopfzeile schätzen (häufigstes Trennzeichen). */
function detectDelimiter(headerLine: string): string {
  const cands = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = -1;
  for (const c of cands) {
    const n = headerLine.split(c).length - 1;
    if (n > bestCount) {
      bestCount = n;
      best = c;
    }
  }
  return best;
}

/** Minimaler RFC-4180-CSV-Parser (Anführungszeichen, eingebettete Delimiter/Zeilen). */
function parseCsvRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch === "\r") {
      // ignorieren (CRLF)
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function pickColumn(headers: string[], candidates: string[], override?: string): number {
  const norm = headers.map((h) => h.trim().toLowerCase());
  if (override) {
    const oi = norm.indexOf(override.trim().toLowerCase());
    if (oi >= 0) return oi;
  }
  // exakte Treffer bevorzugen …
  for (const cand of candidates) {
    const i = norm.indexOf(cand);
    if (i >= 0) return i;
  }
  // … dann Teilstring-Treffer.
  for (let i = 0; i < norm.length; i++) {
    if (candidates.some((c) => norm[i].includes(c))) return i;
  }
  return -1;
}

function parseCsv(text: string, mapping?: ColumnMapping): ParseResult {
  const firstLine = text.slice(0, text.indexOf("\n") >= 0 ? text.indexOf("\n") : text.length);
  const delimiter = detectDelimiter(firstLine);
  const rows = parseCsvRows(text, delimiter);
  const warnings: string[] = [];
  if (rows.length < 2) throw new Error("CSV enthält keine Datenzeilen.");

  const headers = rows[0];
  const iCase = pickColumn(headers, CANDIDATES.case, mapping?.case);
  const iAct = pickColumn(headers, CANDIDATES.activity, mapping?.activity);
  const iTs = pickColumn(headers, CANDIDATES.timestamp, mapping?.timestamp);
  const iRes = pickColumn(headers, CANDIDATES.resource, mapping?.resource);

  if (iCase < 0 || iAct < 0) {
    throw new Error(
      `Spalten für Fall-ID und Aktivität nicht erkannt. Gefundene Spalten: ${headers.join(", ")}.`,
    );
  }
  if (iTs < 0) warnings.push("Keine Zeitstempel-Spalte erkannt – Reihenfolge aus der Dateisortierung, keine Dauern.");

  const events: LogEvent[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    const caseId = (cols[iCase] ?? "").trim();
    const activity = (cols[iAct] ?? "").trim();
    if (!caseId || !activity) continue;
    events.push({
      caseId,
      activity,
      ts: iTs >= 0 ? parseTs(cols[iTs]) : null,
      resource: iRes >= 0 ? (cols[iRes] ?? "").trim() || undefined : undefined,
      order: r,
    });
  }
  if (events.length === 0) throw new Error("Keine gültigen Ereignisse im Log gefunden.");

  return {
    events,
    format: "csv",
    delimiter,
    columnsUsed: {
      case: headers[iCase],
      activity: headers[iAct],
      timestamp: iTs >= 0 ? headers[iTs] : undefined,
      resource: iRes >= 0 ? headers[iRes] : undefined,
    },
    warnings,
  };
}

/** Sehr einfacher XES-Parser (regex-basiert) für Standard-Logs. */
function parseXes(text: string): ParseResult {
  const events: LogEvent[] = [];
  const warnings: string[] = [];
  const traceRe = /<trace\b[\s\S]*?<\/trace>/gi;
  let order = 0;
  let hasTs = false;
  let caseIdx = 0;
  const traces = text.match(traceRe) || [];
  if (traces.length === 0) throw new Error("Keine <trace>-Elemente im XES gefunden.");

  for (const trace of traces) {
    // Fall-ID = trace-weites concept:name, sonst laufende Nummer.
    const caseMatch = trace.match(/<string\s+key="concept:name"\s+value="([^"]*)"/i);
    const caseId = caseMatch ? caseMatch[1] : `case_${++caseIdx}`;
    const eventRe = /<event\b[\s\S]*?<\/event>/gi;
    const evs = trace.match(eventRe) || [];
    for (const ev of evs) {
      const act = ev.match(/<string\s+key="concept:name"\s+value="([^"]*)"/i);
      const time = ev.match(/<date\s+key="time:timestamp"\s+value="([^"]*)"/i);
      const res = ev.match(/<string\s+key="org:resource"\s+value="([^"]*)"/i);
      if (!act) continue;
      const ts = time ? parseTs(time[1]) : null;
      if (ts !== null) hasTs = true;
      events.push({ caseId, activity: act[1], ts, resource: res?.[1], order: order++ });
    }
  }
  if (events.length === 0) throw new Error("Keine Ereignisse im XES-Log gefunden.");
  if (!hasTs) warnings.push("XES ohne Zeitstempel – keine Dauern berechenbar.");

  return {
    events,
    format: "xes",
    columnsUsed: { case: "concept:name (trace)", activity: "concept:name (event)", timestamp: "time:timestamp", resource: "org:resource" },
    warnings,
  };
}

export function parseEventLog(text: string, filename: string, mapping?: ColumnMapping): ParseResult {
  const looksXes = /<\s*log\b/i.test(text.slice(0, 2000)) || filename.toLowerCase().endsWith(".xes");
  return looksXes ? parseXes(text) : parseCsv(text, mapping);
}
