# Sharing API

> Slug `sharing` · OpenAPI-Version `1.0.0` · 12 Operationen

REST API for managing partner sharing configurations and entity sharing.

## Zugriff

| | |
| --- | --- |
| Base URL | `https://sharing-api.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/sharing-api.yaml |
| Docs | https://docs.epilot.io/api/sharing |
| SDK | `epilot.sharing` aus `@epilot/sdk/sharing` (Einzelpaket: `@epilot/sharing-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### Sharing Configuration

_Manage partner sharing configurations_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/sharing/configurations` | `getSharingConfigurations` | Get sharing configurations for multiple partners |
| `GET` | `/v1/sharing/configurations/by-role/{template_role_id}` | `getConfigurationsByTemplateRole` | Get sharing configurations that use a specific template role |
| `DELETE` | `/v1/sharing/configurations/{partner_org_id}` | `deleteSharingConfiguration` | Delete sharing configuration for a partner |
| `GET` | `/v1/sharing/configurations/{partner_org_id}` | `getSharingConfiguration` | Get sharing configuration for a partner |
| `PATCH` | `/v1/sharing/configurations/{partner_org_id}` | `updateSharingConfiguration` | Update sharing configuration for a partner |
| `PUT` | `/v1/sharing/configurations/{partner_org_id}/role` | `assignRoleToConfiguration` | Assign a template role to a partner sharing configuration |
| `POST` | `/v1/sharing/configurations:search` | `searchPartnerSharingConfigurations` | Search partner sharing configurations by entities |

### Entity Sharing

_Share and unshare entities with partners_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/sharing/entities:share` | `shareEntityWithPartners` | Share or unshare entities with partners |
| `POST` | `/v1/sharing/entities:share-child` | `shareChildEntityWithPartners` | Share or unshare child entities with partners |

### Entity Offering

_Offer entities to partners (First Come First Served)_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/sharing/entities:offer` | `offerEntityToPartners` | Offer or unoffer entities to partners (First Come First Served) |
| `GET` | `/v1/sharing/offers/status` | `getOfferStatus` | Get the status of an entity offer (public, no auth required) |
| `POST` | `/v1/sharing/offers:accept` | `acceptOffer` | Accept an entity offer (public, no auth required) |

---

_Generiert aus der OpenAPI-Spec von `sharing-client` (@epilot Client 0.1.1). Nicht von Hand bearbeiten._
