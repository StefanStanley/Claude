# Konzept: Prozessaufnahme per Interview (SaaS für den Energiesektor)

> **Arbeitstitel:** *ProzessLupe* (Platzhalter – Namensvorschläge siehe unten)
> **Status:** Konzeptphase (v0.1) · **Stack:** Next.js + TypeScript · **Betrieb:** On-Prem-fähig (KRITIS)

---

## 1. Vision in einem Satz

Ein Fachexperte **erzählt** seinen Prozess in einem Interview – die Software macht daraus **automatisch** ein **BPMN-Modell** und eine **fundierte Bewertung**, ohne dass jemand BPMN beherrschen oder Diagramme malen muss.

### Das Problem
Prozessaufnahme im Energiesektor ist heute teuer und langsam: Berater führen Workshops, tippen Notizen, malen wochenlang Visio/BPMN-Diagramme, das Wissen veraltet sofort. Fachexperten „können kein BPMN" – ihr Wissen steckt im Kopf und in E-Mails, Fotos, PDFs.

### Die Lösung
Der Experte spricht frei (oder wird interviewt). Alles wird aufgenommen. Zusatzmaterial (Fotos vom Schaltschrank, Betriebsanweisungen als PDF, Video vom Arbeitsschritt) wird angehängt. Die KI-Pipeline extrahiert Prozessschritte, Rollen, Systeme und Entscheidungen → erzeugt ein editierbares BPMN-Modell + eine Bewertung mit konkreten Verbesserungshebeln.

---

## 2. Zielgruppe & Nutzenversprechen

**Kunden:** Stadtwerke, Verteilnetzbetreiber (VNB), Energieversorger (EVU), Messstellenbetreiber, Contracting-/Consulting-Firmen im Energieumfeld.

**Nutzer-Rollen:**
| Rolle | Aufgabe im Tool |
|---|---|
| **Interviewer / Berater** | Führt/lädt Interviews hoch, prüft und finalisiert Modelle |
| **Fachexperte (Prozess-Owner)** | Wird interviewt oder nimmt selbst auf, liefert Zusatzmaterial |
| **Reviewer / QM** | Prüft Modell & Bewertung, gibt frei |
| **Admin** | Nutzer, Rechte, Datenhaltung, Anbieter-Einstellungen |

**Nutzenversprechen:** *Von 3 Wochen Beratung auf 1 Tag.* Prozess-Erstaufnahme in Stunden statt Wochen, konsistente Qualität, sofort auswertbar, revisionssicher dokumentiert.

---

## 3. Kern-User-Journey (Ende-zu-Ende)

```
1. Projekt & Prozess anlegen          → "Netzanschluss-Bearbeitung, Team X"
2. Interview erfassen                  → live aufnehmen ODER Audio/Video hochladen
3. Zusatzmaterial anhängen             → Fotos, PDFs, Videos (Belege/Kontext)
4. Transkription (automatisch)         → Whisper, on-prem, Sprecher-Trennung
5. KI-Analyse                          → Prozessschritte, Rollen, Systeme, Entscheidungen
6. Strukturierte Zwischenform (IR)     → validiertes JSON (Single Source of Truth)
7. BPMN-Modell generieren              → BPMN 2.0 XML + Auto-Layout
8. Bewertung generieren                → Reifegrad, Schwachstellen, Potenziale, Risiken
9. Review & Korrektur (Human-in-Loop)  → Editor, Nachfragen der KI beantworten
10. Export                             → BPMN, PDF-Bericht, SVG/PNG, Handlungsplan
```

Wichtig: **Human-in-the-loop.** Die KI schlägt vor, der Mensch bestätigt/korrigiert. Bei Lücken stellt das System **gezielte Rückfragen** („Wer genehmigt den Antrag – dieselbe Rolle wie die Prüfung?").

---

## 4. Datenmodell (Kern-Entitäten)

```
Organization ─┬─ User (Rolle, SSO-Identität)
              └─ Project ─── Process ─┬─ InterviewSession ─┬─ AudioFile
                                      │                    └─ Transcript (Segmente, Sprecher)
                                      ├─ Asset (photo | pdf | video, + extrahierter Text/OCR)
                                      ├─ ProcessModel (versioniert)
                                      │     ├─ ir_json      (strukturierte Zwischenform)
                                      │     └─ bpmn_xml     (generiertes BPMN 2.0)
                                      ├─ Assessment (Scores je Dimension, Findings, Empfehlungen)
                                      └─ Export/Report (PDF, XML, Bilder)
```

Jedes `ProcessModel` ist **versioniert** – so bleibt nachvollziehbar, was die KI vorschlug und was der Mensch änderte (wichtig für Revisionssicherheit/KRITIS).

---

## 5. Die KI-Pipeline (das Herzstück)

Der zentrale Trick: **Nicht** direkt „Audio → BPMN" (das halluziniert). Sondern ein sauberer, prüfbarer Zwischenschritt – die **Process Intermediate Representation (IR)**.

```
 Audio/Video ──► [ASR: Whisper] ──► Transkript
 PDF ──────────► [Text-Extraktion] ─┐
 Foto ─────────► [Vision/OCR] ──────┤
 Video-Frames ─► [Keyframe-Analyse]─┤
                                    ▼
                        [LLM-Extraktion + Rückfragen]
                                    │
                                    ▼
                    Process IR  (validiertes JSON-Schema)
                    · tasks / activities   · gateways (Entscheidungen)
                    · lanes / roles        · events (Start/Ende/Zwischen)
                    · data objects         · systems (SAP, GIS, …)
                    · sequence flows       · offene Fragen
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       [Deterministischer                 [Bewertungs-Engine
        BPMN-Generator]                     (Rubrik-basiert)]
                    │                               │
                    ▼                               ▼
          BPMN 2.0 XML + Layout            Assessment (Scores + Findings)
```

**Warum die IR?** Sie ist menschenlesbar, per JSON-Schema **validierbar**, versionierbar, und trennt „Verstehen" (LLM) von „Zeichnen" (deterministischer Code). Das reduziert Halluzinationen drastisch und macht Ergebnisse reproduzierbar.

### Bausteine
- **ASR (Spracherkennung):** [faster-whisper](https://github.com/SYSTRAN/faster-whisper) – läuft lokal/on-prem, gute Deutsch-Qualität, Sprecher-Diarisierung optional.
- **Dokumente:** PDF-Textextraktion (`pdf-parse`/`unstructured`), OCR für gescannte PDFs/Fotos (Tesseract on-prem oder Vision-Modell).
- **Bilder/Video:** Vision-Modell (Claude in der Cloud **oder** lokales VLM) für Kontext („Foto zeigt Zählerschrank Typ X"); Video → Keyframes + Audiospur.
- **LLM-Extraktion:** strukturierte Ausgabe erzwungen (Tool/JSON-Schema-Constrained). **Provider-Abstraktion** – austauschbar zwischen Anthropic Claude (Cloud) und lokalem Modell.
- **BPMN-Generator:** IR → BPMN 2.0 XML deterministisch, danach Auto-Layout (`bpmn-auto-layout`).

---

## 6. BPMN-Ansatz (voll on-prem-tauglich)

- **[bpmn-js](https://bpmn.io) (Apache-2.0):** Rendering **und** Editor laufen komplett im Browser – kein Cloud-Dienst nötig, ideal für On-Prem/Air-Gap.
- Pipeline erzeugt valides **BPMN 2.0 XML** → im `bpmn-js`-Viewer anzeigen → im Editor korrigieren → als `.bpmn` exportieren (interoperabel mit Camunda, Signavio, Visio-Import etc.).
- Auto-Layout sorgt für saubere Anordnung ohne manuelles Ziehen.

---

## 7. Bewertungs-Framework (Rubrik)

Jede Dimension liefert **Score (0–100) + Findings + konkrete Empfehlungen**. Die Rubrik ist konfigurierbar (branchenspezifische Presets für Energie/KRITIS).

| Dimension | Was wird bewertet | Beispiel-Finding |
|---|---|---|
| **Reifegrad / Standardisierung** | Ist der Prozess definiert, wiederholbar, dokumentiert? | „3 undokumentierte Sonderfälle" |
| **Medien- & Systembrüche** | Wechsel zwischen Papier/Excel/SAP/GIS | „5 Medienbrüche, 2× Doppelerfassung" |
| **Automatisierungspotenzial** | Manuelle, regelbasierte Schritte | „Antragsprüfung zu 70% automatisierbar" |
| **Durchlaufzeit & Engpässe** | Wartezeiten, Rückschleifen, Freigabestaus | „Genehmigung = Engpass, Ø 6 Tage" |
| **Risiken & Compliance** | KRITIS, ISO 27001, DSGVO, Vier-Augen-Prinzip | „Kein dokumentiertes Vier-Augen-Prinzip" |
| **Rollen-Klarheit (RACI)** | Sind Verantwortlichkeiten eindeutig? | „Rolle für Schritt 4 unklar" |
| **Datenqualität / Doppelarbeit** | Redundante Erfassung, Inkonsistenzen | „Kundendaten 3× erfasst" |

Output: **Management-Summary + Detailbefunde + priorisierter Handlungsplan** (Quick Wins vs. strategische Hebel).

---

## 8. Architektur (On-Prem-fähig)

```
┌─────────────────────────────────────────────────────────────┐
│  Browser:  Next.js (App Router) + React + bpmn-js Editor     │
└───────────────┬─────────────────────────────────────────────┘
                │ HTTPS
┌───────────────▼─────────────────────────────────────────────┐
│  App-Server:  Next.js (API Routes / Server Actions) + Auth   │
│               ├─ REST/tRPC für UI                            │
│               └─ Job-Enqueue (lange KI-Tasks)               │
├──────────────────────────────────────────────────────────────┤
│  Worker:      Job-Queue (BullMQ/Redis) → KI-Pipeline         │
├──────────────────────────────────────────────────────────────┤
│  LLM-Gateway (Adapter):   Cloud (Anthropic)  |  Local (vLLM/ │
│                            Ollama, OpenAI-kompatibel)        │
│  ASR-Service:             faster-whisper (Container)         │
├──────────────────────────────────────────────────────────────┤
│  Postgres  │  Redis (Queue)  │  MinIO/S3 (Dateien, verschl.) │
└──────────────────────────────────────────────────────────────┘
        Alles containerisiert:  Docker Compose (Dev + On-Prem)
                                → Helm-Chart für Kubernetes
```

**On-Prem-Schlüsselentscheidung – der LLM-Adapter:** Jeder KI-Aufruf geht durch ein internes Gateway mit austauschbarem Backend. In der Cloud/MVP: Anthropic Claude. Beim Kunden im Rechenzentrum: lokales Modell (z. B. Llama/Mistral via vLLM, OpenAI-kompatible API) – **gleicher Code, andere Konfiguration**. So bleibt das Produkt bis hin zu air-gapped lauffähig.

---

## 9. Sicherheit & Compliance (KRITIS)

- **Datenhaltung:** EU / On-Prem / air-gapped möglich – kein Zwang zu US-Cloud.
- **Mandantenfähigkeit & RBAC:** strikte Trennung je Organisation, rollenbasierte Rechte.
- **Verschlüsselung:** at-rest (Storage/DB) und in-transit (TLS).
- **Audit-Log:** wer hat was wann geändert (KI-Vorschlag vs. Mensch).
- **SSO:** OIDC/SAML (Keycloak/Azure AD) für Enterprise/On-Prem.
- **DSGVO:** Löschkonzept, Auftragsverarbeitung, Zweckbindung, Minimierung.
- **Kein Training auf Kundendaten** ohne explizite Freigabe.

---

## 10. Roadmap / Phasen

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **0 – Konzept** *(jetzt)* | Dieses Dokument, Scope, Architektur | Entscheidungsgrundlage |
| **1 – MVP-Durchstich** | Text/Transkript rein → IR → BPMN → Bewertung anzeigen | Klickbarer Ende-zu-Ende-Pfad |
| **2 – Erfassung & Multimodal** | Audioaufnahme + Upload (Foto/PDF/Video) + Whisper | Echte Interview-Erfassung |
| **3 – Review & Export** | BPMN-Editor, KI-Rückfragen, PDF-Bericht, Exporte | Produktiv nutzbar |
| **4 – On-Prem-Paket** | Docker/Helm, lokale Modelle, SSO, Audit | Beim Kunden deploybar |
| **5 – Skalierung** | Mandantenfähigkeit, Rubrik-Presets, Benchmarks, Analytics | Marktreife SaaS |

---

## 11. Tech-Stack (Vorschlag)

| Bereich | Wahl | Warum |
|---|---|---|
| Frontend/Backend | **Next.js + TypeScript** | Ein Stack, SSR, self-hostbar (Node) |
| UI | React, Tailwind, shadcn/ui | Schnell, konsistent |
| BPMN | **bpmn-js** | Open Source, läuft on-prem im Browser |
| DB | **PostgreSQL** + Prisma | Robust, self-hostbar |
| Queue | **Redis + BullMQ** | Lange KI-Jobs entkoppeln |
| Files | **MinIO** (S3-kompatibel) | On-prem Objektspeicher |
| ASR | **faster-whisper** | Lokale Transkription DE |
| LLM | **Adapter:** Anthropic ↔ vLLM/Ollama | Cloud jetzt, on-prem später |
| Auth | NextAuth + OIDC (Keycloak) | Enterprise-SSO |
| Deploy | Docker Compose → Helm | Dev = Prod = On-Prem |

---

## 12. Risiken & offene Fragen

- **Qualität der Extraktion:** Deutsch, Fachjargon, Dialekt, schlechte Audioqualität → Rückfrage-Mechanismus + Review-Pflicht als Sicherheitsnetz.
- **Lokale Modelle vs. Claude:** On-Prem-Modelle sind (noch) schwächer bei strukturierter Extraktion → IR-Schema + Validierung + evtl. kleineres, feingetuntes Modell.
- **BPMN-Detailtiefe:** Wie granular? → konfigurierbarer Detaillevel (Übersicht vs. Feinprozess).
- **Namensrechte / Marke:** Produktname prüfen.
- **Preismodell:** pro Prozess? pro Seat? On-Prem-Lizenz? → früh klären.

---

## 13. Namensvorschläge (Arbeitstitel)

*ProzessLupe · Prozessradar · InterviewFlow · ProcessScribe · Flowcap · Prozesskompass*

---

## 14. Nächste Schritte (Empfehlung)

1. **Konzept freigeben** (dieses Dokument) und Produktnamen wählen.
2. **IR-Schema entwerfen** – das JSON-Schema der Zwischenform ist das Fundament.
3. **Phase-1-MVP bauen:** Text rein → IR → BPMN (`bpmn-js`) → Bewertung. Ein echter Durchstich, den man klicken kann.
4. Danach Erfassung/Upload + Whisper (Phase 2).

> Sag Bescheid, wenn das Konzept passt – dann entwerfe ich als Nächstes das **IR-Schema** und baue den **Phase-1-Durchstich** in Next.js.
