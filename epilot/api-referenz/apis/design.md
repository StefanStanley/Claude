# Design Builder API v2

> Slug `design` · OpenAPI-Version `0.0.3` · 14 Operationen

## Zugriff

| | |
| --- | --- |
| Base URL | `https://design-builder-api.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/design-builder-api.yaml |
| Docs | https://docs.epilot.io/api/design |
| SDK | `epilot.design` aus `@epilot/sdk/design` (Einzelpaket: `@epilot/design-client`) |

**Security Schemes:** `custom_authorizer` (http/bearer)

## Endpunkte

### design-builder

_Available design-builder over designs provided by Design Builder v2_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/brands` | `getBrands` | **deprecated** · Scan all brands linked to a organization, based in orgId attribute from JWT auth token |
| `GET` | `/v1/designs` | `getAllDesigns` | Scan all designs linked to a organization, based in orgId attribute from JWT auth token |
| `POST` | `/v1/designs` | `addDesign` | Create a brand new design linked to a organization, based in orgId attribute from JWT auth token |
| `PUT` | `/v1/designs/addConsumer/{application}/{designId}` | `addConsumer` | Add a consumer that uses a specific design |
| `GET` | `/v1/designs/consumer/{application}/{consumerId}` | `getConsumerDesign` | Search for a especific design owned by user organization |
| `GET` | `/v1/designs/files` | `getFiles` | List all files for the user organization bucket |
| `POST` | `/v1/designs/files` | `uploadFile` | Upload a new file for the user organization bucket |
| `GET` | `/v1/designs/limit` | `getLimit` | **deprecated** · Gets designs number limit from database per organization |
| `PUT` | `/v1/designs/removeConsumer/{application}/{designId}` | `removeConsumer` | Remove a consumer that uses a specific design |
| `DELETE` | `/v1/designs/{designId}` | `deleteDesign` | Search and delete for a especific design owned by user organization |
| `GET` | `/v1/designs/{designId}` | `getDesign` | Search for a especific design owned by user organization |
| `PUT` | `/v1/designs/{designId}` | `updateDesign` | Update a especific design owned by user organization |
| `POST` | `/v1/designs/{designId}/duplicate` | `duplicateDesign` | Duplicate an existing design owned by the user organization. |
| `GET` | `/v1/designs/{designId}/parse` | `getThemeFromDesign` | Search for a especific design owned by user organization and parse them to a new or old theme |

---

_Generiert aus der OpenAPI-Spec von `design-client` (@epilot Client 0.5.7). Nicht von Hand bearbeiten._
