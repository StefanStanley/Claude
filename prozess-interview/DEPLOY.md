# Deployment — ProzessLupe

On-Prem-fähiger Betrieb der Phase-1-App. Der MVP ist **zustandslos** (keine
Datenbank), lässt sich also mit einem einzigen Container betreiben.

## Mit Docker Compose (empfohlen)

```bash
cd prozess-interview
docker compose up --build      # baut das Image und startet die App
# → http://localhost:3000
```

Stoppen: `docker compose down`.

### KI-Provider konfigurieren

Ohne Konfiguration läuft die App im **Offline-Mock-Modus** (deterministische
Heuristik, kein Netz nötig). Für die echte Claude-Extraktion eine `.env` neben
`docker-compose.yml` anlegen — Compose liest sie automatisch:

```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
```

## Nur Docker (ohne Compose)

```bash
docker build -t prozess-interview:latest .
docker run --rm -p 3000:3000 \
  -e LLM_PROVIDER=anthropic -e ANTHROPIC_API_KEY=sk-ant-... \
  prozess-interview:latest
```

## Wie das Image gebaut ist

- **Multi-Stage** (`Dockerfile`): `deps` → `build` → schlanke `runner`-Stage.
- **Next.js Standalone-Output** (`output: "standalone"`): nur der Server + die
  tatsächlich genutzten `node_modules` (inkl. `bpmn-auto-layout`) landen im Image.
- Läuft als **non-root** User, mit **Healthcheck** gegen `/`.
- Start-Kommando: `node server.js` (kein `npm`/kein Dev-Server im Container).

## On-Prem / air-gapped

- **Kein API-Key nötig:** `LLM_PROVIDER=mock` liefert den vollständigen
  Durchstich ohne externen Dienst.
- Für ein **lokales LLM** (vLLM/Ollama, OpenAI-kompatibel) ist im
  `docker-compose.yml` bereits ein auskommentierter Service-Block vorgesehen;
  die Anbindung erfolgt über das LLM-Gateway (`src/lib/llm/`).
- Persistenz (Postgres), Objektspeicher (MinIO) und Transkription (Whisper)
  kommen in Phase 2+ als weitere Compose-Services dazu.

## Hinweis zur Verifikation

Der Standalone-Server (`node server.js`, identisch zum Container-`CMD`) wurde
getestet: Startseite **200**, `POST /api/analyze` **200** mit gültigem BPMN-DI.
Der reine `docker build` konnte in der Entwicklungs-Sandbox nicht ausgeführt
werden, weil dort das Ziehen der Base-Images blockiert ist — auf einer normalen
Docker-Umgebung baut das Dockerfile nach dem kanonischen Next.js-Standalone-Muster.
