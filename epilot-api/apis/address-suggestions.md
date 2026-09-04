# Address Suggestions API

> Slug `address-suggestions` · OpenAPI-Version `1.0.0` · 4 Operationen

## Zugriff

| | |
| --- | --- |
| Base URL | `https://address-suggestions-api.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/address-suggestions-api.yaml |
| Docs | https://docs.epilot.io/api/address-suggestions |
| SDK | `epilot.addressSuggestions` aus `@epilot/sdk/address-suggestions` (Einzelpaket: `@epilot/address-suggestions-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotPublicAuth` (http/bearer)

## Endpunkte

### Addresses API

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/addresses-files:validate` | `validateAddressesFile` | validate addresses file |
| `GET` | `/v1/public/availability:check` | `checkAvailability` | Check address availability |
| `GET` | `/v1/public/suggestions` | `getAddresses` | get addresses from file |
| `GET` | `/v1/suggestions:validate` | `validateAddresses` | **deprecated** · validate addresses file |

---

_Generiert aus der OpenAPI-Spec von `address-suggestions-client` (@epilot Client 1.3.3). Nicht von Hand bearbeiten._
