# SWITCHBOARD — Übersicht Schalt- & Stellmaßnahmen

Eigenständiger Prototyp einer zentralen Übersicht aller **Schalt- und
Stellmaßnahmen** im Netz — angelehnt an das Konzept von *Lovion SWITCHBOARD*.
Reines HTML/CSS/JS, keine Abhängigkeiten, kein Build.

## Starten

`index.html` im Browser öffnen. Fertig.
(Optional lokaler Server: `python3 -m http.server` im Ordner, dann
`http://localhost:8000`.)

## Funktionen

- **Zentrale Übersicht** aller aktiven Maßnahmen als Tabelle mit KPI-Leiste
  (aktive Maßnahmen, in Durchführung, aktive Störungen inkl. betroffener
  Kunden, geplant/freigegeben, Archivbestand).
- **Geplant & Störung** in einer Ansicht: Kategorie-Filter und ein
  **Störungsmodus**, der Maßnahmen unter Störungsbedingungen hervorhebt und
  planmäßige Maßnahmen zurücktreten lässt.
- **Interaktive Filter**: Freitextsuche (ID, Betriebsmittel, Verantwortliche),
  Kategorie, Status, Netzebene (NS/MS/HS) — kombinierbar, mit Ergebniszähler.
- **Sortierung** über alle Spalten (Klick auf die Spaltenüberschrift).
- **Detailansicht** je Maßnahme mit Stammdaten und **Schaltschritten**
  (erledigt / aktiv / offen).
- **Konfigurierbare Reports**: Spaltenauswahl, Export als **CSV** (Excel-fähig,
  `;`-getrennt) oder **Druckansicht** — jeweils auf Basis der aktiven Filter.
- **Archiv**: abgeschlossene Maßnahmen in eigenem Tab, für Auswertungen
  verfügbar.

## Dateien

| Datei        | Inhalt                                             |
|--------------|----------------------------------------------------|
| `index.html` | Struktur (Topbar, KPIs, Filter, Tabelle, Dialoge)  |
| `style.css`  | Dark-Theme, Badges, Drawer, Report-Modal, Print    |
| `app.js`     | Demo-Datensatz + Filter-/Sortier-/Report-Logik     |

> Hinweis: Der Datensatz ist beispielhaft. Für den Produktivbetrieb würde die
> Tabelle aus dem Netzleitsystem / einer Maßnahmen-API gespeist.
