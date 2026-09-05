# epilot

Einführung von **epilot** als Anmeldeportal für den Netzanschluss von
Einspeiseanlagen — API-Referenz, Schnittstellenkonzepte und die technische
Umsetzung der Anbindung an SAP.

> Status: Konzeptphase. SK-001 ist Entwurf 0.5, der Export-Job läuft gegen
> Testdaten. Was fehlt, sind zwei Termine — nicht Technik.

## Was hier liegt

| Ordner | Inhalt |
| --- | --- |
| [`api-referenz/`](./api-referenz/) | Alle 51 epilot-APIs mit 1141 Operationen, erzeugt aus den offiziellen OpenAPI-Specs. Dazu das Token-Modell und die Org-Header-Fallstricke. |
| [`schnittstellenkonzept/`](./schnittstellenkonzept/) | Vorgehen, Vorlage und die laufenden Konzepte. Aktuell **SK-001**: Einspeiseanlagen nach SAP. |
| [`schnittstellenkonzept/erhebung/`](./schnittstellenkonzept/erhebung/) | Arbeitsmappe zum Einsammeln der SAP-Seite. |
| [`schnittstellenkonzept/umsetzung/`](./schnittstellenkonzept/umsetzung/) | Der Export-Job. Python, 22 Tests, plattformfrei. |

## SK-001 — Einspeiseanlagen nach SAP in einem Absatz

Nach bestätigter Inbetriebsetzung müssen in SAP die Stammdaten für die
EEG-Abrechnung entstehen. SAP liest dafür eine CSV vom Netzlaufwerk — die heute
**von Hand** erzeugt wird. Abgelöst wird also kein System, sondern ein Handgriff.
Das Zielformat bleibt unverändert, SAP merkt von der Umstellung nichts.

Drei Dinge, die dabei zählen:

**Der Auslöser ist die Inbetriebsetzung, nicht die Anmeldung.** Anmeldedaten sind
keine Abrechnungsdaten — ein Teil der Anmeldungen wird nie realisiert, und die
Ist-Leistung weicht häufig vom Antrag ab.

**Die Kodierung der heutigen Datei entscheidet über das Werkzeug.** UTF-8 ohne BOM
heißt, Power Automate allein genügt. Windows-1252 heißt, es braucht etwas, das die
Datei byte-genau schreiben kann. Zehn Minuten mit einer Originaldatei klären das.

**Die eigentliche Arbeit ist das, was heute im Kopf einer Person passiert.** Wer
die Datei baut, prüft dabei mit — und diese Prüfung fällt mit der Automatisierung
weg. Der Fragenkatalog dafür steht in SK-001, Abschnitt 0.

## Nächste Schritte

1. Eine produktive Original-CSV besorgen und die Kodierung feststellen
2. Eine Stunde mit der Person, die die Datei heute erzeugt
3. Erhebungsmappe an die SAP-Seite geben

Danach ist der Job in wenigen Stunden konfiguriert — die Bausteine stehen.

## Quellen

Die API-Referenz stammt aus den OpenAPI-Specs des offiziellen SDK
([epilot-dev/sdk-js](https://github.com/epilot-dev/sdk-js)), nicht aus
abgeschriebener Dokumentation. Aktualisieren:

```bash
git clone --depth 1 https://github.com/epilot-dev/sdk-js /tmp/sdk-js
python3 epilot/api-referenz/tools/generate_docs.py /tmp/sdk-js
```
