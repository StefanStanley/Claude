# Einspeiser — Analyse der bestehenden Exportspalten

> Grundlage: Spaltenüberschriften des heutigen Einspeiser-Exports, übermittelt am 07.09.2026.
> Rohliste: [`einspeiser_spalten_ist.txt`](./einspeiser_spalten_ist.txt).
> Die Einschätzung beruht auf den Namen — **Werte und Formate zeigt erst eine Datei mit Inhalten.**

**30 Spalten, keine Duplikate.** Deutlich kompakter und fachlich sauberer als der
§ 14a-Export mit seinen 86 Spalten.

## Der wichtigste Befund: keine Personendaten

Die Datei enthält **keinerlei Angaben zum Anlagenbetreiber** — kein Name, keine Anschrift,
keine E-Mail, keine Bankverbindung, keinen Umsatzsteuerstatus. Ebenso fehlen MaStR-Nummer,
Marktlokation, Messlokation und Zählernummer.

> **Diese Schnittstelle überträgt die technische Anlage am Anschlussobjekt, nicht den Kunden.**
> Der einzige Schlüssel in der Datei ist die `Lovion ID`.

Das ist plausibel — beim Netzanschluss existiert der Anschlussnehmer in aller Regel schon,
die Anlage kommt hinzu. Es wirft aber eine Frage auf, die für das Konzept zentral ist:
**Wie kommt SAP von der `Lovion ID` zum Geschäftspartner und zum Vertrag?** Läuft das über
eine zweite Datei, über einen getrennten Prozess, oder ist die Zuordnung in SAP bereits
vorhanden?

Für SK-001 heißt das: Die dort angenommenen Datenlücken (IBAN, Umsatzsteuerstatus,
MaStR-Nummer, Marktlokation, Zähler) betreffen **diese Datei gar nicht**. Sie sind
entweder woanders geregelt oder für diesen Datenfluss ohne Belang.

## Fallstricke in den Spaltennamen

| Spalte | Problem |
| --- | --- |
| `Lovion ID` | **Leerzeichen im Namen** — und im § 14a-Export heißt dasselbe Feld `lovion_id` |
| `Anlagenart nach §48` | Leerzeichen **und** Paragrafenzeichen |
| `Art der Einspeisung` | Leerzeichen im Namen |
| `BAFA-Nummer` | Bindestrich, während der Rest Unterstriche verwendet |
| `Straße_…`, `Flurstück`, `Speicherkapazität_kWh`, `Energieträger`, `Datum_Auslauf_Vergütung`, `Mieterstromzuschlag_gültig_ab` | Umlaute — Kodierung entscheidet über Lesbarkeit in SAP |

Immerhin: **keine doppelten Spaltennamen** und keine Anzeigetexte. Ein Mapping über
Namen wäre hier möglich — anders als bei § 14a.

## Rechtlich kritische Felder dieser Datei

| Feld | Warum |
| --- | --- |
| `EEG_Inbetriebnahmedatum` | bestimmt den Vergütungssatz über die gesamte Förderdauer |
| `Bruttoleistung_kW` | bestimmt Vergütungsklasse und gesetzliche Schwellen |
| `Anlagenart nach §48` | EEG-Vergütungsklasse |
| `Art der Einspeisung` | Voll- oder Überschusseinspeisung, unterschiedliche Sätze |
| `Datum_Auslauf_Vergütung` | Ende der Förderung — Folgefehler wirken 20 Jahre |

## Alle Spalten in Reihenfolge

| # | Spaltenname | Bereich | Anmerkung |
| --- | --- | --- | --- |
| 1 | `Lovion ID` | Referenz | Vorgangskennung im Altportal — einziger Schlüssel in der Datei |
| 2 | `Straße_Anschlussobjekt` | Standort |  |
| 3 | `Hausnummer_Anschlussobjekt` | Standort |  |
| 4 | `PLZ_Anschlussobjekt` | Standort |  |
| 5 | `Ort_Anschlussobjekt` | Standort |  |
| 6 | `Gemarkung` | Standort | Liegenschaftsdaten — Herkunft klären (Formular oder GIS?) |
| 7 | `Flur` | Standort | Liegenschaftsdaten |
| 8 | `Flurstück` | Standort | Liegenschaftsdaten |
| 9 | `Energieart` | Anlage | Verhältnis zu Energieträger klären |
| 10 | `EEG_Inbetriebnahmedatum` | Anlage | **rechtlich kritisch** — bestimmt den Vergütungssatz |
| 11 | `Bruttoleistung_kW` | Leistung | **rechtlich kritisch** — Vergütungsklasse und Schwellen |
| 12 | `Nettoleistung_kW` | Leistung | Abgrenzung zur Bruttoleistung klären |
| 13 | `Wechselrichterleistung_kW` | Leistung |  |
| 14 | `Einspeisespannungsebene` | Netz |  |
| 15 | `Anlagenart nach §48` | Anlage | EEG-Vergütungsklasse — **rechtlich kritisch** |
| 16 | `Neu_Bestand_Erweiterung` | Vorgang | Vorgangstyp — steuert vermutlich die Verarbeitung in SAP |
| 17 | `Mieterstromzuschlag_gültig_ab` | Vergütung | Mieterstrom nach EEG |
| 18 | `Einspeisemanagement` | Steuerung |  |
| 19 | `Messkonzept` | Messung | einziges Messfeld — keine Zählernummer, keine Marktlokation |
| 20 | `BAFA-Nummer` | KWK | für KWK-Anlagen |
| 21 | `Datum_Wirksamkeit_BAFA_Zulassung` | KWK |  |
| 22 | `Datum_Auslauf_Vergütung` | Vergütung | Ende der Förderdauer |
| 23 | `Kleinanlage_KWKG_2016` | KWK |  |
| 24 | `Speicherkapazität_kWh` | Speicher |  |
| 25 | `Max_Entladeleistung_kW` | Speicher |  |
| 26 | `Geodaten_Lage_PV` | Standort | Koordinaten — Format klären |
| 27 | `Energieträger` | Anlage | Verhältnis zu Energieart klären |
| 28 | `Art der Einspeisung` | Vergütung | Voll- oder Überschusseinspeisung — **rechtlich kritisch** |
| 29 | `Fernsteuerbarkeit` | Steuerung |  |
| 30 | `Inselbetrieb` | Steuerung |  |

## Offene Fragen aus dieser Analyse

| # | Frage | An wen |
| --- | --- | --- |
| 1 | Wie kommt SAP von der `Lovion ID` zum Geschäftspartner und Vertrag? | SAP-Betrieb |
| 2 | Gibt es eine zweite Datei mit Personen- und Vertragsdaten? | IT-Betrieb |
| 3 | Unterschied `Energieart` zu `Energieträger` | Fachbereich |
| 4 | Abgrenzung `Bruttoleistung_kW` zu `Nettoleistung_kW` | Fachbereich |
| 5 | Woher kommen Gemarkung, Flur, Flurstück — Formular oder GIS? | Fachbereich |
| 6 | Format von `Geodaten_Lage_PV` (Koordinatensystem, Schreibweise) | IT-Betrieb |
| 7 | Steuert `Neu_Bestand_Erweiterung` die Verarbeitung in SAP? | SAP-Betrieb |
| 8 | Erkennt SAP die Spalten am Namen oder an der Position? | SAP-Betrieb |
| 9 | Kodierung, Trennzeichen, Zeilenende — Originaldatei nötig | Originaldatei |
