# Governance für Schnittstellen

> Fassung 1.0 · 09.10.2026 · Cluster Digitalisierung, Data & AI
>
> Adressat: IT (Architektur, Informationssicherheit, Applikationsbetrieb), Datenschutz,
> Fachbereich. Gegenstand sind alle Schnittstellen der epilot-Strecken — beginnend mit
> SK-001 (Einspeiser → SAP) und SK-002 (§ 14a → SAP).

## Worum es geht

Die IT hat bei den letzten Vorhaben vier Punkte aufgeworfen: **Connectoren, API-Keys,
Zugriff auf Kundendaten, sauberer Betrieb.** Diese Fragen sind berechtigt. Die IT haftet
für den Betrieb und wird gerufen, wenn etwas ausfällt — auch bei Dingen, die sie nicht
gebaut hat und nicht kennt.

Dieses Dokument beantwortet die vier Fragen und schlägt drei Ausbaustufen vor. Es ist
**ein Angebot, kein Durchsetzungsversuch:** Das Cluster übernimmt die fachliche
Verantwortung und liefert die Nachweise, die IT behält die Kontrolle über Zugänge und
Netzzugang.

---

## Teil 1 — Die vier Fragen der IT

### Frage 1: Was passiert mit Connectoren?

**Das eigentliche Risiko** ist nicht der Connector, sondern der **persönliche Account
dahinter.** Ein Connector, der unter dem Konto eines Mitarbeiters läuft, bricht, sobald
dieser das Unternehmen verlässt oder sein Passwort wechselt. Niemand weiß dann, warum.

**Festlegung:** Jede Verbindung läuft über einen **technischen Nutzer**, nie über ein
persönliches Konto. Keine Ausnahme, auch nicht in der Erprobung — ein Prototyp mit
persönlichem Konto wird zum Produktivbetrieb, ohne dass jemand die Entscheidung trifft.

**Nachweis:** Jede Verbindung steht im Schnittstellen-Register (Teil 3) mit technischem
Nutzer, Zweck und verantwortlicher Person. Was nicht im Register steht, existiert nicht
und darf abgeschaltet werden.

### Frage 2: Wer verwaltet den API-Key?

**Hier liegt ein Missverständnis, das die Diskussion entlastet: epilot hat keine
klassischen API-Keys.** Jeder Zugang ist ein JWT, erzeugt über die Access Token API, und
trägt vier Eigenschaften, die ein statischer Schlüssel nicht hat:

| Eigenschaft | Bedeutung für die IT |
| --- | --- |
| `assignments` | Der Token trägt **Rollen** in sich. Ein Token für den Export braucht keine Schreibrechte auf Kundenkontakte. |
| `read_only: true` | Beschränkt den Token technisch auf lesende Operationen. |
| `expires_in` | Läuft ab, 30 Sekunden bis 7 Tage. Ein dauerhaft gültiges Geheimnis gibt es nicht. |
| Widerruf | `DELETE /v1/access-tokens/{id}` zieht einen Token **sofort** zurück. |

Dazu liefert `GET /v1/access-tokens` ein **vollständiges Inventar aller ausgegebenen
Token** — direkt aus dem System, nicht aus einer Liste, die jemand pflegen müsste.

**Festlegung:**

- Token werden im **Azure Key Vault** bzw. **Databricks Secret Scope** hinterlegt,
  niemals in Code, Notebook oder Repository. Das ist heute schon so umgesetzt.
- Je Schnittstelle **ein eigener Token** mit dem engsten möglichen Rollenumfang. Nicht
  der Admin-Token aus der Einführungsphase.
- `read_only: true`, wo die Schnittstelle nur liest. SK-001 braucht eine Ausnahme: Das
  Zurückschreiben des Übertragungsstatus erfordert Schreibrecht auf genau dieses eine
  Attribut.
- **Erneuerung vor Ablauf ist terminiert und hat einen Verantwortlichen.** Ein Token,
  der um 2 Uhr nachts ausläuft, ist ein vermeidbarer Störfall.

### Frage 3: Wer hat Zugriff auf Kundendaten?

**Für SK-001 ist die Antwort überraschend entlastend: Die Schnittstelle überträgt keine
personenbezogenen Daten.** Das ist belegt, nicht behauptet — die Analyse der 30
Exportspalten steht in `bestand/einspeiser_spaltenanalyse.md`. Enthalten sind
ausschließlich technische Anlagendaten am Anschlussobjekt. Kein Name, keine IBAN, kein
Umsatzsteuerstatus.

Auch die **Klärliste enthält keine Antragsinhalte** — nur die Kennung des Vorgangs und
den Grund. Das ist durch einen automatisierten Test abgesichert, nicht durch eine
Verabredung.

**Was trotzdem zu regeln ist:**

| Gegenstand | Festlegung |
| --- | --- |
| Zugriff auf die epilot-Instanz | Rollen in epilot, nicht alle Mitarbeiter sehen alle Vorgänge |
| Zugriff auf die Zwischenablage (Databricks) | Unity-Catalog-Berechtigungen; Rohdaten können mehr enthalten als die Exportdatei |
| Protokolle | ohne Antragsinhalte im Klartext; Bankverbindungen, falls sie je einbezogen werden, nur maskiert |
| Auftragsverarbeitung | AV-Vertrag mit epilot als SaaS-Anbieter — **Prüfpunkt für den Datenschutz, nicht für uns** |
| Aufbewahrung | EEG-relevante Daten unterliegen Aufbewahrungspflichten. Ein Löschkonzept muss das berücksichtigen, nicht pauschal nach 30 Tagen löschen |

**Der Punkt, den die IT zu Recht aufwirft:** Die Bronze-Ablage in Databricks enthält
*mehr* als die Exportdatei — den vollständigen Vorgang. Dort greifen die
Berechtigungsfragen voll, auch wenn die Schnittstelle selbst harmlos ist. Das ist der
Grund, warum Export und Rohdatenablage in diesem Vorhaben zwei getrennte Stränge sind.

### Frage 4: Wie wird sauberer Betrieb gewährleistet?

Eine Dateischnittstelle hat **keine Quittung.** Wenn SAP die Datei nicht abholt, merkt es
niemand. Heute fällt es auf, weil ein Mensch im Prozess steht; nach der Automatisierung
fällt diese Sicherung weg.

**Die fünf Bausteine, die den Betrieb tragen:**

1. **Benannte Zuständigkeit** je Schnittstelle — fachlich und technisch, je mit
   Stellvertretung. Eine Schnittstelle mit genau einem Verantwortlichen ohne Vertretung
   ist ein Betriebsrisiko.
2. **Betriebsdokumentation** je Schnittstelle: Was tut sie, wann läuft sie, was tun bei
   Ausfall, wer wird informiert. Eine Seite, nicht zwanzig.
3. **Alarmierung mit Eskalation.** Wer bekommt den Alarm, wer danach, und ab wann ist es
   eine Störung mit Meldepflicht.
4. **Klärfallbearbeitung mit benannter Person.** Vorgänge, die die Prüfung nicht
   bestehen, laufen in einer Liste auf. Ohne Zuständigkeit verschwinden sie.
5. **Abgleich statt Hoffnung.** Wurde die Datei abgeholt? Stimmt die Satzanzahl? Das ist
   der Ersatz für die fehlende Quittung.

**Was bereits vorhanden ist und als Nachweis dient:**

- Der Lauf ist **wiederholbar**: Solange der Status nicht zurückgeschrieben ist, wird
  derselbe Vorgang erneut eingesammelt. Ein Abbruch mitten im Lauf verliert nichts.
- **Erst Datei ablegen, dann Status setzen** — im Zweifel doppelt statt verloren.
  Dubletten fängt SAP über die Korrelations-ID ab.
- **Atomare Ablage**: unter `.tmp` schreiben, dann umbenennen. SAP kann keine halb
  geschriebene Datei abholen.
- **Kodierungsfehler werden nie still ersetzt.** Der Vorgang geht in die Klärliste,
  statt mit `?` statt eines Umlauts durchzulaufen.
- **40 automatisierte Tests**, Linter ohne Befund, Konventionen maschinenlesbar.

---

## Teil 2 — Rollen

### Die vorhandenen Rollen genügen fast

| Vorhandene Rolle | Aufgabe in der Schnittstellen-Governance |
| --- | --- |
| **Product Owner** | **Schnittstellen-Owner (fachlich).** Entscheidet über Felder, Mapping und Freigabe. Zeichnet das Konzept. Trägt die Entscheidung, wenn ein Feld entfällt. |
| **Application Manager (IT)** | **Technischer Betrieb.** Secret-Verwaltung, Monitoring, Wiederanlauf, Erneuerung der Token. Nimmt den technischen Teil ab. |
| **Key User** | **Fachliche Prüfung und Klärfälle.** Bearbeitet die Klärliste, nimmt die Datei fachlich ab, erkennt falsche Werte, die technisch plausibel sind. |

Diese Zuordnung deckt den Regelbetrieb ab. **Drei Ergänzungen sind nötig** — zwei davon
sind keine neuen Stellen, sondern Einbindungen:

### Ergänzung 1: Integrationsverantwortlicher im Cluster — neue Rolle

**Das ist die einzige wirklich neue Rolle, und sie ist klein: etwa 2–4 Stunden im Monat.**

Aufgabe: das Schnittstellen-Register pflegen, über die Standards wachen, neue Vorhaben
gegen die bestehenden prüfen (gibt es das schon?), die Jahresdurchsicht anstoßen.

**Warum sie unverzichtbar ist:** Ein Register ohne Pflegeverantwortung ist nach sechs
Monaten falsch, und ein falsches Register ist schlimmer als keines — es erzeugt Vertrauen,
das nicht gerechtfertigt ist. Genau an dieser Stelle entsteht die Schatten-IT, die die IT
zu Recht fürchtet.

*Besetzungsvorschlag: Clusterleitung selbst, solange es unter zehn Schnittstellen sind.*

### Ergänzung 2: Datenschutz — Einbindung, keine neue Rolle

Der Datenschutzbeauftragte existiert. Was fehlt, ist ein **definierter Prozessschritt:**
Vor der ersten produktiven Übertragung liegt eine Datenschutz-Einschätzung vor —
Rechtsgrundlage, Verarbeitungsverzeichnis, Löschfristen, AV-Vertrag.

Für SK-001 ist das absehbar unkritisch (keine personenbezogenen Daten in der Datei), aber
es muss **dokumentiert** unkritisch sein, nicht stillschweigend.

### Ergänzung 3: Stellvertretung — Zuordnung, keine neue Rolle

Je Schnittstelle ist für die fachliche und die technische Rolle eine Stellvertretung
benannt. Das ist eine Eintragung im Register, keine Stelle.

### Was ausdrücklich keine neue Rolle braucht

Kein Integrations-Architekt, kein Schnittstellen-Gremium, kein eigenes Board. Bei zwei
bis fünf Schnittstellen erzeugt das mehr Abstimmung als Nutzen. Die Mitzeichnung
(IT-Architektur, Informationssicherheit, Datenschutz, Betrieb) bleibt bei den
bestehenden Funktionen.

---

## Teil 3 — Drei Ausbaustufen

### Stufe 1 — MVP: in zwei Wochen aufsetzbar

**Zweck:** Die IT kann jede Frage beantworten, die ihr gestellt wird. Nicht mehr.

| Baustein | Was konkret entsteht | Aufwand |
| --- | --- | --- |
| **Schnittstellen-Register** | Eine Tabelle (Confluence oder Excel): ID, Kurzname, Von→Nach, Zweck, technischer Nutzer, fachlicher Owner, technischer Betreiber, Stellvertretung, Status. Existiert in `README.md` bereits als Keim. | 1 Tag |
| **Rollen je Schnittstelle benannt** | Namen, keine Abteilungen. Im Register eingetragen. | 2 Stunden |
| **Secrets im Key Vault** | Token aus Code und Notebooks heraus, Zugriffsberechtigung dokumentiert. Heute schon so umgesetzt. | fertig |
| **Technische Nutzer** | Je Schnittstelle ein eigener Token, engster Rollenumfang, `read_only` wo möglich. | 1 Tag |
| **Betriebsdokumentation** | Eine Seite je Schnittstelle: Zweck, Takt, Ausfallverhalten, Ansprechpartner. | 1 Tag je Strecke |
| **Klärfalladresse** | Ein Postfach oder eine Jira-Komponente mit benanntem Bearbeiter. | 2 Stunden |

**Was Stufe 1 nicht leistet:** Keine Überwachung, keine Protokollauswertung, kein
formaler Freigabeprozess. Fällt die Schnittstelle aus, merkt es die Fachseite — nicht die
Technik.

**Verkaufsargument:** Stufe 1 kostet rund **vier Personentage** und beantwortet alle vier
Fragen der IT nachweisbar. Das ist billiger als eine Eskalationsrunde.

### Stufe 2 — Belastbar: drei bis sechs Monate

**Zweck:** Die Schnittstelle übersteht eine Prüfung, und ein Ausfall fällt der Technik
auf, bevor die Fachseite anruft.

| Baustein | Was dazukommt |
| --- | --- |
| **Freigabeprozess** | Eine neue Schnittstelle braucht ein Konzept nach `VORLAGE.md` und vier Mitzeichnungen. Keine Schnittstelle ohne Register-Eintrag. |
| **Überwachung und Alarmierung** | Lauf erfolgreich? Datei abgeholt? Satzanzahl plausibel? Alarm mit zweistufiger Eskalation. |
| **Abgleich mit dem Zielsystem** | Der Ersatz für die fehlende Quittung — monatlicher Abgleich der übertragenen gegen die in SAP angekommenen Sätze. |
| **Berechtigungskonzept dokumentiert** | Wer kommt an welche Daten, in epilot und in der Zwischenablage. Mit **jährlicher Durchsicht** — der Punkt, an dem Berechtigungen sonst zuwachsen. |
| **Änderungsprozess** | Wer darf ein Mapping ändern, wer prüft, wer gibt frei. Änderungen laufen über Git mit Historie — ist umgesetzt. |
| **Trennung Test/Produktiv** | Eigene Token, eigene Ablage, kein Produktivzugriff aus der Entwicklung. |
| **Datenschutz abgeschlossen** | Verarbeitungsverzeichnis, Löschkonzept mit Aufbewahrungspflichten, AV-Vertrag geprüft. |
| **Token-Erneuerung terminiert** | Kalendereintrag mit Vorlauf, Verantwortlicher benannt. |

### Stufe 3 — Zielbild: wenn es mehr als fünf Schnittstellen werden

**Zweck:** Governance skaliert, ohne dass der Aufwand je Schnittstelle mitwächst.

| Baustein | Was dazukommt |
| --- | --- |
| **Automatisierte Secret-Rotation** | Token laufen kurz und werden maschinell erneuert. Kein Kalendereintrag mehr. |
| **Token-Inventar automatisch** | `GET /v1/access-tokens` regelmäßig gegen das Register abgleichen. Ein Token ohne Register-Eintrag ist ein Befund. |
| **Zugriffsprotokolle mit Auswertung** | Nicht nur protokollieren, sondern auffällige Muster erkennen. |
| **Schnittstellenkatalog mit Metadaten** | Technische Angaben (Felder, Formate, Mengen) aus dem Code erzeugt statt gepflegt — die Werkzeugkette kann das. |
| **Leitplanken statt Freigaben** | Eine neue Strecke ist eine Konfiguration im etablierten Rahmen; die Freigabe prüft nur die Abweichung. |
| **Auditfähigkeit** | Jede Übertragung ist rückverfolgbar: welche Version, welche Konfiguration, welche Daten. |

---

## Teil 4 — Empfehlung

**Stufe 1 jetzt, Stufe 2 parallel zum ersten Produktivgang, Stufe 3 erst bei Bedarf.**

Die Begründung ist nicht Bequemlichkeit, sondern Wirksamkeit: Governance, die vor dem
ersten Lauf vollständig sein soll, verzögert den Lauf und wird dann umgeschrieben, weil
die Praxis andere Fragen stellt als die Planung. Stufe 1 ist das Gerüst, das die
Diskussion mit der IT trägt; Stufe 2 entsteht an den Stellen, an denen der Betrieb zeigt,
wo es weh tut.

**Was die IT im Gegenzug bekommt** — und das ist der Kern des Angebots:

| Die IT gibt | Das Cluster liefert |
| --- | --- |
| Technischen Nutzer und Key-Vault-Zugang | Register, benannte Rollen, Betriebsdokumentation |
| Netzzugang zur Ablage | Nachweis, dass keine personenbezogenen Daten übertragen werden |
| Mitzeichnung statt Durchsetzung | Fachliche Verantwortung inklusive Klärfallbearbeitung |
| Bereitschaft im Störfall | Erster Ansprechpartner ist die Fachseite, nicht die IT |

**Die Rollenfrage, die eine Entscheidung braucht:** Der *Integrationsverantwortliche im
Cluster* ist die einzige neue Rolle in diesem Konzept. Ohne sie verwaist das Register
binnen eines halben Jahres. Zwei bis vier Stunden im Monat, Besetzung aus dem Cluster.

---

## Anhang — Was heute schon umgesetzt ist

Als Belegmaterial für das Gespräch. Nichts davon ist Absicht­serklärung:

| Anforderung | Umsetzung | Nachweis |
| --- | --- | --- |
| Keine Geheimnisse im Code | Token aus Secret Scope | `databricks/*.py`, `umsetzung/README.md` |
| Keine internen Pfade im Repository | `config.yaml` in `.gitignore` | `.gitignore` |
| Keine personenbezogenen Daten in der Klärliste | automatisierter Test | `umsetzung/tests/test_export.py` |
| Keine stillen Datenverluste | Kodierungsfehler → Klärliste | `csvschreiber.py`, `pruefe_kodierbar` |
| Keine halben Dateien für SAP | atomare Ablage über `.tmp` | `csvschreiber.py`, `lege_ab` |
| Wiederholbarkeit ohne Datenverlust | Status erst nach Ablage | `job.py` |
| Nachvollziehbare Änderungen | Git mit Conventional Commits | Repositoryhistorie |
| Prüfbare Codequalität | 40 Tests, Linter ohne Befund | `pytest`, `ruff check` |
| Dokumentierte Annahmen | ANNAHME-Markierungen in der Konfiguration | `config.einspeiser.probelauf.yaml` |
