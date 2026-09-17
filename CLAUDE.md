# Kontext: epilot-Einführung bei der Netzgesellschaft Düsseldorf

Diese Datei bringt eine neue Session auf Stand. Sie ersetzt kein Konzept — die
Details stehen in `schnittstellenkonzept/`.

## Worum es geht

epilot wird als **Anmeldeportal für Netzanschlüsse** eingeführt und löst das
Altportal ab. **Das Altportal ist Lovion.** Zwei Formularstrecken sind im Fokus,
beide übergeben Daten an SAP:

| Strecke | Gegenstand | Konzept | Stand |
| --- | --- | --- | --- |
| **Einspeiser** | Einspeiseanlagen, technische Anlagendaten für die EEG-Abrechnung | [SK-001](./schnittstellenkonzept/SK-001-einspeiser-sap.md) | Entwurf 0.7 |
| **§ 14a EnWG** | steuerbare Verbrauchseinrichtungen (Wärmepumpe, Wallbox, Speicher) | [SK-002](./schnittstellenkonzept/SK-002-14a-sap.md) | Entwurf 0.2 |

**Beide Ist-Exporte sind analysiert** — Spaltenlisten und Auswertung in
`schnittstellenkonzept/bestand/`. Kernbefunde:

- **Zwei verschiedene Formate.** Einspeiser 30 Spalten, § 14a 86. Gemeinsam nur die
  Lovion-Kennung (in unterschiedlicher Schreibweise!) und `Messkonzept`.
- **Der Einspeiser-Export enthält keine Personendaten** — keinen Namen, keine IBAN,
  keinen Umsatzsteuerstatus, keine MaStR-Nummer, keine Zählernummer. Nur die technische
  Anlage am Anschlussobjekt plus `Lovion ID`. Frühere Annahmen im Konzept dazu waren
  falsch und sind in 0.7 korrigiert.
- **Der § 14a-Export ist ein Formular-Abzug** mit Anzeigetexten, Bestätigungshäkchen und
  einer dreifach vorkommenden Spalte. Dort ist die Formularstruktur Teil der
  Schnittstellenspezifikation.
- **Empfehlung: Einspeiser zuerst ablösen** — weniger Felder, keine Formularkopplung.

Formularstrecke § 14a (öffentlich):
https://www.netz-duesseldorf.de/netzanschluss/steuerbare-verbrauchseinrichtungen/anmeldung-von-verbrauchseinrichtungen

## Zielbild: epilot ersetzt Lovion

**Entschieden.** Lovion wird abgelöst, epilot erzeugt die CSV-Dateien künftig selbst.
Der Zuschnitt von SK-001 und SK-002 ist damit bestätigt.

**Die daraus wichtigste offene Frage:** Beide Exporte tragen eine Lovion-Kennung — beim
Einspeiser-Export ist `Lovion ID` sogar der **einzige** Schlüssel. Fällt Lovion weg,
verliert dieses Feld seine Quelle. Drei Wege (SK-001, Abschnitt 0a): Nummernkreis in
epilot fortführen, neue Kennung in SAP akzeptieren, oder Umsetzungstabelle führen.
Empfohlen ist der Nummernkreis — nur er lässt die SAP-Seite wirklich unberührt.

Ebenfalls offen und über die Konzepte hinausreichend: Bestandsdaten (Lovion-IDs stehen
in SAP zu Altanlagen) und die **übrigen Schnittstellen von Lovion**, die mit abgelöst
werden müssen.

## Das Wichtigste in vier Sätzen

1. **Beide Strecken laufen heute automatisiert.** Eine Fachanwendung erzeugt eine
   CSV und legt sie auf einem Netzlaufwerk ab, SAP holt sie dort ab.
2. **Es ist eine Ablösung, kein Automatisierungsprojekt.** Neu ist nur das
   Quellsystem: Die Formularstrecke wandert nach epilot, die Dateierzeugung muss
   mitwandern. Der Endtermin kommt vom Abschalttermin des Altportals.
3. **Die SAP-Seite bleibt unangetastet.** Gleiches Format, gleicher Ort, gleicher
   Takt — die Abnahme ist ein Dateivergleich.
   *(Gilt unter der Annahme, dass epilot die Datei künftig selbst erzeugt — siehe
   Kernfrage oben.)*
4. **Der bestehende Erzeugungscode ist die Spezifikation.** Mapping,
   Transformationen und Prüfregeln sind dort implementiert und zu übernehmen.

## Irrtümer, die schon passiert sind

> **Die CSV wird NICHT von Hand erzeugt.** In einer früheren Fassung stand das so
> im Konzept — falsch. Beide Strecken laufen automatisiert. Alles, was auf
> „Handarbeit fällt weg" oder „Fragen an die Sachbearbeitung" aufbaut, ist damit
> hinfällig. Korrigiert in Fassung 0.6.

## Der Nutzer

Cluster Digitalisierung, Data & AI. **Kennt die Energiewirtschaft** — EEG,
Marktkommunikation, MaStR, Inbetriebsetzung sind bekannt und brauchen keine
Erklärung. Erwartet Substanz statt Grundlagen, direkte Ansprache, einen konkreten
nächsten Schritt statt einer Optionsliste. Antwortet knapp und in Stichworten.

## Technische Festlegungen (gelten für beide Strecken)

- **Zielformat CSV**, Ablage auf dem Netzlaufwerk — unverändert
- **Auslöser:** ein fachlicher Reifezustand des Vorgangs, kein Zeitraumfilter
- **Selektion über einen Übertragungsstatus** an der Entity, nicht über einen
  Zeitraum. Zeitraumfilter verlieren Nachzügler lautlos und duplizieren bei
  Wiederholung.
- **Erst Datei ablegen, dann Status setzen.** Im Zweifel doppelt statt verloren;
  Dubletten fängt SAP über die Korrelations-ID ab.
- **Atomare Ablage:** unter `.tmp` schreiben, dann umbenennen. Sonst holt SAP eine
  halb geschriebene Datei ab.
- **Kodierungsfehler nie still ersetzen.** Bei cp1252 und einem Zeichen außerhalb
  des Vorrats geht der Vorgang in die Klärliste, nicht mit `?` durch.
- **Parallelbetrieb im Trockenlauf** als Einführungsweg: neuer Lauf schreibt in ein
  Prüfverzeichnis, alte Strecke liefert weiter, Dateien werden verglichen. Nur eine
  Strecke schreibt nach SAP.

### Die offene Kernfrage: Kodierung

Ob **Power Automate** allein genügt, entscheidet die Zeichenkodierung der heutigen
Datei: UTF-8 ohne BOM → ja. Windows-1252 / ISO-8859-1 / UTF-8 mit BOM → nein, dann
braucht die Erzeugung ein Werkzeug mit byte-genauer Kontrolle (**Databricks** oder
Azure Function), und Power Automate übernimmt nur die Zustellung über den
On-Premises Data Gateway. Zehn Minuten mit einer Originaldatei im Hexeditor klären das.

## epilot: verifizierte Fakten

Alles hier stammt aus den OpenAPI-Specs, nicht aus dem Gedächtnis. Volle Referenz
in `api-referenz/` (51 APIs, 1141 Operationen).

- **Entity API** `https://entity.sls.epilot.io` ist der Einstieg. Jeder Vorgang ist
  eine Entity mit konfigurierbarem Schema.
- **Suche:** `POST /v1/entity:search` mit `{q, size (max 1000), search_after, sort,
  hydrate}`. `q` ist Lucene-Syntax. **`hydrate: true` löst Relationen auf** — ohne
  das liefert eine Relation nur `{"$relation":[{"entity_id":"…"}]}`, also keine Werte.
- **Ändern:** `PATCH /v1/entity/{slug}/{id}`; `PATCH /v1/entity/{slug}:upsert` mit
  `unique_key` ist idempotent.
- **Auth:** Bearer-JWT (`EpilotAuth`). Token über die Access Token API
  (`token_type: api`, `read_only` wo möglich). Vier getrennte Token-Welten:
  `EpilotAuth`, `EpilotPublicAuth` (Journey), `PortalAuth`, `ExternalOIDCAuth`.
- **Org-Header ist nicht einheitlich:** meist `x-epilot-org-id`, bei Template
  Variables, Customer Portal, Metering, Partner Directory und Messaging Settings
  aber `x-ivy-org-id`.
- **Adressen** sind eine Liste von Objekten (`street`, `street_number`,
  `postal_code`, `city`, `country` (nur DE/AT/CH), `additional_info`); Index 0 ist
  die primäre.
- **IBAN ist kein Standardfeld** — muss über `payment` oder ein eigenes Attribut
  modelliert werden.

## KI im Prozess

Seit 10.09. gibt es eine Use-Case-Landkarte: `ki/use-case-landkarte.md`, aufgebaut nach
der Epic-Systematik des Clusters (siehe Skill `jira-cluster-struktur`).

Kernaussage: Vier von sieben Kandidaten scheitern am DoR-Kriterium „Datenquelle
identifiziert" — nicht an Technik oder Budget. Die fehlenden Daten (strukturierte
Klärgründe, typisierte Dokumente, Ereignisspur, erhaltene Korrekturen) entstehen beim Bau
des epilot-Prozesses oder gar nicht. **Sie gehören als Stories in die Lovion-Ablösung
(Initiative Construction & Operations), nicht als eigener KI-Epic.**

Erster echter Use Case ist die **Dokumentenprüfung** (Kennwerte aus Anhängen extrahieren
und gegen die Formularangaben abgleichen, immer mit Belegstelle). Ausdrücklich *keine* KI
gehört in Feldmapping, Fristen, Vergütungsklassen und MaStR-Abgleich.

Offen: Das Pflichtfeld „Fachbereich" kennt keinen Eintrag **Netzanschluss**, und für keinen
Kandidaten ist ein FB-Sponsor benannt — ohne den kommt kein Epic durch das DoR-Gate.

## Beteiligte Systeme

| System | Rolle |
| --- | --- |
| **epilot** | künftiges Anmeldeportal (SaaS) |
| **Lovion** | Altportal und Bearbeitungssystem; erzeugt heute die CSV. Ob es bleibt, ist offen |
| **SAP** | Zielsystem der Abrechnung, liest die CSV vom Netzlaufwerk |
- **Webhooks** signieren ausgehend mit Ed25519; öffentlicher Schlüssel über
  `GET /v1/webhooks/.well-known/public-key`. Ereignisnamen liefert
  `GET /v1/webhooks/configured-events`; eigene fachliche Ereignisse lassen sich im
  Event Catalog anlegen (`POST /v1/events`).

## Umgebung: was in dieser Session nicht geht

- **`docs.epilot.io` und `www.netz-duesseldorf.de` sind per Netzwerkrichtlinie
  gesperrt.** Die API-Referenz wurde deshalb aus dem öffentlichen SDK erzeugt:
  `git clone --depth 1 https://github.com/epilot-dev/sdk-js /tmp/sdk-js`, dann
  `python3 epilot/werkzeuge/api_referenz_erzeugen.py /tmp/sdk-js`.
- **LibreOffice startet nicht.** Word- und Excel-Dateien lassen sich nicht rendern
  und nicht visuell prüfen — nur strukturell validieren (`validate.py` beim
  docx-Skill). Bei .xlsx deshalb möglichst formelfrei arbeiten, sonst fehlt der
  Recalc.
- `openpyxl`, `docx` (npm), `lxml`, `defusedxml` mussten nachinstalliert werden.

## Verfahren und Werkzeuge

Für das *Vorgehen* gibt es einen Skill: **`epilot-abloesung`** (unter
`.claude/skills/epilot-abloesung/`). Er beschreibt die Werkzeugkette, die Entscheidungen,
die bei jeder Strecke zuerst fallen müssen, und die wiederkehrenden Fallstricke. Diese
Datei hier beschreibt den *Stand*.

Alle Werkzeuge liegen in `werkzeuge/` — Spaltenanalyse, Attributabruf aus Blueprint oder
Schema, Mappen-Generator, Konfigurationserzeugung, API-Referenz. Die Kette steht in
`werkzeuge/README.md`.

**Eine neue Strecke ist eine neue Konfiguration, kein neues Programm.**

## Was hier liegt

```
epilot/
  KONVENTIONEN.md          wie hier Code und Doku geschrieben werden
  pyproject.toml           dieselben Regeln maschinenlesbar (ruff)
  werkzeuge/               die Kette: Analyse, Attribute, Mappe, Konfiguration
  api-referenz/            51 APIs, Authentifizierung
  schnittstellenkonzept/
    README.md              Vorgehen, Schnittstellen-Register, häufige Fehler
    VORLAGE.md             Kopiervorlage für weitere Konzepte
    SK-001-…               Einspeiser → SAP, Entwurf 0.6
    SK-002-…               § 14a → SAP, Gerüst
    erhebung/              Excel-Mappe zum Einsammeln der SAP-Seite
    umsetzung/             Export-Job in Python, 22 Tests, konfigurationsgetrieben
  besprechung/             SK-001 als Word-Dokument für die interne Abstimmung
```

**Der Export-Job trägt beide Strecken.** Alles Formatabhängige steht in einer
YAML-Konfiguration; zwei Dateiformate bedeuten zwei Konfigurationen, nicht zwei
Programme. `../../werkzeuge/config_aus_erhebung.py` erzeugt die Konfiguration aus der
ausgefüllten Erhebungsmappe.

## Wie hier geschrieben wird

Gängige Python-Standards, keine Hauskonvention: **PEP 8**, **PEP 257 mit
Google-Style-Docstrings**, **Typannotationen**, **Conventional Commits**. Die Regeln
stehen maschinenlesbar in `pyproject.toml`, begründet in `KONVENTIONEN.md`.

```bash
cd epilot && ruff check .      # läuft ohne Befund durch
cd epilot/schnittstellenkonzept/umsetzung && python3 -m pytest tests/ -q
```

Der Grundsatz dahinter: **Das „Warum" gehört in den Docstring, das „Was" in den Code.**
Ein Docstring, der die Signatur in Prosa wiederholt, ist Ballast. Die automatische
Formatierung (`ruff format`) ist bewusst nicht eingeschaltet — Begründung in
`KONVENTIONEN.md`.

## Das Zielmodell: ein Schema für alles

**Stand 15.09.2026, aus der produktiven Instanz gelesen** (Databricks, Entity API).

Alle Formularstrecken hängen an **einem** Schema: `opportunity` mit **880 Attributen**.
Die 30 übrigen Schemas sind epilot-Standard und klein (`contact` 47, `meter` 17,
`contract` 39). Die Strecken unterscheiden sich allein am **Namenspräfix**:

| Präfix | Bedeutung | Attribute |
| --- | --- | --- |
| `ea_*` | **E**rzeugungs**a**nlage → Einspeiser (SK-001) | ~155 (`ea_generator_` 55, `ea_speicher_` 26, `ea_solarmodul_` 20, …) |
| `vb_*` | **V**er**b**rauchseinrichtung → § 14a (SK-002) | ~107 (`vb_fertigmeldung_` 50, `vb_ladeeinrichtung_` 25, `vb_waermepumpe_` 13, `vb_speicher_` 10, `vb_raumkuehlung_` 9) |
| `14a_*` | nur Zähler und Konzept, **nicht** die ganze Strecke | 18 (`14a_anmeldung_` 15, `14a_konzept_` 3) |
| `ha_*` | Hausanschluss | 33 (Strom 27, Wasser 6) |
| `z1_ausbau_` … `z4_ausbau_` | Zählerausbau, vier Blöcke | je 10 |
| `vorgang_1_` … `vorgang_9_` | **neun identisch ausgerollte Blöcke** | je 23 = **207** |

**Drei Befunde daraus:**

1. **`14a_*` ist nicht die § 14a-Strecke.** Die Geräte stehen unter `vb_*`. Wer nur nach
   `14a` sucht, findet 18 von rund 125 Feldern und hält die Strecke für unvollständig.
2. **Vokabelbruch Wallbox.** Das Wort kommt im Schema **null** mal vor — epilot nennt es
   `ladeeinrichtung` und `ladepunkt`. Genau deshalb werden Attributnamen nicht geraten.
   Die Auflösung steht jetzt in `werkzeuge/schema_attribute.py`.
3. **`vorgang_1_*` bis `vorgang_9_*` sind ein Viertel des Schemas.** Eine flach
   ausgerollte Wiederholstruktur. Kann ein Vorgang mehrere Teilvorgänge tragen, braucht
   die Exportdatei dafür eine Regel — **offene Frage für die Mapping-Sitzung.**

**Offen:** `marktlokation`, `malo`, `melo` kommen an `opportunity` **nicht** vor. Erwartet
SAP eine MaLo-/MeLo-ID, steht sie woanders — Kandidaten sind die Schemas `meter` (17) und
`meter_counter` (12). Ungeklärt.

**Verfahren:** Ein Namensabgleich gegen alle 880 Attribute liefert Rauschen (86 Spalten →
64 Vorschläge, davon nur 10 belastbar). Erst mit `--familien` die Präfixe sichten, dann
mit `--praefix` eingrenzen. Der Präfix-Abzug beim Vergleich hebt Treffer wie
`ZN_Z1 → 14a_anmeldung_zaehlernummer_z1` von 0,70 auf 1,00.

## Mapping-Sitzung 19.09.2026 — vier Entscheidungen

- **Die Kennung ist abgestimmt:** `Opportunity Nummer` ersetzt `Lovion ID`, SAP zieht nach.
- **Die Datei darf schrumpfen:** 16 Spalten statt 30.
- **epilot kann die Datei nicht selbst erzeugen** — der eigene Export-Lauf über die
  Entity API ist der Weg. Der vorhandene Code in `umsetzung/` wird gebraucht.
- **Anschlussobjekt ≠ Anlagenbetreiberadresse.** Zwei getrennte Adressen; welches
  Attribut das Anschlussobjekt trägt, ist noch zu belegen.

Daraus entstand `umsetzung/config.einspeiser.probelauf.yaml` — lauffähig, mit allen
Annahmen als solche gekennzeichnet. Acht Tests sichern sie ab.

**Noch offen:** Werteliste `Energieart` (Quell- und Zielwerte), Quellwerte für
`Art der Einspeisung`, die Felder `Einspeisemanagement` und `Fernsteuerbarkeit`, der
Attributname für `Wechselrichterleistung_kW` (Quelle ist bestätigt).

## Wo die Arbeit steht (17.09.2026)

Die Datenstrecke ist angefangen, das Mapping liegt auf Eis — **in dieser Reihenfolge
bewusst.** Ein Mapping ändert sich, solange die Abstimmung läuft; die Rohdaten nicht.

**Fertig und geprüft:**

- Zugriff auf die produktive epilot-Instanz aus Databricks (Secret Scope `epilot`,
  Schlüssel `access_token`)
- `werkzeuge/entity_laden.py` — Vorgänge seitenweise holen, 10 Tests
- `databricks/01_vorgaenge_laden.py` — Notebook mit acht Markdown-Zellen
- Präfix-Systematik des Schemas verstanden und im Werkzeug abgebildet

**Zwei Stränge, die nicht voneinander abhängen:**

`databricks/02_sap_export_probelauf.py` erzeugt aus echten Vorgängen eine echte CSV —
das ist die EEG-Schnittstelle. Sie läuft direkt gegen die Entity API und braucht die
Bronze-Ablage **nicht**. Wenn der Termindruck steigt, ist das der Entkopplungspunkt.

`databricks/03_bronze_ablegen` (noch zu bauen) legt die Rohdaten als Delta-Tabelle ab —
für Auswertung und Wiederverwendung. Dafür fehlen zwei Angaben aus der Instanz:

1. **Zelle 5 aus Notebook 01** — wie viele Felder sind überhaupt gefüllt, und was ist
   der Median je Vorgang? Daran hängt, ob die Bronze-Tabelle eine **JSON-Spalte**
   bekommt (dünn besetzt) oder **flach** wird (dicht besetzt).
2. **Der Unity-Catalog-Katalog**, in den geschrieben werden darf —
   `spark.sql("SHOW CATALOGS").display()`.

Danach: Wiederholbarkeit ohne Dubletten, dann ein geplanter Job.

**Offene fachliche Fragen** (gehören in die Mapping-Sitzung, nicht in den Code):

- Bilden die neun `vorgang_*`-Blöcke mehrere Teilvorgänge ab, und nach welcher Regel
  kommen sie in die Exportdatei?
- Woher kommt eine MaLo-/MeLo-ID, falls SAP sie erwartet? An `opportunity` steht sie
  nicht; Kandidaten sind die Schemas `meter` und `meter_counter`.
- Gehört `vb_fertigmeldung_*` (50 Felder) zur Anmeldestrecke oder ist das ein
  eigener Vorgang?

## Arbeitsweise im Repository

**Dieses Repository ist `StefanStanleyNGD/ePilot`, Branch `main`.** Es ist aus dem
Branch `epilot-standalone` von `StefanStanley/Claude` hervorgegangen (dort lag alles
unter `epilot/`; hier ist es die Wurzel). Die Historie ist vollständig übernommen.

Der Databricks-Git-Ordner hängt an diesem Repository — Änderungen an `werkzeuge/`
oder `databricks/` werden dort erst nach einem Pull sichtbar. **Das war schon einmal
die Ursache eines `AttributeError`:** Code gepusht, Notebook gegen den alten Stand
gelaufen.
