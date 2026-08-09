# Deployment — ProzessLupe

Die App speichert Prozesse **versioniert** in PostgreSQL (Prisma) und **migriert
sich beim Start selbst** (`docker-entrypoint.sh` → `prisma migrate deploy`).
Dadurch ist jeder Host gleich einfach: Render, Docker Compose, plain Docker, On-Prem.

Zur Laufzeit braucht die App nur:
- **`DATABASE_URL`** (PostgreSQL) — Pflicht für die Persistenz
- **`ANTHROPIC_API_KEY`** (optional) — sonst Offline-Mock-Modus
- **`LLM_PROVIDER`** = `anthropic` oder `mock` (Default-Fallback: `mock`)

---

## Cloud: Render (Blueprint)

Die Datei **`render.yaml`** (im Repo-Root) beschreibt Web-Service **und** managed
PostgreSQL (Region Frankfurt / EU) in einem.

1. Code auf GitHub pushen (dieser Branch/PR genügt).
2. Render-Dashboard → **New → Blueprint** → dieses Repo auswählen.
   Render liest `render.yaml` und legt **Web-Service + Datenbank** an.
3. Warten, bis der erste Build durch ist. Beim Start wandert die App durch
   `prisma migrate deploy` und ist dann unter der Render-URL erreichbar.
4. **Echte KI aktivieren (optional):** im Web-Service unter *Environment*
   `ANTHROPIC_API_KEY` eintragen und `LLM_PROVIDER` auf `anthropic` setzen →
   *Save* löst ein Redeploy aus. Ohne Key läuft alles im Mock-Modus.

**`DATABASE_URL`** wird automatisch aus der managed Datenbank injiziert
(`fromDatabase`), nichts weiter zu tun.

> Kosten/Grenzen: Im Blueprint stehen `plan: free` (Web spinnt bei Inaktivität
> herunter; die Free-Datenbank ist auf ~30 Tage befristet). Für Dauerbetrieb den
> Web-Service auf `starter` und die Datenbank auf `basic-256mb` (o.ä.) hochstufen.

---

## Lokal / On-Prem: Docker Compose

```bash
cd prozess-interview
docker compose up --build      # startet Postgres + App → http://localhost:3000
```

Die App migriert selbst und startet, sobald Postgres gesund ist.
Stoppen: `docker compose down` · inkl. Daten: `docker compose down -v`.

Für echte Claude-Extraktion eine `.env` neben `docker-compose.yml` anlegen:

```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
# optional DB-Defaults überschreiben: POSTGRES_USER / _PASSWORD / _DB
```

---

## Lokale Entwicklung (App ohne Docker)

```bash
cd prozess-interview
npm install
docker compose up -d db        # nur Postgres
export DATABASE_URL="postgresql://prozess:prozess@localhost:5432/prozess?schema=public"
npx prisma migrate deploy
npm run dev                    # http://localhost:3000
```

---

## Wie das Image gebaut ist

- **Multi-Stage** (`Dockerfile`): `deps` → `build` → schlanke `runner`-Stage.
- **Next.js Standalone-Output**: Server + genutzte `node_modules` (inkl.
  `bpmn-auto-layout` und der **Prisma-Query-Engine**; musl-Target im Schema gesetzt).
- Zusätzlich im Runner: **Prisma-CLI + Schema/Migrationen** für `migrate deploy`.
- **Entrypoint** wendet Migrationen an und startet dann `node server.js`.
- Alpine + `openssl`/`libc6-compat`, läuft als **non-root**, mit **Healthcheck**.

---

## On-Prem / air-gapped

- **Kein API-Key nötig:** `LLM_PROVIDER=mock` liefert den vollständigen Durchstich
  ohne externen Dienst.
- Für ein **lokales LLM** (vLLM/Ollama, OpenAI-kompatibel) ist das LLM-Gateway
  (`src/lib/llm/`) der Anbindungspunkt.

---

## Verifikation (Stand dieser Iteration)

Gegen eine echte PostgreSQL 16 verifiziert — im exakten Standalone-Layout des
Dockerfiles (`docker-entrypoint.sh node server.js`):

- `prisma migrate deploy` läuft idempotent, danach startet der Server (Homepage
  **200**, `GET /api/processes` **200** mit den gespeicherten Prozessen).
- Voller Persistenz-Zyklus **Speichern → Liste → neue Version → laden → Löschen**.
- `tsc --noEmit` und `next build` grün; beide Prisma-Engines (debian + musl)
  ins Standalone-Bundle getraced.

Der reine `docker build` / das Render-Deployment ließen sich in der
Entwicklungs-Sandbox nicht ausführen (dort ist das Ziehen von Base-Images
blockiert); Dockerfile und `render.yaml` folgen den kanonischen Mustern.
