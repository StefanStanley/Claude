# Veröffentlichung auf Azure (Bordmittel)

Architektur mit Azure-eigenen Diensten:

- **Frontend** (`netzbau-manager/`, Vite-Build) → **Azure Static Web Apps** (gratis Tarif, eigener CI)
- **Backend** (`netzbau-manager/server/`, Node/Express) → **Azure App Service** (Linux, Node 20)
  mit persistentem `/home`-Verzeichnis für `db.json`

Reihenfolge: **erst Backend** (du brauchst dessen URL fürs Frontend), **dann Frontend**.

> Monorepo-Hinweis: Das Backend lädt zur Laufzeit Seed-Daten aus dem
> Frontend-Ordner (`../../src/data`). Deshalb wird beim Backend der **gesamte
> `netzbau-manager`-Ordner** deployt (inkl. `src/` und `server/`). Der unten
> angegebene Workflow erledigt das.

---

## 1) Backend – Azure App Service

### 1a. Web App anlegen (Portal)

1. [Azure-Portal](https://portal.azure.com) → **Ressource erstellen** → **Web App**.
2. Einstellungen:
   - **Name:** z. B. `netzbau-api` → URL wird `https://netzbau-api.azurewebsites.net`
   - **Veröffentlichen:** Code
   - **Laufzeitstapel:** **Node 20 LTS**
   - **Betriebssystem:** **Linux**
   - **Region:** z. B. *West Europe*
   - **Tarif:** **F1 (kostenlos)** zum Testen, **B1** für Dauerbetrieb
3. **Überprüfen + erstellen** → **Erstellen**.

### 1b. Konfiguration (Portal → die Web App → „Einstellungen → Umgebungsvariablen" bzw. „Konfiguration")

**App-Einstellungen** (Application settings) anlegen:

| Name | Wert |
| --- | --- |
| `DB_PATH` | `/home/data/db.json` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` |
| `CORS_ORIGIN` | *(später die SWA-URL eintragen)* |
| `ANTHROPIC_API_KEY` | *(optional – aktiviert KI-Antworten)* |
| `ASSISTANT_MODEL` | `claude-opus-4-8` *(optional)* |

**Startbefehl** (Konfiguration → Allgemeine Einstellungen → „Startbefehl"):

```
npm --prefix server start
```

Speichern.

### 1c. Publish-Profil holen

In der Web App → **Übersicht** → **Veröffentlichungsprofil abrufen** (lädt eine `.PublishSettings`-Datei).

### 1d. GitHub-Secret setzen

GitHub-Repo → **Settings → Secrets and variables → Actions → New repository secret**:

- **Name:** `AZURE_WEBAPP_PUBLISH_PROFILE`
- **Wert:** den **kompletten Inhalt** der heruntergeladenen Datei einfügen

### 1e. Workflow hinzufügen

Datei `.github/workflows/azure-backend.yml` im Repo anlegen (Name der Web App anpassen):

```yaml
name: Deploy Backend to Azure App Service
on:
  push:
    branches: [main]
    paths: ['netzbau-manager/**']
  workflow_dispatch:

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Backend-Abhängigkeiten installieren
        working-directory: netzbau-manager/server
        run: npm install --omit=dev
      - name: Deploy nach Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: netzbau-api            # <-- deinen App-Service-Namen eintragen
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: netzbau-manager         # ganzer Ordner: src/ + server/
```

Commit/Push → der Workflow läuft. **Test:** `https://netzbau-api.azurewebsites.net/api/health` → `{"status":"ok",…}`.

> Die persistente `db.json` liegt unter `/home/data/` und übersteht Neustarts/Deploys.

---

## 2) Frontend – Azure Static Web Apps

### 2a. Static Web App anlegen (Portal)

1. Portal → **Ressource erstellen** → **Static Web App**.
2. Einstellungen:
   - **Name:** z. B. `netzbau-app`
   - **Plantyp:** **Free**
   - **Quelle:** **GitHub** → Organisation/Repo/**Branch `main`** auswählen
   - **Buildvorgaben:** **Custom**
     - **App-Speicherort (app_location):** `netzbau-manager`
     - **API-Speicherort (api_location):** *(leer lassen)*
     - **Ausgabespeicherort (output_location):** `dist`
3. **Überprüfen + erstellen** → **Erstellen**.

Azure committet automatisch einen Workflow unter `.github/workflows/azure-static-web-apps-*.yml`.

### 2b. Backend-URL in den Build einbauen

Damit das Frontend das Backend findet, muss `VITE_API_URL` **zur Buildzeit** gesetzt sein. Im erzeugten SWA-Workflow beim Schritt `Azure/static-web-apps-deploy` einen `env`-Block ergänzen:

```yaml
      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_XXXX }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: 'upload'
          app_location: 'netzbau-manager'
          api_location: ''
          output_location: 'dist'
        env:
          VITE_API_URL: 'https://netzbau-api.azurewebsites.net'   # <-- deine Backend-URL
```

Commit/Push → SWA baut und veröffentlicht. Du bekommst eine URL wie
`https://netzbau-app.azurestaticapps.net`.

---

## 3) Verbinden (CORS) & Testen

1. Zurück zum **App Service** → `CORS_ORIGIN` auf die SWA-URL setzen, z. B.
   `https://netzbau-app.azurestaticapps.net` (ohne abschließenden `/`) → Speichern (App startet neu).
2. Die Static-Web-App-URL öffnen.
   - Der Statuschip oben rechts sollte **„Backend"** zeigen.
   - Test: eine neue Maßnahme anlegen → nach Reload noch vorhanden (Persistenz via `/home`).
   - KI-Assistent: mit gesetztem `ANTHROPIC_API_KEY` antwortet er „Claude · live", sonst regelbasiert.

---

## Kosten & Hinweise

- **Static Web Apps Free:** kostenlos, inkl. HTTPS und globalem CDN.
- **App Service F1 (kostenlos):** für Demos ok (begrenzte CPU-Minuten/Tag). Für
  Dauerbetrieb **B1** (kein Tageslimit, „Always On" möglich).
- **Persistenz:** `/home` ist bei App Service dauerhaft – die JSON-Datei reicht
  für Pilotbetrieb. Für Produktion später **Azure Database for PostgreSQL**.
- **Eigene Domain:** beide Dienste unterstützen Custom Domains (Portal →
  „Benutzerdefinierte Domains"). Danach `VITE_API_URL` und `CORS_ORIGIN` anpassen.
- **Kartenkacheln** (OSM/Geobasis NRW) lädt der Browser direkt – nichts weiter nötig.
