# SK-001 — Einspeiseanlage aus epilot in SAP (EEG-Abrechnung)

> **Entwurf 0.5.** Kein Neubau, sondern die **Ablösung einer produktiven Schnittstelle**:
> Die Strecke Portal → SAP ist im Altportal bereits umgesetzt. Dieses Dokument beschreibt
> deshalb nicht, was man sich ausdenken müsste, sondern was aus dem Bestand zu übernehmen
> und was bewusst zu ändern ist. Feldnamen auf der epilot-Seite bleiben Platzhalter,
> solange das Entity-Schema nicht steht.

| | |
| --- | --- |
| **ID** | SK-001 |
| **Version / Stand** | 0.5 — 04.09.2026 |
| **Status** | Entwurf — Entscheidungsvorlage Middleware |
| **Fachlicher Owner** | *offen* |
| **Technischer Owner** | Cluster Digitalisierung, Data & AI |
| **Beteiligte Systeme** | epilot → Netzlaufwerk (CSV) → SAP (IS-U / FI-CA) |

---

## 0. Ausgangslage: Automatisierung eines Handprozesses

Heute wird die CSV **manuell** erzeugt und auf einem **Netzlaufwerk** abgelegt, von dort
holt SAP sie ab. Es gibt also keine bestehende Schnittstelle, die abgelöst wird — es gibt
einen Menschen, der die Schnittstelle ist.

```
Anmeldung ──► Prüfung ──► Anschlusszusage ──► Errichtung ──► Inbetriebsetzung
                                                                    │
                                                        ┌───────────┘
                                                        ▼
                                              [ Handarbeit: CSV erzeugen ]
                                                        │
                                                        ▼
                                              Netzlaufwerk ──► SAP
```

**Was das für dieses Vorhaben bedeutet:**

**Die gute Nachricht — der technische Weg ist der einfachste denkbare.** Netzlaufwerk statt
SFTP oder Middleware heißt: ein Job im internen Netz, der die Datei genau dorthin schreibt,
wo sie heute von Hand landet. Nach außen braucht es nur ausgehendes HTTPS zu epilot. Keine
eingehende Freigabe, keine Middleware, keine Änderung auf der SAP-Seite.

**Die eigentliche Arbeit liegt woanders.** Wer heute die Datei erzeugt, tut mehr als
kopieren: Er entscheidet, welche Vorgänge reif sind. Er sieht, wenn eine Angabe unplausibel
ist. Er weiß, was bei Sonderfällen zu tun ist, und ruft im Zweifel jemanden an. **Diese
Prüfung ist nirgends aufgeschrieben, und sie fällt weg, sobald ein Job die Datei schreibt.**

Das ist der übliche Grund, warum die Automatisierung eines Handprozesses schiefgeht: Nicht
die Technik, sondern das stillschweigende Urteilsvermögen, das mit wegautomatisiert wird.

### Die zwei Quellen

| Quelle | Liefert |
| --- | --- |
| **Eine produktive CSV** | Das exakte Zielformat. SAP frisst sie — damit ist sie die verbindliche Spezifikation, unabhängig davon, was irgendwo dokumentiert ist. |
| **Die Person, die sie erzeugt** | Alles andere: Selektion, Prüfungen, Sonderfälle, Takt, was bei Fehlern passiert. Die mit Abstand wichtigere Quelle. |

### Fragen an die Person, die es heute macht

*Ein Termin, eine Stunde. Das ist die Konzeptarbeit — nicht das Ausfüllen von Vorlagen.*

**Auswahl**
- Woran erkennst du, welche Vorgänge in die nächste Datei gehören?
- Kommt es vor, dass ein Vorgang eigentlich reif wäre, du ihn aber bewusst zurückhältst? Warum?
- Wie stellst du sicher, dass keiner doppelt geht — und keiner vergessen wird?

**Prüfung**
- Worauf schaust du, bevor du die Datei ablegst?
- Wann hast du zuletzt einen Vorgang wegen einer Auffälligkeit herausgenommen? Was war es?
- Bei welchen Angaben rufst du im Zweifel jemanden an?

**Sonderfälle**
- Welche Fälle behandelst du anders als den Normalfall?
- Gibt es Vorgänge, die du gar nicht über die Datei schickst, sondern anders?

**Ablauf**
- Wie oft machst du das, und wann?
- Was passiert, wenn du im Urlaub bist?
- Woher weißt du, dass SAP die Datei verarbeitet hat? Was war das letzte Mal, dass etwas
  schiefging, und wie hast du es gemerkt?

**Zeitaufwand**
- Wie lange dauert ein Durchgang, und was davon ist die eigentliche Prüfung?

*Die Antwort auf die letzte Frage ist euer Nutzenargument. Die Antworten auf „Prüfung" und
„Sonderfälle" sind die Anforderungen, ohne die die Automatisierung Schaden anrichtet.*

### Einführung in zwei Stufen

Weil der Prozess heute manuell ist, gibt es einen risikoarmen Weg — nutzt ihn:

**Stufe 1 — Job erzeugt, Mensch gibt frei.** Der Job schreibt die Datei in einen
Prüfordner. Die Person, die es heute macht, sieht sie durch und verschiebt sie auf das
Netzlaufwerk. Der Zeitaufwand sinkt sofort, das Risiko bleibt bei null, und jede Abweichung
fällt genau der Person auf, die sie erkennen kann.

**Stufe 2 — Job schreibt direkt.** Nach einer vereinbarten Zahl beanstandungsfreier Läufe
entfällt der Handgriff. Die Prüfungen, die in Stufe 1 aufgefallen sind, sind bis dahin als
Regeln im Job abgebildet.

*Stufe 1 ist keine Zwischenlösung, sondern die Testphase mit Produktivdaten — und sie
kostet fast nichts.*

## 1. Fachlicher Zweck

Nach bestätigter Inbetriebsetzung einer Einspeiseanlage entstehen in SAP automatisch die
Stammdaten, die für die Abrechnung der Einspeisevergütung nötig sind — ohne dass jemand
sie aus dem Portal abtippt.

**Auslösendes Ereignis:** Abschluss des Prozessschritts „Inbetriebsetzung bestätigt" im
epilot-Workflow, mit vorliegendem Inbetriebsetzungsprotokoll und gesetztem Zähler.

**Ergebnis / Nutzen:** Die Übertragung läuft ohne Handgriff und ohne Abhängigkeit von einer
einzelnen Person. Die erste Vergütungsabrechnung kann fristgerecht erfolgen, auch in
Urlaubszeiten und bei steigenden Anlagenzahlen.

*Der bezifferbare Teil: Zeitaufwand je Durchgang × Anzahl Durchgänge. Zu erheben im
Gespräch, siehe Abschnitt 0.*

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
epilot (Cloud)  ◄──[ HTTPS, ausgehend ]──  Export-Job (intern)  ──►  Netzlaufwerk  ──►  SAP
```

**Der Job braucht:** ausgehendes HTTPS zu epilot, Schreibrecht auf dem Netzlaufwerk, einen
Ort zum Laufen (Server oder Scheduler im internen Netz) und eine Ablage für das
Zugangstoken. Mehr nicht — keine eingehende Freigabe, keine neue Komponente in der DMZ.

*Hinweis: epilot bringt mit `POST /v1/entity:export` einen eigenen CSV-Export mit. Der
liefert die Entity-Felder in epilot-Struktur, nicht im SAP-Format — als Abkürzung taugt er
deshalb nicht. Für einen manuellen Notweg ist er trotzdem gut zu kennen.*

### Werkzeugwahl: Power Automate oder Databricks

Beide stehen zur Verfügung, und beide haben genau eine Schwachstelle für diesen
Anwendungsfall — die jeweils andere.

| | Power Automate | Databricks on Azure |
| --- | --- | --- |
| **Erreicht das Netzlaufwerk** | **ja**, über den On-Premises Data Gateway — genau dafür gebaut | **nein**, schreibt nach Blob/ADLS; SMB braucht zusätzliche Anbindung oder einen zweiten Schritt |
| **Byte-genaue CSV** | **schwach** — schreibt UTF-8; Kodierung, BOM und Zeilenenden sind nur über fragile Umwege steuerbar | **volle Kontrolle** — Kodierung, Trennzeichen, Maskierung, Zeilenende exakt wie gefordert |
| Prüfregeln aus dem Interview | in einer GUI zusammengeklickt, ab mittlerer Komplexität schlecht wartbar | normaler Code, testbar |
| Versionierung, Review | schwach | Git, wie jeder andere Code |
| Aufwand für einen kleinen Lauf | gering | Overhead — es ist ein Big-Data-Werkzeug für eine Datei mit dreistelliger Zeilenzahl |
| Betriebskosten | Lizenz (HTTP-Konnektor ist Premium) | Cluster-Laufzeit je Lauf |

**Die Entscheidung hängt an einem Byte.** Konkret an der Kodierung der heutigen Datei:

- **Zieldatei ist UTF-8 ohne BOM** → Power Automate allein genügt. Der einfachste Weg,
  eine Komponente, kein Bruch.
- **Zieldatei ist Windows-1252 / ISO-8859-1 oder UTF-8 mit BOM** → Power Automate scheidet
  für die Erzeugung aus. Was dabei herauskommt, sieht in der Vorschau richtig aus und
  zerlegt in SAP jeden Umlaut.

*Deutsche SAP-Umfelder mit gewachsenen Dateiimporten liegen erfahrungsgemäß häufiger beim
zweiten Fall. Sicher weiß man es erst, wenn jemand die Originaldatei im Hexeditor
aufmacht — das ist eine Aufgabe von zehn Minuten und sollte vor der Werkzeugentscheidung
erledigt sein.*

### Empfehlung: Arbeitsteilung

Unabhängig vom Ausgang der Kodierungsfrage trägt diese Aufteilung — und sie lässt sich
später auf eine Komponente zusammenziehen, wenn sich die einfache Variante bestätigt:

```
epilot  ◄─[ HTTPS ]─  Databricks Job  ──►  Blob/ADLS  ──►  Power Automate  ──►  Netzlaufwerk  ──►  SAP
                      Abruf, Prüfung,      abgelegte      + Data Gateway
                      CSV-Erzeugung        Datei          (Kopie + Umbenennung)
```

**Databricks erzeugt, Power Automate stellt zu.** Jedes Werkzeug macht das, worin es stark
ist: Databricks die byte-genaue Datei und die Prüflogik, Power Automate den letzten Meter
ins interne Netz, wofür der Gateway ohnehin existiert.

Drei Gründe für Databricks bei der Erzeugung:

1. **Das Dateiformat ist die harte Anforderung.** SAP nimmt die Datei oder nicht.
   Volle Kontrolle darüber ist nicht verhandelbar.
2. **Die Prüfregeln werden echter Code.** Was im Gespräch mit der Sachbearbeitung
   herauskommt, ist Logik mit Sonderfällen — in einem Flow zusammengeklickt wird sie
   unwartbar, in Python bleibt sie lesbar und testbar.
3. **Diese Schnittstelle liefert Vergütungsgrundlagen.** Versionierung, Review und
   automatisierte Tests sind hier keine Kür.

*Der ehrliche Einwand: Databricks ist für diese Datenmenge überdimensioniert. Das ist
vertretbar, wenn ihr die Plattform ohnehin betreibt — dann ist der Grenzaufwand ein Job
mehr. Falls nicht, ist eine Azure Function das passendere Werkzeug für dieselbe Rolle;
die Architektur bleibt identisch.*

### Ablage des Zugangstokens

Der epilot-Access-Token (`token_type: api`, `read_only: true`) gehört in den Azure Key
Vault, nicht in ein Notebook und nicht in eine Flow-Variable. Erneuerung vor Ablauf
einplanen — ein Token, der nachts ausläuft, ist ein vermeidbarer Störfall.

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
| Ablageort | Netzlaufwerk — **genauer Pfad und Schreibrechte für den Job zu klären** |
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

### Heute ist die Kontrolle ein Mensch

Solange die Datei von Hand erzeugt wird, ist die Fehlerkontrolle implizit: Wer die Datei
baut, sieht dabei, ob etwas nicht stimmt. Diese Kontrolle fällt mit der Automatisierung
weg und muss ersetzt werden — durch Regeln im Job für das, was prüfbar ist, und durch eine
Klärliste für alles, was ein Mensch entscheiden muss.

**Was im Zweifel gilt: nicht liefern.** Ein Vorgang, der in der Klärliste hängt, ist ein
sichtbares Problem. Ein Vorgang, der mit falschen Werten in SAP landet, ist ein unsichtbares
— und die falschen Werte sind hier Vergütungsgrundlagen.

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

## 8a. Umsetzung in Phasen

*Größenordnungen für die Planung, keine belastbare Schätzung — sie setzen voraus, dass
das epilot-Entity-Schema für Netzanschlussanfragen steht.*

| Phase | Inhalt | Größenordnung |
| --- | --- | --- |
| **1 — Erhebung** | Gespräch mit der Sachbearbeitung, Originaldatei aufnehmen, Format byteweise dokumentieren, Kodierungsfrage klären | 2–3 PT |
| **2 — Entscheidung** | Werkzeug festlegen (folgt aus Phase 1), Zielpfad und Rechte klären | 1 PT |
| **3 — epilot** | Übertragungsstatus am Vorgang, fehlende Felder in der Journey ergänzen | 2–4 PT |
| **4 — Erzeugung** | Abruf, Transformation, CSV-Erzeugung, Ablage | 5–8 PT |
| **5 — Prüfregeln** | Was in Phase 1 als implizite Prüfung aufgetaucht ist, als Regeln mit Klärliste | 2–3 PT |
| **6 — Zustellung** | Flow mit Gateway, atomare Übergabe per Umbenennung | 1–2 PT |
| **7 — Vergleichstest** | Reale Altvorgänge durchspielen, Dateien byteweise vergleichen | 3–5 PT |
| **8 — Stufe 1 im Betrieb** | Job schreibt in den Prüfordner, Freigabe von Hand | 4–6 Wochen Laufzeit |
| **9 — Umstellung** | Direktschreiben, Abgleichskennzahl aktiv | 1 PT |

**Kritischer Pfad ist Phase 1.** Ohne die Originaldatei ist die Werkzeugentscheidung nicht
zu treffen, und ohne das Gespräch fehlen die Prüfregeln. Beides ist in einer Woche
machbar, wenn die Termine stehen.

## 9. Offene Punkte und Entscheidungen

| # | Punkt | Wer entscheidet | Ergebnis |
| --- | --- | --- | --- |
| 1 | ~~Bleibt die SAP-Seite unverändert?~~ | — | **entschieden: ja, CSV bleibt** |
| 2 | ~~Ablageort?~~ | — | **entschieden: Netzlaufwerk** |
| 3 | **Gespräch mit der Person, die die Datei heute erzeugt** (Fragen in Abschnitt 0) | Cluster | offen |
| 4 | Produktive Originaldatei besorgen, Format byteweise aufnehmen | Fachbereich | offen |
| 5 | Genauer Pfad auf dem Netzlaufwerk, Schreibrechte für den Job | IT-Betrieb | offen |
| 6 | Wann läuft der SAP-Import — fester Job oder manuell angestoßen? | SAP-Betrieb | offen |
| 7 | Wie wird heute bemerkt, dass ein Import fehlgeschlagen ist? | SAP-Betrieb + Fachbereich | offen |
| 8 | Werkzeug: Power Automate allein oder Databricks + Power Automate — **entscheidet sich an der Kodierung der Originaldatei** | IT-Architektur | offen |
| 8b | Betreibt ihr Databricks bereits produktiv? Falls nein, Azure Function als Alternative prüfen | IT-Architektur | offen |
| 9 | Selektionsregel: Übertragungsstatus in epilot einführen | Cluster + Fachbereich | offen |
| 10 | Stufe 1 (Prüfordner): Dauer und Kriterium für den Übergang auf Stufe 2 | Fachbereich | offen |
| 11 | Vertretungsregel — heute personenabhängig, künftig? | Fachbereich | offen |
