# SK-001 — Einspeiseanlage aus epilot in SAP (EEG-Abrechnung)

> **Entwurf 0.3.** Kein Neubau, sondern die **Ablösung einer produktiven Schnittstelle**:
> Die Strecke Portal → SAP ist im Altportal bereits umgesetzt. Dieses Dokument beschreibt
> deshalb nicht, was man sich ausdenken müsste, sondern was aus dem Bestand zu übernehmen
> und was bewusst zu ändern ist. Feldnamen auf der epilot-Seite bleiben Platzhalter,
> solange das Entity-Schema nicht steht.

| | |
| --- | --- |
| **ID** | SK-001 |
| **Version / Stand** | 0.3 — 04.09.2026 |
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

### Entschieden: Quellsystemtausch über CSV

**SAP konsumiert heute eine CSV, und das bleibt so.** SAP-seitig wird nichts angefasst.

Damit ist der Zuschnitt klar: Es ist zu erzeugen, was das Altportal erzeugt — dieselbe
Datei, am selben Ort, zur selben Zeit. Aus SAPs Sicht darf die Umstellung unsichtbar sein.
Das ist die risikoärmste Variante und macht die Abnahme zu einem Dateivergleich.

*Die Vorgabe gilt. Ob die CSV mittelfristig durch etwas anderes ersetzt wird, ist eine
eigene Diskussion zu einem anderen Zeitpunkt — sie gehört nicht in dieses Vorhaben.*

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

### Die Grundfrage: Wie kommt die Datei ins interne Netz?

epilot läuft als SaaS in der Cloud und kann nicht auf ein internes Netzlaufwerk oder ein
SAP-Verzeichnis schreiben. Zwischen epilot und dem Ablageort braucht es eine Komponente.
Zwei Wege sind möglich:

| | Push | **Pull (empfohlen)** |
| --- | --- | --- |
| Ablauf | epilot meldet jeden Vorgang per Webhook an eine intern erreichbare Komponente, die sammelt und die Datei schreibt | Ein Job im internen Netz fragt epilot zeitgesteuert ab (`POST /v1/entity:search`) und schreibt die Datei |
| Netzzugang | erfordert einen von außen erreichbaren Endpunkt im internen Netz | nur ausgehendes HTTPS |
| Wiederholbarkeit | Zustellungen müssen gepuffert werden; verpasste Ereignisse brauchen Replay | Job kann jederzeit erneut laufen und holt den aktuellen Stand |
| Betriebshoheit | verteilt | vollständig bei euch |

**Empfehlung Pull.** Der Ausschlag gibt der Netzzugang: Ein eingehender Endpunkt aus dem
Internet ins interne Netz ist ein Sicherheitsvorgang mit eigener Freigabekette und
entsprechender Laufzeit. Ausgehendes HTTPS habt ihr ohnehin. Dazu kommt, dass ein Pull-Job
von sich aus wiederholbar ist — bei einer Dateischnittstelle ohne Rückkanal ist das die
wichtigere Eigenschaft.

```
epilot (Cloud)  ◄──[ HTTPS, ausgehend ]──  Export-Job (intern)  ──►  Ablage  ──►  SAP
```

*Hinweis: epilot bringt mit `POST /v1/entity:export` einen eigenen CSV-Export mit. Der
liefert die Entity-Felder in epilot-Struktur, nicht im SAP-Format — als Abkürzung taugt er
deshalb nicht. Für einen manuellen Notweg ist er trotzdem gut zu kennen.*

### Selektion: über Status, nicht über Zeitraum

Welche Vorgänge kommen in den nächsten Lauf? Die naheliegende Antwort „alle seit dem
letzten Lauf" ist die falsche:

- **Nachzügler gehen verloren.** Ein Vorgang, der rückwirkend vervollständigt wird, fällt
  aus dem Zeitfenster und wird nie übertragen — ohne dass es auffällt.
- **Wiederholung erzeugt Dubletten.** Läuft der Job zweimal, ist derselbe Vorgang zweimal
  in der Datei.

Stattdessen: ein **Übertragungsstatus am Vorgang in epilot**. Der Job selektiert alles mit
Status „bereit, noch nicht übertragen", schreibt die Datei und setzt die Vorgänge danach
auf „übertragen". Das ist wiederholbar, lückenlos und jederzeit nachvollziehbar.

*Zu klären: Wie ist die Selektion im Altportal gelöst? Wenn dort über einen Zeitraum
selektiert wird, ist das eine der Schwachstellen, die man bei der Ablösung nicht mitnimmt.*

### Die Datei: was exakt zu erheben ist

**Nicht aus der Schnittstellendokumentation, sondern aus einer echten produktiven Datei.**
Eine Originaldatei im Hexeditor beantwortet die Hälfte dieser Fragen in zwei Minuten —
und zwar richtig, während die Doku oft einen früheren Stand beschreibt.

| Merkmal | Wert | Warum es zählt |
| --- | --- | --- |
| Zeichenkodierung | | **Der häufigste Fehler.** epilot liefert UTF-8; erwartet die Gegenseite Windows-1252 oder UTF-8 mit BOM, werden aus Umlauten in Namen und Straßen unbrauchbare Zeichen |
| Trennzeichen | | Semikolon oder Komma |
| Maskierung | | Was passiert, wenn das Trennzeichen im Feldinhalt vorkommt? Anführungszeichen, Verdopplung, oder gar keine Regel? |
| Zeilenende | | CRLF oder LF — SAP-Importe sind hier oft empfindlich |
| Dezimaltrennzeichen | | Komma oder Punkt bei der Leistung. Bei Komma **und** Semikolon als Trenner ist Maskierung zwingend |
| Datumsformat | | Beim Inbetriebnahmedatum kein Feld für Interpretation |
| Kopfzeile | | vorhanden oder nicht, und ist die Spaltenreihenfolge fix? |
| Leere Felder | | Leerstring, Platzhalter oder Feld entfällt |
| Feldlängen | | Wird gekürzt, abgelehnt, oder läuft es einfach durch? |

### Ablage und Übergabe

| | |
| --- | --- |
| Ablageort | *SFTP, Netzlaufwerk, SAP-Verzeichnis — zu erheben* |
| Dateinamensmuster | *Oft mit Zeitstempel oder laufender Nummer, und SAP erwartet es exakt* |
| Zeitpunkt / Takt | *Wann läuft der SAP-Import, und wie lange vorher muss die Datei liegen?* |
| Verhalten ohne Vorgänge | *Leere Datei mit Kopfzeile oder gar keine Datei? Import-Jobs reagieren darauf unterschiedlich — und ein Job, der auf eine Datei wartet, die nie kommt, meldet sich meist nicht* |
| Nachbehandlung | *Wer löscht oder archiviert die Datei nach dem Import?* |

**Atomare Übergabe — nicht verhandelbar.** Die Datei wird unter temporärem Namen
geschrieben und erst nach vollständigem Schreiben in den Zielnamen umbenannt. Andernfalls
holt der SAP-Job irgendwann eine halb geschriebene Datei ab und importiert einen
abgeschnittenen Bestand. Das passiert selten, fällt spät auf und ist mühsam zu
korrigieren. *Zu prüfen, ob das Altportal es so macht — falls nicht, ist es eine der
Verbesserungen, die man bei der Ablösung mitnimmt, weil sie nichts kostet.*

## 5. Fehlerbehandlung

| Fehlerklasse | Beispiel | Verhalten |
| --- | --- | --- |
| Fachlich unvollständig | MaStR-Nummer oder IBAN fehlt | **Keine Übergabe.** Vorgang bleibt in einer Klärliste, Nachforderung beim Betreiber |
| Fachlich unplausibel | Leistung weicht stark vom Antrag ab, IBN-Datum in der Zukunft | Prüfung durch Sachbearbeitung vor Übergabe |
| Technisch vorübergehend | SAP oder Middleware nicht erreichbar | Wiederholung, dann Alarm |
| Technisch dauerhaft | Pflichtfeld in SAP abgelehnt | Alarm, keine stille Wiederholung |

### Der wunde Punkt jeder Dateischnittstelle: keine Quittung

Eine CSV hat keinen Rückkanal. Wenn SAP die Datei nicht verarbeiten kann, erfährt die
liefernde Seite es nicht — es sei denn, jemand hat dafür etwas gebaut. Drei Fragen an den
Bestand, und zwar wörtlich so:

1. **Wie erfahrt ihr heute, dass ein Import fehlgeschlagen ist?** Gibt es ein
   Rückprotokoll, eine Mail, einen Blick in ein Protokoll — oder merkt es erst die
   Abrechnung?
2. **Was passiert bei einem Teilfehler?** Bricht der Import bei Zeile 47 ab, und sind die
   Zeilen davor dann verbucht oder nicht?
3. **Was passiert, wenn die Datei gar nicht erst abgeholt wird?** Das ist der stille Fall:
   Kein Fehler, keine Meldung, die Vorgänge stehen einfach nicht in SAP.

Solange es keine Quittung gibt, braucht es einen **Abgleich statt einer Fehlerquote**:
gelieferte Zeilen gegen angelegte Datensätze in SAP, regelmäßig und automatisch. Das ist
die einzige Kontrolle, die den stillen Fall aufdeckt.

*Die bestehende Fehlerbehandlung des Altportals ist im Übrigen die Vorlage: Was dort heute
in Klärlisten landet und wie oft, ist gleichzeitig die Anforderung an die neue Strecke.*

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
Eingangsdaten durch die neue Strecke und vergleicht die erzeugten Dateien **byteweise**
gegen das Original — nicht nur die Werte, sondern auch Kodierung, Trennzeichen,
Maskierung und Zeilenenden. Jede Abweichung ist entweder ein Fehler oder eine bewusste Entscheidung — beides
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
| 1 | ~~Bleibt die SAP-Seite unverändert?~~ | — | **entschieden: ja, CSV bleibt** |
| 2 | Produktive Originaldatei besorgen und Format exakt aufnehmen | Betrieb Altportal | offen |
| 3 | Ablageort, Dateinamensmuster und Abholzeitpunkt des SAP-Jobs | SAP-Betrieb | offen |
| 4 | Gibt es ein Rückprotokoll des Imports — und wie wird heute ein Fehlschlag bemerkt? | SAP-Betrieb | offen |
| 5 | Wer betreut die bestehende Strecke im Altportal — Termin vereinbaren | Cluster | offen |
| 6 | Wie selektiert das Altportal die zu übertragenden Vorgänge (Status oder Zeitraum)? | Betrieb Altportal | offen |
| 7 | Wo läuft der Export-Job künftig, und wer betreibt ihn? | IT-Betrieb | offen |
| 8 | Umstellung: harter Stichtag oder Parallelbetrieb mit Trennregel? | Fachbereich + IT | offen |
| 9 | Vorgänge, die im Altportal angemeldet und nach der Umstellung in Betrieb gesetzt werden | Fachbereich | offen |
| 10 | Bekannte Schwachstellen des Altportals — welche werden mit abgelöst, welche später? | Fachbereich + Cluster | offen |
