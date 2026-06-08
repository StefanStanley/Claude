# NetzBau Manager

Klickbarer Prototyp einer Software für das **Bauprojekt-Management bei
Verteilnetzbetreibern (VNB)** — von der Kabeltrasse über die Ortsnetzstation
bis zum Hausanschluss.

> Status: Interaktiver UI-Prototyp mit realistischen Beispieldaten.
> Es gibt noch kein Backend; Eingaben werden nicht dauerhaft gespeichert.

## Funktionsumfang (Prototyp)

- **Dashboard** — Kennzahlen (aktive Maßnahmen, Budgetvolumen, kritische
  Vorhaben, fällige Meilensteine), laufende Bauausführung, Aktivitätsfeed und
  anstehende Meilensteine.
- **Maßnahmen** — Liste aller Baumaßnahmen als **Tabelle** oder **Kanban-Board**
  (gegliedert nach Statusphasen: Planung → Genehmigung → Ausschreibung → Bau →
  Abnahme → Abgeschlossen), mit Filtern.
- **Maßnahmen-Detail** — Stammdaten, Fortschritt, Budget/Ausgaben, Bauzeitraum,
  Meilenstein-Timeline, abhakbare **Aufgaben & Gewerke**, Genehmigungen,
  Projektbeteiligte und Dokumente.
- **Netzkarte** — echte Open-Source-Karte (**Leaflet + OpenStreetMap**),
  zentriert auf **Düsseldorf**, mit Status-Pins an realen Standorten;
  Popup je Baustelle mit Sprung in die Detailansicht.
- **Terminplan** — Gantt-Bauzeitenplan über alle Maßnahmen: Balken nach
  Statusphase, Fortschrittsfüllung, Meilenstein-Rauten und Heute-Linie.
- **Ressourcen & Gewerke** — Bindung von Tiefbaufirmen und Bauleitung über
  die Maßnahmen, mit Parallelauslastung und Zeitspur.
- **Dokumente** — zentrale Ablage aller Pläne, Verträge, Fotos, Berichte und
  Genehmigungen mit Typfilter und Suche.
- **Berichte & Kennzahlen** — Budget vs. Ausgaben, Statusverteilung,
  Maßnahmen nach Art, Budget nach Gemeinde und Auslastung der Tiefbaufirmen.
- **Neue Maßnahme** — Anlage-Dialog.

## Fachlicher Hintergrund

Das Datenmodell (`src/data/types.ts`) bildet typische VNB-Begriffe ab:
Sparten, Spannungsebenen, Maßnahmenarten, Genehmigungen (z. B.
Aufgrabungs­genehmigung, Kreuzungsvereinbarung), Gewerke (Tiefbau,
Elektromontage, Abnahme) sowie Beteiligte (Bauleitung VNB, Tiefbaufirma,
Monteure).

## Starten

```bash
npm install
npm run dev      # Entwicklungsserver (http://localhost:5173)
npm run build    # Produktions-Build
npm run preview  # Build lokal ansehen
```

## Technik

React 18 · TypeScript · Vite · **Leaflet** (OpenStreetMap). Bewusst ohne
UI-Framework — ein eigenes, schlankes Designsystem in `src/index.css`.

Die Karte lädt OpenStreetMap-Kacheln zur Laufzeit im Browser (Internet
erforderlich). Beispieldaten sind im Versorgungsgebiet Düsseldorf verortet
(Flingern, Reisholz, Gerresheim, Eller, Garath, Oberkassel).

## Mögliche nächste Schritte

- Backend & Persistenz (z. B. FastAPI/PostgreSQL oder Node/Prisma)
- Netztopologie auf der Karte (Trassen/Leitungen als Linien, GeoJSON-Layer,
  ggf. amtliche Geobasisdaten NRW / OpenStreetMap-Overpass)
- Gantt-Terminplanung mit Abhängigkeiten und Ressourcen
- Rollen-/Rechtekonzept (Bauleitung, Planung, Auftragnehmer)
- Schnittstellen zu GIS-, ERP- und Dokumentenmanagement-Systemen
