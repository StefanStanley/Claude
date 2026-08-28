# Umzug nach Databricks — Schritt für Schritt

Runbook für die Inbetriebnahme im Workspace. Von leerem Workspace bis zum
laufenden Wochenjob.

**Realistischer Gesamtaufwand:** 2–3 Arbeitstage verteilt über 2–3 Wochen.
Die Wartezeit entsteht nicht bei der Technik, sondern bei zwei Dingen:
der Netzwerkfreigabe und der Bereinigung der SharePoint-Liste. Beides
gehört deshalb in Phase 0 angestoßen.

---

## Phase 0 — Anstoßen, was Vorlauf braucht (Tag 1, 1 Stunde)

Drei Anträge, die nicht von dir abhängen. Sie laufen parallel zu allem anderen.

| Was | An wen | Was genau |
|---|---|---|
| Ausgehender Netzzugang vom Databricks-Cluster zur Portal-Domäne | Netzwerk-Admin | HTTPS/443 zur Domäne der Normenbibliothek. Bei Azure: NSG bzw. Firewall-Regel für das Workspace-Subnetz |
| App-Registrierung in Entra ID mit `Sites.Selected` | Entra-ID-Admin | Anwendungsberechtigung + Admin-Zustimmung. Client Secret mit Ablaufdatum notieren |
| Freigabe der App auf die SharePoint-Site | SharePoint-Admin | Leserecht auf genau die eine Site (`Sites.Selected` wirkt erst dadurch) |

Parallel selbst entscheiden:

- **Katalog und Schema.** Vorschlag: `governance.vde_zugang`. Wenn es einen
  Katalog für Verwaltungsdaten gibt, gehört es dorthin.
- **Dienstkonto für den Job.** Ein Service Principal, nicht dein Benutzer.
  Sonst steht der Job still, sobald du das Unternehmen verlässt oder dein
  Passwort rotiert.
- **Portal-Administratorkonto.** Ein eigenes technisches Konto in der
  Normenbibliothek. Damit ist im Portal-Protokoll erkennbar, was automatisiert
  passiert ist.
- **Vertragsfrage klären:** Ist automatisierter Zugriff mit einem technischen
  Konto vom VDE-Lizenzvertrag gedeckt? Das ist eine Frage an den Einkauf oder
  die Rechtsabteilung, nicht an die IT. Antwort abwarten, bevor Phase 7 läuft.

---

## Phase 1 — Grundgerüst im Workspace (Tag 1, 45 Minuten)

### 1.1 Repository als Git-Ordner einbinden

Workspace → **Repos** → *Add Repo* → URL des Repositories, Branch
`claude/databricks-vde-automation-fio1f9`.

Alternativ über die CLI:

```bash
databricks repos create \
  --url https://github.com/<owner>/<repo> \
  --provider gitHub \
  --path /Workspace/Repos/vde-zugangsverwaltung
```

**Abnahme:** Der Ordner `vde-zugangsverwaltung/notebooks/` ist im Workspace sichtbar.

### 1.2 Katalog, Schema und Volumes anlegen

In einem beliebigen Notebook oder im SQL-Editor:

```sql
CREATE CATALOG IF NOT EXISTS governance;
CREATE SCHEMA  IF NOT EXISTS governance.vde_zugang
  COMMENT 'Verwaltung der VDE-Regelwerkszugaenge';

CREATE VOLUME IF NOT EXISTS governance.vde_zugang.konfig
  COMMENT 'Selektoren und Init-Script';
CREATE VOLUME IF NOT EXISTS governance.vde_zugang.screenshots
  COMMENT 'Screenshots fehlgeschlagener Portal-Aktionen';
```

### 1.3 Berechtigungen setzen

Das Schema enthält Name, Personalnummer und E-Mail von Mitarbeitern.
Der Zugriff gehört eng gefasst — das ist keine Formalie, sondern der Grund,
warum der Datenschutzbeauftragte später zustimmen kann.

```sql
GRANT USE CATALOG ON CATALOG governance TO `<dienstkonto>`;
GRANT USE SCHEMA, CREATE TABLE, MODIFY, SELECT
  ON SCHEMA governance.vde_zugang TO `<dienstkonto>`;
GRANT READ VOLUME, WRITE VOLUME
  ON VOLUME governance.vde_zugang.konfig TO `<dienstkonto>`;
GRANT READ VOLUME, WRITE VOLUME
  ON VOLUME governance.vde_zugang.screenshots TO `<dienstkonto>`;

-- Lesezugriff für dich als Verantwortlichen
GRANT SELECT ON SCHEMA governance.vde_zugang TO `<deine-mailadresse>`;
```

**Abnahme:** `SELECT * FROM governance.vde_zugang.INFORMATION_SCHEMA.TABLES;`
läuft ohne Fehler durch.

---

## Phase 2 — Zugangsdaten hinterlegen (Tag 1, 20 Minuten)

Nichts davon gehört in den Code oder in ein Notebook.

```bash
databricks secrets create-scope vde-zugang

# SharePoint / Microsoft Graph
databricks secrets put-secret vde-zugang graph-tenant-id
databricks secrets put-secret vde-zugang graph-client-id
databricks secrets put-secret vde-zugang graph-client-secret

# VDE Normenbibliothek
databricks secrets put-secret vde-zugang portal-benutzer
databricks secrets put-secret vde-zugang portal-passwort

# nur bei SMTP-Versand
databricks secrets put-secret vde-zugang smtp-host
databricks secrets put-secret vde-zugang smtp-benutzer
databricks secrets put-secret vde-zugang smtp-passwort
```

Lesezugriff für das Dienstkonto:

```bash
databricks secrets put-acl vde-zugang <dienstkonto> READ
```

**Abnahme:** In einem Notebook liefert
`dbutils.secrets.get("vde-zugang", "graph-tenant-id")` einen Wert
(er wird als `[REDACTED]` angezeigt — das ist richtig so).

> **Ablaufdatum notieren.** Client Secrets in Entra ID laufen ab, meist nach
> 12 oder 24 Monaten. Trage dir den Termin jetzt in den Kalender ein.
> Ein abgelaufenes Secret ist die häufigste Ursache, wenn ein solcher Job
> nach einem Jahr plötzlich stillsteht.

---

## Phase 3 — Cluster mit Browser (Tag 1, 45 Minuten)

**Serverless scheidet aus.** Der Job braucht Chromium samt Systembibliotheken;
Serverless-Compute lässt weder Init-Scripts noch `apt`-Installationen zu.
Es wird ein klassischer Single-Node-Job-Cluster.

### 3.1 Init-Script ins Volume legen

```bash
databricks fs cp resources/init_playwright.sh \
  dbfs:/Volumes/governance/vde_zugang/konfig/init_playwright.sh
```

### 3.2 Cluster anlegen

Compute → *Create Cluster*:

| Einstellung | Wert |
|---|---|
| Policy | Unrestricted (oder eine Policy, die Init-Scripts erlaubt) |
| Cluster-Modus | Single Node |
| Databricks Runtime | 15.4 LTS |
| Zugriffsmodus | Single User → das Dienstkonto |
| Knotentyp | Azure `Standard_DS3_v2` · AWS `m5d.large` · GCP `n2-standard-4` |
| Init-Script | Volume → `/Volumes/governance/vde_zugang/konfig/init_playwright.sh` |
| Umgebungsvariable | `PLAYWRIGHT_BROWSERS_PATH=/opt/playwright` |
| Auto-Terminierung | 20 Minuten |

Der Browser braucht Arbeitsspeicher. Unter 14 GB wird es eng, sobald die
Benutzerliste mehrere hundert Zeilen hat.

### 3.3 Rauchtest

Neues Notebook am Cluster:

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    seite = b.new_page()
    seite.goto("https://<portal-domaene>")
    print("Titel:", seite.title())
    b.close()
```

**Abnahme:** Der Seitentitel der Normenbibliothek erscheint.

Erscheint stattdessen ein Timeout, ist die Netzwerkfreigabe aus Phase 0 noch
nicht durch — nicht der Cluster ist schuld. Startet Chromium gar nicht, hat das
Init-Script nicht gegriffen: Cluster-Ereignisprotokoll → *Init script logs*.

---

## Phase 4 — SharePoint-Anbindung und Datenqualität (Tag 2–8)

Das ist die Phase, die in der Praxis am längsten dauert. Nicht wegen der
Technik, sondern weil die gewachsene Liste selten so sauber ist, wie man denkt.

### 4.1 Liste auf die erwarteten Spalten bringen

Siehe Tabelle in der [README](../README.md#1-sharepoint-liste). Entscheidend
sind `Personalnummer`, `EMail`, `Regelwerke` und `Austrittsdatum`.

Die Personalnummer ist der Schlüssel zwischen Liste und Portal. Ist sie im
Portal nicht gepflegt, wird über die E-Mail-Adresse zugeordnet — dann muss die
auf beiden Seiten identisch sein.

### 4.2 Ersten Lauf als reinen Lesetest fahren

Notebook `vde_zugangsabgleich` am Cluster starten mit:

| Widget | Wert |
|---|---|
| `portal_modus` | `aufgabenliste` |
| `dry_run` | `true` |
| `mail_versand` | `aus` |

Es wird nichts geschrieben, nichts versendet, das Portal nicht angefasst.

### 4.3 Abschnitt 6 des Notebooks abarbeiten

Dort stehen die Datenqualitäts-Hinweise: fehlende Personalnummern, fehlende
E-Mail-Adressen, doppelte Zeilen, Mitarbeiter ohne Regelwerk, abgelaufene
Soll-Einträge.

**Abnahme:** Die Warnliste ist leer oder jeder verbleibende Eintrag ist bewusst
so gewollt und dokumentiert. Erst dann weiter.

Diesen Schritt nicht abkürzen. Jede Unsauberkeit hier wird später zu einer
Aktion im Portal.

---

## Phase 5 — Portal-Selektoren ermitteln (Tag 8, 1–2 Stunden)

Der einzige Schritt mit echter Handarbeit — und der einzige, der nach einem
Portal-Update wiederholt werden muss.

**Auf dem eigenen Rechner ausführen, nicht auf dem Cluster.** Mit `--sichtbar`
öffnet sich ein Browserfenster, in dem du mitverfolgst, was passiert.

```bash
pip install playwright && playwright install chromium

python3 scripts/selektoren_erkunden.py \
    --url https://<portal-domaene> \
    --benutzer <technisches-konto> \
    --passwort '...' \
    --sichtbar \
    --ausgabe selektoren.json
```

Das Skript meldet sich an, läuft Anmeldung, Benutzerübersicht und
Anlegen-Formular ab und schlägt für jedes Feld Kandidaten vor. Am Ende listet
es auf, was es nicht gefunden hat — typischerweise die Zellenselektoren und
die beiden Vorlagen:

```json
{
  "marker_angemeldet": "#benutzermenue",
  "zelle_personalnummer": "td.personalnummer",
  "zelle_email": "td.email",
  "zelle_regelwerke": "td.lizenzen",
  "auswahl_regelwerk": "input[data-regelwerk=\"{regelwerk}\"]",
  "knopf_regelwerk_entziehen": "tr[data-pnr=\"{personalnummer}\"] button.entfernen"
}
```

Diese von Hand ergänzen (Rechtsklick → *Untersuchen*). Zwei Regeln:

1. **Stabile Merkmale bevorzugen:** `id`, `name`, `data-*` überleben ein
   Portal-Update meist, CSS-Klassen oft nicht.
2. **Der Entzugsknopf muss auf die Zeile eingegrenzt sein.** Ohne
   `tr[data-pnr="{personalnummer}"]` davor trifft er die falsche Person.
   Dafür gibt es einen Test — er heißt
   `test_entziehen_trifft_nur_die_richtige_person`.

### Gegen das Portal-Double prüfen

Bevor die Datei ins Volume geht, den Testlauf durchziehen:

```bash
python3 -m unittest discover -s tests -v
```

58 Tests, davon 16 gegen ein nachgebautes Portal. Sie prüfen die Mechanik,
nicht deine Selektoren — aber wenn sie rot sind, stimmt etwas Grundsätzliches
nicht.

Dann ins Volume:

```bash
databricks fs cp selektoren.json \
  dbfs:/Volumes/governance/vde_zugang/konfig/selektoren.json
```

**Abnahme:** `Selektoren.aus_json(...).pruefe()` wirft keine Ausnahme. Fehlt
ein Pflichtfeld, verweigert der Job den Start und nennt die offenen Felder.

---

## Phase 6 — Lesen ohne Schreiben (Tag 9, 1 Stunde)

Die wichtigste Stufe. Hier zeigt sich, ob die Selektoren stimmen.

| Widget | Wert |
|---|---|
| `portal_modus` | `browser` |
| `dry_run` | `true` |
| `portal_url` | Basis-URL |
| `selektoren_pfad` | `/Volumes/governance/vde_zugang/konfig/selektoren.json` |
| `screenshot_pfad` | `/Volumes/governance/vde_zugang/screenshots` |

Der Job meldet sich am Portal an, liest den Bestand, rechnet die Maßnahmen aus
— und ändert nichts.

**Abnahme, und zwar streng:** Öffne das Portal parallel im Browser und
vergleiche die gelesene Benutzerzahl und einige Stichproben mit dem, was der
Job in Abschnitt 5 anzeigt.

- Zahl stimmt nicht → Zeilenselektor oder Blätterfunktion falsch
- Regelwerke fehlen oder sind zerhackt → `zelle_regelwerke` oder das
  Trennzeichen falsch
- Personalnummern leer → falsche Zellenspalte

Solange der gelesene Bestand nicht exakt zum Portal passt, **nicht** weiter.
Ein falsch gelesener Ist-Bestand erzeugt in Stufe 7 falsche Aktionen.

---

## Phase 7 — Erster Echtlauf, klein gehalten (Tag 10, 2 Stunden)

### 7.1 Notbremse enger stellen

| Widget | Wert für den ersten Lauf |
|---|---|
| `max_entzuege` | `2` |
| `max_aenderungen` | `5` |
| `dry_run` | `false` |

Löst die Notbremse aus, ist das kein Fehler, sondern die richtige Reaktion —
sieh dir an, warum so viele Änderungen anstehen.

### 7.2 Lauf starten und im Portal nachsehen

Jede ausgeführte Aktion im Portal prüfen. Der Job liest zwar selbst nach, aber
beim ersten Mal willst du es mit eigenen Augen gesehen haben.

### 7.3 Protokoll ansehen

```sql
SELECT stichtag, status, aktion, name, regelwerk, meldung, dauer_s
FROM governance.vde_zugang.massnahmen
ORDER BY erstellt_am DESC;
```

**Abnahme:** Alle Aktionen `ERFOLG`, im Portal sichtbar, Protokoll vollständig.

Bei `FEHLER`: Meldung und Screenshot im Volume ansehen. Fast immer ist es ein
Selektor, der auf einer Unterseite anders heißt als auf der Übersicht.

---

## Phase 8 — In Produktion nehmen (Tag 11, 1 Stunde)

### 8.1 Job über das Asset Bundle ausrollen

```bash
databricks bundle validate
databricks bundle deploy -t prod
```

Variablen in `resources/vde_zugangsabgleich_job.yml` vorher füllen:
`portal_url`, `sp_site_hostname`, `verantwortlicher`, `dienstkonto`,
`node_type`.

### 8.2 Auf Normalwerte stellen

| Parameter | Produktivwert |
|---|---|
| `portal_modus` | `browser` |
| `dry_run` | `false` |
| `max_entzuege` | `10` |
| `max_aenderungen` | `40` |
| `mail_versand` | `graph` oder `smtp` |
| `empfaenger` | deine Adresse, plus Vertretung |

### 8.3 Zeitplan aktivieren

In `resources/vde_zugangsabgleich_job.yml` `pause_status` von `PAUSED` auf
`UNPAUSED` setzen und erneut ausrollen. Montags 07:00 Europe/Berlin.

### 8.4 Alarmierung

Der Job schickt bei Fehlschlag eine Mail (`email_notifications.on_failure`).
Das deckt aber nur den Absturz ab — nicht den Fall, dass er sauber durchläuft
und die Notbremse gezogen hat. Dafür ist die Ergebnismail da: Betreff beginnt
dann mit `LAUF GESTOPPT`. Eine Postfachregel darauf lohnt sich.

**Abnahme:** Ein manuell ausgelöster Lauf über die Job-Oberfläche läuft grün
durch und die Mail kommt an.

---

## Phase 9 — Betrieb

### Wöchentlich, 5 Minuten

Ergebnismail lesen. Interessant sind nur zwei Zeilen: `fehlgeschlagen` und
`offen`. Prüffälle abarbeiten — das ist der Teil, der bewusst bei dir bleibt.

### Monatlich, 15 Minuten

```sql
SELECT aktion, status, count(*) AS anzahl
FROM governance.vde_zugang.massnahmen
WHERE stichtag >= current_date() - INTERVAL 30 DAYS
GROUP BY ALL ORDER BY anzahl DESC;
```

Häufen sich `FEHLER` bei einer bestimmten Aktion, hat sich das Portal geändert.

### Wenn sich das Portal ändert

Erkennbar an Klartext-Meldungen wie *„Benutzeruebersicht nicht gefunden"*.
Der Job ändert dann nichts — er bricht ab.

1. `selektoren_erkunden.py` erneut laufen lassen
2. Geänderte Felder ersetzen
3. `python3 -m unittest discover -s tests`
4. Neue `selektoren.json` ins Volume
5. Einmal mit `dry_run = true` gegenprüfen

Realistisch ein- bis zweimal im Jahr, Aufwand je unter einer Stunde.

### Rückfall

Zwei Stufen, beide ohne Code-Änderung:

| Situation | Maßnahme |
|---|---|
| Portal geändert, keine Zeit für Selektoren | `portal_modus = aufgabenliste` — du bekommst wieder die Aufgabenliste per Mail und klickst selbst |
| Etwas ist grundsätzlich falsch | Zeitplan auf `PAUSED`. Der Job hat nichts Bleibendes verändert, was nicht im Portal steht |

Ein Rückbau der Datenlage ist nie nötig: Die Wahrheit steht im Portal, die
Delta-Tabellen sind Protokoll und Momentaufnahme.

---

## Der kritische Pfad

Sechs von neun Phasen sind an einem Tag machbar. Was den Zeitplan bestimmt:

1. **Netzwerkfreigabe** (Phase 0) — blockiert Phase 3, Vorlauf oft 1–2 Wochen
2. **SharePoint-Datenqualität** (Phase 4) — blockiert alles Weitere, Aufwand
   hängt am Zustand der Liste
3. **Vertragsfrage** (Phase 0) — blockiert Phase 7

Alles andere ist Fleißarbeit in überschaubarer Zeit.
