# KI im Netzanschlussprozess — Use-Case-Landkarte

> Stand 10.09.2026. Betrachtet die Prozesse **Einspeiseranmeldung** und **§ 14a**, wie sie
> mit epilot neu entstehen. Aufgebaut nach der Epic-Systematik des Clusters, damit die
> Kandidaten direkt als Use Cases angelegt werden können.

## Die Trennlinie

Der Prozess zerfällt in zwei Sorten Arbeit:

| | Beispiele | Werkzeug |
| --- | --- | --- |
| **Rechnen und Übertragen** | Feldmapping, CSV-Erzeugung, Fristen, Vergütungsklassen, MaStR-Abgleich | deterministisch — Regeln, Code, API |
| **Lesen, Verstehen, Einordnen** | Anhänge prüfen, Klärfälle einordnen, Rückfragen formulieren | dort gehört KI hin |

**Faustregel: KI dort, wo heute ein Mensch etwas liest und beurteilt.** Nicht dort, wo
gerechnet oder übertragen wird — das Inbetriebnahmedatum wirkt zwanzig Jahre, dort will
niemand ein Modell dazwischen.

---

## Die Kandidaten

### KI-1 · Dokumentenprüfung und Abgleich

**Problem:** Zu jeder Anmeldung gehören Anhänge — Einheitenzertifikat,
Wechselrichter-Datenblatt, Lageplan, Vollmacht, später das Inbetriebsetzungsprotokoll; bei
§ 14a Steuerbarkeitsnachweis und Gerätedatenblätter. Heute öffnet die Sachbearbeitung jedes
PDF, sucht die Leistungsangabe und vergleicht sie mit dem Formular.

**Lösung:** Extraktion der Kennwerte plus Abgleich gegen die Formularangaben. Abweichung →
Klärfall, Übereinstimmung → durch. **Immer mit Belegstelle** („9,9 kWp, Seite 2, Tabelle
Modulleistung") — ohne Fundstelle dauert die Nachprüfung länger als das manuelle Ablesen.

| Feld | Wert |
| --- | --- |
| Wirkungsfeld | Automatisierung & KI |
| Komponenten | LLM/AI, Power Platform oder Python/ML |
| Datenquelle | Uploads in epilot + Formularwerte aus der Entity |
| Aufwand | M–L |
| Wirkung | hoch und messbar: Minuten je Vorgang × Vorgänge/Monat |
| DoR-Reife | Problem ✓ · Datenquelle ✓ (sofern Dokumente typisiert abgelegt werden) · FB-Sponsor **offen** · Aufwand ✓ · Wirkungsfeld ✓ |

*Der stärkste Kandidat. Klare Erfolgsmessung, begrenztes Risiko (Mensch entscheidet),
wiederkehrend — also adoptionsfähig.*

---

### KI-2 · Antragsassistent in der Anmeldestrecke

**Problem:** Unvollständige oder unplausible Anträge erzeugen Klärfälle — mit Rückfrage,
Wartezeit, Nachfassen und erneuter Prüfung. Jeder Klärfall, der gar nicht erst entsteht,
spart den ganzen Rattenschwanz.

**Lösung:** Unterstützung beim Ausfüllen, bevor abgeschickt wird.

| Feld | Wert |
| --- | --- |
| Wirkungsfeld | Automatisierung & KI |
| Komponenten | LLM/AI |
| Datenquelle | **fehlt noch** — strukturierte Klärgründe existieren nicht |
| Wirkung | potenziell am höchsten, weil Vermeidung statt Nachbearbeitung |
| DoR-Reife | Problem ✓ · **Datenquelle ✗** · FB-Sponsor offen · Aufwand ✓ · Wirkungsfeld ✓ |

> **Der wertvollste Kandidat ist nicht ready — und der Grund ist behebbar.** Ohne
> strukturierte Klärgründe weiß niemand, woran Anträge tatsächlich scheitern. Siehe
> „Voraussetzungen" unten.

Zu beachten: Transparenzpflicht gegenüber dem Antragsteller, und Fehlberatung wäre hier
sichtbar nach außen. Konservativ auslegen — Hinweise geben, nicht Werte vorschlagen.

---

### KI-3 · Klärfall-Triage und Rückfragevorschlag

**Problem:** Klärfälle landen in einer Liste und müssen einzeln eingeordnet werden: Was
fehlt, wer muss ran, welcher Text geht an den Kunden.

**Lösung:** Klassifikation nach Grund, Vorschlag des passenden Textbausteins und der
zuständigen Rolle.

| Feld | Wert |
| --- | --- |
| Wirkungsfeld | Automatisierung & KI |
| Komponenten | LLM/AI, Power Platform |
| Datenquelle | **fehlt noch** — dieselbe Lücke wie KI-2 |
| Aufwand | M |
| DoR-Reife | **Datenquelle ✗**, sonst erfüllbar |

---

### KI-4 · Statusauskunft für Antragsteller

**Problem:** „Wo steht mein Antrag?" bindet Hotline-Zeit.

**Vor dem UC steht eine Prüfung:** epilot bringt ein Kundenportal mit (Customer Portal API,
167 Operationen). **Wenn der Status dort ohnehin sichtbar wird, ist das kein KI-Fall,
sondern Konfiguration.** Ein Assistent vor einer schlechten Statusanzeige ist Kosmetik.

*Empfehlung: Erst klären, was das Portal von sich aus kann. KI höchstens für die
Freitextfrage darüber hinaus — und dann als eigener UC bewerten.*

---

### KI-5 · Assistenz für die Sachbearbeitung

**Problem:** Bei einem Vorgang mit langer Historie dauert die Einarbeitung — was ist
passiert, was fehlt, was ist der nächste Schritt.

| Feld | Wert |
| --- | --- |
| Wirkungsfeld | Automatisierung & KI |
| Datenquelle | **fehlt noch** — setzt eine Ereignisspur voraus |
| DoR-Reife | **Datenquelle ✗** |

*Zurückstellen. Wird interessant, sobald die Ereignisspur läuft und genug Vorgänge
durchgelaufen sind.*

---

### KI-6 · Datenqualität bei der Migration

**Problem:** Bei der Ablösung von Lovion wandern Bestandsdaten. Dubletten, unplausible
Leistungswerte, fehlende MaStR-Nummern und inkonsistente Adressen fallen sonst erst in der
Abrechnung auf.

**Zeitfenster: jetzt.** Nach der Migration ist der Nutzen weg.

> **Passt bewusst nicht ins UC-Modell:** einmalig, also keine Adoption und keine
> „eingesparten h/Monat" im Regelbetrieb. **Gehört als Story in die Lovion-Ablösung
> (Initiative Construction & Operations), nicht als eigener Epic** — sonst verzerrt es die
> Adoption Rate.

---

### KI-7 · Durchlaufzeiten und Engpässe

**Problem:** Wo bleiben Vorgänge liegen, und wie lange dauert ein Anschluss wirklich?

| Feld | Wert |
| --- | --- |
| Wirkungsfeld | **Data-Driven & BI** — nicht Automatisierung |
| Komponenten | Power BI, Databricks |
| Datenquelle | Ereignisspur — **fehlt noch** |

*Der Reiz: Das ist zunächst gar keine KI, sondern Auswertung. Und es ist die Grundlage,
auf der sich später überhaupt erst beurteilen lässt, wo Automatisierung sich lohnt.*

---

## Wo KI ausdrücklich nicht hingehört

Eine Landkarte, die überall „KI" sagt, ist wertlos. Diese Stellen sind deterministisch
besser aufgehoben:

| Prozessschritt | Warum kein Modell |
| --- | --- |
| Feldmapping und CSV-Erzeugung | muss reproduzierbar und byteweise prüfbar sein — ist bereits gebaut |
| Netzverträglichkeitsprüfung | Berechnung nach festen Regeln |
| Vergütungsklasse und Fristen | Rechtsanwendung, nicht Einschätzung |
| MaStR-Abgleich | Schnittstellenaufruf gegen ein Register |
| Marktkommunikation | strukturierte Formate, kein Freitext |
| Ablehnungsentscheidung | automatisierte Entscheidung mit Rechtswirkung — DSGVO Art. 22, vor jedem Bau zu klären |

---

## Voraussetzungen — der eigentliche Hebel

Vier von sieben Kandidaten scheitern heute am **DoR-Kriterium „Datenquelle identifiziert"**.
Nicht an der Technik, nicht am Budget. Die fehlenden Daten entstehen — oder eben nicht —
beim Bau des epilot-Prozesses, also **in den nächsten Wochen**.

| Was | Wofür | Kosten jetzt | Kosten später |
| --- | --- | --- | --- |
| **Klär- und Ablehnungsgründe strukturiert** statt Freitext im Notizfeld | KI-2, KI-3 | ein Auswahlfeld | nicht rückwirkend erzeugbar |
| **Dokumente typisiert ablegen** statt „Anlagen" als Sammelfeld | KI-1 | Formularentscheidung | Nachträgliche Klassifikation aller Bestandsdokumente |
| **Ereignisspur**: Schritt, Zeitpunkt, Bearbeiter, Dauer | KI-5, KI-7 | Konfiguration | Historie ist verloren |
| **Korrekturen erhalten** statt überschreiben | Qualitätsmessung, später Training | Versionierung | Lernsignal existiert nicht |

> **Diese vier Punkte sind keine KI-Initiative.** Sie sind Anforderungen an die
> Lovion-Ablösung und gehören als Stories in das BuB-Projekt. Als eigener Epic geführt,
> werden sie gegen andere Use Cases priorisiert und fallen hinten runter — genau das darf
> nicht passieren.

Nebeneffekt, der für sich schon trägt: Strukturierte Klärgründe und eine Ereignisspur sind
**auch ohne KI** die beste Prozessstatistik, die der Fachbereich je hatte.

---

## Reihenfolge

Bei einem WIP-Limit von 5–6 Use Cases im gesamten Cluster ist diese Liste eine **Pipeline,
keine Roadmap**. Realistisch laufen aus diesem Thema ein bis zwei parallel.

| Rang | Was | Warum jetzt |
| --- | --- | --- |
| **1** | Voraussetzungen in die Lovion-Ablösung einbringen | Zeitfenster schließt sich mit dem Bau des Prozesses. Kein eigener UC — Stories im BuB-Projekt. |
| **2** | KI-6 Datenqualität Migration | Zeitfenster ebenfalls jetzt. Story im BuB-Projekt, nicht eigener Epic. |
| **3** | **KI-1 Dokumentenprüfung** | Der erste echte Use Case: DoR erfüllbar, Wirkung messbar, adoptionsfähig. |
| 4 | KI-4 Statusauskunft — erst Portalprüfung | Möglicherweise gar kein KI-Fall. |
| 5 | KI-7 Durchlaufzeiten | Sobald die Ereignisspur Daten liefert. |
| 6 | KI-2 / KI-3 Antragsassistent und Triage | Sobald Klärgründe strukturiert vorliegen — dann mit der höchsten Wirkung. |

---

## Zwei offene Punkte für die Systematik

**Fachbereich-Zuordnung.** Das Pflichtfeld kennt Netzbetrieb, Netzplanung, Netzführung,
Messwesen, Instandhaltung und Asset Management. **Netzanschluss taucht nicht auf** —
weder für die Einspeiser- noch für die § 14a-Strecke gibt es damit einen sauberen Eintrag.
Zu klären, bevor die Epics angelegt werden.

**FB-Sponsor.** Bei jedem Kandidaten offen. Ohne benannten Sponsor kommt kein Epic durch
das DoR-Gate — und ohne ihn gibt es später niemanden, der die Lösung abnimmt und nutzt.
Das ist bei diesem Thema der schnellste Weg, die Pipeline zu füllen.
