# Event Catalog API

> Slug `event-catalog` · OpenAPI-Version `0.1.0` · 14 Operationen

Manages the catalog of business events available in epilot

## Zugriff

| | |
| --- | --- |
| Base URL | `https://event-catalog.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/event-catalog.yaml |
| Docs | https://docs.epilot.io/api/event-catalog |
| SDK | `epilot.eventCatalog` aus `@epilot/sdk/event-catalog` (Einzelpaket: `@epilot/event-catalog-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### Event Catalog

_API for managing business event catalog_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/events` | `listEvents` | Retrieve list of available business events |
| `POST` | `/v1/events` | `createCustomEvent` | Reserve an org-scoped custom event name and persist its immutable v1.0 draft definition. |
| `DELETE` | `/v1/events/{event_name}` | `deprecateCustomEvent` | Soft-deprecate an org-scoped custom event. |
| `GET` | `/v1/events/{event_name}` | `getEvent` | Retrieve the configuration of a specific business event |
| `PATCH` | `/v1/events/{event_name}` | `patchEvent` | Update the configuration of a specific business event for the organization |
| `GET` | `/v1/events/{event_name}/example` | `getEventExample` | Generate a sample event payload based on the event's JSON Schema. |
| `GET` | `/v1/events/{event_name}/json_schema` | `getEventJSONSchema` | Retrieve the JSON Schema of a specific business event. |
| `GET` | `/v1/events/{event_name}/versions` | `listEventVersions` | List every known version of an event, along with the `latest` |
| `POST` | `/v1/events/{event_name}:history` | `searchEventHistory` | Paginated history of events |
| `POST` | `/v1/events/{event_name}:preview` | `previewCustomEvent` | Assemble and fully validate a persisted custom-event draft without publishing it. |
| `POST` | `/v1/events/{event_name}:publish` | `publishCustomEventDefinition` | Conditionally activate an immutable custom-event v1.0 definition. |
| `POST` | `/v1/events/{event_name}:trigger` | `triggerEvent` | Explicitly trigger an event by providing input field values and an optional entity seed |
| `GET` | `/v2/events/{event_name}/history/{event_id}` | `getHistoricalEvent` | Fetch a single historical event by id with full hydration |
| `POST` | `/v2/events/{event_name}:history` | `searchEventHistoryV2` | Paginated history of events with projected/lightweight payload (v2). |

---

_Generiert aus der OpenAPI-Spec von `event-catalog-client` (@epilot Client 0.7.0). Nicht von Hand bearbeiten._
