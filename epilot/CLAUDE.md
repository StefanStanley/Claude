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
  `python3 epilot/api-referenz/tools/generate_docs.py /tmp/sdk-js`.
- **LibreOffice startet nicht.** Word- und Excel-Dateien lassen sich nicht rendern
  und nicht visuell prüfen — nur strukturell validieren (`validate.py` beim
  docx-Skill). Bei .xlsx deshalb möglichst formelfrei arbeiten, sonst fehlt der
  Recalc.
- `openpyxl`, `docx` (npm), `lxml`, `defusedxml` mussten nachinstalliert werden.

## Was hier liegt

```
epilot/
  api-referenz/            51 APIs, Authentifizierung, Generator
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
Programme. `tools/config_aus_erhebung.py` erzeugt die Konfiguration aus der
ausgefüllten Erhebungsmappe.

## Arbeitsweise im Repository

Entwicklungsbranch `claude/epilot-api-docs-zpfvzb`, nach Freigabe auf `main`
gemerged. Der Nutzer schaut über die GitHub-App auf `main` — was dort nicht liegt,
sieht er nicht.
