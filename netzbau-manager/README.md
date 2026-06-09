# NetzBau Manager

Klickbarer Prototyp einer Software für das **Bauprojekt-Management bei
Verteilnetzbetreibern (VNB)** — von der Kabeltrasse über die Ortsnetzstation
bis zum Hausanschluss.

> Status: Interaktiver Prototyp mit realistischen Beispieldaten und einem
> schlanken Backend zur Persistenz. Ohne laufendes Backend arbeitet die App
> automatisch im Demo-Modus mit Seed-Daten (Änderungen nur lokal).

## Funktionsumfang (Prototyp)

- **Steuerungs-Cockpit** — proaktive Startseite: erklärbarer **Risiko-Score**
  je Maßnahme (Termin/Genehmigung/Budget/Kapazität), **nächste beste Aktionen**,
  Engpass-Analyse (Tiefbau-Auslastung, hängende Genehmigungen) und
  Netzanschluss-Frühindikatoren.
- **Netzanschluss-Cockpit** — Energiewende-Pipeline (PV, Wärmepumpe,
  E-Mobilität) mit **SLA-Ampel**, Fristen-Tracking, §14a-Kennzeichnung und
  Priorisierung (überfällige zuerst).
- **KI-Steuerungsassistent** — Chat über das Portfolio (Risiken, Genehmigungen,
  Budgets, Anschlüsse). Nutzt die **Claude-API** im Backend, mit
  regelbasiertem Fallback ohne API-Key.
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
  zentriert auf **Düsseldorf**:
  - Status-Pins an realen Standorten, Popup mit Sprung in die Detailansicht
  - **Trassenverläufe als Linien**, eingefärbt nach Spannungsebene
    (geplante Trassen gestrichelt)
  - **Amtliche NRW-Geobasisdaten** als WMS-Layer (Luftbild DOP, ALKIS-
    Liegenschaften von Geobasis NRW)
  - **Layer-Umschalter** (Basiskarten + ein-/ausblendbare Overlays)
  - **Status-Filter**, der Pins und Trassen synchron filtert
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

**Frontend:**

```bash
npm install
npm run dev      # Entwicklungsserver (http://localhost:5173)
npm run build    # Produktions-Build
npm run preview  # Build lokal ansehen
```

**Backend (für echte Persistenz):**

```bash
cd server
npm install
npm run dev      # API auf http://localhost:4000
```

Läuft das Backend, lädt das Frontend die Daten von der API und speichert
Änderungen (neue Maßnahmen, abgehakte Aufgaben). Ein Statuschip oben rechts
zeigt **„Backend"** (verbunden) bzw. **„Demo"** (Seed-Fallback). Die API-URL
lässt sich über `VITE_API_URL` überschreiben.

### Veröffentlichung

Schritt-für-Schritt-Anleitung zum Deployen (Frontend auf Vercel, Backend auf
Render mit persistenter Disk) in **[DEPLOY.md](./DEPLOY.md)**. Konfiguration
liegt bei: `vercel.json`, `render.yaml`, `.env.example`.

### API-Endpunkte

| Methode | Pfad | Zweck |
| --- | --- | --- |
| `GET` | `/api/massnahmen` | alle Maßnahmen |
| `GET` | `/api/massnahmen/:id` | eine Maßnahme |
| `POST` | `/api/massnahmen` | Maßnahme anlegen |
| `PATCH` | `/api/massnahmen/:id/aufgaben/:aId` | Aufgabe abhaken (Fortschritt wird neu berechnet) |
| `GET` | `/api/netzanschluesse` | alle Netzanschluss-Anträge |
| `POST` | `/api/assistent` | KI-Assistent (Claude, sonst Regel-Fallback) |

**KI-Assistent aktivieren:** Im Backend `ANTHROPIC_API_KEY` setzen (optional
`ASSISTANT_MODEL`, Standard `claude-opus-4-8`). Ohne Key antwortet der Assistent
regelbasiert direkt aus den Daten.

Persistenz: JSON-Datei (`server/data/db.json`), beim ersten Start aus den
Seed-Daten erzeugt.

## Technik

**Frontend:** React 18 · TypeScript · Vite · **Leaflet** (OpenStreetMap).
Bewusst ohne UI-Framework — ein eigenes, schlankes Designsystem in
`src/index.css`. Zustand/Datenzugriff über einen `StoreProvider`
(`src/data/store.tsx`) mit API-Anbindung und Seed-Fallback.

**Backend:** Node · Express · TypeScript (Ausführung via `tsx`, kein
Build-Schritt) mit JSON-Datei-Persistenz. Code unter `server/`.

Die Karte lädt OpenStreetMap-Kacheln zur Laufzeit im Browser (Internet
erforderlich). Beispieldaten sind im Versorgungsgebiet Düsseldorf verortet
(Flingern, Reisholz, Gerresheim, Eller, Garath, Oberkassel).

## Mögliche nächste Schritte

- Persistenz auf eine echte Datenbank (PostgreSQL/Prisma) statt JSON-Datei;
  Migrationen, Mehrbenutzer-Betrieb
- Vollständige Netztopologie als GeoJSON (alle Bestandsleitungen/-stationen,
  nicht nur Bauvorhaben)
- Gantt-Terminplanung mit Abhängigkeiten und Ressourcen
- Rollen-/Rechtekonzept (Bauleitung, Planung, Auftragnehmer)
- Schnittstellen zu GIS-, ERP- und Dokumentenmanagement-Systemen
