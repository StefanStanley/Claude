# SK-XXX — <Kurzname der Schnittstelle>

> Kopiervorlage. Kursive Leitfragen beim Ausfüllen löschen.
> Abschnitte, die nicht zutreffen, mit „entfällt, weil …" begründen statt streichen —
> die Freigabe fragt sonst genau danach.

| | |
| --- | --- |
| **ID** | SK-XXX |
| **Version / Stand** | 0.1 — TT.MM.JJJJ |
| **Status** | Entwurf / in Freigabe / freigegeben / produktiv |
| **Fachlicher Owner** | |
| **Technischer Owner** | |
| **Beteiligte Systeme** | epilot ↔ <System B> |

---

## 1. Fachlicher Zweck

*Was wird fachlich erreicht? In drei Sätzen, ohne Technik. Wenn das nicht gelingt,
ist der Fluss noch nicht verstanden.*

**Auslösendes Ereignis:**
*Was genau passiert, damit Daten fließen? „Kunde reicht Anmeldung ein", „Monteur setzt
Status auf fertig", „täglich um 2 Uhr". Ein Ereignis, nicht mehrere.*

**Ergebnis / Nutzen:**
*Was ist danach besser? Idealerweise messbar — eingesparte Bearbeitungszeit,
wegfallende Rückfragen, verkürzte Durchlaufzeit.*

**Wegfallender Handbetrieb:**
*Was macht heute ein Mensch, das danach entfällt? Diese Zeile trägt später die
Wirtschaftlichkeit.*

**Mengengerüst:**

| | Wert |
| --- | --- |
| Vorgänge pro Monat | |
| Spitzenlast (Vorgänge pro Stunde) | |
| Datenvolumen je Vorgang | |
| Erwartetes Wachstum (2 Jahre) | |

*Gezählt, nicht geschätzt. Diese Zahlen entscheiden über synchron vs. asynchron.*

---

## 2. Systeme, Richtung und Verantwortung

**Datenfluss:**

```
<Quellsystem>  ──[ Auslöser: … ]──►  <Zielsystem>
```

*Ein Bild, notfalls als ASCII. Bei Rückkanal: zweiter Pfeil, oder besser ein eigenes
Konzept — Hin- und Rückrichtung sind zwei Schnittstellen.*

**Wer ruft wen:**
*Wichtig und oft verwechselt mit der Datenrichtung. Daten können von A nach B fließen,
obwohl B den Aufruf startet (Polling). Beides festhalten.*

### Führendes System

*Der wichtigste Abschnitt des Dokuments. Pro Datenobjekt genau ein System, das gewinnt.
Wenn ihr euch nicht einigen könnt, ist das keine Formalie, die man später klärt — dann
ist der fachliche Prozess noch nicht entschieden.*

| Datenobjekt | Führendes System | Begründung | Was passiert bei Änderung im anderen System? |
| --- | --- | --- | --- |
| | | | |

---

## 3. Datenobjekte und Feldmapping

**Fachliches Objekt:**
*z. B. „Netzanschlussanfrage". In epilot ist das ein Entity-Schema (Slug), im Gegensystem
ein Datensatz/Beleg. Beides benennen.*

| | epilot | <System B> |
| --- | --- | --- |
| Objektbezeichnung | Entity-Slug `…` | |
| Eindeutiger Schlüssel | | |

**Korrelations-ID:**
*Der gemeinsame, fachlich stabile Schlüssel, mit dem beide Seiten denselben Vorgang
wiedererkennen — auch nach einem Neustart, einer Wiederholung oder drei Monaten
Fehlersuche. Wer vergibt ihn, und wo wird er auf der Gegenseite gespeichert?*

### Feldmapping

| Quellfeld | Zielfeld | Typ | Pflicht | Umsetzung / Transformation | Beispielwert |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

*Auch die unangenehmen Fälle eintragen: Feld existiert auf der Gegenseite nicht,
Wertelisten stimmen nicht überein, Datumsformate, Einheiten, Nachkommastellen,
Feldlängen. Genau hier scheitern Projekte im Test, nicht im Konzept.*

**Wertelisten / Mappingtabellen:**
*Statuswerte, Anlagenarten, Anrede — jede Liste, die auf beiden Seiten unterschiedlich
heißt, gehört hier hin, vollständig.*

---

## 4. Technische Umsetzung

| | |
| --- | --- |
| **Verfahren** | synchron REST / Webhook (Push) / Polling / Datei-Batch |
| **Aufrufender** | |
| **Endpunkte** | |
| **Frequenz / Zeitpunkt** | |
| **Erwartete Antwortzeit** | |
| **Timeout** | |
| **Maximale Nutzlast** | |

*Faustregel: Wenn der Nutzer auf das Ergebnis wartet, synchron. Wenn nicht, asynchron —
das ist robuster, weil eine kurze Störung im Zielsystem den Vorgang nicht verliert.*

### Authentifizierung

**Richtung epilot → extern (Webhook):**
epilot signiert ausgehende Webhook-Aufrufe mit Ed25519. Der öffentliche Schlüssel wird
über `GET /v1/webhooks/.well-known/public-key` bezogen; die empfangende Seite **muss**
die Signatur prüfen. Alternativ unterstützt die Webhooks-API OAuth gegen das Zielsystem.

**Richtung extern → epilot (API-Aufruf):**
Bearer-JWT im `Authorization`-Header, ausgestellt über die Access Token API als
`token_type: api` mit expliziten Rollenzuweisungen und, wo möglich, `read_only: true`.
Details und Fallstricke: [`../epilot-api/authentifizierung.md`](../epilot-api/authentifizierung.md).

| | |
| --- | --- |
| Verwendeter Token-Typ / Technischer Nutzer | |
| Rollen und Berechtigungsumfang | *So eng wie möglich — nicht der Admin-Token aus der Einführungsphase.* |
| Gültigkeitsdauer und Erneuerung | *Wer erneuert wann? Ein ablaufender Token um 2 Uhr nachts ist ein vermeidbarer Störfall.* |
| Ablage der Zugangsdaten | *Secret-Store, nicht Konfigurationsdatei, nicht Repository.* |

### Idempotenz und Reihenfolge

*Was passiert, wenn dieselbe Nachricht zweimal ankommt? Ohne Antwort darauf erzeugt
jede Wiederholung eine Dublette. In epilot löst `PATCH /v1/entity/{slug}:upsert` mit
`unique_key` genau das — dieselbe Anfrage zweimal gesendet ergibt einen Datensatz.*

*Und: Ist die Reihenfolge relevant? Wenn Statusmeldung 2 vor Statusmeldung 1 ankommt —
was dann? Zeitstempel oder Sequenznummer mitführen.*

---

## 5. Fehlerbehandlung

| Fehlerklasse | Beispiel | Verhalten | Wer wird informiert |
| --- | --- | --- | --- |
| Fachlich (Daten unplausibel) | Pflichtfeld leer, unbekannte Zählernummer | *Keine Wiederholung — muss ein Mensch klären* | |
| Technisch, vorübergehend | Zielsystem nicht erreichbar, Timeout | *Wiederholung mit wachsendem Abstand* | |
| Technisch, dauerhaft | Authentifizierung abgelehnt, Endpunkt weg | *Sofort Alarm, keine stille Wiederholung* | |

| | |
| --- | --- |
| **Wiederholungsstrategie** | *Wie oft, in welchen Abständen, wann endgültig aufgeben?* |
| **Umgang mit endgültig gescheiterten Vorgängen** | *Wo landen sie, wer sieht sie, wie werden sie nachträglich eingespielt?* |
| **Nachträgliches Einspielen** | *Für epilot-Webhooks: `POST /v1/webhooks/configs/{configId}/events/{eventId}/replay` bzw. `…/replay-batch`.* |
| **Zustand des Vorgangs während der Störung** | *Was sieht der Sachbearbeiter, was sieht der Kunde?* |

*Der letzte Punkt wird fast immer vergessen und ist im Betrieb der teuerste:
ein Vorgang, der zwischen zwei Systemen verschwindet, kostet mehr als die
Schnittstelle eingespart hat.*

---

## 6. Betrieb

| | |
| --- | --- |
| Überwachung — was wird gemessen | *Mindestens: Durchsatz, Fehlerquote, Alter des ältesten unverarbeiteten Vorgangs.* |
| Alarmierung — Schwelle und Empfänger | |
| Protokollierung und Aufbewahrungsdauer | *Ohne personenbezogene Daten im Klartext.* |
| Ansprechpartner Betrieb (beide Seiten) | |
| Erreichbarkeit / Servicezeiten | |
| Geplante Wartungsfenster der Gegenseite | *Wie erfährt ihr davon, und was macht die Schnittstelle solange?* |
| Verhalten bei längerem Ausfall | *Ab wann wird auf Handbetrieb umgestellt, und wie kommen die Vorgänge danach nach?* |

---

## 7. Sicherheit und Datenschutz

| | |
| --- | --- |
| Personenbezogene Daten enthalten? | ja / nein — *wenn ja: welche Kategorien* |
| Rechtsgrundlage der Verarbeitung | |
| Eintrag im Verarbeitungsverzeichnis | *Referenz* |
| Auftragsverarbeitungsvertrag vorhanden | |
| Löschfristen und deren Umsetzung | *Auf beiden Seiten. Eine Schnittstelle, die Daten verteilt, verteilt auch die Löschpflicht.* |
| Transportverschlüsselung | *TLS-Version, Zertifikatsprüfung* |
| Netzzugang / Freigaben | *Ausgehend, eingehend, IP-Bereiche, Firewall-Antrag* |
| Schutzbedarf und ISMS-Einstufung | *Bei KRITIS-Nähe: eigene Bewertung notwendig* |

---

## 8. Test und Abnahme

| | |
| --- | --- |
| Testumgebungen beider Seiten | *epilot bietet dafür Sandbox- und Snapshot-APIs.* |
| Testdaten | *Keine Echtdaten mit Personenbezug in Testsystemen.* |
| Fachliche Testfälle | *Auch die unangenehmen: Sonderzeichen, Feldlängen, doppelte Übertragung, Abbruch mittendrin.* |
| Abnahmekriterien | *Woran wird festgestellt, dass die Schnittstelle funktioniert? Vorher festlegen.* |
| Vorgehen bei Inbetriebnahme | *Parallelbetrieb, Teilmenge, Rückfallebene* |

---

## 9. Offene Punkte und Entscheidungen

| # | Punkt | Wer entscheidet | Bis wann | Ergebnis |
| --- | --- | --- | --- | --- |
| 1 | | | | |

*Offene Punkte sind kein Makel — ein Konzept ohne sie ist meist nur nicht gründlich
genug gelesen worden. Wichtig ist, dass sie benannt sind und einen Namen tragen.*
