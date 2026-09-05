# Consent API

> Slug `consent` · OpenAPI-Version `1.0.0` · 3 Operationen

Consent Management for epilot customer entities

## Zugriff

| | |
| --- | --- |
| Base URL | `https://consent.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/consent.yaml |
| Docs | https://docs.epilot.io/api/consent |
| SDK | `epilot.consent` aus `@epilot/sdk/consent` (Einzelpaket: `@epilot/consent-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### consent

_Consent Management_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/consent/publish` | `publishConsentEvent` | Publishes consent event on event bus, which appends to consent store |
| `GET` | `/v1/consent/{identifier}` | `listConsentEvents` | List opt-ins and opt-outs by customer identifier |
| `GET` | `/v1/opt-in/{token}` | `handleOptInWithToken` | Endpoint to handle opt-in links |

---

_Generiert aus der OpenAPI-Spec von `consent-client` (@epilot Client 1.5.3). Nicht von Hand bearbeiten._
