/* SWITCHBOARD — zentrale Übersicht Schalt- & Stellmaßnahmen
 * Eigenständiger Prototyp: Demo-Daten + Filter/Sortierung/Reports/Archiv.
 * Keine externen Abhängigkeiten.
 */

// ---------- Stammdaten ----------
const STATUS = {
  Geplant:        { label: "Geplant",         cls: "status-geplant" },
  Freigegeben:    { label: "Freigegeben",     cls: "status-freigegeben" },
  Durchführung:   { label: "In Durchführung", cls: "status-durchfuehrung" },
  Abgeschlossen:  { label: "Abgeschlossen",   cls: "status-abgeschlossen" },
  Archiviert:     { label: "Archiviert",      cls: "status-archiviert" },
};

const EBENE_LABEL = { NS: "Niederspannung", MS: "Mittelspannung", HS: "Hochspannung" };

// ---------- Demo-Datensatz ----------
// Zeitfenster als ISO-Strings; Bezugsdatum der Demo: 13.08.2026
const MASSNAHMEN = [
  {
    id: "SM-2026-0412", titel: "Trafowechsel Station Nord", untertitel: "Planmäßiger Austausch T1 (630 kVA)",
    kategorie: "Geplant", typ: "Schaltmaßnahme", ebene: "MS", betriebsmittel: "UW Nord / Feld 04",
    verantwortlich: "M. Braun", team: "Betrieb MS", beginn: "2026-08-14T07:00", ende: "2026-08-14T15:00",
    status: "Freigegeben", prioritaet: "Normal", kunden: 240, fortschritt: 0,
    schritte: [
      { t: "Freischalten Feld 04", d: "SPZ gesetzt, gegen Wiedereinschalten gesichert", s: "done" },
      { t: "Spannungsfreiheit feststellen", d: "3-polig geprüft", s: "done" },
      { t: "Erden und kurzschließen", d: "", s: "active" },
      { t: "Trafo T1 demontieren", d: "", s: "todo" },
      { t: "Neuen Trafo einbringen & anschließen", d: "", s: "todo" },
      { t: "Wiederinbetriebnahme & Zuschalten", d: "", s: "todo" },
    ],
  },
  {
    id: "SM-2026-0418", titel: "Kabelfehler MS-Ring Ost", untertitel: "Erdschluss Abzweig E-12, Versorgung umschalten",
    kategorie: "Störung", typ: "Schaltmaßnahme", ebene: "MS", betriebsmittel: "Ringkabel Ost / KVS 12",
    verantwortlich: "S. Keller", team: "Entstörung", beginn: "2026-08-13T09:20", ende: "2026-08-13T13:00",
    status: "Durchführung", prioritaet: "Hoch", kunden: 610, fortschritt: 55,
    schritte: [
      { t: "Fehlerortung Abzweig E-12", d: "Wischerortung + Vorortung", s: "done" },
      { t: "Fehlerhaften Abschnitt freischalten", d: "", s: "done" },
      { t: "Umschaltung auf Ersatzeinspeisung", d: "Kupplung KVS 12 → KVS 09", s: "active" },
      { t: "Versorgung wiederherstellen", d: "", s: "todo" },
      { t: "Reparatur beauftragen", d: "", s: "todo" },
    ],
  },
  {
    id: "SM-2026-0421", titel: "Sollwertanpassung Regeltrafo", titelSort: "", untertitel: "Stufensteller UW Süd auf +2 setzen",
    kategorie: "Geplant", typ: "Stellmaßnahme", ebene: "HS", betriebsmittel: "UW Süd / Regeltrafo RT2",
    verantwortlich: "A. Wolf", team: "Netzführung", beginn: "2026-08-13T14:00", ende: "2026-08-13T14:30",
    status: "Freigegeben", prioritaet: "Normal", kunden: 0, fortschritt: 0,
    schritte: [
      { t: "Spannungsband prüfen", d: "aktuell 109,1 kV", s: "done" },
      { t: "Stufensteller auf +2 stellen", d: "", s: "active" },
      { t: "Nachregelung überwachen", d: "", s: "todo" },
    ],
  },
  {
    id: "SM-2026-0423", titel: "NS-Ausfall Wohngebiet Lindenweg", untertitel: "NH-Sicherung durchgebrannt, Ersatz",
    kategorie: "Störung", typ: "Schaltmaßnahme", ebene: "NS", betriebsmittel: "ONS 214 / Abgang 3",
    verantwortlich: "T. Roth", team: "Entstörung", beginn: "2026-08-13T10:05", ende: "2026-08-13T11:15",
    status: "Durchführung", prioritaet: "Hoch", kunden: 84, fortschritt: 70,
    schritte: [
      { t: "Störungsmeldung aufnehmen", d: "3 Kundenmeldungen", s: "done" },
      { t: "ONS 214 anfahren", d: "", s: "done" },
      { t: "NH-Sicherung Abgang 3 tauschen", d: "", s: "active" },
      { t: "Spannung kontrollieren & Rückmeldung", d: "", s: "todo" },
    ],
  },
  {
    id: "SM-2026-0409", titel: "Wartung Sammelschiene A", untertitel: "Revision SS-A, Umschaltung auf SS-B",
    kategorie: "Geplant", typ: "Schaltmaßnahme", ebene: "HS", betriebsmittel: "UW West / Sammelschiene A",
    verantwortlich: "M. Braun", team: "Betrieb HS", beginn: "2026-08-16T06:00", ende: "2026-08-16T18:00",
    status: "Geplant", prioritaet: "Normal", kunden: 0, fortschritt: 0,
    schritte: [
      { t: "Schaltprogramm erstellen", d: "", s: "done" },
      { t: "Freigabe Netzführung einholen", d: "", s: "todo" },
      { t: "Lastumlegung auf SS-B", d: "", s: "todo" },
      { t: "SS-A freischalten & erden", d: "", s: "todo" },
    ],
  },
  {
    id: "SM-2026-0405", titel: "Netzumbau Baustelle Ringstraße", untertitel: "Provisorische Einspeisung setzen",
    kategorie: "Geplant", typ: "Stellmaßnahme", ebene: "NS", betriebsmittel: "KVS 07 / Provisorium",
    verantwortlich: "J. Feld", team: "Netzbau", beginn: "2026-08-18T08:00", ende: "2026-08-18T12:00",
    status: "Geplant", prioritaet: "Niedrig", kunden: 32, fortschritt: 0,
    schritte: [
      { t: "Provisorium vorbereiten", d: "", s: "todo" },
      { t: "Umschaltung Kunden", d: "", s: "todo" },
    ],
  },
  // --- Archiv (abgeschlossen) ---
  {
    id: "SM-2026-0388", titel: "Trafowechsel Station Mitte", untertitel: "T2 planmäßig getauscht",
    kategorie: "Geplant", typ: "Schaltmaßnahme", ebene: "MS", betriebsmittel: "UW Mitte / Feld 02",
    verantwortlich: "S. Keller", team: "Betrieb MS", beginn: "2026-08-05T07:00", ende: "2026-08-05T14:20",
    status: "Archiviert", prioritaet: "Normal", kunden: 180, fortschritt: 100,
    schritte: [
      { t: "Freischalten & sichern", d: "", s: "done" },
      { t: "Trafo tauschen", d: "", s: "done" },
      { t: "Wiederinbetriebnahme", d: "planmäßig abgeschlossen", s: "done" },
    ],
  },
  {
    id: "SM-2026-0361", titel: "Erdschluss MS-Ring West", untertitel: "Störung behoben, Kabelmuffe erneuert",
    kategorie: "Störung", typ: "Schaltmaßnahme", ebene: "MS", betriebsmittel: "Ringkabel West / KVS 03",
    verantwortlich: "T. Roth", team: "Entstörung", beginn: "2026-07-29T02:15", ende: "2026-07-29T06:40",
    status: "Archiviert", prioritaet: "Hoch", kunden: 430, fortschritt: 100,
    schritte: [
      { t: "Fehlerortung", d: "", s: "done" },
      { t: "Umschaltung Ersatzeinspeisung", d: "", s: "done" },
      { t: "Reparatur & Rückschaltung", d: "Dauer 4h25m", s: "done" },
    ],
  },
  {
    id: "SM-2026-0355", titel: "Sollwertkorrektur UW Nord", untertitel: "Blindleistungssollwert angepasst",
    kategorie: "Geplant", typ: "Stellmaßnahme", ebene: "HS", betriebsmittel: "UW Nord / Kompensation",
    verantwortlich: "A. Wolf", team: "Netzführung", beginn: "2026-07-22T11:00", ende: "2026-07-22T11:25",
    status: "Archiviert", prioritaet: "Normal", kunden: 0, fortschritt: 100,
    schritte: [{ t: "Sollwert gesetzt", d: "", s: "done" }],
  },
];

// ---------- State ----------
const state = {
  view: "aktiv",         // aktiv | archiv
  suche: "",
  kategorie: "alle",
  status: "alle",
  ebene: "alle",
  sortKey: "beginn",
  sortDir: "asc",
  stoerung: false,
};

// ---------- Helpers ----------
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const AKTIV_STATUS = ["Geplant", "Freigegeben", "Durchführung", "Abgeschlossen"];

function fmtRange(a, b) {
  const da = new Date(a), db = new Date(b);
  const wd = da.toLocaleDateString("de-DE", { weekday: "short" });
  const day = da.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  const t1 = da.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const t2 = db.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return `${wd} ${day} · ${t1}–${t2}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// ---------- Filter + Sort Pipeline ----------
function currentRows() {
  let rows = MASSNAHMEN.filter(m =>
    state.view === "archiv" ? m.status === "Archiviert" : m.status !== "Archiviert"
  );

  if (state.kategorie !== "alle") rows = rows.filter(m => m.kategorie === state.kategorie);
  if (state.status !== "alle")    rows = rows.filter(m => m.status === state.status);
  if (state.ebene !== "alle")     rows = rows.filter(m => m.ebene === state.ebene);

  if (state.suche.trim()) {
    const q = state.suche.trim().toLowerCase();
    rows = rows.filter(m =>
      [m.id, m.titel, m.untertitel, m.betriebsmittel, m.verantwortlich, m.team]
        .join(" ").toLowerCase().includes(q)
    );
  }

  const dir = state.sortDir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    let va = a[state.sortKey], vb = b[state.sortKey];
    if (state.sortKey === "titel") { va = a.titel; vb = b.titel; }
    if (typeof va === "string") return va.localeCompare(vb, "de") * dir;
    return (va > vb ? 1 : va < vb ? -1 : 0) * dir;
  });
  return rows;
}

// ---------- Renderers ----------
function renderKpis() {
  const aktiv = MASSNAHMEN.filter(m => m.status !== "Archiviert");
  const stoerungenAktiv = aktiv.filter(m => m.kategorie === "Störung");
  const inDurchf = aktiv.filter(m => m.status === "Durchführung");
  const geplant = aktiv.filter(m => m.status === "Geplant" || m.status === "Freigegeben");
  const archiv = MASSNAHMEN.filter(m => m.status === "Archiviert");
  const betroffene = stoerungenAktiv.reduce((s, m) => s + m.kunden, 0);

  const cards = [
    { label: "Aktive Maßnahmen", value: aktiv.length, sub: "gesamt in Übersicht", color: "var(--accent)" },
    { label: "In Durchführung", value: inDurchf.length, sub: "laufend geschaltet", color: "var(--warn)" },
    { label: "Störungen aktiv", value: stoerungenAktiv.length, sub: `${betroffene} betroffene Kunden`, color: "var(--danger)" },
    { label: "Geplant / freigegeben", value: geplant.length, sub: "in Vorbereitung", color: "var(--violet)" },
    { label: "Im Archiv", value: archiv.length, sub: "für Auswertungen", color: "var(--ok)" },
  ];
  $("#kpis").innerHTML = cards.map(c => `
    <div class="kpi" style="--accent-color:${c.color}">
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-value">${c.value}</div>
      <div class="kpi-sub">${c.sub}</div>
    </div>`).join("");
}

function statusHtml(m) {
  const s = STATUS[m.status];
  return `<span class="status ${s.cls}">${s.label}</span>`;
}

function rowHtml(m) {
  const st = m.kategorie === "Störung";
  const kat = st
    ? `<span class="badge badge-stoerung">Störung</span>`
    : `<span class="badge badge-geplant">Geplant</span>`;
  return `
    <tr data-id="${m.id}" class="${st ? "row-stoerung" : ""}">
      <td class="cell-id">${m.id}</td>
      <td class="cell-titel">${escapeHtml(m.titel)}<small>${escapeHtml(m.typ)} · ${escapeHtml(m.untertitel)}</small></td>
      <td>${kat}</td>
      <td><span class="chip chip-ebene-${m.ebene}">${m.ebene}</span></td>
      <td>${escapeHtml(m.betriebsmittel)}</td>
      <td>${escapeHtml(m.verantwortlich)}</td>
      <td class="cell-time">${fmtRange(m.beginn, m.ende)}</td>
      <td>${statusHtml(m)}</td>
      <td><div class="progress"><span style="width:${m.fortschritt}%"></span></div></td>
    </tr>`;
}

function renderTable() {
  const rows = currentRows();
  const body = $("#gridBody");
  body.innerHTML = rows.map(rowHtml).join("");
  $("#emptyState").hidden = rows.length > 0;
  $("#resultCount").textContent = `${rows.length} ${rows.length === 1 ? "Maßnahme" : "Maßnahmen"}`;

  // Sort-Indikatoren
  $$(".grid th.sortable").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.key === state.sortKey) th.classList.add(state.sortDir === "asc" ? "sort-asc" : "sort-desc");
  });

  body.querySelectorAll("tr").forEach(tr =>
    tr.addEventListener("click", () => openDrawer(tr.dataset.id))
  );
}

function populateStatusFilter() {
  const sel = $("#fStatus");
  AKTIV_STATUS.forEach(s => {
    const o = document.createElement("option");
    o.value = s; o.textContent = "Status: " + STATUS[s].label;
    sel.appendChild(o);
  });
}

// ---------- Detail-Drawer ----------
function openDrawer(id) {
  const m = MASSNAHMEN.find(x => x.id === id);
  if (!m) return;
  $("#dId").textContent = `${m.id} · ${m.typ}`;
  $("#dTitel").textContent = m.titel;

  const item = (label, val) => `
    <div class="detail-item"><div class="dl">${label}</div><div class="dv">${val}</div></div>`;

  const done = m.schritte.filter(s => s.s === "done").length;
  const steps = m.schritte.map((s, i) => `
    <div class="step ${s.s}">
      <div class="step-num">${s.s === "done" ? "✓" : i + 1}</div>
      <div class="step-text">
        <div class="st-main">${escapeHtml(s.t)}</div>
        ${s.d ? `<div class="st-sub">${escapeHtml(s.d)}</div>` : ""}
      </div>
    </div>`).join("");

  $("#drawerBody").innerHTML = `
    <div class="detail-grid">
      ${item("Kategorie", m.kategorie === "Störung"
        ? '<span class="badge badge-stoerung">Störung</span>'
        : '<span class="badge badge-geplant">Geplant</span>')}
      ${item("Status", statusHtml(m))}
      ${item("Netzebene", `${EBENE_LABEL[m.ebene]} (${m.ebene})`)}
      ${item("Priorität", m.prioritaet)}
      ${item("Betriebsmittel", escapeHtml(m.betriebsmittel))}
      ${item("Verantwortlich", `${escapeHtml(m.verantwortlich)} · ${escapeHtml(m.team)}`)}
      ${item("Zeitfenster", fmtRange(m.beginn, m.ende))}
      ${item("Betroffene Kunden", m.kunden.toLocaleString("de-DE"))}
      <div class="detail-item full">${item("Beschreibung", escapeHtml(m.untertitel))}</div>
    </div>
    <div class="steps-title">Schaltschritte · ${done}/${m.schritte.length} erledigt</div>
    ${steps}`;

  $("#drawerBackdrop").hidden = false;
  $("#drawer").hidden = false;
}
function closeDrawer() { $("#drawer").hidden = true; $("#drawerBackdrop").hidden = true; }

// ---------- Report ----------
const REPORT_COLS = [
  { key: "id", label: "ID" }, { key: "titel", label: "Bezeichnung" },
  { key: "typ", label: "Typ" }, { key: "kategorie", label: "Kategorie" },
  { key: "ebene", label: "Netzebene" }, { key: "betriebsmittel", label: "Betriebsmittel" },
  { key: "verantwortlich", label: "Verantwortlich" }, { key: "status", label: "Status" },
  { key: "beginn", label: "Beginn" }, { key: "ende", label: "Ende" },
  { key: "kunden", label: "Betroffene Kunden" }, { key: "fortschritt", label: "Fortschritt %" },
];

function openReport() {
  const box = $("#reportCols");
  box.querySelectorAll("label").forEach(l => l.remove());
  REPORT_COLS.forEach(c => {
    const on = ["id", "titel", "kategorie", "ebene", "status", "beginn"].includes(c.key);
    const l = document.createElement("label");
    l.innerHTML = `<input type="checkbox" value="${c.key}" ${on ? "checked" : ""}/> ${c.label}`;
    box.appendChild(l);
  });
  updateReportSummary();
  box.oninput = updateReportSummary;
  $("#reportBackdrop").hidden = false;
}
function closeReport() { $("#reportBackdrop").hidden = true; }

function updateReportSummary() {
  const rows = currentRows();
  const parts = [];
  parts.push(state.view === "archiv" ? "Datenbasis: Archiv" : "Datenbasis: Aktive Übersicht");
  if (state.kategorie !== "alle") parts.push(`Kategorie ${state.kategorie}`);
  if (state.status !== "alle") parts.push(`Status ${STATUS[state.status].label}`);
  if (state.ebene !== "alle") parts.push(`Ebene ${state.ebene}`);
  if (state.suche.trim()) parts.push(`Suche „${state.suche.trim()}“`);
  $("#reportSummary").textContent = `${rows.length} Datensätze · ${parts.join(" · ")}`;
}

function selectedReportCols() {
  return $$("#reportCols input:checked").map(i => i.value);
}

function exportCsv() {
  const cols = selectedReportCols();
  if (!cols.length) return;
  const rows = currentRows();
  const head = cols.map(k => REPORT_COLS.find(c => c.key === k).label);
  const lines = [head.join(";")];
  rows.forEach(m => {
    lines.push(cols.map(k => {
      let v = m[k] ?? "";
      if (k === "beginn" || k === "ende") v = new Date(m[k]).toLocaleString("de-DE");
      return `"${String(v).replace(/"/g, '""')}"`;
    }).join(";"));
  });
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `switchboard-report-${state.view}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- Events ----------
function bind() {
  $("#fSuche").addEventListener("input", e => { state.suche = e.target.value; renderTable(); });

  $("#fKategorie").addEventListener("click", e => {
    const b = e.target.closest(".seg-btn"); if (!b) return;
    $$("#fKategorie .seg-btn").forEach(x => x.classList.remove("is-active"));
    b.classList.add("is-active");
    state.kategorie = b.dataset.val;
    renderTable();
  });

  $("#fStatus").addEventListener("change", e => { state.status = e.target.value; renderTable(); });
  $("#fEbene").addEventListener("change", e => { state.ebene = e.target.value; renderTable(); });

  $("#fReset").addEventListener("click", () => {
    state.suche = ""; state.kategorie = "alle"; state.status = "alle"; state.ebene = "alle";
    $("#fSuche").value = ""; $("#fStatus").value = "alle"; $("#fEbene").value = "alle";
    $$("#fKategorie .seg-btn").forEach(x => x.classList.toggle("is-active", x.dataset.val === "alle"));
    renderTable();
  });

  $$(".tab").forEach(t => t.addEventListener("click", () => {
    $$(".tab").forEach(x => x.classList.remove("is-active"));
    t.classList.add("is-active");
    state.view = t.dataset.view;
    // Statusfilter im Archiv nicht sinnvoll → zurücksetzen
    if (state.view === "archiv") { state.status = "alle"; $("#fStatus").value = "alle"; }
    renderTable();
  }));

  $$(".grid th.sortable").forEach(th => th.addEventListener("click", () => {
    const key = th.dataset.key;
    if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    else { state.sortKey = key; state.sortDir = "asc"; }
    renderTable();
  }));

  $("#stoerungsmodus").addEventListener("change", e => {
    state.stoerung = e.target.checked;
    document.body.classList.toggle("stoerung", state.stoerung);
    if (state.stoerung) {
      state.kategorie = "Störung";
      $$("#fKategorie .seg-btn").forEach(x => x.classList.toggle("is-active", x.dataset.val === "Störung"));
    } else {
      state.kategorie = "alle";
      $$("#fKategorie .seg-btn").forEach(x => x.classList.toggle("is-active", x.dataset.val === "alle"));
    }
    renderTable();
  });

  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", closeDrawer);

  $("#btnReport").addEventListener("click", openReport);
  $("#reportClose").addEventListener("click", closeReport);
  $("#reportBackdrop").addEventListener("click", e => { if (e.target.id === "reportBackdrop") closeReport(); });
  $("#reportCsv").addEventListener("click", () => { exportCsv(); });
  $("#reportDruck").addEventListener("click", () => { closeReport(); setTimeout(() => window.print(), 60); });

  $("#btnNeu").addEventListener("click", () =>
    alert("Prototyp: Das Anlegen neuer Schalt-/Stellmaßnahmen ist im Demo-Datensatz nicht aktiv."));

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeDrawer(); closeReport(); }
  });
}

// ---------- Init ----------
populateStatusFilter();
bind();
renderKpis();
renderTable();
