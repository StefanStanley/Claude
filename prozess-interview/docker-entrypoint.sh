#!/bin/sh
# Container-Start: erst Datenbank-Migrationen anwenden, dann den Server starten.
# So ist jeder Host (Render, docker compose, plain docker, On-Prem) selbst-migrierend.
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "→ Wende Datenbank-Migrationen an (prisma migrate deploy) …"
  # Direkt über den Paketpfad aufrufen (nicht .bin/prisma): so liegen die
  # .wasm-Assets neben dem CLI (node_modules/prisma/build/), sonst ENOENT.
  node node_modules/prisma/build/index.js migrate deploy
else
  echo "→ DATABASE_URL nicht gesetzt — Migration übersprungen (Persistenz deaktiviert, Mock-Modus)."
fi

exec "$@"
