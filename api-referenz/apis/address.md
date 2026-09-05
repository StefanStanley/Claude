# Address API

> Slug `address` · OpenAPI-Version `2.0.0` · 3 Operationen

API for address based operations on the Epilot platform

## Zugriff

| | |
| --- | --- |
| Base URL | `https://address.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/address-api.yaml |
| Docs | https://docs.epilot.io/api/address |
| SDK | `epilot.address` aus `@epilot/sdk/address` (Einzelpaket: `@epilot/address-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotPublicAuth` (http/bearer)

## Endpunkte

### Availability

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/availability/{id}/validate` | `validateAvailabilityFile` | Validates an already uploaded availability file, it returns an array of errors if any errors are found in the file. |
| `POST` | `/v1/public/availability` | `availabilityCheck` | Check for Entities that contain a matching availability range in related availability files. |

### Address Suggestion

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/public/suggestions` | `getAddressSuggestions` | Get address suggestions for the given Availability File |

---

_Generiert aus der OpenAPI-Spec von `address-client` (@epilot Client 0.2.3). Nicht von Hand bearbeiten._
