/**
 * Erzeugt das Foliendeck zum Governance-Konzept für die IT-Abstimmung.
 *
 * Reproduzierbar statt von Hand gebaut: Ändert sich GOVERNANCE.md, wird dieses
 * Skript angepasst und das Deck neu erzeugt. Die Farben stammen aus den
 * Mapping-Arbeitsmappen (werkzeuge/mappe_bauen.py), damit alle Artefakte des
 * Vorhabens dieselbe Anmutung haben.
 *
 *   npm install -g pptxgenjs
 *   NODE_PATH=$(npm root -g) node governance_deck.js
 *
 * Geprüft wird mit scripts/office/validate.py aus dem pptx-Skill. Die visuelle Prüfung
 * per Rendering ist in der Cloud-Session nicht möglich — LibreOffice lädt die Datei dort
 * nicht. Ersatzweise wird die Höhenauslastung jeder Textbox rechnerisch geschätzt; bei
 * deutschen Texten ist der Überlauf das Hauptrisiko.
 */
const pptxgen = require("pptxgenjs");

// applyTheme schreibt die Themenfarben in die fertige Datei — pptxgenjs kann das nicht.
// Fehlt das Modul, läuft das Skript trotzdem durch: Alle sichtbaren Farben sind unten
// explizit gesetzt, nur die Theme-Palette bleibt dann Office-Standard.
let applyTheme = null;
try {
  ({ applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js"));
} catch {
  console.warn("Hinweis: apply_theme.js nicht gefunden — Themenfarben werden nicht gesetzt.");
}

const THEME = {
  name: "NGD Schnittstellen",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1A1A1A",      // Text auf hell
    lt1: "FFFFFF",      // heller Grund
    dk2: "1F3B42",      // dunkler Grund (Wendepunkte der Argumentation)
    lt2: "F4F6F6",      // Kartenfläche
    accent1: "0E5A69",  // Petrol — Hauptakzent
    accent2: "C87D1E",  // Bernstein — offene Punkte
    accent3: "5A6A73",  // Grau — Sekundärtext
    accent4: "2C7A6B",  // Grün — erledigt
    accent5: "8E3324",  // Rot — Risiko
    accent6: "AFC3C7",  // Petrol hell
    hlink: "0E5A69",
    folHlink: "5A6A73",
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";          // 13.3 x 7.5 Zoll — VOR dem ersten addSlide
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.author = "Cluster Digitalisierung, Data & AI";
pres.title = "Governance für Schnittstellen";

const C = pres.SchemeColor;
const P = THEME.colors;

// ---------------------------------------------------------------- Layouts
pres.defineSlideMaster({
  title: "TITEL",
  background: { color: P.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 1.0, y: 2.4, w: 11.3, h: 1.6,
        fontSize: 40, bold: true, color: C.background1, fontFace: THEME.headFontFace } } },
    { placeholder: { options: { name: "body", type: "body", x: 1.0, y: 4.1, w: 11.3, h: 1.4,
        fontSize: 16, color: P.accent6, valign: "top" } } },
  ],
});

pres.defineSlideMaster({
  title: "KAPITEL",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 0.45, w: 11.9, h: 0.85,
        fontSize: 30, bold: true, color: C.text1, fontFace: THEME.headFontFace, valign: "middle" } } },
    { text: { text: "Governance Schnittstellen · Cluster Digitalisierung, Data & AI",
        options: { x: 0.7, y: 6.95, w: 9.0, h: 0.3, fontSize: 9, color: P.accent3, isTextBox: true } } },
  ],
  slideNumber: { x: 12.4, y: 6.95, fontSize: 9, color: P.accent3 },
});

pres.defineSlideMaster({
  title: "KAPITEL_DUNKEL",
  background: { color: P.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 0.45, w: 11.9, h: 0.85,
        fontSize: 30, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: "middle" } } },
  ],
  slideNumber: { x: 12.4, y: 6.95, fontSize: 9, color: P.accent6 },
});

// ------------------------------------------------------- Bausteine
/** Nummer in einem Petrol-Kreis — das durchgehende visuelle Motiv des Decks. */
function kreis(s, x, y, text, grund = P.accent1, schrift = "FFFFFF", d = 0.5) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: grund },
    line: { color: grund, width: 0 }, objectName: `kreis_${text}` });
  s.addText(text, { x, y, w: d, h: d, fontSize: d > 0.45 ? 15 : 12, bold: true,
    color: schrift, align: "center", valign: "middle", margin: 0, isTextBox: true });
}

/** Karte mit Überschrift und Fließtext. */
function karte(s, { x, y, w, h, kopf, text, fuss, grund = P.lt2, akzent = P.accent1 }) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06,
    fill: { color: grund }, line: { color: grund, width: 0 }, objectName: `karte_${kopf.slice(0, 18)}` });
  s.addText(kopf, { x: x + 0.3, y: y + 0.22, w: w - 0.6, h: 0.4, fontSize: 15, bold: true,
    color: akzent, margin: 0, isTextBox: true });
  s.addText(text, { x: x + 0.3, y: y + 0.68, w: w - 0.6, h: h - (fuss ? 1.25 : 0.95),
    fontSize: 13, color: P.dk1, margin: 0, isTextBox: true, valign: "top" });
  if (fuss) {
    s.addText(fuss, { x: x + 0.3, y: y + h - 0.58, w: w - 0.6, h: 0.42, fontSize: 11,
      italic: true, color: P.accent3, margin: 0, isTextBox: true });
  }
}

// =============================================================== 1 Titel
pres.addSection({ title: "Einstieg" });
let s = pres.addSlide({ masterName: "TITEL", sectionTitle: "Einstieg" });
s.addText("Governance für Schnittstellen", { placeholder: "title" });
s.addText([
  { text: "Vier Fragen. Vier Antworten. Vier Personentage.", options: { bold: true, breakLine: true } },
  { text: "epilot → SAP · Einspeiser (SK-001) und § 14a (SK-002)", options: { fontSize: 14 } },
], { placeholder: "body" });
s.addText("09.10.2026", { x: 1.0, y: 6.4, w: 4.0, h: 0.4, fontSize: 12, color: P.accent6, isTextBox: true });
s.addNotes(
  "Einstieg: Wir haben bei den letzten Vorhaben vier Punkte von Ihnen gehört — Connectoren, " +
  "API-Keys, Zugriff auf Kundendaten, sauberer Betrieb. Diese Fragen sind berechtigt, und wir " +
  "haben sie beantwortet. Der Aufwand für die erste Stufe liegt bei rund vier Personentagen.\n\n" +
  "Nicht sagen: 'Die IT blockiert.' Die IT haftet — das ist der Unterschied."
);

// =============================================================== 2 Das Angebot
pres.addSection({ title: "Das Angebot" });
s = pres.addSlide({ masterName: "KAPITEL_DUNKEL", sectionTitle: "Das Angebot" });
s.addText("Das Angebot in einem Satz", { placeholder: "title" });
s.addText(
  "Das Cluster übernimmt die fachliche Verantwortung und liefert die Nachweise.\n" +
  "Die IT behält die Kontrolle über Zugänge und Netzzugang.",
  { x: 0.7, y: 1.5, w: 11.9, h: 1.0, fontSize: 21, bold: true, color: P.accent6,
    margin: 0, isTextBox: true, lineSpacingMultiple: 1.2 }
);
const tausch = [
  ["Die IT gibt", "Das Cluster liefert"],
  ["Technischen Nutzer, Key-Vault-Zugang", "Register, benannte Rollen, Betriebsanleitung"],
  ["Netzzugang zur Dateiablage", "Nachweis: keine personenbezogenen Daten"],
  ["Mitzeichnung statt Durchsetzung", "Fachliche Verantwortung inkl. Klärfälle"],
  ["Bereitschaft im Störfall", "Erster Ansprechpartner ist die Fachseite"],
];
s.addTable(
  tausch.map((r, i) => r.map((c) => ({
    text: c,
    options: i === 0
      ? { bold: true, color: "FFFFFF", fill: { color: P.accent1 }, fontSize: 14 }
      : { color: "FFFFFF", fill: { color: "2A4C54" }, fontSize: 13 },
  }))),
  { x: 0.7, y: 2.9, w: 11.9, colW: [5.95, 5.95], rowH: 0.62, border: { type: "solid", color: P.dk2, pt: 2 },
    valign: "middle", margin: 0.14 }
);
s.addText("Das ist ein Tauschgeschäft, kein Durchsetzungsversuch.", {
  x: 0.7, y: 6.4, w: 11.9, h: 0.4, fontSize: 14, italic: true, color: P.accent2, isTextBox: true });
s.addNotes(
  "Bottom line first. Diese Folie ist der Kern — wenn nur eine Folie hängen bleibt, dann diese.\n\n" +
  "Der letzte Punkt ist die wertvollste Zusage: Erster Ansprechpartner im Störfall ist die " +
  "Fachseite, nicht die IT. Damit nehmen wir ihnen genau das ab, wovor sie sich fürchten — " +
  "nachts für etwas gerufen zu werden, das sie nicht gebaut haben."
);

// =============================================================== 3 Warum jetzt
s = pres.addSlide({ masterName: "KAPITEL", sectionTitle: "Das Angebot" });
s.addText("Warum die Frage jetzt entschieden werden muss", { placeholder: "title" });
s.addText("Der Endtermin kommt von außen", { x: 0.7, y: 1.35, w: 11.9, h: 0.45,
  fontSize: 18, bold: true, color: P.accent1, isTextBox: true, margin: 0 });
s.addText(
  "Das Altportal Lovion wird abgeschaltet. Mit ihm fällt die Fachanwendung weg, die heute " +
  "beide CSV-Dateien erzeugt. Der Termin ist nicht verhandelbar — ohne tragende Schnittstelle " +
  "fehlen SAP die Daten für die EEG-Abrechnung.",
  { x: 0.7, y: 1.85, w: 11.9, h: 0.9, fontSize: 14, color: P.dk1, isTextBox: true, margin: 0 }
);
karte(s, { x: 0.7, y: 3.0, w: 3.75, h: 2.9, kopf: "Heute",
  text: "Schnittstellen entstehen im Projekt. Niemand führt sie. Wenn eine ausfällt, wird die IT gerufen — für etwas, das sie nicht kennt.",
  fuss: "Folge: Die IT bremst. Zu Recht.", akzent: P.accent5 });
karte(s, { x: 4.75, y: 3.0, w: 3.75, h: 2.9, kopf: "Ohne Einigung",
  text: "Aus einer Governance-Frage wird ein Terminproblem. Beide Seiten verlieren: Die IT bekommt die Schnittstelle trotzdem, nur ohne Regeln.",
  fuss: "Das ist das eigentliche Risiko.", akzent: P.accent2 });
karte(s, { x: 8.8, y: 3.0, w: 3.8, h: 2.9, kopf: "Mit Stufe 1",
  text: "Jede Schnittstelle hat einen Namen im Register, eine Betriebsanleitung und eine Eskalation. Die IT weiß, was läuft.",
  fuss: "Aufwand: rund vier Personentage.", akzent: P.accent4 });
s.addNotes(
  "Die Spannung aufbauen, ohne zu drohen. Der Abschalttermin betrifft beide Seiten gleich.\n\n" +
  "Die mittlere Karte ist das Argument, das sitzt: Ohne Einigung entsteht die Schnittstelle " +
  "trotzdem — nur ungeregelt. Das will die IT am wenigsten."
);

// =============================================================== 4 Connectoren
pres.addSection({ title: "Die vier Fragen" });
s = pres.addSlide({ masterName: "KAPITEL", sectionTitle: "Die vier Fragen" });
s.addText("Frage 1 — Was passiert mit Connectoren?", { placeholder: "title" });
kreis(s, 0.7, 1.45, "1", P.accent1, "FFFFFF", 0.55);
s.addText("Das Risiko ist nicht der Connector, sondern das persönliche Konto dahinter", {
  x: 1.45, y: 1.45, w: 11.1, h: 0.55, fontSize: 18, bold: true, color: P.accent1,
  valign: "middle", isTextBox: true, margin: 0 });
s.addText(
  "Ein Connector unter dem Konto eines Mitarbeiters bricht, sobald dieser das Unternehmen " +
  "verlässt oder sein Passwort wechselt. Niemand weiß dann, warum.",
  { x: 1.45, y: 2.1, w: 11.1, h: 0.7, fontSize: 14, color: P.dk1, isTextBox: true, margin: 0 }
);
karte(s, { x: 0.7, y: 3.05, w: 5.8, h: 2.9, kopf: "Festlegung",
  text: "Jede Verbindung läuft über einen technischen Nutzer. Nie über ein persönliches Konto — auch nicht in der Erprobung.",
  fuss: "Ein Prototyp mit persönlichem Konto wird zum Produktivbetrieb, ohne dass jemand die Entscheidung trifft." });
karte(s, { x: 6.8, y: 3.05, w: 5.8, h: 2.9, kopf: "Nachweis",
  text: "Jede Verbindung steht im Schnittstellen-Register: technischer Nutzer, Zweck, verantwortliche Person, Stellvertretung.",
  fuss: "Was nicht im Register steht, existiert nicht — und darf abgeschaltet werden." });
s.addNotes(
  "Der letzte Satz ist eine echte Zusage an die IT: Sie darf abschalten, was nicht eingetragen ist. " +
  "Das ist die Handhabe gegen Schatten-IT, die sie bisher nicht hat.\n\n" +
  "Falls gefragt wird: Ja, auch unsere eigenen Prototypen. Keine Ausnahme."
);

// =============================================================== 5 API-Keys
s = pres.addSlide({ masterName: "KAPITEL", sectionTitle: "Die vier Fragen" });
s.addText("Frage 2 — Wer verwaltet den API-Key?", { placeholder: "title" });
kreis(s, 0.7, 1.45, "2", P.accent1, "FFFFFF", 0.55);
s.addText("epilot hat keine klassischen API-Keys", {
  x: 1.45, y: 1.45, w: 11.1, h: 0.55, fontSize: 20, bold: true, color: P.accent1,
  valign: "middle", isTextBox: true, margin: 0 });
s.addText(
  "Jeder Zugang ist ein JWT, erzeugt über die Access Token API. Er trägt vier Eigenschaften, " +
  "die ein statischer Schlüssel nicht hat:",
  { x: 1.45, y: 2.1, w: 11.1, h: 0.5, fontSize: 14, color: P.dk1, isTextBox: true, margin: 0 }
);
const keyTab = [
  ["Eigenschaft", "Bedeutung für die IT"],
  ["assignments", "Der Token trägt Rollen in sich. Ein Export-Token braucht keine Schreibrechte auf Kontakte."],
  ["read_only: true", "Beschränkt den Token technisch auf lesende Operationen."],
  ["expires_in", "Läuft ab — 30 Sekunden bis 7 Tage. Ein dauerhaft gültiges Geheimnis gibt es nicht."],
  ["DELETE /access-tokens/{id}", "Zieht einen Token sofort zurück."],
  ["GET /access-tokens", "Vollständiges Inventar aller Token — aus dem System, nicht aus einer Liste."],
];
s.addTable(
  keyTab.map((r, i) => [
    { text: r[0], options: i === 0
        ? { bold: true, color: "FFFFFF", fill: { color: P.accent1 }, fontSize: 13 }
        : { fontSize: 12, bold: true, color: P.accent1, fill: { color: P.lt2 }, fontFace: "Courier New" } },
    { text: r[1], options: i === 0
        ? { bold: true, color: "FFFFFF", fill: { color: P.accent1 }, fontSize: 13 }
        : { fontSize: 12, color: P.dk1, fill: { color: P.lt2 } } },
  ]),
  { x: 0.7, y: 2.75, w: 11.9, colW: [3.3, 8.6], rowH: 0.52,
    border: { type: "solid", color: "FFFFFF", pt: 2 }, valign: "middle", margin: 0.12 }
);
s.addText(
  "Das ist mehr Kontrolle, als ein statischer Schlüssel bieten könnte. " +
  "Die Sorge trifft einen Mechanismus, den es hier nicht gibt.",
  { x: 0.7, y: 6.2, w: 11.9, h: 0.5, fontSize: 14, bold: true, italic: true,
    color: P.accent4, isTextBox: true, margin: 0 }
);
s.addNotes(
  "Das ist die Folie, die das Gespräch dreht. Erst die Sorge ernst nehmen, dann zeigen, " +
  "dass der befürchtete Mechanismus hier nicht existiert.\n\n" +
  "Ergänzen: Token liegen im Azure Key Vault bzw. Databricks Secret Scope — nie in Code, " +
  "Notebook oder Repository. Das ist heute schon umgesetzt, nicht geplant.\n\n" +
  "Eine Ausnahme offen benennen: SK-001 braucht Schreibrecht auf genau ein Attribut, den " +
  "Übertragungsstatus. Sonst liefert jeder Lauf alle Vorgänge erneut."
);

// =============================================================== 6 Kundendaten
s = pres.addSlide({ masterName: "KAPITEL", sectionTitle: "Die vier Fragen" });
s.addText("Frage 3 — Wer hat Zugriff auf Kundendaten?", { placeholder: "title" });
kreis(s, 0.7, 1.45, "3", P.accent1, "FFFFFF", 0.55);
s.addText("SK-001 überträgt keine personenbezogenen Daten", {
  x: 1.45, y: 1.45, w: 11.1, h: 0.55, fontSize: 20, bold: true, color: P.accent4,
  valign: "middle", isTextBox: true, margin: 0 });
s.addText(
  "Belegt, nicht behauptet: Die Analyse aller 30 Exportspalten liegt vor. Enthalten sind " +
  "ausschließlich technische Anlagendaten am Anschlussobjekt — kein Name, keine IBAN, " +
  "kein Umsatzsteuerstatus. Die Klärliste enthält nur Vorgangskennung und Grund; " +
  "ein automatisierter Test sichert das ab.",
  { x: 1.45, y: 2.1, w: 11.1, h: 1.0, fontSize: 14, color: P.dk1, isTextBox: true, margin: 0 }
);
karte(s, { x: 0.7, y: 3.3, w: 5.8, h: 2.6, kopf: "Trotzdem zu regeln",
  text: "Rollen in epilot — nicht jeder Mitarbeiter sieht jeden Vorgang. Protokolle ohne Antragsinhalte. AV-Vertrag mit epilot als SaaS-Anbieter. Löschkonzept mit EEG-Aufbewahrungspflichten.",
  fuss: "Prüfpunkte für den Datenschutz." });
karte(s, { x: 6.8, y: 3.3, w: 5.8, h: 2.6, kopf: "Der eigentliche Punkt",
  text: "Die Rohdatenablage in Databricks enthält mehr als die Exportdatei — den vollständigen Vorgang. Dort greifen die Berechtigungsfragen voll.",
  fuss: "Deshalb sind Export und Rohdatenablage in diesem Vorhaben zwei getrennte Stränge.",
  grund: "FBF3E6", akzent: P.accent2 });
s.addNotes(
  "Wichtig: Die rechte Karte selbst ansprechen, nicht darauf warten, dass die IT sie findet. " +
  "Das kostet nichts und bringt Glaubwürdigkeit — wir haben die unbequeme Stelle selbst benannt.\n\n" +
  "Der Punkt ist real: Die Bronze-Ablage enthält den vollen Vorgang mit allen 880 Attributen. " +
  "Die Schnittstelle selbst ist harmlos, die Rohdatenablage nicht."
);

// =============================================================== 7 Betrieb
s = pres.addSlide({ masterName: "KAPITEL", sectionTitle: "Die vier Fragen" });
s.addText("Frage 4 — Wie wird sauberer Betrieb gewährleistet?", { placeholder: "title" });
kreis(s, 0.7, 1.45, "4", P.accent1, "FFFFFF", 0.55);
s.addText("Eine Dateischnittstelle hat keine Quittung", {
  x: 1.45, y: 1.45, w: 11.1, h: 0.55, fontSize: 18, bold: true, color: P.accent5,
  valign: "middle", isTextBox: true, margin: 0 });
s.addText(
  "Holt SAP die Datei nicht ab, merkt es niemand. Heute fällt es auf, weil ein Mensch im " +
  "Prozess steht. Nach der Automatisierung fällt diese Sicherung weg — sie muss ersetzt werden.",
  { x: 1.45, y: 2.1, w: 11.1, h: 0.7, fontSize: 14, color: P.dk1, isTextBox: true, margin: 0 }
);
const bausteine = [
  ["Benannte Zuständigkeit", "fachlich und technisch, je mit Stellvertretung"],
  ["Betriebsanleitung", "eine Seite je Schnittstelle, nicht zwanzig"],
  ["Alarmierung mit Eskalation", "wer zuerst, wer danach, ab wann Störungsmeldung"],
  ["Klärfälle mit Bearbeiter", "ohne Zuständigkeit verschwinden die Fälle"],
  ["Abgleich statt Hoffnung", "wurde die Datei abgeholt, stimmt die Satzanzahl"],
];
bausteine.forEach(([kopf, text], i) => {
  const y = 3.0 + i * 0.73;
  kreis(s, 0.75, y + 0.06, String(i + 1), P.accent6, P.dk2, 0.42);
  s.addText(kopf, { x: 1.35, y, w: 3.7, h: 0.55, fontSize: 14, bold: true,
    color: P.dk1, valign: "middle", isTextBox: true, margin: 0 });
  s.addText(text, { x: 5.1, y, w: 7.5, h: 0.55, fontSize: 13, color: P.accent3,
    valign: "middle", isTextBox: true, margin: 0 });
});
s.addNotes(
  "Fünf Bausteine, nicht mehr. Jeder ersetzt etwas, das heute ein Mensch leistet.\n\n" +
  "Punkt 5 ist der Ersatz für die fehlende Quittung — monatlicher Abgleich der übertragenen " +
  "gegen die in SAP angekommenen Sätze. Das ist der Punkt, der die IT am meisten beruhigt."
);

// =============================================================== 8 Was schon läuft
pres.addSection({ title: "Nachweis" });
s = pres.addSlide({ masterName: "KAPITEL", sectionTitle: "Nachweis" });
s.addText("Neun Anforderungen sind schon umgesetzt", { placeholder: "title" });
s.addText("Belegmaterial, keine Absichtserklärung — jede Zeile hat eine Nachweisstelle im Code", {
  x: 0.7, y: 1.3, w: 11.9, h: 0.4, fontSize: 15, italic: true, color: P.accent3,
  isTextBox: true, margin: 0 });
const nachweis = [
  ["Keine Geheimnisse im Code", "Token aus dem Secret Scope"],
  ["Keine internen Pfade im Repository", "Konfiguration in .gitignore"],
  ["Keine personenbezogenen Daten in der Klärliste", "automatisierter Test"],
  ["Keine stillen Datenverluste", "Kodierungsfehler gehen in die Klärliste"],
  ["Keine halben Dateien für SAP", "atomare Ablage über temporären Namen"],
  ["Wiederholbarkeit ohne Datenverlust", "Status erst nach erfolgreicher Ablage"],
  ["Nachvollziehbare Änderungen", "Git mit Conventional Commits"],
  ["Prüfbare Codequalität", "40 Tests, Linter ohne Befund"],
  ["Dokumentierte Annahmen", "ANNAHME-Markierungen in der Konfiguration"],
];
s.addTable(
  nachweis.map(([a, b], i) => [
    { text: a, options: { fontSize: 12.5, color: P.dk1, bold: true,
        fill: { color: i % 2 ? "FFFFFF" : P.lt2 } } },
    { text: b, options: { fontSize: 12.5, color: P.accent3,
        fill: { color: i % 2 ? "FFFFFF" : P.lt2 } } },
  ]),
  { x: 0.7, y: 1.85, w: 11.9, colW: [6.2, 5.7], rowH: 0.46,
    border: { type: "solid", color: P.accent6, pt: 1 }, valign: "middle", margin: 0.12 }
);
s.addText(
  "Wir reden nicht über Governance, die entstehen soll — wir zeigen, was läuft.",
  { x: 0.7, y: 6.25, w: 11.9, h: 0.45, fontSize: 15, bold: true, color: P.accent4,
    isTextBox: true, margin: 0 }
);
s.addNotes(
  "Diese Folie ist der Glaubwürdigkeitsbeweis. Wenn jemand nachfragt, kann man die Stelle " +
  "im Code zeigen — Dateiname und Funktion stehen im Governance-Dokument, Anhang.\n\n" +
  "Nicht alle neun vorlesen. Zwei oder drei herausgreifen, die zum Gesprächsverlauf passen."
);

// =============================================================== 9 Drei Stufen
pres.addSection({ title: "Vorschlag" });
s = pres.addSlide({ masterName: "KAPITEL", sectionTitle: "Vorschlag" });
s.addText("Drei Ausbaustufen — Empfehlung: Stufe 1 jetzt", { placeholder: "title" });
const stufen = [
  { x: 0.7, kopf: "Stufe 1 · MVP", dauer: "zwei Wochen · ~4 Personentage",
    text: "Register, benannte Rollen mit Vertretung, technische Nutzer, Secrets im Key Vault, Betriebsanleitung, Klärfalladresse.",
    fuss: "Beantwortet alle vier Fragen nachweisbar.", akzent: P.accent4, grund: "E8F2EE", stark: true },
  { x: 4.75, kopf: "Stufe 2 · Belastbar", dauer: "drei bis sechs Monate",
    text: "Freigabeprozess, Überwachung mit Eskalation, Abgleich mit SAP, Berechtigungskonzept mit Jahresdurchsicht, Änderungsprozess, Trennung Test/Produktiv.",
    fuss: "Übersteht eine Prüfung.", akzent: P.accent1, grund: P.lt2 },
  { x: 8.8, kopf: "Stufe 3 · Zielbild", dauer: "ab etwa fünf Schnittstellen",
    text: "Automatisierte Rotation, Token-Inventar maschinell gegen das Register geprüft, Protokollauswertung, Leitplanken statt Einzelfreigaben.",
    fuss: "Skaliert ohne Mehraufwand je Strecke.", akzent: P.accent3, grund: P.lt2 },
];
stufen.forEach((st) => {
  const w = st.x > 8 ? 3.8 : 3.75;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: st.x, y: 1.4, w, h: 4.1, rectRadius: 0.06,
    fill: { color: st.grund }, line: { color: st.stark ? st.akzent : st.grund, width: st.stark ? 2 : 0 },
    objectName: `stufe_${st.kopf.slice(0, 8)}` });
  s.addText(st.kopf, { x: st.x + 0.3, y: 1.62, w: w - 0.6, h: 0.42, fontSize: 17, bold: true,
    color: st.akzent, margin: 0, isTextBox: true });
  s.addText(st.dauer, { x: st.x + 0.3, y: 2.04, w: w - 0.6, h: 0.35, fontSize: 12, bold: true,
    color: P.accent3, margin: 0, isTextBox: true });
  s.addText(st.text, { x: st.x + 0.3, y: 2.5, w: w - 0.6, h: 2.0, fontSize: 13, color: P.dk1,
    margin: 0, isTextBox: true, valign: "top" });
  s.addText(st.fuss, { x: st.x + 0.3, y: 4.85, w: w - 0.6, h: 0.45, fontSize: 11.5, italic: true,
    color: st.akzent, margin: 0, isTextBox: true });
});
s.addText(
  "Warum nicht alles sofort: Governance, die vor dem ersten Lauf vollständig sein soll, " +
  "verzögert den Lauf — und wird danach umgeschrieben, weil die Praxis andere Fragen stellt " +
  "als die Planung.",
  { x: 0.7, y: 5.75, w: 11.9, h: 0.8, fontSize: 14, color: P.dk1, isTextBox: true, margin: 0 }
);
s.addNotes(
  "Die Empfehlung ist nicht Bequemlichkeit, sondern Wirksamkeit. Stufe 2 entsteht an den " +
  "Stellen, an denen der Betrieb zeigt, wo es weh tut — nicht dort, wo die Planung es vermutet.\n\n" +
  "Falls Widerstand kommt ('warum nicht gleich Stufe 2'): Stufe 2 läuft parallel zum ersten " +
  "Produktivgang. Es geht nicht um ob, sondern um die Reihenfolge."
);

// =============================================================== 10 Rollen
s = pres.addSlide({ masterName: "KAPITEL", sectionTitle: "Vorschlag" });
s.addText("Rollen — drei vorhandene genügen, eine kommt dazu", { placeholder: "title" });
const rollen = [
  ["Product Owner", "Schnittstellen-Owner, fachlich", "Entscheidet über Felder und Mapping, zeichnet das Konzept, trägt die Entscheidung, wenn ein Feld entfällt.", P.accent1],
  ["Application Manager (IT)", "Technischer Betrieb", "Secrets, Überwachung, Wiederanlauf, Erneuerung der Token. Nimmt den technischen Teil ab.", P.accent1],
  ["Key User", "Fachliche Prüfung und Klärfälle", "Bearbeitet die Klärliste, nimmt die Datei fachlich ab, erkennt falsche Werte, die technisch plausibel sind.", P.accent1],
];
rollen.forEach(([rolle, funktion, text, farbe], i) => {
  const y = 1.35 + i * 1.07;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y, w: 11.9, h: 0.95, rectRadius: 0.05,
    fill: { color: P.lt2 }, line: { color: P.lt2, width: 0 }, objectName: `rolle_${i}` });
  s.addText(rolle, { x: 1.0, y: y + 0.10, w: 3.1, h: 0.38, fontSize: 14.5, bold: true,
    color: farbe, margin: 0, isTextBox: true });
  s.addText(funktion, { x: 1.0, y: y + 0.48, w: 3.1, h: 0.35, fontSize: 11.5, italic: true,
    color: P.accent3, margin: 0, isTextBox: true });
  s.addText(text, { x: 4.3, y: y + 0.14, w: 8.0, h: 0.68, fontSize: 13, color: P.dk1,
    margin: 0, isTextBox: true, valign: "middle" });
});
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 4.65, w: 11.9, h: 1.55, rectRadius: 0.05,
  fill: { color: "FBF3E6" }, line: { color: P.accent2, width: 2 }, objectName: "rolle_neu" });
s.addText("NEU · Integrationsverantwortlicher im Cluster", {
  x: 1.0, y: 4.82, w: 5.2, h: 0.4, fontSize: 14.5, bold: true, color: P.accent2,
  margin: 0, isTextBox: true });
s.addText("2–4 Stunden im Monat", { x: 1.0, y: 5.22, w: 5.2, h: 0.35, fontSize: 11.5,
  italic: true, color: P.accent3, margin: 0, isTextBox: true });
s.addText(
  "Pflegt das Register, wacht über die Standards, prüft neue Vorhaben gegen die " +
  "bestehenden. Ohne Pflegeverantwortung ist das Register nach sechs Monaten falsch — " +
  "und ein falsches Register ist schlimmer als keines.",
  { x: 6.4, y: 4.82, w: 5.9, h: 1.2, fontSize: 12.5, color: P.dk1, margin: 0,
    isTextBox: true, valign: "middle" }
);
s.addText(
  "Nicht vorgeschlagen: Integrations-Architekt, Schnittstellen-Gremium, eigenes Board.",
  { x: 0.7, y: 6.35, w: 11.9, h: 0.45, fontSize: 13, italic: true, color: P.accent3,
    isTextBox: true, margin: 0 }
);
s.addNotes(
  "Die zentrale Botschaft: Wir erfinden keine Rollenlandschaft. Drei bestehende Rollen " +
  "bekommen eine klare Zuordnung, eine kleine Rolle kommt dazu.\n\n" +
  "Zum falschen Register ergänzen: Es ist schlimmer als keines, weil es Vertrauen " +
  "erzeugt, das nicht gerechtfertigt ist. Genau dort entsteht die Schatten-IT.\n\n" +
  "Der letzte Satz ist wichtig — er zeigt, dass wir keine Bürokratie aufbauen wollen. " +
  "Das nimmt dem Gegenüber ein Standardargument. Bei zwei bis fünf Strecken erzeugt ein " +
  "Gremium mehr Abstimmung als Nutzen.\n\n" +
  "Zwei weitere Punkte, falls gefragt: Datenschutz ist ein Prozessschritt, keine neue Rolle. " +
  "Stellvertretung ist ein Eintrag im Register, keine Stelle."
);

// =============================================================== 11 Zusagen
pres.addSection({ title: "Entscheidung" });
s = pres.addSlide({ masterName: "KAPITEL_DUNKEL", sectionTitle: "Entscheidung" });
s.addText("Was wir heute entscheiden wollen", { placeholder: "title" });
const zusagen = [
  ["Technischer Nutzer und Key-Vault-Zugang für SK-001", "IT-Betrieb", "diese Woche"],
  ["Mitzeichnung durch Informationssicherheit und Datenschutz", "IS und DSB", "bis Monatsende"],
  ["Besetzung des Integrationsverantwortlichen", "Cluster", "diese Woche"],
];
zusagen.forEach(([text, wer, bis], i) => {
  const y = 1.75 + i * 1.3;
  kreis(s, 0.8, y + 0.22, String(i + 1), P.accent6, P.dk2, 0.6);
  s.addText(text, { x: 1.7, y: y + 0.05, w: 7.6, h: 0.95, fontSize: 17, bold: true,
    color: "FFFFFF", margin: 0, isTextBox: true, valign: "middle" });
  s.addText(wer, { x: 9.5, y: y + 0.12, w: 1.6, h: 0.4, fontSize: 13, color: P.accent6,
    margin: 0, isTextBox: true });
  s.addText(bis, { x: 9.5, y: y + 0.52, w: 2.9, h: 0.4, fontSize: 13, bold: true,
    color: P.accent2, margin: 0, isTextBox: true });
});
s.addText(
  "Das Konzept im Volltext: schnittstellenkonzept/GOVERNANCE.md",
  { x: 0.8, y: 6.4, w: 11.7, h: 0.4, fontSize: 12, italic: true, color: P.accent6,
    isTextBox: true, margin: 0 }
);
s.addNotes(
  "Drei konkrete Zusagen, jede mit Adressat und Termin. Nicht mehr — wer fünf Dinge " +
  "entscheiden soll, entscheidet keines.\n\n" +
  "Falls die Runde nicht entscheiden kann: Mindestens Punkt 1 festmachen, der blockiert " +
  "sonst den Probelauf. Punkte 2 und 3 können schriftlich nachgezogen werden."
);

// =============================================================== 12 Anhang
s = pres.addSlide({ masterName: "KAPITEL", sectionTitle: "Entscheidung" });
s.addText("Offene Punkte, die wir selbst benennen", { placeholder: "title" });
karte(s, { x: 0.7, y: 1.4, w: 5.8, h: 2.3, kopf: "Rohdatenablage",
  text: "Die Zwischenablage in Databricks enthält den vollständigen Vorgang, nicht nur die 16 Exportspalten. Berechtigungskonzept dafür steht noch aus.",
  fuss: "Eigener Strang, nicht Teil von SK-001.", grund: "FBF3E6", akzent: P.accent2 });
karte(s, { x: 6.8, y: 1.4, w: 5.8, h: 2.3, kopf: "Aufbewahrung",
  text: "EEG-relevante Daten unterliegen Aufbewahrungspflichten. Ein Löschkonzept muss das berücksichtigen — nicht pauschal nach 30 Tagen löschen.",
  fuss: "Abzustimmen mit Datenschutz und Billing.", grund: "FBF3E6", akzent: P.accent2 });
karte(s, { x: 0.7, y: 3.95, w: 5.8, h: 2.3, kopf: "Auftragsverarbeitung",
  text: "AV-Vertrag mit epilot als SaaS-Anbieter. Prüfpunkt für den Datenschutz, nicht für das Cluster.",
  fuss: "Status uns nicht bekannt.", grund: "FBF3E6", akzent: P.accent2 });
karte(s, { x: 6.8, y: 3.95, w: 5.8, h: 2.3, kopf: "Token-Erneuerung",
  text: "Ein Token, der um 2 Uhr nachts ausläuft, ist ein vermeidbarer Störfall. Erneuerung braucht Termin und Verantwortlichen.",
  fuss: "Teil von Stufe 1, Verantwortlicher offen.", grund: "FBF3E6", akzent: P.accent2 });
s.addNotes(
  "Diese Folie ist freiwillig und genau deshalb wirksam: Wer die unbequemen Stellen selbst " +
  "nennt, wird zu den übrigen Aussagen geglaubt.\n\n" +
  "Falls die Zeit knapp wird, kann die Folie als Pre-Read dienen und übersprungen werden."
);

// ---------------------------------------------------------------- schreiben
(async () => {
  await pres.writeFile({ fileName: "Governance_Schnittstellen.pptx" });
  if (applyTheme) await applyTheme("Governance_Schnittstellen.pptx", THEME);
  console.log("geschrieben: Governance_Schnittstellen.pptx");
})();
