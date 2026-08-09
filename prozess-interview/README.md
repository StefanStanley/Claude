# ProzessLupe *(Arbeitstitel)*

SaaS für den **Energiesektor**: Prozessaufnahme per **Interview**. Ein Fachexperte
erzählt seinen Prozess (Audio) und hängt Fotos, PDFs und Videos an – heraus kommt
ein **BPMN-Modell** und eine **Bewertung** des Prozesses.

- **Stack:** Next.js + TypeScript
- **Betrieb:** On-Prem-fähig (KRITIS) – KI-Anbieter austauschbar (Cloud ↔ lokal)
- **Status:** Phase-1-MVP (Durchstich lauffähig)

## Schnellstart

```bash
cd prozess-interview
npm install
cp .env.example .env        # optional: ANTHROPIC_API_KEY eintragen
npm run dev                 # http://localhost:3000
```

Ohne `ANTHROPIC_API_KEY` läuft die App automatisch im **Offline-Mock-Modus**
(deterministische Heuristik) — der Durchstick ist also ohne Cloud demofähig.
Mit gesetztem Key nutzt sie Anthropic Claude für die echte Extraktion.

**Bedienung:** Transkript einfügen (oder „Beispiel einfügen") → *Analysieren* →
BPMN-Modell + IR-Struktur + Bewertung erscheinen. Das Modell lässt sich als
`.bpmn` exportieren.

## Architektur des Durchstichs

| Datei | Rolle |
|---|---|
| `src/lib/ir/schema.ts` | **Process IR** + Assessment als Zod-Schema (Fundament) |
| `src/lib/llm/provider.ts` | Provider-Abstraktion (LLM-Gateway) |
| `src/lib/llm/anthropic.ts` | Cloud-Backend (Anthropic Claude) |
| `src/lib/llm/mock.ts` | Offline-Backend (Heuristik, kein Key nötig) |
| `src/lib/bpmn/generate.ts` | Deterministischer IR→BPMN-Generator + Auto-Layout |
| `src/app/api/analyze/route.ts` | Pipeline-Endpunkt |
| `src/components/BpmnViewer.tsx` | bpmn-js-Viewer (on-prem, im Browser) |

## Dokumentation

📄 **[KONZEPT.md](./KONZEPT.md)** – Vollständiges Konzept: Vision, User-Journey,
Datenmodell, KI-Pipeline, Architektur, Compliance, Roadmap.

## Kernidee der KI-Pipeline

```
Audio/PDF/Foto/Video → Transkript/Extraktion → Process IR (validiertes JSON)
                                                      ├──► BPMN 2.0 XML (bpmn-js)
                                                      └──► Bewertung (Rubrik)
```

Die **Process IR** (strukturierte Zwischenform) trennt „Verstehen" (LLM) vom
„Zeichnen" (deterministischer Generator) – prüfbar, versionierbar, wenig Halluzination.

## Nächste Schritte

1. Konzept freigeben, Produktnamen wählen
2. IR-JSON-Schema entwerfen
3. Phase-1-MVP-Durchstich bauen (Text → IR → BPMN → Bewertung)
