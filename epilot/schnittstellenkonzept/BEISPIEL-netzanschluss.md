# SK-001 — Netzanschlussanfrage aus epilot in die Bearbeitung

> ⚠️ **Vollständig erfundenes Beispiel.** Zahlen, Feldnamen, Systemnamen und
> Verantwortliche sind ausgedacht. Zweck ist allein, den Detailgrad zu zeigen,
> auf den [`VORLAGE.md`](./VORLAGE.md) hinauswill. Nichts hier ist eine Aussage
> über eure tatsächliche Systemlandschaft.
>
> Die epilot-Endpunkte sind echt — sie stammen aus den OpenAPI-Specs
> (siehe [`../api-referenz/`](../api-referenz/)).

| | |
| --- | --- |
| **ID** | SK-001 |
| **Version / Stand** | 0.3 — 12.03.2026 |
| **Status** | in Freigabe |
| **Fachlicher Owner** | Leitung Netzanschluss |
| **Technischer Owner** | Cluster Digitalisierung, Data & AI |
| **Beteiligte Systeme** | epilot → NetzBau Manager |

---

## 1. Fachlicher Zweck

Netzanschlussanfragen für PV-Anlagen, Wärmepumpen und Ladeinfrastruktur kommen über
das epilot-Kundenportal herein. Sie müssen ohne Handarbeit als Vorgang im
Bearbeitungssystem entstehen, damit die Sachbearbeitung direkt mit der Prüfung
beginnen kann.

**Auslösendes Ereignis:** Kunde schließt die Journey „Netzanschluss anmelden" ab;
in epilot entsteht eine Entity vom Typ `netzanschluss_anfrage` mit Status `eingereicht`.

**Ergebnis / Nutzen:** Der Vorgang liegt binnen zwei Minuten im Bearbeitungssystem
statt am nächsten Werktag. Die Eingangsbestätigung an den Kunden wird dadurch
belastbar terminiert.

**Wegfallender Handbetrieb:** Heute exportiert eine Sachbearbeiterin die Anfragen
morgens als Liste und legt die Vorgänge einzeln von Hand an — rund 12 Minuten je Vorgang,
inklusive Rückfragen bei unvollständigen Angaben.

**Mengengerüst:**

| | Wert |
| --- | --- |
| Vorgänge pro Monat | 420 (gezählt 11/2025 – 01/2026) |
| Spitzenlast | 25 pro Stunde (Montagvormittag, Förderprogramm-Effekte) |
| Datenvolumen je Vorgang | ca. 4 KB Stammdaten + 0–3 Anhänge à max. 10 MB |
| Wachstum 2 Jahre | Verdopplung erwartet (Hochlauf Wärmepumpe) |

---

## 2. Systeme, Richtung und Verantwortung

```
epilot  ──[ Webhook: Entity erstellt, Slug netzanschluss_anfrage ]──►  NetzBau Manager
```

**Wer ruft wen:** epilot ruft aktiv den Endpunkt des Bearbeitungssystems auf (Push).
Kein Polling — bei 420 Vorgängen im Monat wäre ein Minutentakt reine Leerlast.

### Führendes System

| Datenobjekt | Führendes System | Begründung | Bei Änderung im anderen System |
| --- | --- | --- | --- |
| Antragsdaten (Anlage, Leistung, Anschlusswunsch) | epilot | Vom Kunden erklärt, rechtlich sein Antrag | Änderung im Bearbeitungssystem wird **nicht** zurückgespielt, sondern als Prüfvermerk erfasst |
| Kundenstammdaten (Name, Adresse) | ERP | Führende Kundenakte, gewachsen | epilot-Werte gelten nur bis zur Zuordnung zum ERP-Kunden |
| Bearbeitungsstatus | NetzBau Manager | Entsteht erst in der Bearbeitung | Rückkanal ins Portal ist **SK-002**, eigenes Konzept |

---

## 3. Datenobjekte und Feldmapping

| | epilot | NetzBau Manager |
| --- | --- | --- |
| Objektbezeichnung | Entity-Slug `netzanschluss_anfrage` | Vorgang, Typ `NA-ANFRAGE` |
| Eindeutiger Schlüssel | `_id` (UUID) | `vorgang_nr` (fortlaufend) |

**Korrelations-ID:** Die epilot-`_id` wird im Bearbeitungssystem im Feld
`ext_referenz` gespeichert und ist dort eindeutig indiziert. Sie ist der Schlüssel
für Wiederholungen, Fehlersuche und den späteren Rückkanal aus SK-002.

### Feldmapping (Auszug)

| Quellfeld (epilot) | Zielfeld | Typ | Pflicht | Umsetzung | Beispiel |
| --- | --- | --- | --- | --- | --- |
| `_id` | `ext_referenz` | String(36) | ja | unverändert | `f47ac10b-58cc-…` |
| `anlagenart` | `anlagen_typ` | Enum | ja | Mappingtabelle unten | `pv` → `PVA` |
| `leistung_kw` | `leistung` | Dezimal(6,2) | ja | Einheit kW beidseitig, auf 2 Stellen runden | `9.90` |
| `anschluss_adresse.plz` | `standort_plz` | String(5) | ja | unverändert | `40233` |
| `anschluss_adresse.strasse` | `standort_strasse` | String(60) | ja | **Zielfeld auf 60 Zeichen begrenzt**, längere Werte werden gekürzt und protokolliert | `Beispielstraße 12` |
| `kunde.email` | `kontakt_email` | String(120) | ja | kleingeschrieben | `a.muster@example.org` |
| `wunschtermin` | `termin_wunsch` | Datum | nein | ISO 8601 → `TT.MM.JJJJ` | `2026-06-01` → `01.06.2026` |
| `paragraph_14a` | `steuerbar_14a` | Boolean | ja | fehlt in der Quelle → `false` | `true` |
| — | `eingangskanal` | Enum | ja | fest `PORTAL` | `PORTAL` |

**Mappingtabelle Anlagenart:**

| epilot | NetzBau Manager |
| --- | --- |
| `pv` | `PVA` |
| `waermepumpe` | `WP` |
| `ladeinfrastruktur` | `LIS` |
| `speicher` | `SP` |
| `sonstige` | `SONST` — löst Pflichtprüfung durch Sachbearbeitung aus |

*Offen: Kombianlagen (PV + Speicher) sind in epilot ein Vorgang, im Bearbeitungssystem
bisher zwei. Siehe Punkt 2 unter „Offene Punkte".*

---

## 4. Technische Umsetzung

| | |
| --- | --- |
| **Verfahren** | Webhook (Push), asynchron |
| **Aufrufender** | epilot |
| **Zielendpunkt** | `POST https://netzbau.intern.example/api/v1/vorgaenge` |
| **Auslöser** | Webhook-Config mit `eventName` = Entity-Anlage-Ereignis, gefiltert auf Slug `netzanschluss_anfrage`. Die wählbaren Ereignisnamen liefert `GET /v1/webhooks/configured-events`. |
| **Erwartete Antwortzeit** | < 2 s |
| **Timeout** | 10 s |
| **Maximale Nutzlast** | 256 KB — Anhänge werden **nicht** mitgesendet, siehe unten |

Anhänge werden als epilot-Datei-Referenzen übertragen. Das Bearbeitungssystem holt
sie bei Bedarf über die File API nach. Das hält die Nutzlast klein und vermeidet
Zeitüberschreitungen bei großen Uploads.

### Authentifizierung

**epilot → NetzBau Manager:** epilot signiert den Aufruf mit Ed25519. Das
Bearbeitungssystem prüft die Signatur gegen den öffentlichen Schlüssel aus
`GET /v1/webhooks/.well-known/public-key` (täglich zwischengespeichert).
Ungeprüfte Aufrufe werden mit 401 abgewiesen.

**NetzBau Manager → epilot** (nur für das Nachladen von Anhängen):

| | |
| --- | --- |
| Token-Typ | Access Token, `token_type: api`, `read_only: true` |
| Rollen | ausschließlich Lesezugriff auf `netzanschluss_anfrage` und zugehörige Dateien |
| Gültigkeit | 7 Tage, automatische Erneuerung über Nacht, Alarm bei Fehlschlag |
| Ablage | Secret-Store des Bearbeitungssystems, nicht in der Konfiguration |

### Idempotenz und Reihenfolge

Das Bearbeitungssystem prüft vor dem Anlegen auf eine vorhandene `ext_referenz`.
Ist sie bekannt, wird der Vorgang **nicht** erneut angelegt, sondern mit HTTP 200 und
der bestehenden `vorgang_nr` quittiert. Damit sind Wiederholungen folgenlos.

Reihenfolge ist unkritisch: Jeder Vorgang ist eigenständig, es gibt keine
Folgemeldungen in diesem Fluss.

---

## 5. Fehlerbehandlung

| Fehlerklasse | Beispiel | Verhalten | Wer wird informiert |
| --- | --- | --- | --- |
| Fachlich | Anlagenart unbekannt, Leistung = 0 | HTTP 422, keine Wiederholung; Vorgang landet in der Klärliste | Teamleitung Netzanschluss, täglich |
| Technisch vorübergehend | Zielsystem nicht erreichbar, Timeout | Wiederholung nach 1, 5, 15, 60 min | erst bei endgültigem Fehlschlag |
| Technisch dauerhaft | Signaturprüfung schlägt fehl, 401/404 | keine Wiederholung, sofortiger Alarm | Betrieb, Rufbereitschaft |

**Endgültig gescheiterte Vorgänge** bleiben in epilot mit Status `eingereicht` stehen
und erscheinen auf einer Fehlerliste im Bearbeitungssystem. Nachträgliches Einspielen
über `POST /v1/webhooks/configs/{configId}/events/{eventId}/replay`, größere Mengen
über `…/events/replay-batch`.

**Zustand während der Störung:** Der Kunde hat seine Eingangsbestätigung bereits aus
epilot erhalten — für ihn ändert sich nichts. Die Sachbearbeitung sieht den Vorgang
noch nicht. Ab vier Stunden Rückstand wird auf Handbetrieb umgestellt (Export aus
epilot), die betroffenen Vorgänge werden nach Behebung **nicht** erneut eingespielt,
sondern über die `ext_referenz` abgeglichen.

---

## 6. Betrieb

| | |
| --- | --- |
| Überwachung | Durchsatz je Stunde, Fehlerquote, Alter des ältesten unverarbeiteten Vorgangs |
| Alarmschwelle | Fehlerquote > 5 % über 15 min, oder ältester Vorgang > 30 min |
| Empfänger | Rufbereitschaft IT-Betrieb, werktags zusätzlich Teamleitung Netzanschluss |
| Protokollierung | 90 Tage, Korrelations-ID und Statuscode; **keine** Antragsinhalte im Klartext |
| Wartungsfenster | Bearbeitungssystem sonntags 02:00–04:00; epilot puffert und wiederholt |

---

## 7. Sicherheit und Datenschutz

| | |
| --- | --- |
| Personenbezogene Daten | ja — Name, Anschrift, E-Mail, Telefon, Angaben zur Anlage am Wohnort |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO, Anbahnung des Anschlussvertrags |
| Verarbeitungsverzeichnis | Eintrag VVT-2026-014 |
| AV-Vertrag | mit epilot vorhanden, Stand 09.2025 |
| Löschfristen | epilot: Löschung 6 Monate nach Abschluss oder Ablehnung; Bearbeitungssystem folgt der Aufbewahrungspflicht des Vorgangs — **unterschiedliche Fristen, bewusst so entschieden** |
| Transport | TLS 1.3, Zertifikatsprüfung verpflichtend |
| Netzzugang | eingehend nur von den epilot-Ausgangsadressen, Firewall-Antrag FW-2026-0087 |
| Schutzbedarf | normal; keine Steuerungsdaten, keine Rückwirkung auf den Netzbetrieb |

---

## 8. Test und Abnahme

Testumgebung über epilot-Sandbox gegen die Integrationsumgebung des Bearbeitungssystems.
Testdaten synthetisch, keine Echtdaten.

Testfälle unter anderem: Vollständiger Antrag; fehlendes Pflichtfeld; Straßenname mit
72 Zeichen; Umlaute und `ß`; doppelte Zustellung desselben Ereignisses; Zielsystem
während der Zustellung nicht erreichbar; Anhang von 10 MB; unbekannte Anlagenart.

**Abnahmekriterien:** 100 Testvorgänge, davon 0 Dubletten, alle fachlichen Fehler in
der Klärliste sichtbar, Wiederholung nach simuliertem Ausfall vollständig.

**Inbetriebnahme:** Zwei Wochen Parallelbetrieb — die Sachbearbeitung führt die
Handanlage weiter und vergleicht stichprobenartig. Rückfallebene ist der bisherige
Export.

---

## 9. Offene Punkte und Entscheidungen

| # | Punkt | Wer entscheidet | Bis wann | Ergebnis |
| --- | --- | --- | --- | --- |
| 1 | Straßennamen > 60 Zeichen: kürzen oder Vorgang zur Klärung? | Fachbereich | 20.03. | offen |
| 2 | Kombianlage PV + Speicher — ein Vorgang oder zwei? | Fachbereich + Architektur | 27.03. | offen |
| 3 | Unterschiedliche Löschfristen beidseitig — Bestätigung Datenschutz | DSB | 31.03. | offen |
| 4 | Wer pflegt die Mappingtabelle Anlagenart bei neuen Typen? | Cluster | 20.03. | offen |
