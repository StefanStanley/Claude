# SK-001 — Einspeiseanlage aus epilot in SAP (EEG-Abrechnung)

> **Entwurf 0.6.** Kein Neubau, sondern die **Ablösung einer produktiven Schnittstelle**:
> Die Strecke Portal → SAP ist im Altportal bereits umgesetzt. Dieses Dokument beschreibt
> deshalb nicht, was man sich ausdenken müsste, sondern was aus dem Bestand zu übernehmen
> und was bewusst zu ändern ist. Feldnamen auf der epilot-Seite bleiben Platzhalter,
> solange das Entity-Schema nicht steht.

| | |
| --- | --- |
| **ID** | SK-001 |
| **Version / Stand** | 0.6 — 07.09.2026 |
| **Status** | Entwurf — Entscheidungsvorlage Middleware |
| **Fachlicher Owner** | *offen* |
| **Technischer Owner** | Cluster Digitalisierung, Data & AI |
| **Beteiligte Systeme** | epilot → Netzlaufwerk (CSV) → SAP (IS-U / FI-CA) |

---

## 0. Ausgangslage: Ablösung einer laufenden Schnittstelle

Die CSV für SAP wird heute **automatisiert erzeugt** und auf einem Netzlaufwerk abgelegt.
Das gilt für zwei Strecken:

| Strecke | Gegenstand |
| --- | --- |
| **Einspeiser** | Einspeiseanlagen, Stammdaten für die EEG-Abrechnung — dieses Konzept |
| **§ 14a EnWG** | steuerbare Verbrauchseinrichtungen (Wärmepumpen, Wallboxen, Speicher) — eigenes Konzept, siehe unten |

Abgelöst wird also eine **produktiv laufende, automatisierte Schnittstelle**. Nicht die
Erzeugung ist neu, sondern das Quellsystem: Die Formularstrecke wandert vom Altportal
nach epilot, und die dahinterliegende Dateierzeugung muss mitwandern.

```
Formularstrecke ──► Vorgangsbearbeitung ──► automatische ──► Netzlaufwerk ──► SAP
  (wandert nach                              Dateierzeugung
   epilot)                                   (muss mitwandern)
```

### Was das für dieses Konzept bedeutet

**Die bestehende Erzeugung ist die Spezifikation.** Feldmapping, Transformationsregeln,
Wertelisten, Prüfungen und Sonderfälle sind implementiert und laufen. Sie müssen nicht
erdacht, sondern **aus dem Bestand übernommen** werden — aus dem Quellcode und aus
produktiven Dateien, nicht aus einer Beschreibung.

**Der Auslöser ist nicht Effizienz, sondern Ablösungszwang.** Es fällt keine Handarbeit
weg. Die Strecke muss weiterlaufen, wenn das Altportal abgeschaltet wird. Das ist für die
Priorisierung wichtig: Der Termin ergibt sich aus dem Abschalttermin des Altportals, nicht
aus einem Nutzenversprechen.

**Aus Sicht von SAP darf sich nichts ändern.** Gleiches Format, gleicher Ort, gleicher
Takt. Damit wird die Abnahme zu einem Dateivergleich — dem verlässlichsten Kriterium,
das eine Ablösung haben kann.

### Was aus dem Bestand zu erheben ist

*Reihenfolge nach Nutzen:*

**1. Der Erzeugungscode.** Er enthält das vollständige Mapping einschließlich aller
Sonderfälle, die über die Jahre eingebaut wurden. Zugang dazu ist der wichtigste
Einzelschritt dieses Vorhabens.

**2. Produktive Dateien, nicht die Dokumentation.** Ein Satz echter Übertragungen zeigt,
welche Felder tatsächlich befüllt sind und welche Werte in den Schlüsselfeldern wirklich
vorkommen. Bei gewachsenen Schnittstellen weicht die Dokumentation regelmäßig vom
implementierten Stand ab. Diese Dateien sind gleichzeitig der Referenzsatz für die Abnahme.

**3. Die Betriebserfahrung.** Wer die Strecke betreut, kennt die Fälle, die regelmäßig
hängenbleiben, und weiß, wie ein fehlgeschlagener Import bemerkt wird. Ein Gespräch von
einer Stunde — nicht mehr die Konzeptarbeit selbst, aber die Absicherung gegen das,
was im Code nicht sichtbar ist.

**4. Die gewollten Änderungen.** Was an der heutigen Strecke stört, gehört benannt, aber
getrennt. Eine Ablösung, die gleichzeitig alles verbessert, wird nicht fertig. Empfehlung:
erst gleichwertig ablösen, Verbesserungen als eigene Vorhaben danach.

### Verhältnis zur § 14a-Strecke

Beide Strecken erzeugen eine CSV für SAP, beide hängen an einer Formularstrecke, die nach
epilot wandert. Ob es sich um dasselbe Dateiformat, denselben Erzeugungsmechanismus und
denselben Zielprozess in SAP handelt, ist **offen und vorrangig zu klären** — davon hängt
ab, ob ein Konzept mit zwei Ausprägungen genügt oder zwei getrennte Konzepte nötig sind.

Für die technische Umsetzung ist die Antwort weniger kritisch: Der Export-Lauf ist
konfigurationsgetrieben gebaut. Zwei Formate bedeuten zwei Konfigurationen, nicht
zwei Programme.

## 1. Fachlicher Zweck

Nach bestätigter Inbetriebsetzung einer Einspeiseanlage entstehen in SAP automatisch die
Stammdaten, die für die Abrechnung der Einspeisevergütung nötig sind — ohne dass jemand
sie aus dem Portal abtippt.

**Auslösendes Ereignis:** Abschluss des Prozessschritts „Inbetriebsetzung bestätigt" im
epilot-Workflow, mit vorliegendem Inbetriebsetzungsprotokoll und gesetztem Zähler.

**Ergebnis / Nutzen:** Die Übertragung läuft nach der Ablösung des Altportals unverändert
weiter. Die Vergütungsabrechnung bleibt fristgerecht möglich.

*Der Nutzen dieses Vorhabens ist die Aufrechterhaltung des Betriebs, nicht eine Einsparung.
Das ist keine Schwäche des Vorhabens, sondern seine Begründung: Ohne die Ablösung bricht
eine produktive Strecke weg.*

**Mengengerüst:** *Aus dem Protokoll der bestehenden Erzeugung auszulesen — dort liegen
die echten Zahlen, es muss nichts geschätzt werden.*

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

Nicht alle Felder, die SAP braucht, entstehen in der Formularstrecke. **Die bestehende
Erzeugung holt sie heute bereits von irgendwoher** — der Weg ist im Code nachvollziehbar
und zu übernehmen, nicht neu zu erfinden.

| Feld | Entsteht außerhalb der Formularstrecke | Bestehende Erzeugung holt es aus | Übernehmen? |
| --- | --- | --- | --- |
| MaLo-ID | Vergabe Netzbetreiber | *zu erheben* | |
| Zählernummer, Zählwerke | Zählersetzung | *zu erheben* | |
| Bankverbindung (IBAN) | Erklärung des Betreibers | *zu erheben* | |
| Umsatzsteuerstatus | Erklärung des Betreibers | *zu erheben* | |
| MaStR-Nummer | Registrierung durch den Betreiber | *zu erheben* | |

*Kommt ein Feld heute aus einem System, das epilot nicht erreicht, ist das ein echter
Klärungspunkt für die Architektur — dann braucht der neue Lauf entweder denselben Zugang
oder das Feld muss in der Formularstrecke erhoben werden.*

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

### Die Prüfungen stehen im Bestand

Welche Vorgänge die bestehende Erzeugung zurückhält und warum, ist implementiert. Diese
Regeln sind zu übernehmen — sie sind über Jahre an realen Fällen gewachsen und enthalten
Ausnahmen, die niemand aus dem Kopf rekonstruiert.

Zwei Dinge sind trotzdem aktiv zu klären, weil sie im Code oft nicht sichtbar sind:
Was passiert heute mit einem zurückgehaltenen Vorgang, und wer sieht ihn? Und: Welche
Fälle bleiben regelmäßig hängen? Beides beantwortet die Betriebserfahrung, nicht der
Quellcode.

**Grundsatz bleibt: im Zweifel nicht liefern.** Ein Vorgang in der Klärliste ist ein
sichtbares Problem, ein falscher Wert in SAP ein unsichtbares — und die Werte hier sind
Vergütungsgrundlagen.

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

**Inbetriebnahme — Parallelbetrieb im Trockenlauf.** Weil die alte Strecke bis zur
Abschaltung des Altportals weiterläuft, lässt sich die neue daneben betreiben, ohne dass
sie liefert: Der neue Lauf erzeugt seine Datei in ein Prüfverzeichnis, die alte Strecke
liefert weiterhin nach SAP. Beide Dateien werden automatisch verglichen. Erst wenn sie
über einen vereinbarten Zeitraum übereinstimmen, wird umgeschaltet.

Das ist die stärkste Absicherung, die dieses Vorhaben haben kann, und sie kostet fast
nichts. Wichtig dabei: **Nur eine Strecke schreibt nach SAP.** Zwei Quellen, die in
dasselbe Zielverzeichnis liefern, erzeugen Dubletten.

---

## 8a. Umsetzung in Phasen

*Größenordnungen für die Planung, keine belastbare Schätzung — sie setzen voraus, dass
das epilot-Entity-Schema für Netzanschlussanfragen steht.*

| Phase | Inhalt | Größenordnung |
| --- | --- | --- |
| **1 — Erhebung** | Zugang zum Erzeugungscode, produktive Dateien als Referenzsatz, Format byteweise dokumentieren, Kodierungsfrage klären | 2–3 PT |
| **2 — Entscheidung** | Werkzeug festlegen (folgt aus Phase 1), Zielpfad und Rechte klären | 1 PT |
| **3 — epilot** | Übertragungsstatus am Vorgang, fehlende Felder in der Journey ergänzen | 2–4 PT |
| **4 — Erzeugung** | Abruf, Transformation, CSV-Erzeugung, Ablage | 5–8 PT |
| **5 — Prüfregeln** | Regeln aus dem bestehenden Erzeugungscode übernehmen, Klärliste ergänzen | 2–3 PT |
| **6 — Zustellung** | Flow mit Gateway, atomare Übergabe per Umbenennung | 1–2 PT |
| **7 — Vergleichstest** | Reale Altvorgänge durchspielen, Dateien byteweise vergleichen | 3–5 PT |
| **8 — Parallelbetrieb** | Neuer Lauf schreibt in ein Prüfverzeichnis, automatischer Vergleich gegen die Lieferung der alten Strecke | 4–6 Wochen Laufzeit |
| **9 — Umstellung** | Direktschreiben, Abgleichskennzahl aktiv | 1 PT |

**Kritischer Pfad ist Phase 1.** Ohne die Originaldatei ist die Werkzeugentscheidung nicht
zu treffen, und ohne Zugang zum Erzeugungscode fehlt das Mapping. Beides ist in einer Woche
beschafft, wenn die Zuständigkeiten klar sind.

**Der Endtermin ergibt sich von außen:** Die Strecke muss stehen, bevor das Altportal
abgeschaltet wird. Dieser Termin gehört in die Planung, bevor über Phasen gesprochen wird.

## 9. Offene Punkte und Entscheidungen

| # | Punkt | Wer entscheidet | Ergebnis |
| --- | --- | --- | --- |
| 1 | ~~Bleibt die SAP-Seite unverändert?~~ | — | **entschieden: ja, CSV bleibt** |
| 2 | ~~Ablageort?~~ | — | **entschieden: Netzlaufwerk** |
| 3 | **Wann wird das Altportal abgeschaltet?** Daraus folgt der Endtermin | Programmleitung | offen |
| 4 | **Zugang zum bestehenden Erzeugungscode** — wer betreut ihn, wo liegt er? | IT-Betrieb | offen |
| 5 | Produktive Referenzdateien für Abnahmevergleich beschaffen | Betrieb Altportal | offen |
| 6 | Kodierung der Originaldatei feststellen — entscheidet die Werkzeugwahl | Fachbereich | offen |
| 7 | **§ 14a und Einspeiser: ein Format oder zwei?** Ein Erzeugungsmechanismus oder zwei? | IT-Architektur | offen |
| 8 | Reihenfolge der Ablösung beider Strecken | Programmleitung | offen |
| 9 | Werkzeug: Power Automate allein oder Databricks + Power Automate | IT-Architektur | offen |
| 10 | Betreibt ihr Databricks bereits produktiv? Sonst Azure Function prüfen | IT-Architektur | offen |
| 11 | Pfad und Schreibrechte auf dem Netzlaufwerk für den neuen Lauf | IT-Betrieb | offen |
| 12 | Wie wird heute ein fehlgeschlagener Import bemerkt? | SAP-Betrieb | offen |
| 13 | Woher holt die bestehende Erzeugung MaLo-ID, Zähler, IBAN, USt-Status, MaStR? | IT-Betrieb | offen |
| 14 | Dauer des Parallelbetriebs und Kriterium für die Umschaltung | Fachbereich + IT | offen |
| 15 | Bekannte Schwachstellen: welche werden mit abgelöst, welche später? | Fachbereich | offen |
