# ProzessLupe *(Arbeitstitel)*

SaaS für den **Energiesektor**: Prozessaufnahme per **Interview**. Ein Fachexperte
erzählt seinen Prozess (Audio) und hängt Fotos, PDFs und Videos an – heraus kommt
ein **BPMN-Modell** und eine **Bewertung** des Prozesses.

- **Stack:** Next.js + TypeScript + PostgreSQL (Prisma)
- **Betrieb:** On-Prem-fähig (KRITIS) – KI-Anbieter austauschbar (Cloud ↔ lokal)
- **Status:** Phase 2 – Durchstich + versionierte Persistenz

## Schnellstart (Docker, empfohlen)

```bash
cd prozess-interview
docker compose up --build      # startet Postgres + Migration + App → http://localhost:3000
```

Ohne `ANTHROPIC_API_KEY` läuft die App im **Offline-Mock-Modus** (deterministische
Heuristik) — also ohne Cloud demofähig. Mit Key nutzt sie Anthropic Claude.

### Lokale Entwicklung

```bash
cd prozess-interview
npm install
docker compose up -d db        # nur Postgres
export DATABASE_URL="postgresql://prozess:prozess@localhost:5432/prozess?schema=public"
npx prisma migrate deploy
npm run dev                    # http://localhost:3000
```

### In die Cloud (Render)

Der Blueprint **`render.yaml`** (Repo-Root) legt Web-Service + managed Postgres
(EU/Frankfurt) an: Render-Dashboard → **New → Blueprint** → Repo wählen. Die App
migriert sich beim Start selbst.

Details & On-Prem-Hinweise: **[DEPLOY.md](./DEPLOY.md)**.

**Bedienung:** Transkript einfügen (oder „Beispiel einfügen") → *Analysieren* →
BPMN-Modell + IR-Struktur + Bewertung. Mit **Speichern** wird der Prozess
versioniert abgelegt; die Seitenleiste listet gespeicherte Prozesse, die
Versions-Auswahl zeigt die Historie. Das Modell lässt sich als `.bpmn` exportieren.

## Architektur des Durchstichs

| Datei | Rolle |
|---|---|
| `src/lib/ir/schema.ts` | **Process IR** + Assessment als Zod-Schema (Fundament) |
| `src/lib/llm/provider.ts` | Provider-Abstraktion (LLM-Gateway) |
| `src/lib/llm/anthropic.ts` | Cloud-Backend (Anthropic Claude) |
| `src/lib/llm/mock.ts` | Offline-Backend (Heuristik, kein Key nötig) |
| `src/lib/bpmn/generate.ts` | Deterministischer IR→BPMN-Generator + Auto-Layout |
| `src/app/api/analyze/route.ts` | Pipeline-Endpunkt (zustandslose Vorschau) |
| `src/components/BpmnViewer.tsx` | bpmn-js-Viewer (on-prem, im Browser) |
| `prisma/schema.prisma` | Datenmodell: `Process` + versionierte `ProcessVersion` |
| `src/lib/processes.ts` | Persistenz-Logik (CRUD + Versionierung, atomar) |
| `src/app/api/processes/**` | REST-API: Liste, Anlegen, Laden, Version anhängen, Löschen |

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

## Status & nächste Schritte

**Erledigt:** IR-Schema · KI-Pipeline (Cloud + Offline-Mock) · BPMN-Generierung &
Viewer · Bewertung · Docker-Setup · **versionierte Persistenz (Postgres)**.

**Als Nächstes (Phase 3):**
1. BPMN-**Editor** statt nur Viewer (Korrekturen zurück in die IR)
2. Rollen als BPMN-**Lanes** rendern
3. **Datei-Upload** (Foto/PDF/Video) + Whisper-Transkription
4. Auth / Mandantenfähigkeit (SSO)
