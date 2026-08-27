# VDE-Regelwerkszugänge automatisiert verwalten

Databricks-Job, der die Verwaltung der VDE-Regelwerkszugänge für Mitarbeiter
automatisiert: Er liest den **Soll-Zustand** aus einer SharePoint-Liste, vergleicht
ihn mit dem geführten **Ist-Bestand** und erzeugt eine priorisierte Aufgabenliste
inklusive fertiger Mail.

Das VDE-Portal bietet keine Schnittstelle. Anlegen und Entziehen bleiben deshalb
ein manueller Klick – aber ohne die Suche danach, wer eigentlich was braucht.

## Was der Job erkennt

| Aktion | Auslöser |
|---|---|
| **Zugang anlegen** | Mitarbeiter steht mit einem Regelwerk in SharePoint, hat aber keinen Zugang |
| **Zugang entziehen** | Mitarbeiter ausgeschieden oder als inaktiv geführt (Priorität HOCH) |
| **Zugang entziehen** | Austritt steht in den nächsten 30 Tagen an (terminierbar) |
| **Zugang entziehen** | Regelwerk steht nicht mehr im Soll – z. B. Abteilungswechsel |
| **Zugang verlängern** | Gültigkeit abgelaufen (HOCH) oder läuft in den nächsten 30 Tagen ab |
| **Manuell prüfen** | Verwaister Zugang: zur Personalnummer gibt es keinen Stammdatensatz |

Zusätzlich meldet der Lauf Datenqualitätsprobleme in der Liste: fehlende
Personalnummern, fehlende E-Mail-Adressen, doppelte Zeilen, Mitarbeiter ohne
Regelwerk, abgelaufene Soll-Einträge.

**Grundsatz:** Bei unklarer Datenlage wird nie still entzogen. Was nicht eindeutig
zuordenbar ist, landet als `PRÜFEN` auf der Liste.

## Aufbau

```
vde-zugangsverwaltung/
├── notebooks/vde_zugangsabgleich.py     Einstiegspunkt in Databricks
├── src/vde_zugang/
│   ├── modelle.py                       Datenmodelle + Normalisierung
│   ├── konfiguration.py                 Parameter, Spaltenzuordnung
│   ├── sharepoint.py                    Microsoft Graph (nur lesend)
│   ├── abgleich.py                      Kernlogik Soll/Ist  ← hier stehen die Regeln
│   ├── bestand.py                       Delta-Tabellen, Portal-Export
│   ├── bericht.py                       Markdown / HTML / CSV
│   ├── mail.py                          Versand über Graph oder SMTP
│   └── lauf.py                          Orchestrierung
├── tests/                               38 Tests, laufen ohne Databricks
├── scripts/demo_lokal.py                Vorschau mit Beispieldaten
└── resources/vde_zugangsabgleich_job.yml  Job-Definition (Asset Bundle)
```

## Einrichtung

### 1. SharePoint-Liste

Eine Zeile je Mitarbeiter. Erwartete Spalten (Namen sind im Notebook anpassbar):

| Spalte | Typ | Pflicht | Bemerkung |
|---|---|---|---|
| `Title` | Text | ja | Name des Mitarbeiters (erste Spalte heißt intern immer `Title`) |
| `Personalnummer` | Text | ja | eindeutiger Schlüssel |
| `EMail` | Text oder Person | ja | für die Anlage beim VDE |
| `Abteilung` | Text | nein | nur für den Bericht |
| `Status` | Auswahl | nein | `aktiv` / `ausgeschieden` – leer gilt als aktiv |
| `Austrittsdatum` | Datum | nein | steuert die Offboarding-Erkennung |
| `Regelwerke` | Mehrfachauswahl **oder** Text | ja | z. B. `VDE-AR-N-4100; VDE-0100` |
| `GueltigBis` | Datum | nein | leer = unbefristet |
| `Begruendung` | Text | nein | erscheint als Grund in der Aufgabenliste |
| `Kostenstelle` | Text | nein | |

Schreibweisen werden normalisiert: `vde ar n 4100`, `VDE_AR-N-4100` und
`VDE-AR-N-4100` gelten als dasselbe Regelwerk.

### 2. App-Registrierung in Entra ID

1. Neue App-Registrierung anlegen, Client Secret erzeugen.
2. Anwendungsberechtigung `Sites.Selected` (empfohlen) oder `Sites.Read.All`
   vergeben und Admin-Zustimmung erteilen.
3. Bei `Sites.Selected`: die App durch den SharePoint-Admin auf genau diese Site
   berechtigen (Leserecht genügt – der Job schreibt nie nach SharePoint).
4. Nur bei Mailversand über Graph: zusätzlich `Mail.Send`, sinnvollerweise über
   eine Application Access Policy auf ein einzelnes Absender-Postfach begrenzt.

### 3. Secrets in Databricks

```bash
databricks secrets create-scope vde-zugang

databricks secrets put-secret vde-zugang graph-tenant-id
databricks secrets put-secret vde-zugang graph-client-id
databricks secrets put-secret vde-zugang graph-client-secret

# nur bei SMTP-Versand:
databricks secrets put-secret vde-zugang smtp-host
databricks secrets put-secret vde-zugang smtp-benutzer
databricks secrets put-secret vde-zugang smtp-passwort
```

Im Code stehen keine Zugangsdaten.

### 4. Ist-Bestand befüllen

Der Job führt den Ist-Zustand selbst in `governance.vde_zugang.bestand`, weil das
VDE-Portal keine Abfrage anbietet. Zwei Wege für den Start:

* **Portal-Export** (empfohlen): CSV aus dem VDE-Portal in ein Unity-Catalog-Volume
  legen und den Pfad im Widget `portal_export_pfad` angeben. Die Spaltennamen werden
  tolerant erkannt (`Personalnummer`/`PersNr`/`employee_id`, `Regelwerk`/`Produkt`/`Lizenz`, …).
  Wird der Pfad gesetzt, gilt der Export als Wahrheit und ersetzt den Bestand.
* **Leer starten**: Der erste Lauf schlägt dann alle Zugänge als „anlegen" vor.
  Die bereits vorhandenen einmalig über `bestaetige_erledigte_massnahmen` einbuchen.

### 5. Erster Lauf

Notebook mit `dry_run = true` und `mail_versand = aus` starten. Es wird nichts
geschrieben und nichts versendet – der Bericht erscheint nur im Notebook.

Wenn die Liste plausibel aussieht: `dry_run = false`, Empfänger eintragen,
`mail_versand` auf `graph` oder `smtp` stellen.

### 6. Zeitplan

```bash
databricks bundle validate
databricks bundle deploy -t prod
```

Der Zeitplan (montags 07:00) ist in `resources/vde_zugangsabgleich_job.yml`
bewusst auf `PAUSED` gesetzt. Erst nach ein paar sauberen Läufen auf `UNPAUSED`.

## Der Arbeitsablauf danach

1. Montagmorgen kommt die Mail mit der Aufgabenliste (CSV im Anhang).
2. Aufgaben im VDE-Portal abarbeiten.
3. Bestand fortschreiben, sonst stehen dieselben Aufgaben nächste Woche wieder drin:

```python
from vde_zugang.lauf import bestaetige_erledigte_massnahmen
bestaetige_erledigte_massnahmen(spark, konfig, lauf_id="<Lauf-ID aus Schritt 4>")
```

Wer den Zwischenschritt nicht will, setzt `auto_bestaetigen = true`. Dann geht der
Job davon aus, dass die gemeldeten Aufgaben erledigt werden, und schreibt den
Bestand direkt fort. Bequemer, aber ungenauer: Vergessene Aufgaben fallen dann
nicht mehr auf. `PRÜFEN`-Einträge verändern den Bestand nie.

## Tabellen

| Tabelle | Inhalt |
|---|---|
| `governance.vde_zugang.bestand` | aktueller Ist-Bestand der Zugänge |
| `governance.vde_zugang.massnahmen` | Protokoll je Lauf: was wann vorgeschlagen wurde |

## Entwicklung

```bash
python3 -m unittest discover -s tests -v   # 38 Tests, ohne Databricks/Spark
python3 scripts/demo_lokal.py              # Vorschau mit Beispieldaten
python3 scripts/demo_lokal.py --html > vorschau.html
```

Die Fachlogik in `abgleich.py`, `bericht.py` und `modelle.py` ist reines Python
ohne Spark- und Netzwerkabhängigkeit und damit vollständig lokal testbar.

## Grenzen

* **Kein Auto-Provisioning.** Ohne VDE-API bleibt der Portal-Klick manuell.
  Falls der VDE später eine Schnittstelle anbietet: `bestand.py` und `lauf.py`
  sind die einzigen Stellen, die dafür angefasst werden müssen.
* **Der Ist-Bestand ist nur so gut wie seine Pflege.** Regelmäßig gegen einen
  Portal-Export abgleichen.
* **Personenbezogene Daten.** Bestand und Protokoll enthalten Name, Personalnummer
  und E-Mail. Zugriff auf das Schema entsprechend über Unity Catalog einschränken
  und die Aufbewahrungsdauer mit dem Datenschutz abstimmen.
