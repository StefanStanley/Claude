# Schnittstellenkonzepte

Arbeitsverzeichnis für die Schnittstellenkonzepte rund um die epilot-Einführung.

## Das Prinzip

Ein Schnittstellenkonzept beschreibt **einen Datenfluss zwischen zwei Systemen für
einen fachlichen Zweck** — nicht „die Anbindung von epilot". Fünf Datenflüsse heißen
fünf Dokumente. Das klingt nach mehr Arbeit, ist aber weniger: jedes Dokument wird
einzeln fertig, einzeln freigegeben und einzeln gebaut. Ein Sammelkonzept wird nie fertig,
weil immer noch eine Frage offen ist.

## Vorgehen in drei Schritten

### Schritt 1 — Kandidaten sammeln (halber Tag, im Team)

Nicht technisch denken, sondern an den Prozessbrüchen entlang: **Wo wird heute etwas
aus einem System abgetippt, per Mail geschickt oder als Excel exportiert?** Genau da
gehört eine Schnittstelle hin. Jeder Bruch wird eine Zeile im Register unten.

Zwei Fragen helfen beim Finden:
- Welche Information wartet heute in einem Postfach, statt im Zielsystem zu landen?
- Wo ruft ein Kunde oder Kollege an, weil er einen Stand nicht sehen kann?

### Schritt 2 — Priorisieren (eine Sitzung)

Drei Kriterien, mehr nicht:

| Kriterium | Frage |
| --- | --- |
| **Schmerz** | Wie viele Vorgänge pro Monat, wie viel Handarbeit je Vorgang? |
| **Machbarkeit** | Hat das Gegensystem überhaupt eine API? Wer kennt sie? |
| **Abhängigkeit** | Muss etwas anderes vorher da sein (Datenmodell, Rollenkonzept)? |

Der erste Fluss soll **klein und sichtbar** sein. Nicht der wichtigste — der, an dem ihr
das Verfahren lernt, ohne dass ein Scheitern wehtut. Der wichtigste kommt als zweiter,
dann könnt ihr es schon.

### Schritt 3 — Ersten Fluss ausdetaillieren (ein bis zwei Tage)

[`VORLAGE.md`](./VORLAGE.md) kopieren, ausfüllen, in die Freigabe geben.
Ein ausgefülltes Muster liegt in [`BEISPIEL-netzanschluss.md`](./BEISPIEL-netzanschluss.md)
— **erfundene Inhalte**, nur um zu zeigen, welcher Detailgrad gemeint ist.

```bash
cp schnittstellenkonzept/VORLAGE.md schnittstellenkonzept/SK-001-<kurzname>.md
```

## Schnittstellen-Register

Die Übersicht über alle Kandidaten. Erst wenn eine Zeile in Detailkonzept-Reife ist,
entsteht daraus ein eigenes Dokument.

| ID | Kurzname | Von → Nach | Fachlicher Zweck | Menge/Monat | Aufwand heute | Prio | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [SK-001](./SK-001-einspeiser-sap.md) | Einspeiser → SAP | epilot → SAP | Stammdaten für die EEG-Abrechnung; löst die bestehende automatisierte CSV-Erzeugung ab | *zu erheben* | läuft heute automatisiert | hoch | in Konzeption |
| [SK-002](./SK-002-14a-sap.md) | § 14a → SAP | epilot → SAP | Steuerbare Verbrauchseinrichtungen (Wärmepumpe, Wallbox, Speicher); ebenfalls bestehende CSV-Strecke | *zu erheben* | läuft heute automatisiert | hoch | Gerüst |
| SK-003 | | | | | | | offen |

> **Beantwortet:** Es sind **zwei verschiedene Formate** — gemeinsam haben die Exporte nur
> die Lovion-Kennung und `Messkonzept`. Zwei Erhebungen und zwei Feldmappings, aber eine
> Umsetzung mit zwei Konfigurationen. Einzelheiten im
> [Vergleich beider Strecken](./bestand/vergleich_beide_strecken.md).
>
> **Empfehlung zur Reihenfolge: Einspeiser zuerst** — 30 klar benannte Felder, keine
> Formularkopplung, keine Duplikate. Das Verfahren lässt sich dort risikoärmer erproben.

Status: `offen` → `in Konzeption` → `in Freigabe` → `freigegeben` → `umgesetzt` → `produktiv`

## Offen: die übrigen Lovion-Schnittstellen

**epilot ersetzt Lovion.** SK-001 und SK-002 decken die beiden bekannten CSV-Strecken nach
SAP ab — das sind aber vermutlich nicht die einzigen Verbindungen des Systems. Bevor ein
Abschalttermin gesetzt wird, gehört erhoben, was sonst an Lovion hängt: GIS, Dokumenten-
ablage, weitere Fachsysteme, Auswertungen.

Jede gefundene Verbindung wird eine Zeile im Register oben. Die Frage an den Betrieb lautet
schlicht: **Welche Systeme tauschen heute Daten mit Lovion aus, in welche Richtung?**

## Wer zeichnet mit

Klärt das **vor** dem ersten Dokument, nicht danach — sonst schreibt ihr für den falschen
Leser. Üblicherweise:

| Rolle | Prüft |
| --- | --- |
| Fachbereich / Prozessowner | Stimmt der fachliche Zweck, ist der Auslöser richtig beschrieben? |
| IT-Architektur | Passt das Verfahren, gibt es das schon woanders? |
| Informationssicherheit | Authentifizierung, Netzzugang, Secrets, Protokollierung |
| Datenschutz | Personenbezogene Daten, Rechtsgrundlage, Löschfristen, AV-Vertrag |
| Betrieb | Wer bekommt den Alarm um 3 Uhr nachts? |

## Vier Fehler, die richtig teuer werden

**Führendes System nicht festgelegt.** Wenn dasselbe Feld in beiden Systemen änderbar
ist und nicht definiert ist, wer gewinnt, bekommt ihr Datenmüll, den niemand mehr
auseinanderdividieren kann. Das ist die wichtigste Zeile im ganzen Dokument.

**Keine fachliche Korrelations-ID.** Beide Seiten brauchen einen gemeinsamen, stabilen
Schlüssel für denselben Vorgang. Ohne den ist jede Fehlersuche Rätselraten und
Wiederholungen erzeugen Dubletten.

**Fehlerfall nicht zu Ende gedacht.** „Dann kommt eine Fehlermeldung" ist keine
Fehlerbehandlung. Wer sieht sie, was passiert mit dem Vorgang in der Zwischenzeit,
und wie wird er nachträglich eingespielt?

**Mengengerüst geraten.** Zehn Vorgänge am Tag und zehntausend führen zu völlig
unterschiedlichen Architekturen. Zählt nach, bevor ihr entscheidet.
