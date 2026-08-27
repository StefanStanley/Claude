# VDE-Regelwerkszugänge automatisiert verwalten

Databricks-Job, der die Verwaltung der VDE-Regelwerkszugänge übernimmt: Er liest den
**Soll-Zustand** aus einer SharePoint-Liste, den **Ist-Zustand** direkt aus der
VDE Normenbibliothek, und setzt die Differenz dort selbst um — Zugänge anlegen,
entziehen, verlängern.

Die Normenbibliothek hat keine Schnittstelle. Der Job bedient deshalb die
Administrationsoberfläche im Browser, so wie ein Mensch es täte, nur zuverlässiger
und protokolliert.

## Was der Job tut

| Aktion | Auslöser |
|---|---|
| **Zugang anlegen** | Mitarbeiter steht mit einem Regelwerk in SharePoint, hat aber keinen Zugang |
| **Zugang entziehen** | Mitarbeiter ausgeschieden oder als inaktiv geführt |
| **Zugang entziehen** | Austritt steht in den nächsten 30 Tagen an |
| **Zugang entziehen** | Regelwerk steht nicht mehr im Soll – z. B. Abteilungswechsel |
| **Zugang verlängern** | Gültigkeit abgelaufen oder läuft in den nächsten 30 Tagen ab |
| **Manuell prüfen** | Verwaister Zugang: zur Personalnummer gibt es keinen Stammdatensatz |

Prüffälle werden **nie** automatisch ausgeführt. Unklare Datenlage bleibt Menschensache.

Nach jeder Aktion liest der Job den Zustand frisch aus dem Portal und vergleicht ihn
mit der Erwartung. „Knopf gedrückt" gilt nicht als Nachweis.

## Die Notbremse

Eine Automatisierung, die Zugänge entziehen kann, braucht Grenzen. Wenn die
SharePoint-Liste kaputt ist — leer geladen, Spalte umbenannt, Import halb
durchgelaufen — sieht der Abgleich das als „niemand braucht mehr etwas".

Der Lauf stoppt vollständig, bevor er irgendetwas ändert, wenn:

* mehr als **10 Entzüge** in einem Lauf anstehen,
* mehr als **40 Änderungen** insgesamt anstehen,
* oder mehr als **30 %** des Bestands entzogen werden sollen (erst ab 20 Zugängen —
  bei fünf Lizenzen sind zwei Entzüge 40 % und trotzdem normal).

Alle drei Grenzen sind Job-Parameter. Löst die Notbremse aus, geht eine Mail mit dem
Grund raus und es passiert nichts.

## Zwei Betriebsarten

| Modus | Ist-Zustand | Portal |
|---|---|---|
| `browser` | direkt aus dem Portal gelesen | wird bedient |
| `aufgabenliste` | aus der Delta-Tabelle | nur Meldung per Mail |

`aufgabenliste` ist der Rückfall, solange die Selektoren nicht eingerichtet sind oder
wenn das Portal nicht erreichbar ist. Der Abgleich funktioniert in beiden Modi gleich.

## Aufbau

```
vde-zugangsverwaltung/
├── notebooks/vde_zugangsabgleich.py     Einstiegspunkt in Databricks
├── src/vde_zugang/
│   ├── modelle.py                       Datenmodelle + Normalisierung
│   ├── konfiguration.py                 Parameter, Spaltenzuordnung
│   ├── sharepoint.py                    Microsoft Graph (nur lesend)
│   ├── abgleich.py                      Kernlogik Soll/Ist  ← hier stehen die Regeln
│   ├── portal/
│   │   ├── basis.py                     Adapter-Schnittstelle
│   │   ├── normenbibliothek.py          Browser-Automatisierung (Playwright)
│   │   ├── selektoren.py                alle Ortsangaben zum Portal  ← hier korrigieren
│   │   └── ausfuehrung.py               Reihenfolge, Wiederholung, Notbremse
│   ├── bestand.py                       Delta-Tabellen
│   ├── bericht.py                       Markdown / HTML / CSV
│   ├── mail.py                          Versand über Graph oder SMTP
│   └── lauf.py                          Orchestrierung
├── tests/
│   ├── fake_portal.py                   Portal-Double zum Testen
│   └── test_*.py                        58 Tests
├── scripts/selektoren_erkunden.py       ermittelt die echten Portal-Selektoren
└── resources/
    ├── init_playwright.sh               Cluster-Init-Script für Chromium
    └── vde_zugangsabgleich_job.yml      Job-Definition (Asset Bundle)
```

## Einrichtung

### 1. SharePoint-Liste

Eine Zeile je Mitarbeiter. Erwartete Spalten (Namen sind im Notebook anpassbar):

| Spalte | Typ | Pflicht | Bemerkung |
|---|---|---|---|
| `Title` | Text | ja | Name (erste Spalte heißt intern immer `Title`) |
| `Personalnummer` | Text | ja | eindeutiger Schlüssel, muss zum Portal passen |
| `EMail` | Text oder Person | ja | für die Anlage beim VDE |
| `Abteilung` | Text | nein | nur für den Bericht |
| `Status` | Auswahl | nein | `aktiv` / `ausgeschieden` – leer gilt als aktiv |
| `Austrittsdatum` | Datum | nein | steuert die Offboarding-Erkennung |
| `Regelwerke` | Mehrfachauswahl **oder** Text | ja | z. B. `VDE-AR-N-4100; VDE-0100` |
| `GueltigBis` | Datum | nein | leer = unbefristet |
| `Begruendung` | Text | nein | erscheint als Grund im Bericht |

Schreibweisen werden normalisiert: `vde ar n 4100`, `VDE_AR-N-4100` und
`VDE-AR-N-4100` gelten als dasselbe Regelwerk.

**Wichtig:** Die Personalnummer ist der Schlüssel zwischen Liste und Portal. Wenn im
Portal keine Personalnummer gepflegt ist, wird über die E-Mail-Adresse zugeordnet —
dann muss die stimmen.

### 2. App-Registrierung in Entra ID (SharePoint)

1. App-Registrierung anlegen, Client Secret erzeugen.
2. Anwendungsberechtigung `Sites.Selected` (empfohlen) oder `Sites.Read.All`,
   Admin-Zustimmung erteilen.
3. Bei `Sites.Selected`: App durch den SharePoint-Admin auf diese Site berechtigen
   (Leserecht genügt – der Job schreibt nie nach SharePoint).
4. Nur bei Mailversand über Graph: zusätzlich `Mail.Send`, per Application Access
   Policy auf ein einzelnes Absender-Postfach begrenzt.

### 3. Portal-Zugang

Ein Administratorkonto der Normenbibliothek. Empfehlenswert ist ein eigenes
technisches Konto statt eines persönlichen — dann ist im Portal-Protokoll erkennbar,
was automatisiert passiert ist, und ein Personalwechsel legt die Automatisierung
nicht lahm.

### 4. Secrets in Databricks

```bash
databricks secrets create-scope vde-zugang

databricks secrets put-secret vde-zugang graph-tenant-id
databricks secrets put-secret vde-zugang graph-client-id
databricks secrets put-secret vde-zugang graph-client-secret

databricks secrets put-secret vde-zugang portal-benutzer
databricks secrets put-secret vde-zugang portal-passwort

# nur bei SMTP-Versand:
databricks secrets put-secret vde-zugang smtp-host
databricks secrets put-secret vde-zugang smtp-benutzer
databricks secrets put-secret vde-zugang smtp-passwort
```

Im Code stehen keine Zugangsdaten.

### 5. Portal-Selektoren ermitteln

Das ist der einzige Schritt, der Handarbeit braucht — und der einzige, der nach einem
Portal-Update wiederholt werden muss. Alle Ortsangaben liegen in **einer** Datei;
die Ablauflogik wird davon nicht berührt.

```bash
python3 scripts/selektoren_erkunden.py \
    --url https://portal-der-normenbibliothek.de \
    --benutzer admin@firma.de \
    --passwort '...' \
    --sichtbar \
    --ausgabe selektoren.json
```

Das Skript meldet sich an, läuft Anmeldung, Benutzerübersicht und Anlegen-Formular ab
und schlägt für jedes Feld Kandidaten vor — stabile Merkmale (`id`, `name`,
`data-*`) zuerst, weil CSS-Klassen sich mit jedem Update ändern. Was es nicht findet,
listet es am Ende auf. Diese Felder von Hand ergänzen (Rechtsklick → Untersuchen im
Browser), typischerweise die Zellenselektoren und die beiden Vorlagen:

```json
{
  "auswahl_regelwerk": "input[data-regelwerk=\"{regelwerk}\"]",
  "knopf_regelwerk_entziehen": "tr[data-pnr=\"{personalnummer}\"] button[data-loeschen]"
}
```

In `{regelwerk}`, `{personalnummer}` und `{email}` setzt die Automatisierung die
jeweiligen Werte ein. **Der Entzugsknopf muss auf die Zeile eingegrenzt sein** —
sonst trifft er die falsche Person. Genau dafür gibt es einen Test.

Die fertige JSON-Datei in ein Unity-Catalog-Volume legen und den Pfad im Widget
`selektoren_pfad` eintragen. Fehlt ein Pflichtfeld, verweigert der Job den Start mit
einer Liste der offenen Felder — statt stillschweigend nichts zu tun.

### 6. Chromium auf dem Cluster

`resources/init_playwright.sh` in ein Volume legen und am Job-Cluster als Init-Script
eintragen (Compute → Advanced options → Init Scripts). Ohne das installiert das
Notebook den Browser bei jedem Lauf neu.

Der Cluster braucht ausgehenden Netzzugang zum Portal. Bei einem gesperrten
Workspace muss der Netzwerk-Admin die Portal-Domäne freigeben.

### 7. Inbetriebnahme in drei Stufen

| Stufe | `portal_modus` | `dry_run` | Was passiert |
|---|---|---|---|
| 1 | `aufgabenliste` | `true` | nur der Abgleich, nichts wird angefasst |
| 2 | `browser` | `true` | Portal wird **gelesen**, nichts geändert |
| 3 | `browser` | `false` | Echtbetrieb |

Stufe 2 ist die wichtige: Erst wenn der gelesene Ist-Bestand mit dem übereinstimmt,
was im Portal tatsächlich steht, darf geschrieben werden. Stimmt er nicht, sind die
Zellenselektoren falsch — nicht die Logik.

### 8. Zeitplan

```bash
databricks bundle validate
databricks bundle deploy -t prod
```

Der Zeitplan (montags 07:00) steht in `resources/vde_zugangsabgleich_job.yml` und ist
bewusst auf `PAUSED`.

## Was bei Fehlern passiert

* **Eine Aktion schlägt fehl** → einmal wiederholt, dann als `FEHLER` protokolliert,
  mit Screenshot. Der Rest des Laufs läuft weiter.
* **Portal nicht erreichbar oder Login abgelehnt** → Lauf bricht ab, Mail mit Grund.
  Es wird nichts halb erledigt.
* **Ein Selektor greift nicht** → Klartext-Meldung, welches Element fehlt.
  Meist hat sich das Portal geändert: `selektoren_erkunden.py` neu laufen lassen.
* **Notbremse** → nichts wird geändert, Mail nennt den Grund.

Screenshots landen im konfigurierten Volume-Pfad und sind im Bericht verlinkt.

## Tabellen

| Tabelle | Inhalt |
|---|---|
| `governance.vde_zugang.bestand` | Ist-Bestand nach dem letzten Lauf |
| `governance.vde_zugang.massnahmen` | je Lauf und Maßnahme: was wurde versucht, mit welchem Ergebnis, wie lange |

Die Maßnahmen-Tabelle ist der Nachweis gegenüber Lizenzgeber und Revision.

## Entwicklung

```bash
python3 -m unittest discover -s tests -v   # alle Tests
python3 -m unittest tests.test_abgleich    # nur Fachlogik, ohne Browser
python3 scripts/demo_lokal.py              # Vorschau mit Beispieldaten
python3 tests/fake_portal.py               # Portal-Double auf localhost:8799
```

Die Browser-Tests laufen gegen `tests/fake_portal.py` — ein Portal-Double, das die
Bedienschritte der Normenbibliothek nachbildet: anmelden, Benutzerliste, anlegen,
entziehen mit Sicherheitsabfrage, Gültigkeit ändern. Damit ist die Automatisierung
vollständig geprüft, ohne das echte Portal anzufassen. Beim Umstellen auf neue
Selektoren bleibt dieser Test die Referenz.

Die Fachlogik (`abgleich.py`, `bericht.py`, `modelle.py`) ist reines Python ohne
Spark-, Browser- und Netzwerkabhängigkeit.

## Grenzen

* **Das Portal kann sich ändern.** Dann greifen Selektoren nicht mehr. Der Job meldet
  das im Klartext und ändert nichts — aber jemand muss `selektoren.json` nachziehen.
  Realistisch ein- bis zweimal im Jahr.
* **Automatisierte Anmeldung.** Ob ein technisches Konto und automatisierter Zugriff
  vom Lizenzvertrag gedeckt sind, ist eine Frage an den Vertrag, nicht an die Technik.
  Vor dem Echtbetrieb kurz klären.
* **Personenbezogene Daten.** Bestand und Protokoll enthalten Name, Personalnummer
  und E-Mail. Zugriff auf das Schema über Unity Catalog einschränken, Aufbewahrungs-
  dauer mit dem Datenschutz abstimmen.
* **Kommt später eine API**, ist nur ein neuer Adapter neben `normenbibliothek.py`
  nötig. Abgleich, Notbremse, Bericht und Protokoll bleiben unverändert.
