# SK-002 — Steuerbare Verbrauchseinrichtungen (§ 14a EnWG) aus epilot in SAP

> **Entwurf 0.2, Stand 07.09.2026.** Ausgangspunkt für die Bearbeitung der § 14a-Strecke.
> Was aus SK-001 übertragbar ist, steht hier verkürzt mit Verweis; was § 14a-spezifisch
> ist, steht als Frage. **Es ist bewusst nichts erfunden** — die Felder und Formate
> ergeben sich aus dem bestehenden Erzeugungscode und einer produktiven Originaldatei.

| | |
| --- | --- |
| **ID** | SK-002 |
| **Status** | Entwurf — Spaltenstruktur des Ist-Exports liegt vor |
| **Beteiligte Systeme** | epilot → Netzlaufwerk (CSV) → SAP |
| **Formularstrecke heute** | https://www.netz-duesseldorf.de/netzanschluss/steuerbare-verbrauchseinrichtungen/anmeldung-von-verbrauchseinrichtungen |

---

## 1. Ausgangslage

Wie bei SK-001: Die Anmeldung steuerbarer Verbrauchseinrichtungen läuft heute über das
Altportal, die Übergabe nach SAP erfolgt **automatisiert** über eine CSV auf dem
Netzlaufwerk. Die Formularstrecke wandert nach epilot, die Dateierzeugung muss mitwandern.

## 2. Die Vorabfrage — bevor alles andere

**Erzeugen § 14a und Einspeiser dasselbe Dateiformat über denselben Mechanismus?**

| Antwort | Konsequenz |
| --- | --- |
| **Ein Format, ein Mechanismus** | Ein Konzept mit zwei Ausprägungen genügt. Der Export-Lauf braucht zwei Konfigurationen, sonst nichts. Beide Strecken können gemeinsam abgelöst werden. |
| **Zwei Formate, ein Mechanismus** | Zwei Konfigurationen, ein Ablöseprojekt. Die Erhebung läuft zweimal, die Technik einmal. |
| **Zwei getrennte Erzeugungen** | Zwei Vorhaben mit eigener Erhebung, eigener Abnahme und eigener Reihenfolge. |

*Diese Frage entscheidet den Zuschnitt und ist mit einem Blick in den Erzeugungscode
beantwortet. Sie gehört an den Anfang.*

## 2a. Der Ist-Export: 86 Spalten

Die Spaltenüberschriften des heutigen Exports liegen vor. Die vollständige Auswertung
steht in [`bestand/14a_spaltenanalyse.md`](./bestand/14a_spaltenanalyse.md), die
Rohliste in [`bestand/14a_spalten_ist.txt`](./bestand/14a_spalten_ist.txt).

**Drei Fallstricke, die die Umsetzung unmittelbar betreffen:**

| Fund | Konsequenz |
| --- | --- |
| `text-info-messkonzept` steht **dreimal** in der Datei (Position 70, 80, 83) | Ein Mapping über Spaltennamen ist unmöglich. Die Zuordnung muss über die **Position** laufen — auch in der neuen Erzeugung. |
| `text-technische-mindestanforderung ` trägt ein **Leerzeichen am Ende** (Position 77) | Wer den Namen abtippt oder trimmt, erzeugt eine andere Datei. Fällt nur im byteweisen Vergleich auf. |
| Punkte, Schrägstrich und Umlaut in Spaltennamen (`ZS_1_1.8.1`, `text-voraussetzungen-modul1/2`, `…zugänglichkeit`) | Spaltennamen sind Zeichenketten, keine Pfade. Punktnotation im Mapping bricht daran. |

### Die strategisch wichtigste Beobachtung

**Der Export ist ein Formular-Abzug, kein zielsystemorientiertes Mapping.** Dafür sprechen
rund 18 `text-*`-Spalten mit reinen Anzeigetexten, fünf verschiedene Namensschemata
nebeneinander (`referenceNumber`, `Vorname_AB`, `text-info-messkonzept`, `lovion_id`,
`netzentnahmescheinleistung`) und die dreifach wiederholte Spalte.

> **Daraus folgt: Die Struktur der epilot-Formularstrecke ist Teil der
> Schnittstellenspezifikation.** Wer Felder umbenennt, umsortiert oder zusammenfasst,
> verändert die Datei und damit den SAP-Import. Formular und Export sind hier nicht
> getrennt — das schränkt die Freiheit beim Nachbau der Journey erheblich ein und gehört
> in die Planung, bevor jemand mit dem Formularbau beginnt.

**Die Aufwandsfrage dahinter:** Verarbeitet SAP alle 86 Spalten oder nur einen Teil?
Werden die Anzeigetexte beim Import ohnehin verworfen, müssen sie zwar formal in der
Datei stehen, ihr Inhalt ist aber gleichgültig. Das macht einen erheblichen Unterschied.

### Bedingte Pflichtfelder

`Art_der_SteuVE` ist der Diskriminator: Je nach Wert sind die Blöcke Wärmepumpe, Speicher
oder Ladepunkt befüllt, die übrigen leer. **Die Datei ist dünn besetzt.** Eine
Pflichtprüfung, die alle Felder immer verlangt, hält jeden Vorgang zurück — die Regeln
müssen an den Diskriminator gebunden werden. Vermutlich gilt dasselbe für `Messkonzept`,
`NSH`, `SLP` und `Modul_1_2`.

### Was in den Spalten schon sichtbar ist

- **`referenceNumber`** ist der Kandidat für die Korrelations-ID.
- **`lovion_id`** ist die Vorgangskennung im Altportal — **Lovion ist das abzulösende
  System.** Damit stellt sich die Frage, woher dieses Feld künftig kommt: Erzeugt epilot
  die Datei, gibt es keine Lovion-Kennung mehr. Bleibt Lovion im Prozess, ist der
  Zuschnitt dieses Konzepts ein anderer — siehe Abschnitt 2b.
- **`Datum_IBN`** und **`Modul_1_2`** sind die rechtlich kritischen Felder dieser Strecke.
- **Zwei Zähler** sind fest vorgesehen (`Z1`, `Z2`) mit OBIS-Ständen 1.8.1 und 1.8.2.
  Was bei drei Zählern passiert, ist offen.
- **`Dateiupload`** und **`Ladepunkt_Dokumente`** sind Dateiverweise — wie sie in einer
  CSV transportiert werden, ist zu klären.

## 2b. Zielbildfrage: Bleibt Lovion?

**Lovion ist das Altportal.** Es erzeugt heute die CSV und trägt seine Vorgangskennung
als `lovion_id` darin. Bevor dieses Konzept weitergeschrieben wird, muss geklärt sein,
welche Rolle Lovion künftig hat:

| Szenario | Zu bauende Schnittstelle | Folge für dieses Konzept |
| --- | --- | --- |
| **Lovion fällt für diesen Prozess weg** | epilot → SAP (CSV) | SK-002 gilt wie beschrieben. Offen: Was tritt an die Stelle der `lovion_id`, und kommt SAP ohne sie aus? |
| **Lovion bleibt Bearbeitungssystem**, epilot liefert nur die Anmeldung | epilot → Lovion | Die SAP-Strecke bleibt unberührt — Lovion erzeugt die Datei weiter. Dieses Konzept beschriebe dann den falschen Datenfluss und wäre neu zuzuschneiden. |
| **Übergangsphase mit beidem** | beide | Klare Trennregel nötig, welcher Vorgang über welchen Weg läuft. Sonst Dubletten in SAP. |

*Der Aufwand unterscheidet sich zwischen den Szenarien erheblich. Die Frage gehört
beantwortet, bevor Feldmapping oder Formularbau beginnen.*

## 3. Was fachlich anders ist als bei den Einspeisern

Die Strecken sehen technisch ähnlich aus, sind fachlich aber gegenläufig:

| | Einspeiser (SK-001) | § 14a (SK-002) |
| --- | --- | --- |
| Richtung | Erzeugung, Geld **an** den Betreiber | Verbrauch, Geld **vom** Kunden |
| Abrechnungswirkung | Einspeisevergütung | reduziertes Netzentgelt |
| Auslöser | Inbetriebsetzung der Erzeugungsanlage | Inbetriebnahme der steuerbaren Einrichtung |
| Zentrale Wahl | Vergütungsart | **Modulwahl** (pauschale oder prozentuale Reduzierung, zeitvariabel) |
| Steuerbarkeit | — | **zentral:** Steuerbarkeitsnachweis, Steuerbox, Anschlussart |

**Die Modulwahl ist bei § 14a das, was bei den Einspeisern die Vergütungsart ist:** Sie
steuert die Abrechnung in SAP und ist damit ein rechtlich kritisches Feld. Ob und wie sie
in der Datei transportiert wird, ist aus dem Bestand zu erheben.

### Vermutlich zusätzlich relevante Angaben

*Zu bestätigen anhand der Originaldatei — hier nur als Suchraster für die Erhebung:*

- Art der Einrichtung (Wärmepumpe, Ladeeinrichtung, Speicher, Klimatisierung)
- installierte bzw. maximale Bezugsleistung je Einrichtung
- Anzahl der Einrichtungen an einem Anschluss
- Steuerbarkeitsnachweis und Art der technischen Umsetzung
- Datum der Inbetriebnahme
- Marktlokation, Messlokation, Zählernummer
- gewähltes Modul der Netzentgeltreduzierung
- Verhältnis zu einer vorhandenen Erzeugungsanlage am selben Anschluss

## 4. Was unverändert aus SK-001 gilt

Diese Festlegungen sind strecken-unabhängig und hier nicht erneut zu diskutieren
— Begründungen in [SK-001](./SK-001-einspeiser-sap.md):

- Zielformat CSV, Ablage auf dem Netzlaufwerk, SAP-Seite unangetastet
- Selektion über einen Übertragungsstatus, nicht über einen Zeitraum
- erst Datei ablegen, dann Status setzen
- atomare Ablage per Umbenennung
- Kodierungsfehler nie still ersetzen
- Parallelbetrieb im Trockenlauf mit automatischem Dateivergleich als Einführungsweg
- Werkzeugwahl entscheidet sich an der Kodierung der Originaldatei

**Der Export-Lauf** in [`umsetzung/`](./umsetzung/) trägt diese Strecke ohne Änderung:
ein weiteres Dateiformat ist eine weitere Konfiguration.

## 5. Zu erheben

Dieselbe Reihenfolge wie bei SK-001, dieselbe [Erhebungsmappe](./erhebung/) — sie ist
formatunabhängig und lässt sich für § 14a mit angepasster Feldliste verwenden.

1. **Produktive Originaldatei mit Inhalten** — die Spaltennamen liegen vor, aber Kodierung,
   Trennzeichen, Zeilenende und die tatsächlichen Werte fehlen noch. Sie ist zugleich der
   Referenzsatz für den Abnahmevergleich.
2. **Zugang zum bestehenden Erzeugungscode** für die § 14a-Strecke
3. **Betriebserfahrung:** welche Fälle bleiben hängen, wie wird ein Importfehler bemerkt
4. **Gewollte Änderungen** — getrennt behandeln, erst gleichwertig ablösen

## 6. Offene Punkte

| # | Punkt | Entscheidet | Stand |
| --- | --- | --- | --- |
| 0 | **Bleibt Lovion im Prozess, oder wird es abgelöst?** Bestimmt den Zuschnitt | Programmleitung | offen |
| 1 | Ein Format oder zwei? Ein Erzeugungsmechanismus oder zwei? | IT-Architektur | offen |
| 2 | Reihenfolge: § 14a oder Einspeiser zuerst? | Programmleitung | offen |
| 3 | Zugang zum Erzeugungscode der § 14a-Strecke | IT-Betrieb | offen |
| 4 | Produktive Originaldatei beschaffen | Betrieb Altportal | offen |
| 5 | Wie wird die Modulwahl heute übertragen und in SAP verarbeitet? | Fachbereich + SAP-Betrieb | offen |
| 6 | Anschlüsse mit Erzeugung **und** steuerbarem Verbrauch — eine Datei oder zwei? | Fachbereich | offen |
| 7 | Mengengerüst aus dem Protokoll der bestehenden Erzeugung | IT-Betrieb | offen |
| 8 | **Verarbeitet SAP alle 86 Spalten oder nur einen Teil?** | SAP-Betrieb | offen |
| 9 | Erkennt SAP die Spalten an der Position oder am Namen? | SAP-Betrieb | offen |
| 10 | Woher kommt `lovion_id`, wenn epilot die Datei erzeugt? Kommt SAP ohne sie aus? | SAP-Betrieb | offen |
| 11 | Unterschied `Ladepunkt_Netzentnahmescheinleistung` / `netzentnahmescheinleistung` | Fachbereich | offen |
| 12 | Bedeutung von `RK_Leistung`; Verhältnis `Modul_1_2` zu `Wahl_Modul_1` | Fachbereich | offen |
| 13 | Transport der Dateiverweise (`Dateiupload`, `Ladepunkt_Dokumente`) | IT-Betrieb | offen |
| 14 | Verhalten bei mehr als zwei Zählern | Fachbereich | offen |

---

*Punkt 1 und 2 zuerst — sie entscheiden, ob dieses Dokument eigenständig bleibt oder in
SK-001 aufgeht.*
