# Iban API

> Slug `iban` · OpenAPI-Version `1.0.0` · 1 Operationen

API Backend for epilot Iban feature.

## Zugriff

| | |
| --- | --- |
| Base URL | `https://iban-api.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/iban-api.yaml |
| Docs | https://docs.epilot.io/api/iban |
| SDK | `epilot.iban` aus `@epilot/sdk/iban` (Einzelpaket: `@epilot/iban-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotPublicAuth` (http/bearer)

## Endpunkte

### Ibans

_Operations related to ibans_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/public/iban:validate` | `validateIban` | Validate an Iban |

---

_Generiert aus der OpenAPI-Spec von `iban-client` (@epilot Client 0.3.1). Nicht von Hand bearbeiten._
