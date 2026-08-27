const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Claude Code";
pres.title = "VDE-Zugangsverwaltung – Konzept";

// --- Palette (Ocean Gradient + semantische Statusfarben) ---
const NAVY = "21295C";
const DEEP = "065A82";
const TEAL = "1C7293";
const TINT = "E8EFF4";
const LINE = "D5E0E8";
const BODY = "44515E";
const MUTED = "6B7A8C";

const ROT = "A63D32";
const AMBER = "9C6F16";

const s = pres.addSlide();
s.background = { color: "FFFFFF" };

const L = 0.55;              // linker Rand
const R = 12.78;             // rechter Rand
const BOX_W = 2.72;
const GAP = 0.44;
const spalte = (i) => L + i * (BOX_W + GAP);

// ---------------------------------------------------------------- Titel
s.addText("VDE-Regelwerkszugänge automatisiert verwalten", {
  x: L, y: 0.34, w: 10.9, h: 0.58, isTextBox: true, margin: 0,
  fontFace: "Cambria", fontSize: 26, bold: true, color: NAVY, valign: "middle",
});

s.addText(
  "Databricks-Job: gleicht die SharePoint-Liste (Soll) mit dem geführten Ist-Bestand ab und liefert dem Zugangsverantwortlichen eine priorisierte Aufgabenliste.",
  { x: L, y: 0.98, w: 10.6, h: 0.52, isTextBox: true, margin: 0,
    fontFace: "Calibri", fontSize: 13, color: MUTED, valign: "top" }
);

s.addShape(pres.ShapeType.roundRect, {
  x: 11.06, y: 0.42, w: 1.72, h: 0.52, rectRadius: 0.08,
  fill: { color: NAVY }, line: { color: NAVY, width: 0 },
});
s.addText([
  { text: "wöchentlich", options: { fontSize: 11, bold: true, color: "FFFFFF", breakLine: true } },
  { text: "Mo 07:00 Uhr", options: { fontSize: 9.5, color: "AEBBD6" } },
], { x: 11.06, y: 0.42, w: 1.72, h: 0.52, isTextBox: true, margin: 0,
     align: "center", valign: "middle", fontFace: "Calibri", lineSpacingMultiple: 0.95 });

// ---------------------------------------------------------------- Ablauf
const SCHRITT_Y = 1.66;
const SCHRITT_H = 1.16;

const schritte = [
  ["SharePoint-Liste", "Soll-Zustand: welcher Mitarbeiter braucht welches Regelwerk, Austrittsdatum, Gültigkeit."],
  ["Databricks-Job", "Liest über Microsoft Graph (nur lesend), vergleicht mit dem Ist-Bestand, prüft Fristen."],
  ["Aufgabenliste", "Mail mit priorisierten Maßnahmen, CSV im Anhang, Protokoll in Delta."],
  ["VDE-Portal", "Zugänge manuell anlegen oder entziehen – der Job hat die Arbeit vorsortiert."],
];

schritte.forEach(([titel, text], i) => {
  const x = spalte(i);
  s.addShape(pres.ShapeType.roundRect, {
    x, y: SCHRITT_Y, w: BOX_W, h: SCHRITT_H, rectRadius: 0.06,
    fill: { color: TINT }, line: { color: TINT, width: 0 },
  });
  s.addShape(pres.ShapeType.ellipse, {
    x: x + 0.16, y: SCHRITT_Y + 0.15, w: 0.32, h: 0.32,
    fill: { color: DEEP }, line: { color: DEEP, width: 0 },
  });
  s.addText(String(i + 1), {
    x: x + 0.16, y: SCHRITT_Y + 0.15, w: 0.32, h: 0.32, isTextBox: true, margin: 0,
    fontFace: "Calibri", fontSize: 12, bold: true, color: "FFFFFF",
    align: "center", valign: "middle",
  });
  s.addText(titel, {
    x: x + 0.56, y: SCHRITT_Y + 0.13, w: BOX_W - 0.72, h: 0.36, isTextBox: true, margin: 0,
    fontFace: "Cambria", fontSize: 13, bold: true, color: NAVY, valign: "middle",
  });
  s.addText(text, {
    x: x + 0.17, y: SCHRITT_Y + 0.53, w: BOX_W - 0.34, h: 0.55, isTextBox: true, margin: 0,
    fontFace: "Calibri", fontSize: 9.5, color: BODY, valign: "top", lineSpacingMultiple: 0.98,
  });
});

// Pfeile zwischen den Schritten
for (let i = 0; i < 3; i++) {
  s.addShape(pres.ShapeType.rightArrow, {
    x: spalte(i) + BOX_W + 0.08, y: SCHRITT_Y + SCHRITT_H / 2 - 0.09, w: 0.28, h: 0.18,
    fill: { color: "B6C6D2" }, line: { color: "B6C6D2", width: 0 },
  });
}

// Rückkopplung: erledigte Massnahmen fliessen in den Ist-Bestand
const RUECK_Y = 2.92;
s.addShape(pres.ShapeType.roundRect, {
  x: spalte(1), y: RUECK_Y, w: spalte(3) + BOX_W - spalte(1), h: 0.44, rectRadius: 0.05,
  fill: { color: "FFFFFF" }, line: { color: TEAL, width: 1, dashType: "dash" },
});
s.addShape(pres.ShapeType.leftArrow, {
  x: spalte(1) + 0.14, y: RUECK_Y + 0.14, w: 0.26, h: 0.16,
  fill: { color: TEAL }, line: { color: TEAL, width: 0 },
});
s.addText([
  { text: "Ist-Bestand als Delta-Tabelle:  ", options: { bold: true, color: TEAL } },
  { text: "Das VDE-Portal kennt keine Abfrage – erledigte Maßnahmen werden zurückgemeldet, damit der nächste Lauf sie nicht erneut vorschlägt.", options: { color: BODY } },
], { x: spalte(1) + 0.48, y: RUECK_Y, w: spalte(3) + BOX_W - spalte(1) - 0.62, h: 0.44,
     isTextBox: true, margin: 0, fontFace: "Calibri", fontSize: 9.5, valign: "middle" });

// ---------------------------------------------------------------- Erkennung
s.addText("Was der Job erkennt", {
  x: L, y: 3.52, w: 6.0, h: 0.30, isTextBox: true, margin: 0,
  fontFace: "Cambria", fontSize: 16, bold: true, color: NAVY, valign: "middle",
});

const KARTE_Y = 3.88;
const KARTE_H = 1.26;

const karten = [
  [TEAL, "Anlegen", "Mitarbeiter steht mit einem Regelwerk in der Liste, hat aber keinen Zugang."],
  [ROT, "Entziehen", "Ausgeschieden oder inaktiv, Austritt in den nächsten 30 Tagen, Bedarf entfallen."],
  [AMBER, "Verlängern", "Gültigkeit ist abgelaufen oder läuft im Vorlauffenster ab."],
  [MUTED, "Prüfen", "Zugang ohne Stammdatensatz. Unklare Datenlage wird gemeldet, nie still entzogen."],
];

karten.forEach(([farbe, titel, text], i) => {
  const x = spalte(i);
  s.addShape(pres.ShapeType.roundRect, {
    x, y: KARTE_Y, w: BOX_W, h: KARTE_H, rectRadius: 0.06,
    fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 },
  });
  s.addShape(pres.ShapeType.ellipse, {
    x: x + 0.19, y: KARTE_Y + 0.24, w: 0.15, h: 0.15,
    fill: { color: farbe }, line: { color: farbe, width: 0 },
  });
  s.addText(titel.toUpperCase(), {
    x: x + 0.44, y: KARTE_Y + 0.16, w: BOX_W - 0.6, h: 0.30, isTextBox: true, margin: 0,
    fontFace: "Calibri", fontSize: 12, bold: true, color: farbe, charSpacing: 1, valign: "middle",
  });
  s.addText(text, {
    x: x + 0.19, y: KARTE_Y + 0.54, w: BOX_W - 0.38, h: 0.68, isTextBox: true, margin: 0,
    fontFace: "Calibri", fontSize: 10, color: BODY, valign: "top", lineSpacingMultiple: 1.0,
  });
});

// ---------------------------------------------------------------- Prinzipien
s.addText("Konstruktionsprinzipien", {
  x: L, y: 5.36, w: 5.0, h: 0.30, isTextBox: true, margin: 0,
  fontFace: "Cambria", fontSize: 16, bold: true, color: NAVY, valign: "middle",
});

const prinzipien = [
  ["Testlauf ist der Standard.", "Der erste Lauf schreibt nichts und versendet nichts."],
  ["Nie still entziehen.", "Was nicht eindeutig zuordenbar ist, wird zum Prüffall."],
  ["Keine Zugangsdaten im Code.", "Graph-App im Secret Scope, Leserecht auf genau eine Site."],
  ["Fachlogik ohne Cluster testbar.", "38 Tests laufen lokal, Regeln stehen an einer Stelle."],
];

prinzipien.forEach(([fett, rest], i) => {
  const y = 5.74 + i * 0.325;
  s.addShape(pres.ShapeType.ellipse, {
    x: L + 0.02, y: y + 0.085, w: 0.11, h: 0.11,
    fill: { color: TEAL }, line: { color: TEAL, width: 0 },
  });
  s.addText([
    { text: fett + " ", options: { bold: true, color: NAVY } },
    { text: rest, options: { color: BODY } },
  ], { x: L + 0.26, y, w: 7.35, h: 0.28, isTextBox: true, margin: 0,
       fontFace: "Calibri", fontSize: 10.5, valign: "middle" });
});

// ---------------------------------------------------------------- Abgrenzung
s.addShape(pres.ShapeType.roundRect, {
  x: 8.32, y: 5.36, w: 4.46, h: 1.68, rectRadius: 0.07,
  fill: { color: NAVY }, line: { color: NAVY, width: 0 },
});
s.addText("Bewusst kein Auto-Provisioning", {
  x: 8.58, y: 5.54, w: 3.94, h: 0.30, isTextBox: true, margin: 0,
  fontFace: "Cambria", fontSize: 13, bold: true, color: "FFFFFF", valign: "middle",
});
s.addText(
  "Der VDE bietet keine Schnittstelle. Der Job ersetzt die Recherche, nicht den Klick im Portal – und protokolliert jeden Lauf nachvollziehbar. Kommt später eine API, sind nur zwei Module betroffen.",
  { x: 8.58, y: 5.90, w: 3.94, h: 1.06, isTextBox: true, margin: 0,
    fontFace: "Calibri", fontSize: 10.5, color: "C6D0E4", valign: "top", lineSpacingMultiple: 1.02 }
);

s.addText("Repository: vde-zugangsverwaltung  ·  Notebook + Job-Definition (Asset Bundle)  ·  Unity Catalog: governance.vde_zugang", {
  x: L, y: 7.10, w: 12.23, h: 0.24, isTextBox: true, margin: 0,
  fontFace: "Calibri", fontSize: 9, color: "94A3B0", valign: "middle",
});

s.addNotes(
  "Onepager zum Konzept der VDE-Zugangsverwaltung. Kernaussage: Der Databricks-Job automatisiert die Entscheidung, wer welchen Regelwerkszugang braucht, nicht die Ausfuehrung im VDE-Portal. Soll aus SharePoint, Ist als Delta-Tabelle, Ergebnis ist eine priorisierte Aufgabenliste per Mail."
);

pres.writeFile({ fileName: "VDE-Zugangsverwaltung-Onepager.pptx" }).then(() => console.log("geschrieben"));
