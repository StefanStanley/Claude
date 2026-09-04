# SK-001 — Einspeiseanlage aus epilot in SAP (EEG-Abrechnung)

> **Entwurf 0.2.** Kein Neubau, sondern die **Ablösung einer produktiven Schnittstelle**:
> Die Strecke Portal → SAP ist im Altportal bereits umgesetzt. Dieses Dokument beschreibt
> deshalb nicht, was man sich ausdenken müsste, sondern was aus dem Bestand zu übernehmen
> und was bewusst zu ändern ist. Feldnamen auf der epilot-Seite bleiben Platzhalter,
> solange das Entity-Schema nicht steht.

| | |
| --- | --- |
| **ID** | SK-001 |
| **Version / Stand** | 0.2 — 04.09.2026 |
| **Status** | Entwurf |
| **Fachlicher Owner** | *offen* |
| **Technischer Owner** | Cluster Digitalisierung, Data & AI |
| **Beteiligte Systeme** | epilot → SAP (IS-U / FI-CA) — ablösend für Altportal → SAP |

---

## 0. Ausgangslage: Ablösung, nicht Neubau

Die Strecke ist im Altportal produktiv umgesetzt. Übergabepunkt ist die bestätigte
Inbetriebsetzung — fachlich geklärt, hier nicht erneut zu diskutieren.

```
Anmeldung ──► Prüfung ──► Anschluss- ──► Errichtung ──► Inbetriebsetzung ──► SAP
                           zusage                        + Zählersetzung
```

**Was das für dieses Konzept bedeutet:** Das Feldmapping, die Transformationsregeln, die
Wertelisten und die Sonderfälle existieren bereits. Sie müssen nicht erfunden, sondern
**erhoben** werden. Das ist deutlich schneller — und deutlich zuverlässiger, weil die
bestehende Lösung alle Ausnahmen kennt, die über die Jahre aufgelaufen sind.

### Die entscheidende Architekturfrage

**Bleibt die SAP-Seite unverändert?**

| Fall | Konsequenz |
| --- | --- |
| **Quellsystemtausch** — SAP empfängt weiterhin dasselbe Format, nur der Absender wechselt | Das kleinere Projekt. epilot muss die bestehende Nachricht erzeugen, SAP-seitig ist nichts anzufassen. Die Abnahme ist ein Vergleich: gleiche Eingangsdaten, gleiche Nachricht. |
| **Beide Seiten neu** | Das größere Projekt mit eigenem SAP-Aufwand, eigener Abnahme und eigener Freigabekette. Nur sinnvoll, wenn die bestehende Schnittstelle fachlich nicht mehr trägt. |

*Diese Frage vor allem anderen klären — sie bestimmt Aufwand, Zeitplan und Beteiligte.*

### Was aus dem Altportal zu erheben ist

*Die eigentliche Konzeptarbeit. Reihenfolge nach Nutzen:*

**1. Produktive Nachrichten, nicht die Dokumentation.** Ein Jahr echter Übertragungen aus
dem Log exportieren und auswerten: Welche Felder sind tatsächlich immer befüllt, welche
nie, welche Werte kommen in den Schlüsselfeldern wirklich vor. Die Doku gewachsener
Schnittstellen weicht fast immer vom implementierten Stand ab — die Nachrichten lügen nicht.

**2. Die Sonderfälle.** In jeder produktiven Schnittstelle stecken Ausnahmen, die irgendwann
jemand eingebaut hat und die nirgends stehen. Sie sind der häufigste Grund, warum ein
Nachbau im Testbetrieb sauber aussieht und in Produktion auseinanderfällt. Sie finden sich
im Code — oder bei der Person, die die Strecke betreut. Diese Person zu sprechen ist der
mit Abstand wirksamste halbe Tag in diesem Vorhaben.

**3. Die Fehlerfälle aus dem Betrieb.** Was landet heute in Klärlisten, wie oft, und woran
liegt es? Das ist gleichzeitig euer Mengengerüst und die Vorlage für die Fehlerbehandlung
der neuen Strecke.

**4. Die bewussten Verbesserungen.** Was am Altportal ärgert, gehört benannt — aber
getrennt. Eine Ablösung, die gleichzeitig alles besser macht, wird nicht fertig.
Empfehlung: erst gleichwertig ablösen, Verbesserungen als eigene Vorhaben danach.

## 1. Fachlicher Zweck

Nach bestätigter Inbetriebsetzung einer Einspeiseanlage entstehen in SAP automatisch die
Stammdaten, die für die Abrechnung der Einspeisevergütung nötig sind — ohne dass jemand
sie aus dem Portal abtippt.

**Auslösendes Ereignis:** Abschluss des Prozessschritts „Inbetriebsetzung bestätigt" im
epilot-Workflow, mit vorliegendem Inbetriebsetzungsprotokoll und gesetztem Zähler.

**Ergebnis / Nutzen:** Die erste Vergütungsabrechnung kann fristgerecht erfolgen. Der
Betreiber bekommt sein Geld, ohne dass die Abrechnung auf eine Handanlage wartet.

**Mengengerüst:** *Aus dem Altportal-Log auszulesen — dort liegen die echten Zahlen, es
muss nichts geschätzt werden.*

| | Wert |
| --- | --- |
| Übertragungen pro Monat (Ist) | |
| Saisonale Spitze | |
| Anteil Übertragungen mit Nacharbeit | |
| Wachstum 2 Jahre | |

---

## 2. Systeme, Richtung und Verantwortung

```
epilot  ──[ Auslöser: IBS bestätigt ]──►  ( Middleware? )  ──►  SAP IS-U / FI-CA
```

**Wer ruft wen:** *Offen — abhängig von der SAP-Anbindung, siehe Abschnitt 4.*

### Führendes System

| Datenobjekt | Führend | Begründung |
| --- | --- | --- |
| Antrags- und Prozessdaten | **epilot** | Der Antragsprozess läuft dort, epilot bleibt die Akte des Vorgangs |
| Abrechnungsstammdaten nach IBS | **SAP** | Ab Übergabe ist SAP die Wahrheit; spätere Änderungen (Betreiberwechsel, Leistungserweiterung) laufen nicht mehr über epilot |
| Marktlokation (MaLo-ID) | **Netzbetreiber-System / Marktkommunikation** | Wird nicht in epilot vergeben — siehe Datenlücken unten |
| Zähler / Messlokation | **Messstellenbetrieb** | Entsteht bei der Zählersetzung |

**Der Übergabepunkt ist eine Einbahnstraße.** Nach erfolgreicher Übergabe ändert sich der
Datensatz in SAP unabhängig von epilot weiter. Was danach im Portal geändert wird, fließt
**nicht** automatisch nach. Wenn das fachlich nicht reicht, braucht es einen bewussten
Änderungsdienst — dann als eigenes Konzept SK-00x, nicht als Anhängsel hier.

---

## 3. Datenobjekte und Feldmapping

### Was SAP für die EEG-Abrechnung braucht

Ein Datensatz in epilot wird in SAP zu mehreren Objekten. Das ist der Grund, warum diese
Schnittstelle mehr ist als ein Feldmapping:

| SAP-Objekt | Inhalt | Quelle |
| --- | --- | --- |
| Geschäftspartner | Anlagenbetreiber | epilot — **Achtung: nicht zwingend der Antragsteller** |
| Vertragskonto (FI-CA) | Zahlungsdaten für die Auszahlung | teilweise epilot, Bankverbindung oft fehlend |
| Anschlussobjekt / Verbrauchsstelle | Standort der Anlage | epilot |
| Anlage (Einspeiseanlage) | technische Anlagendaten | epilot + IBS-Protokoll |
| Marktlokation (MaLo) | Zählpunktbezeichnung | **nicht aus epilot** |
| Gerät / Zähler | Zählernummer, Zählwerke | **nicht aus epilot** |
| Vertrag | Einspeisetarif, Vergütungsart | epilot + Tarifierung in SAP |

### Rechtlich kritische Felder

Diese fünf entscheiden über Geld und Fristen. Bei ihnen ist ein Übertragungsfehler kein
Schönheitsfehler, sondern ein Fall für die Nachberechnung:

| Feld | Warum kritisch |
| --- | --- |
| **Inbetriebnahmedatum** | Bestimmt den Vergütungssatz für die gesamte Förderdauer. Muss dem IBS-Protokoll entsprechen, nicht dem Antragsdatum. |
| **Installierte Leistung (kWp)** | Bestimmt die Vergütungsklasse und das Überschreiten gesetzlicher Schwellen; kann von der Antragsangabe abweichen — es zählt der Ist-Wert aus der IBS. |
| **MaStR-Nummer** | Ohne Registrierung im Marktstammdatenregister droht die Kürzung des Vergütungsanspruchs. Wird vom Betreiber selbst registriert, liegt bei IBS oft noch nicht vor. |
| **Vergütungsart** | Volleinspeisung / Überschusseinspeisung / Direktvermarktung — unterschiedliche Sätze und Abrechnungslogik. |
| **Umsatzsteuerstatus des Betreibers** | Die Vergütung wird per Gutschrift abgerechnet. Ob Umsatzsteuer auszuweisen ist, hängt am Status des Betreibers (Kleinunternehmerregelung oder Regelbesteuerung). Ein Klassiker unter den Abrechnungsfehlern. |

### Datenlücken — was epilot nicht liefern kann

Nicht alle Felder, die SAP braucht, entstehen im Portal. **Im Altportal ist für jedes
dieser Felder bereits ein Weg etabliert** — der ist zu erheben und zu bewerten, nicht neu
zu erfinden.

| Feld | Entsteht außerhalb des Portals | Im Altportal gelöst durch | Übernehmen? |
| --- | --- | --- | --- |
| MaLo-ID | Vergabe Netzbetreiber | *zu erheben* | |
| Zählernummer, Zählwerke | Zählersetzung | *zu erheben* | |
| Bankverbindung (IBAN) | Erklärung des Betreibers | *zu erheben* | |
| Umsatzsteuerstatus | Erklärung des Betreibers | *zu erheben* | |
| MaStR-Nummer | Registrierung durch den Betreiber | *zu erheben* | |

*Wo der bestehende Weg Handarbeit erfordert, ist die Ablösung die Gelegenheit, das Feld
stattdessen in der Journey zu erheben. Das ist aber eine Verbesserung im Sinne von Punkt 4
oben — bewusst entscheiden, nicht nebenbei mitnehmen.*

### Korrelations-ID

Die epilot-Entity-ID (`_id`) wird in SAP in einem Referenzfeld am Geschäftspartner oder
an der Anlage abgelegt und dient beiden Seiten als gemeinsamer Schlüssel.
*Zu klären: Welches SAP-Feld nimmt sie auf, und ist es suchbar?*

### Feldmapping

*Auszufüllen, sobald das epilot-Entity-Schema und die SAP-Zielfelder feststehen.
Diese Tabelle ist die eigentliche Arbeit des Konzepts.*

| Quellfeld (epilot) | SAP-Objekt | SAP-Feld | Pflicht | Transformation |
| --- | --- | --- | --- | --- |
| | | | | |

---

## 4. Technische Umsetzung

*Der bestehende Weg ist die Vorgabe, solange nichts dagegen spricht. Zu erheben statt
zu entwerfen:*

| Frage | Aus dem Bestand zu klären |
| --- | --- |
| Welchen Weg nimmt das Altportal? | Middleware (Integration Suite / CPI, PI/PO, anderer Bus) oder direkt? |
| Welches Verfahren? | OData, IDoc, BAPI/RFC, Datei |
| Wer betreibt die SAP-Seite? | Die Zuständigkeit ist meist der Engpass, nicht die Technik |
| Synchron, ereignisgesteuert oder Batch? | Was heute läuft, ist der Ausgangspunkt |

**Wenn eine Middleware im Spiel ist, ist das die gute Nachricht:** Dann endet eure
Schnittstelle dort, die SAP-Seite bleibt unberührt, und das Vorhaben schrumpft auf
epilot → Middleware im bestehenden Format.

**epilot-Seite** (steht bereits fest, siehe [`../epilot-api/`](../epilot-api/)):
Auslöser über Webhook auf ein Workflow-Ereignis; ausgehende Aufrufe werden von epilot
mit Ed25519 signiert (öffentlicher Schlüssel über `GET /v1/webhooks/.well-known/public-key`).
Lesende Nachfragen laufen über die Entity API mit einem Access Token vom Typ `api`,
`read_only: true`. Fehlgeschlagene Zustellungen lassen sich über die Replay-Endpunkte
der Webhooks-API nachträglich einspielen.

---

## 5. Fehlerbehandlung

| Fehlerklasse | Beispiel | Verhalten |
| --- | --- | --- |
| Fachlich unvollständig | MaStR-Nummer oder IBAN fehlt | **Keine Übergabe.** Vorgang bleibt in einer Klärliste, Nachforderung beim Betreiber |
| Fachlich unplausibel | Leistung weicht stark vom Antrag ab, IBN-Datum in der Zukunft | Prüfung durch Sachbearbeitung vor Übergabe |
| Technisch vorübergehend | SAP oder Middleware nicht erreichbar | Wiederholung, dann Alarm |
| Technisch dauerhaft | Pflichtfeld in SAP abgelehnt | Alarm, keine stille Wiederholung |

*Auch hier gilt: Die bestehende Fehlerbehandlung des Altportals ist die Vorlage. Was dort
heute in Klärlisten landet und wie oft, ist gleichzeitig die Anforderung an die neue
Strecke — und zeigt, wo sie besser sein sollte.*

**Zwei Punkte, die bei einer Ablösung neu hinzukommen:**

**Dubletten über die Systemgrenze.** Solange beide Portale Daten liefern können, muss
ausgeschlossen sein, dass derselbe Vorgang zweimal in SAP landet — einmal aus dem
Altportal, einmal aus epilot. Der Abgleich darf sich nicht allein auf die epilot-ID
stützen, denn die kennt das Altportal nicht.

**Vorgänge über dem Umstellzeitpunkt.** Anlagen, die im Altportal angemeldet, aber erst
nach der Umstellung in Betrieb gesetzt werden. Wer überträgt sie — und woher kommen die
Antragsdaten dafür?

---

## 6. Betrieb

*Übernehmt, was im Altportal überwacht wird, und ergänzt die eine Kennzahl, die dort
oft fehlt: **Anzahl inbetriebgesetzter Anlagen ohne Stammdatensatz in SAP, nach Alter.**
Sie zeigt, ob die Strecke wirklich trägt — eine reine Fehlerquote tut das nicht, denn
ein Vorgang, der gar nicht erst losläuft, erzeugt keinen Fehler.*

---

## 7. Sicherheit und Datenschutz

| | |
| --- | --- |
| Personenbezogene Daten | ja — Betreiber sind überwiegend Privatpersonen: Name, Anschrift, Bankverbindung, Steuermerkmale |
| Bankverbindung | erhöhter Schutzbedarf; Protokollierung nur maskiert |
| Rechtsgrundlage | *einzutragen* |
| Verarbeitungsverzeichnis | *Eintrag ergänzen* |
| Löschfristen | in SAP nach steuerlichen Aufbewahrungsfristen; in epilot davon abweichend — *bewusst zu entscheiden und zu dokumentieren* |
| Transport | TLS, Zertifikatsprüfung; bei Middleware zusätzlich die interne Strecke betrachten |

---

## 8. Test und Abnahme

**Die Ablösung hat ein Abnahmekriterium, das ein Neubau nicht hat: den Vergleich.**

Nehmt einen Satz realer, bereits übertragener Vorgänge aus dem Altportal, spielt dieselben
Eingangsdaten durch die neue Strecke und vergleicht die erzeugten Nachrichten Feld für
Feld. Jede Abweichung ist entweder ein Fehler oder eine bewusste Entscheidung — beides
muss benannt sein. Das ist belastbarer als jede Testfallliste, weil es genau die
Sonderfälle trifft, die niemand aufgeschrieben hat.

Ergänzend die Fälle, die im Bestand selten vorkommen und deshalb im Vergleichssatz
fehlen könnten: Betreiber ≠ Antragsteller, abweichende Ist-Leistung, Betreiberwechsel
kurz nach IBS, zweite Anlage am selben Standort.

**Inbetriebnahme:** Parallelbetrieb ist hier heikel — zwei Portale, die in dasselbe
SAP schreiben, brauchen eine klare Trennung, wer welchen Vorgang überträgt.
*Zu entscheiden: harter Stichtag oder Trennung nach Vorgangsart?*

---

## 9. Offene Punkte und Entscheidungen

| # | Punkt | Wer entscheidet | Ergebnis |
| --- | --- | --- | --- |
| 1 | **Bleibt die SAP-Seite unverändert (Quellsystemtausch) oder wird beidseitig neu gebaut?** | IT-Architektur + SAP-Betrieb | offen |
| 2 | Wer betreut die bestehende Schnittstelle im Altportal — und wann sprechen wir mit dieser Person? | Cluster | offen |
| 3 | Export produktiver Nachrichten aus dem Altportal für die Mapping-Erhebung | Betrieb Altportal | offen |
| 4 | Umstellung: harter Stichtag oder Parallelbetrieb mit Trennregel? | Fachbereich + IT | offen |
| 5 | Vorgänge, die im Altportal angemeldet und nach der Umstellung in Betrieb gesetzt werden | Fachbereich | offen |
| 6 | Bekannte Schwachstellen des Altportals — welche werden mit abgelöst, welche später? | Fachbereich + Cluster | offen |
| 7 | Änderungen nach Übergabe an SAP — wie heute gelöst, bleibt es dabei? | Abrechnung | offen |
