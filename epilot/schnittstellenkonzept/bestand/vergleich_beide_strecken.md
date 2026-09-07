# Vergleich der beiden Exportstrecken

Stand 07.09.2026, auf Grundlage der Spaltenüberschriften beider Exporte.

| | Einspeiser | § 14a |
| --- | --- | --- |
| Spalten | 30 | 86 |
| Doppelte Spaltennamen | keine | `text-info-messkonzept` dreimal |
| Anzeigetexte in der Datei | keine | rund 18 `text-*`-Spalten |
| Personendaten | **keine** | vollständig (Name, Anschrift, E-Mail, Telefon) |
| Bestätigungen und Einwilligungen | keine | mehrere (`Datenschutz`, `Bestaetigung_*`) |
| Zählerdaten | nur `Messkonzept` | zwei Zähler mit OBIS-Ständen |
| Charakter | kuratiertes Fachdatenset | Formular-Abzug |
| Schlüsselfeld | `Lovion ID` | `referenceNumber`, dazu `lovion_id` |

## Die Vorabfrage ist beantwortet

> **Es sind zwei verschiedene Formate.** Gemeinsam haben die Dateien exakt zwei Felder:
> die Lovion-Kennung — und selbst die in unterschiedlicher Schreibweise (`Lovion ID`
> gegen `lovion_id`) — sowie `Messkonzept`.

Daraus folgt für den Zuschnitt:

- **Zwei getrennte Erhebungen** und zwei Feldmappings. Ein gemeinsames Konzept mit zwei
  Ausprägungen trägt nicht; SK-001 und SK-002 bleiben eigenständig.
- **Eine gemeinsame Umsetzung.** Der Export-Lauf ist konfigurationsgetrieben — zwei
  Formate bedeuten zwei Konfigurationen, nicht zwei Programme. Das gilt unverändert.
- **Unterschiedlicher Aufwand.** Die Einspeiser-Strecke ist mit 30 klar benannten Feldern
  deutlich einfacher. Sie eignet sich als erste Ablösung, an der das Verfahren erprobt wird.

## Die auffälligste Asymmetrie

Die beiden Exporte sind unterschiedlich gebaut, nicht nur unterschiedlich groß.

Der Einspeiser-Export ist **zielsystemorientiert**: kompakte Fachfelder, sprechende Namen,
keine Formularartefakte. Der § 14a-Export ist **formularorientiert**: Er bildet die
Eingabemaske ab, samt Anzeigetexten und Bestätigungshäkchen.

Das hat eine praktische Folge für die Ablösung: Beim § 14a-Export ist die Struktur der
epilot-Formularstrecke Teil der Schnittstellenspezifikation — wer das Formular umbaut,
verändert die Datei. Beim Einspeiser-Export besteht diese Kopplung nicht; dort ist die
Formularstrecke frei gestaltbar, solange am Ende die 30 Felder gefüllt sind.

**Empfehlung zur Reihenfolge:** Einspeiser zuerst. Weniger Felder, keine Formularkopplung,
keine Duplikate im Dateikopf — das Verfahren lässt sich dort mit geringerem Risiko
erproben, bevor die aufwendigere § 14a-Strecke folgt.
