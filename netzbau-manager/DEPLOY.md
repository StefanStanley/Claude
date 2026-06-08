# Veröffentlichung (Publishing)

Die App besteht aus zwei Teilen, die getrennt deployt werden:

- **Frontend** (`netzbau-manager/`) → statischer Build, gehostet auf **Vercel**
- **Backend** (`netzbau-manager/server/`) → Node-Dienst, gehostet auf **Render**
  mit persistenter Disk für `db.json`

Reihenfolge: **erst Backend** (du brauchst dessen URL fürs Frontend), **dann
Frontend**.

---

## 1) Backend auf Render

Voraussetzung: GitHub-Repo mit Render verbunden.

### Variante A — manuell (empfohlen, funktioniert sicher im Monorepo)

1. Render → **New** → **Web Service** → dieses Repo wählen.
2. Einstellungen:
   - **Root Directory:** `netzbau-manager/server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
   - **Instance Type:** **Starter** (für persistente Disk nötig)
3. **Advanced → Add Disk:**
   - **Name:** `netzbau-data`
   - **Mount Path:** `/var/data`
   - **Size:** 1 GB
4. **Environment Variables:**
   - `DB_PATH = /var/data/db.json`
   - `CORS_ORIGIN = https://DEINE-FRONTEND-DOMAIN.vercel.app`
     (kann nach dem Frontend-Deploy nachgetragen/aktualisiert werden)
   - `NODE_VERSION = 20`
5. **Create Web Service.** Nach dem Deploy bekommst du eine URL wie
   `https://netzbau-manager-api.onrender.com`.
6. Test: `https://…onrender.com/api/health` → `{"status":"ok",…}`.

### Variante B — Blueprint

`render.yaml` (liegt in `netzbau-manager/`) ins **Repo-Root** verschieben und in
Render **New → Blueprint** auswählen. Danach nur noch `CORS_ORIGIN` setzen.

> **Free-Plan-Hinweis:** Persistente Disks gibt es nur ab **Starter**
> (kostenpflichtig). Auf dem Free-Plan läuft es auch — aber ohne Disk: dann
> `DB_PATH` weglassen, und die Daten fallen bei jedem Neustart auf den
> Seed-Stand zurück (für eine reine Demo ok). Free-Instanzen „schlafen" zudem
> nach Inaktivität ein (erster Aufruf dauert dann ein paar Sekunden).

---

## 2) Frontend auf Vercel

1. Vercel → **Add New… → Project** → dieses Repo wählen.
2. **Root Directory:** `netzbau-manager` (wichtig im Monorepo!).
3. Framework wird als **Vite** erkannt; Build/Output kommen aus `vercel.json`
   (`npm run build` → `dist`).
4. **Environment Variable:**
   - `VITE_API_URL = https://netzbau-manager-api.onrender.com`
     (die Render-URL aus Schritt 1)
5. **Deploy.** Du bekommst eine URL wie `https://netzbau-manager.vercel.app`.
6. Zurück zu Render: `CORS_ORIGIN` auf genau diese Vercel-URL setzen und neu
   deployen.

Fertig — das Frontend lädt die Daten nun vom Render-Backend; der Statuschip
oben rechts zeigt **„Backend"**.

---

## Schnelltest nach dem Deploy

- `GET https://…onrender.com/api/massnahmen` liefert die Maßnahmenliste.
- In der Web-App eine neue Maßnahme anlegen → nach Reload noch vorhanden
  (= Disk-Persistenz funktioniert).

## Eigene Domain

Beide Plattformen erlauben eigene Domains (z. B. `netzbau.example.de` fürs
Frontend, `api.netzbau.example.de` fürs Backend). Danach `VITE_API_URL` und
`CORS_ORIGIN` entsprechend anpassen.

## Hinweis zu den Kartenkacheln

Die Karte lädt OpenStreetMap- und Geobasis-NRW-Kacheln direkt im Browser des
Nutzers. Für stärkere Nutzung einen eigenen Tile-Provider/Key verwenden und die
OSM-Nutzungsbedingungen beachten.
