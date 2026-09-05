# Authentifizierung & Konventionen

Alles hier stammt aus den OpenAPI-Specs der epilot-Clients (`components.securitySchemes`,
Access Token API) und dem offiziellen SDK. Handgepflegt – im Gegensatz zu den Seiten
unter `apis/`.

## Das Grundmuster

Jeder Aufruf gegen eine epilot-API trägt einen JWT im Authorization-Header:

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

Der Token trägt Identität, Organisation und Berechtigungen in sich. Es gibt **keine
klassischen API-Keys** – auch der langlebige Integrations-Token ist ein JWT.

In den Specs heißt dieses Schema fast überall `EpilotAuth` (`type: http`, `scheme: bearer`).
Abweichende Namen für dasselbe Muster: `BearerAuth` (Workflows), `custom_authorizer` (Design).

## Token besorgen: Access Token API

Für Integrationen erzeugst du einen langlebigen Token über die
[Access Token API](./apis/access-token.md) (`https://access-token.sls.epilot.io`):

```http
POST /v1/access-tokens
Authorization: Bearer <dein-User-Token>
Content-Type: application/json

{ "name": "Integration Netzbau", "token_type": "api", "assignments": [] }
```

Wichtige Felder:

| Feld | Bedeutung |
| --- | --- |
| `token_type` | `api`, `journey`, `portal`, `portal_preview`, `assume`, `app` |
| `assignments` | Rollen des Tokens, z. B. `"739224:employee"`. Leer = Rollen des ausstellenden Users |
| `expires_in` | Sekunden (30 – 604800) oder Kurzform wie `"7d"`, `"1h"` |
| `read_only` | `true` beschränkt den Token auf lesende Operationen |

Verwalten: `GET /v1/access-tokens` (auflisten), `DELETE /v1/access-tokens/{id}` (widerrufen).
Zur Verifikation stellt der Dienst JWKS und OIDC-Discovery bereit, jeweils getrennt für
interne, öffentliche und Portal-Preview-Tokens:
`/v1/access-tokens/.well-known/jwks.json` bzw. `/.well-known/openid-configuration`.

## Die vier Token-Welten

epilot trennt sauber zwischen Innen- und Außensicht. Welches Schema eine API akzeptiert,
steht auf ihrer Seite unter *Security Schemes*.

| Schema | Wer | Typisch bei |
| --- | --- | --- |
| `EpilotAuth` | Mitarbeiter oder Server-Integration (`api`-Token) | fast alle APIs |
| `EpilotPublicAuth` | anonymer Endkunde in einer Journey (`journey`-Token) | Address, Iban, Pricing, Address Suggestions, Validation Rules |
| `PortalAuth` | eingeloggter Portalnutzer (Cognito-Token) | Customer Portal, Journey, Metering |
| `ExternalOIDCAuth` | Portalnutzer aus fremdem Identity Provider | Customer Portal |

`EitherAuth` (Customer Portal, Metering) akzeptiert Portal- **oder** epilot-Token.
Ein Sonderfall ist die File API: sie kennt zusätzlich `CookieAuth` – ein Aufruf von
`GET /v1/files/session` mit Bearer-Token setzt ein HttpOnly-Cookie `token`, damit
Dateien direkt in `<img>`-Tags eingebunden werden können.

## Organisations-Kontext

Der Token bestimmt die Organisation. Wer mandantenübergreifend arbeitet (Shared Tenant,
Partner), überschreibt sie per Header:

```http
x-epilot-org-id: 739224
```

In den Specs heißt das Schema `EpilotOrg`. Achtung auf den Header-Namen – nicht alle
Dienste sind vereinheitlicht:

- `x-epilot-org-id` – Regelfall (Entity, App, Message, Kanban, Purpose, …)
- `x-ivy-org-id` – Template Variables (`EpilotOrg`) sowie Customer Portal, Metering,
  Partner Directory, Messaging Settings (dort als `AsOrganization`, laut Spec
  **nur intern** für Service-zu-Service-Aufrufe)

## Base URLs & Umgebungen

Produktion folgt dem Muster `https://<service>.sls.epilot.io`. Einige Services führen
zusätzlich Dev-/Staging-Hosts in ihrer Spec: `https://<service>.dev.sls.epilot.io`,
`https://<service>.staging.sls.epilot.io`.

Nicht jeder Hostname folgt dem Servicenamen: die Journey API läuft auf
`journey-config.sls.epilot.io`, die Workflow-APIs auf `workflows-execution` bzw.
`workflows-definition`, die Organization API auf `organization-v2`.
Die verbindliche URL steht in jeder Spec unter `servers` – und auf jeder API-Seite hier.

## Zugriff aus Code

Das offizielle SDK kapselt alle Clients (Specs werden lazy geladen):

```bash
npm i @epilot/sdk axios openapi-client-axios
```

```ts
import { epilot } from '@epilot/sdk'

epilot.authorize(() => process.env.EPILOT_TOKEN!)

const { data: entity } = await epilot.entity.createEntity(
  { slug: 'contact' },
  { first_name: 'John', last_name: 'Doe' },
)
```

Der Methodenname ist die `operationId` aus der Spec – genau die Spalte *Operation* in
den Tabellen unter `apis/`. Signatur ist immer `(parameters, body?, axiosConfig?)`.

Ohne Node geht es genauso gut direkt: jede API hat eine OpenAPI-Spec unter
`https://docs.api.epilot.io/<slug>.yaml`, daraus lässt sich für jede Sprache ein
Client generieren.
