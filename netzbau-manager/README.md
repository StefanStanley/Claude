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
- **Netzkarte** — schematische geografische Verortung aller Baustellen mit
  Status-Pins (Platzhalter für eine spätere GIS-/WebMap-Anbindung).
- **Neue Maßnahme** — Anlage-Dialog.
- Bereiche *Terminplan*, *Dokumente* und *Berichte* sind als nächste
  Ausbaustufen angedeutet.

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

React 18 · TypeScript · Vite. Bewusst ohne UI-Framework — ein eigenes,
schlankes Designsystem in `src/index.css`.

## Mögliche nächste Schritte

- Backend & Persistenz (z. B. FastAPI/PostgreSQL oder Node/Prisma)
- Echte Kartenintegration (Leaflet/MapLibre + Geodaten der Netztopologie)
- Gantt-Terminplanung mit Abhängigkeiten und Ressourcen
- Rollen-/Rechtekonzept (Bauleitung, Planung, Auftragnehmer)
- Schnittstellen zu GIS-, ERP- und Dokumentenmanagement-Systemen
