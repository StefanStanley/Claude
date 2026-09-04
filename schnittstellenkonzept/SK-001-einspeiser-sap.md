# SK-001 — Einspeiseanlage aus epilot in SAP (EEG-Abrechnung)

> **Entwurf 0.1.** Der fachliche Teil (Abschnitte 1–3) ist aus der Prozesslogik für
> EEG-Einspeiseanlagen abgeleitet und sollte weitgehend tragen. Die technische Seite
> (Abschnitt 4) ist bewusst leer — sie hängt an Entscheidungen, die noch offen sind.
> Feldnamen auf der epilot-Seite sind Platzhalter, solange das Entity-Schema nicht steht.

| | |
| --- | --- |
| **ID** | SK-001 |
| **Version / Stand** | 0.1 — 04.09.2026 |
| **Status** | Entwurf |
| **Fachlicher Owner** | *offen* |
| **Technischer Owner** | Cluster Digitalisierung, Data & AI |
| **Beteiligte Systeme** | epilot → SAP (IS-U / FI-CA) |

---

## 0. Die zentrale Weichenstellung

Zwischen der Anmeldung im Portal und der Abrechnung in SAP liegt die
**Inbetriebsetzung**. Das ist kein Detail, sondern bestimmt den gesamten Zuschnitt
dieser Schnittstelle.

```
Anmeldung ──► Netzverträglichkeits- ──► Anschluss- ──► Errichtung ──► Inbetrieb- ──► SAP
 (epilot)      prüfung                   zusage         durch EFB      setzung       Stammdaten
                                                                       + Zählersetzung
                        │                                                    │
                        └──── hier ist noch nichts abrechnungsrelevant ──────┘
```

**Konsequenz:** Der Auslöser für die Übergabe an SAP ist **nicht** „Antrag eingereicht",
sondern „Inbetriebsetzung bestätigt und Zähler gesetzt".

Wer die Anmeldedaten direkt nach SAP schiebt, legt Stammdaten für Anlagen an, die noch
nicht existieren — und teils nie existieren werden. Erfahrungsgemäß wird ein erheblicher
Teil der Anmeldungen nie realisiert, und bei den realisierten weicht die tatsächlich
installierte Leistung häufig vom Antrag ab. Beides erzeugt in SAP Karteileichen und
falsche Vergütungsgrundlagen, die später niemand mehr sauber auseinanderdividiert.

*Zu prüfen: Wie hoch ist bei euch die Abbruchquote zwischen Anmeldung und IBS, und wie
oft weicht die installierte Leistung ab? Zwei Zahlen aus dem Bestand genügen, um diese
Entscheidung zu untermauern.*

---

## 1. Fachlicher Zweck

Nach bestätigter Inbetriebsetzung einer Einspeiseanlage entstehen in SAP automatisch die
Stammdaten, die für die Abrechnung der Einspeisevergütung nötig sind — ohne dass jemand
sie aus dem Portal abtippt.

**Auslösendes Ereignis:** Abschluss des Prozessschritts „Inbetriebsetzung bestätigt" im
epilot-Workflow, mit vorliegendem Inbetriebsetzungsprotokoll und gesetztem Zähler.

**Ergebnis / Nutzen:** Die erste Vergütungsabrechnung kann fristgerecht erfolgen. Der
Betreiber bekommt sein Geld, ohne dass die Abrechnung auf eine Handanlage wartet.

**Wegfallender Handbetrieb:** *Zu erheben — wie viele Minuten je Anlage werden heute für
die Stammdatenanlage in SAP aufgewendet, und wo entstehen dabei Rückfragen?*

**Mengengerüst:** *Zu erheben.*

| | Wert |
| --- | --- |
| Inbetriebsetzungen pro Monat | |
| Saisonale Spitze | *PV-Anlagen häufen sich im Frühjahr/Sommer* |
| Wachstum 2 Jahre | |

*Die Menge entscheidet über das Verfahren: bei wenigen Dutzend im Monat genügt ein
Tagesbatch, bei hunderten lohnt die ereignisgesteuerte Übergabe.*

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

*Der wichtigste Abschnitt für die Planung. Für jede Lücke braucht es eine Antwort, sonst
scheitert die Übergabe an unvollständigen Pflichtfeldern in SAP.*

| Fehlendes Feld | Woher es kommt | Lösungsansatz |
| --- | --- | --- |
| MaLo-ID | Vergabe durch den Netzbetreiber | *offen — Nachschlag aus dem Netzsystem, oder Vergabe in SAP selbst?* |
| Zählernummer, Zählwerke | Zählersetzung durch Messstellenbetrieb | *offen — Rückmeldung des Monteurs in epilot erfassen, oder aus dem Gerätesystem?* |
| Bankverbindung (IBAN) | wird im Anmeldeformular oft nicht abgefragt | **Empfehlung: in der Journey erheben** — nachträglich ist es Handarbeit je Fall |
| Umsatzsteuerstatus | Erklärung des Betreibers | **Empfehlung: in der Journey abfragen** |
| MaStR-Nummer | Registrierung durch den Betreiber, teils nach IBN | *offen — Nachreichung über das Portal, mit Nachfassen* |

**Die zwei Empfehlungen sind billig, wenn ihr sie jetzt umsetzt, und teuer später.**
Ein zusätzliches Feld in der Journey kostet eine Konfiguration; dieselben Daten
nachträglich bei tausend Betreibern einzusammeln kostet Monate.

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

*Bewusst offen. Die Frage ist nicht „welchen Endpunkt rufen wir auf", sondern
**wie ihr überhaupt an SAP herankommt** — und das ist eine organisatorische Entscheidung,
keine technische.*

**Zu entscheiden:**

| Frage | Anmerkung |
| --- | --- |
| Gibt es eine Middleware? | SAP Integration Suite / CPI, PI/PO, oder ein anderer Bus. Wenn ja, führt der Weg fast sicher darüber — dann ist eure Schnittstelle epilot → Middleware, und die SAP-Seite ist deren Sache. |
| Welches Verfahren nimmt SAP an? | OData-Service, IDoc, BAPI/RFC, Datei — hängt an Release und Betriebsmodell. |
| Wer betreibt und ändert die SAP-Seite? | Oft der eigentliche Engpass. Interne SAP-Abteilung, Dienstleister, Konzern-IT? |
| Synchron oder Batch? | Bei diesen Mengen ist ein Tagesbatch meist ausreichend und deutlich robuster. |

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

**Doppelte Anlage in SAP ist der teuerste Fehler dieser Strecke** — ein zweiter
Geschäftspartner zum selben Betreiber zieht sich durch die gesamte Abrechnung.
Deshalb: Prüfung auf die Korrelations-ID vor jedem Anlegen, und ein Abgleich auf
bestehende Geschäftspartner (Name, Adresse, Bankverbindung) vor der Neuanlage.

**Was der Betreiber merkt:** Nichts — solange die Erstabrechnung fristgerecht kommt.
*Zu klären: Ab welcher Verzögerung wird es kritisch, und wer überwacht das?*

---

## 6. Betrieb

*Nach der technischen Entscheidung auszufüllen. Die eine Kennzahl, die hier auf jeden
Fall hingehört: **Anzahl inbetriebgesetzter Anlagen ohne Stammdatensatz in SAP, nach
Alter.** Das ist die Zahl, die zeigt, ob die Strecke wirklich funktioniert — und die
niemand sieht, wenn man nur Fehlerquoten misst.*

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

*Nach der technischen Entscheidung auszufüllen. Zwingend im Testumfang:*

- Betreiber ≠ Antragsteller
- Anlage mit abweichender Ist-Leistung gegenüber dem Antrag
- Betreiber ohne Umsatzsteuerausweis (Kleinunternehmerregelung) und mit
- Zweite Anlage desselben Betreibers am selben Standort *(Erweiterung — Neuanlage oder Zuordnung?)*
- Doppelte Zustellung desselben Ereignisses
- Betreiberwechsel kurz nach IBS

---

## 9. Offene Punkte und Entscheidungen

| # | Punkt | Wer entscheidet | Ergebnis |
| --- | --- | --- | --- |
| 1 | Auslöser ist die bestätigte IBS, nicht die Anmeldung — Bestätigung durch den Fachbereich | Fachbereich Netzanschluss | offen |
| 2 | Wie kommt die MaLo-ID in den Datensatz? | Fachbereich + Marktkommunikation | offen |
| 3 | Wie kommen Zählernummer und Zählwerke aus der Zählersetzung nach epilot? | Messstellenbetrieb | offen |
| 4 | IBAN und Umsatzsteuerstatus in der Journey erheben? | Fachbereich + Abrechnung | offen |
| 5 | Nachreichung der MaStR-Nummer — Prozess und Nachfassen | Fachbereich | offen |
| 6 | SAP-Anbindungsweg (Middleware, Verfahren, Zuständigkeit) | IT-Architektur + SAP-Betrieb | offen |
| 7 | Änderungen nach Übergabe — eigener Änderungsdienst nötig? | Fachbereich + Abrechnung | offen |
