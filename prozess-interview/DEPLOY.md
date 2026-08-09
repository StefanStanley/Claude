# Deployment — ProzessLupe

On-Prem-fähiger Betrieb. Die App speichert Prozesse **versioniert** in PostgreSQL
(Prisma). Jede Analyse erzeugt eine neue, unveränderliche Version.

## Mit Docker Compose (empfohlen)

```bash
cd prozess-interview
docker compose up --build
# → http://localhost:3000
```

Compose startet drei Dienste:

1. **db** — PostgreSQL 16 (Volume `pgdata`, Healthcheck).
2. **migrate** — führt einmalig `prisma migrate deploy` aus (nutzt die
   Builder-Stage mit Prisma-CLI + Schema) und beendet sich.
3. **app** — die Next.js-App; startet erst, wenn `db` gesund **und** `migrate`
   erfolgreich durch ist.

Stoppen: `docker compose down` · inkl. Daten löschen: `docker compose down -v`.

### KI-Provider konfigurieren

Ohne Konfiguration läuft die App im **Offline-Mock-Modus** (deterministische
Heuristik, kein Netz nötig). Für die echte Claude-Extraktion eine `.env` neben
`docker-compose.yml` anlegen — Compose liest sie automatisch:

```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5

# Optional: DB-Zugangsdaten überschreiben (Defaults: prozess/prozess/prozess)
# POSTGRES_USER=prozess
# POSTGRES_PASSWORD=change-me
# POSTGRES_DB=prozess
```

## Lokale Entwicklung (ohne Docker für die App)

```bash
cd prozess-interview
npm install
# Nur die Datenbank via Docker hochziehen:
docker compose up -d db
# Schema anwenden + Client generieren:
export DATABASE_URL="postgresql://prozess:prozess@localhost:5432/prozess?schema=public"
npx prisma migrate deploy
npm run dev            # → http://localhost:3000
```

`cp .env.example .env` und Werte eintragen erspart das manuelle `export`.

## Wie das Image gebaut ist

- **Multi-Stage** (`Dockerfile`): `deps` → `build` → schlanke `runner`-Stage.
- **Next.js Standalone-Output**: nur Server + tatsächlich genutzte
  `node_modules` (inkl. `bpmn-auto-layout` und der **Prisma-Query-Engine** —
  musl-Target ist im `schema.prisma` gesetzt).
- Alpine + `openssl`/`libc6-compat` für die Prisma-Engine.
- Läuft als **non-root** User, mit **Healthcheck** gegen `/`.
- Start: `node server.js`.

## On-Prem / air-gapped

- **Kein API-Key nötig:** `LLM_PROVIDER=mock` liefert den vollständigen
  Durchstich ohne externen Dienst.
- **Persistenz** ist bereits enthalten (Postgres, versioniert).
- Für ein **lokales LLM** (vLLM/Ollama, OpenAI-kompatibel) ist das LLM-Gateway
  (`src/lib/llm/`) der Anbindungspunkt; MinIO (Datei-Upload) und Whisper
  (Transkription) folgen als weitere Compose-Services.

## Hinweis zur Verifikation

Verifiziert gegen eine echte PostgreSQL-16-Instanz über den Standalone-Server
(`node server.js`, identisch zum Container-`CMD`): kompletter Zyklus
**Speichern (v1) → Liste → neue Version (v2) → alte Version laden → Löschen**,
dazu `next build` und `tsc --noEmit` grün, und beide Prisma-Query-Engines
(debian + musl) korrekt ins Standalone-Bundle getraced. Der reine `docker build`
ist in der Entwicklungs-Sandbox nicht ausführbar (das Ziehen der Base-Images ist
dort blockiert); auf einer normalen Docker-Umgebung baut das Dockerfile nach dem
kanonischen Next.js-Standalone-Muster.
