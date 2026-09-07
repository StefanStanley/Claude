# § 14a — Analyse der bestehenden Exportspalten

> Grundlage: Spaltenüberschriften des heutigen § 14a-Exports, übermittelt am 07.09.2026.
> Die Kategorisierung ist eine Einschätzung anhand der Namen — **sie ersetzt keine
> Originaldatei mit Inhalten.** Was tatsächlich befüllt ist und wie, zeigt erst ein
> echter Datensatz.

**86 Spalten.** Davon rund **68 mutmaßliche Datenfelder** und **18 mutmaßliche Formular-Anzeigetexte**.

## Drei Fallstricke, die sofort zählen

**1. `text-info-messkonzept` kommt dreimal vor** (Position 70, 80, 83). Ein Mapping über
Spaltennamen ist damit unmöglich — die Zuordnung muss über die **Position** erfolgen.
Das gilt auch für die neue Erzeugung: Sie muss dieselbe Spalte dreimal an denselben
Positionen ausgeben.

**2. `text-technische-mindestanforderung ` hat ein Leerzeichen am Ende** (Position 77).
Wer den Namen abtippt oder trimmt, erzeugt eine andere Datei als heute. Beim
byteweisen Abnahmevergleich fällt das auf — beim Lesen der Liste nicht.

**3. Punkte und Sonderzeichen in Spaltennamen.** Die OBIS-Kennziffern `ZS_1_1.8.1`,
`ZS_1_1.8.2`, `ZS_2_1.8.1`, `ZS_2_1.8.2` enthalten Punkte, `text-voraussetzungen-modul1/2`
einen Schrägstrich, `text-bedingung-ladepunkt-zugänglichkeit` einen Umlaut. Punktnotation
im Mapping bricht daran — die Konfiguration muss Spaltennamen als Zeichenkette behandeln,
nicht als Pfad.

## Die strategisch wichtigste Beobachtung

**Der Export ist ein Formular-Abzug, kein zielsystemorientiertes Mapping.**

Dafür sprechen die rund 18 `text-*`-Spalten mit Anzeigetexten, die
uneinheitliche Benennung über fünf Namensschemata hinweg (`referenceNumber` neben
`Vorname_AB` neben `text-info-messkonzept` neben `lovion_id`) und die dreifach
wiederholte Spalte.

Daraus folgt eine Festlegung für die Ablösung:

> **Die Struktur der epilot-Formularstrecke ist Teil der Schnittstellenspezifikation.**
> Wer Felder im Formular umbenennt, umsortiert oder zusammenfasst, verändert die Datei
> und damit den SAP-Import. Formular und Export sind hier nicht getrennt.

Zu klären ist deshalb früh: **Verarbeitet SAP alle 86 Spalten, oder nur einen Teil?**
Wenn die Anzeigetexte im Import ohnehin verworfen werden, ist die neue Erzeugung
freier — dann müssen sie zwar formal in der Datei stehen, aber ihr Inhalt ist
gleichgültig. Das ist ein erheblicher Unterschied im Aufwand.

## Bedingte Pflichtfelder

`Art_der_SteuVE` ist der Diskriminator: Je nach Wert sind die Blöcke Wärmepumpe,
Speicher oder Ladepunkt befüllt und die übrigen leer. **Die Datei ist dünn besetzt.**
Pflichtfelder sind damit bedingt, nicht absolut — eine Pflichtprüfung, die alle Felder
immer verlangt, hält jeden Vorgang zurück.

Ebenso zu klären: `Messkonzept`, `NSH`, `SLP`/`SLP_opt` und `Modul_1_2` steuern
vermutlich weitere Blöcke.

## Verteilung nach Bereich

| Bereich | Spalten |
| --- | --- |
| Messung/Zähler | 19 |
| Formulartext | 18 |
| Ladepunkt | 13 |
| Betreiber | 10 |
| Upload/Bestätigung | 6 |
| Metadaten | 4 |
| Anlagenort | 4 |
| Wärmepumpe | 3 |
| Speicher | 3 |
| Modul | 3 |
| Steuerung | 2 |
| Art | 1 |

## Alle Spalten in Reihenfolge

*Reihenfolge und Schreibweise exakt wie geliefert. „Anzeige?“ heißt: vermutlich ein
Formulartext ohne Dateninhalt — an einem echten Datensatz zu bestätigen.*

| # | Spaltenname | Bereich | Art | Anmerkung |
| --- | --- | --- | --- | --- |
| 1 | `referenceNumber` | Metadaten | Daten | Kandidat für die Korrelations-ID |
| 2 | `timestamp` | Metadaten | Daten |  |
| 3 | `formID` | Metadaten | Daten | deutet auf ein Formularsystem mit mehreren Formularen |
| 4 | `Vorname_AB` | Betreiber | Daten |  |
| 5 | `Name_AB` | Betreiber | Daten |  |
| 6 | `Strasse_AB` | Betreiber | Daten |  |
| 7 | `Nr_AB` | Betreiber | Daten |  |
| 8 | `PLZ_AB` | Betreiber | Daten |  |
| 9 | `Ort_AB` | Betreiber | Daten |  |
| 10 | `Email_AB` | Betreiber | Daten |  |
| 11 | `Tel_AB` | Betreiber | Daten |  |
| 12 | `Auswahl_Anlagenbetreiber` | Betreiber | Daten | vermutlich Diskriminator: Betreiber = Anschlussnehmer oder Dritter |
| 13 | `Vollmacht_AB` | Betreiber | Daten | Nachweis bei Vertretung |
| 14 | `Strasse_AO` | Anlagenort | Daten |  |
| 15 | `Nr_AO` | Anlagenort | Daten |  |
| 16 | `PLZ_AO` | Anlagenort | Daten |  |
| 17 | `Ort_AO` | Anlagenort | Daten |  |
| 18 | `Art_der_SteuVE` | Art | Daten | **Diskriminator** — steuert, welche Blöcke unten befüllt sind |
| 19 | `WP_max_Leist` | Wärmepumpe | Daten |  |
| 20 | `WP_groesser_30` | Wärmepumpe | Daten | Schwellenkennzeichen |
| 21 | `text-waermepumpen-leistung` | Formulartext | Anzeige? |  |
| 22 | `RK_Leistung` | Wärmepumpe | Daten | Bedeutung zu klären (Raumkühlung? Reserve?) |
| 23 | `SP_max_Leist` | Speicher | Daten |  |
| 24 | `SP_max_Entladeleist` | Speicher | Daten |  |
| 25 | `SP_Kapazitaet` | Speicher | Daten |  |
| 26 | `standort_ladepunkt` | Ladepunkt | Daten |  |
| 27 | `text-bedingung-ladepunkt-zugänglichkeit` | Formulartext | Anzeige? |  |
| 28 | `Privater_Ladepunkt_Elektromobile` | Ladepunkt | Daten |  |
| 29 | `Ladepunkt_Hersteller` | Ladepunkt | Daten |  |
| 30 | `Ladepunkt_Anzahl` | Ladepunkt | Daten |  |
| 31 | `Ladepunkt_Einzelleistung` | Ladepunkt | Daten |  |
| 32 | `Bestaetigung_NGD_groesser_12kW` | Ladepunkt | Daten |  |
| 33 | `hinweis_ladepunkt` | Formulartext | Anzeige? |  |
| 34 | `Ladepunkt_Ladesteuerung` | Ladepunkt | Daten |  |
| 35 | `Ladepunkt_Netzentnahmescheinleistung` | Ladepunkt | Daten | **Dublette?** siehe netzentnahmescheinleistung |
| 36 | `netzentnahmescheinleistung` | Ladepunkt | Daten | **Dublette?** siehe Ladepunkt_Netzentnahmescheinleistung |
| 37 | `Ladepunkt_Anschlussebene` | Ladepunkt | Daten |  |
| 38 | `Ladepunkt_Dokumente` | Ladepunkt | Daten | Dateiverweis — Transport in einer CSV klären |
| 39 | `Ladepunkt_Inbetriebnahme` | Ladepunkt | Daten |  |
| 40 | `Text_Einwilligung_SWD` | Formulartext | Anzeige? |  |
| 41 | `Ladepunkt_Checkbox_Einwilligung_SWD` | Ladepunkt | Daten |  |
| 42 | `lovion_id` | Metadaten | Daten | Verknüpfung ins Lovion-System — wer setzt sie, und wann? |
| 43 | `Messkonzept` | Messung/Zähler | Daten |  |
| 44 | `Datum_IBN` | Messung/Zähler | Daten | **rechtlich kritisch** |
| 45 | `text-angaben-messung-zaehler1` | Formulartext | Anzeige? |  |
| 46 | `ZN_Z1` | Messung/Zähler | Daten |  |
| 47 | `Art_Z1` | Messung/Zähler | Daten |  |
| 48 | `Dat_Abl_Z1` | Messung/Zähler | Daten |  |
| 49 | `ZS_1_ET` | Messung/Zähler | Daten |  |
| 50 | `ZS_1_1.8.1` | Messung/Zähler | Daten | OBIS-Kennziffer im Spaltennamen — Punkte brechen Punktnotation im Mapping |
| 51 | `ZS_1_1.8.2` | Messung/Zähler | Daten | OBIS-Kennziffer im Spaltennamen |
| 52 | `text-angaben-zaehler-2` | Formulartext | Anzeige? |  |
| 53 | `ZN_Z2` | Messung/Zähler | Daten | fester zweiter Zähler — was bei drei Zählern? |
| 54 | `Art_Z2` | Messung/Zähler | Daten |  |
| 55 | `Dat_Abl_Z2` | Messung/Zähler | Daten |  |
| 56 | `ZS_2_ET` | Messung/Zähler | Daten |  |
| 57 | `ZS_2_1.8.1` | Messung/Zähler | Daten | OBIS-Kennziffer im Spaltennamen |
| 58 | `ZS_2_1.8.2` | Messung/Zähler | Daten | OBIS-Kennziffer im Spaltennamen |
| 59 | `NSH` | Messung/Zähler | Daten |  |
| 60 | `text_nachtspeicherheizung` | Formulartext | Anzeige? |  |
| 61 | `SLP_opt` | Messung/Zähler | Daten |  |
| 62 | `Anm_sonstige_MK1` | Messung/Zähler | Daten |  |
| 63 | `SLP` | Messung/Zähler | Daten |  |
| 64 | `Anm_sonstige_MK2` | Messung/Zähler | Daten |  |
| 65 | `Modul_1_2` | Modul | Daten | **rechtlich kritisch** — steuert die Netzentgeltabrechnung |
| 66 | `text_modul1` | Formulartext | Anzeige? |  |
| 67 | `Wahl_Modul_1` | Modul | Daten | Verhältnis zu Modul_1_2 zu klären |
| 68 | `text-voraussetzungen-modul1/2` | Formulartext | Anzeige? |  |
| 69 | `sonstige-varianten-text` | Modul | Daten |  |
| 70 | `text-info-messkonzept` | Formulartext | Anzeige? | **mehrfach vorhanden** |
| 71 | `Steuerungsart` | Steuerung | Daten | technische Umsetzung der Steuerbarkeit |
| 72 | `Auftrag_NGD` | Steuerung | Daten | Auftrag an die Netzgesellschaft |
| 73 | `text-info-steuerung` | Formulartext | Anzeige? |  |
| 74 | `Text_Formularvorlage` | Formulartext | Anzeige? |  |
| 75 | `Dateiupload` | Upload/Bestätigung | Daten | Dateiverweis — Transport in einer CSV klären |
| 76 | `Bestaetigung_Upload` | Upload/Bestätigung | Daten |  |
| 77 | `text-technische-mindestanforderung `␣ | Formulartext | Anzeige? | **Leerzeichen am Ende im Spaltennamen** |
| 78 | `Bestaetigung_TMA` | Upload/Bestätigung | Daten |  |
| 79 | `text-steuerung-anlage-trennliie` | Formulartext | Anzeige? |  |
| 80 | `text-info-messkonzept` | Formulartext | Anzeige? | **mehrfach vorhanden** |
| 81 | `text-vertragsbedingungen-beschlusskammer` | Formulartext | Anzeige? |  |
| 82 | `Bestaetigung_VB` | Upload/Bestätigung | Daten |  |
| 83 | `text-info-messkonzept` | Formulartext | Anzeige? | **mehrfach vorhanden** |
| 84 | `Daten_erhalten` | Upload/Bestätigung | Daten | Einwilligung — Nachweispflicht |
| 85 | `Datenschutz` | Upload/Bestätigung | Daten | Einwilligung — Nachweispflicht |
| 86 | `text-kundeninformation` | Formulartext | Anzeige? |  |

---

## Offene Fragen aus dieser Analyse

| # | Frage | An wen |
| --- | --- | --- |
| 1 | Verarbeitet SAP alle 86 Spalten oder nur einen Teil? | SAP-Betrieb |
| 2 | Sind die `text-*`-Spalten im Import inhaltlich relevant? | SAP-Betrieb |
| 3 | Was unterscheidet `Ladepunkt_Netzentnahmescheinleistung` von `netzentnahmescheinleistung`? | Fachbereich |
| 4 | Was bedeutet `RK_Leistung`? | Fachbereich |
| 5 | Verhältnis von `Modul_1_2` zu `Wahl_Modul_1` | Fachbereich |
| 6 | Wer setzt `lovion_id`, und zu welchem Zeitpunkt? | IT-Betrieb |
| 7 | Wie werden `Dateiupload` und `Ladepunkt_Dokumente` transportiert — Name, Pfad, Link? | IT-Betrieb |
| 8 | Was passiert bei mehr als zwei Zählern? | Fachbereich |
| 9 | Ist die Spaltenreihenfolge fix, oder erkennt SAP die Spalten am Namen? | SAP-Betrieb |
| 10 | Welche Kodierung, welches Trennzeichen, welches Zeilenende? | Originaldatei |
