# Kanban API

> Slug `kanban` · OpenAPI-Version `1.2.3` · 10 Operationen

The Kanban API provides board management and data query capabilities for epilot's Kanban view feature.

Kanban boards allow epilot users to visualize and manage workflow tasks, opportunities, and other entities in a column-based layout.

Key capabilities:
- Create, read, update, and delete Kanban boards with configurable swimlanes and filters
- Share boards with individual users or across the entire organization
- Set and clear the organization-level default board
- Query and autocomplete Flows data to populate Kanban cards with live entity data

## Zugriff

| | |
| --- | --- |
| Base URL | `https://kanban.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/kanban.yaml |
| Docs | https://docs.epilot.io/api/kanban |
| SDK | `epilot.kanban` aus `@epilot/sdk/kanban` (Einzelpaket: `@epilot/kanban-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### Kanban

_Endpoints for managing Kanban boards. Boards consist of swimlanes, each with configurable filters to display matching workflow tasks or entities. Boards can be owned by individual users and optionally shared with other users or the whole organization._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/kanban/board` | `createKanbanBoard` | Creates a new Kanban board with the provided configuration. |
| `DELETE` | `/v1/kanban/board/{boardId}` | `deleteKanbanBoard` | Permanently deletes a Kanban board by ID. |
| `GET` | `/v1/kanban/board/{boardId}` | `getKanbanBoard` | Retrieves a Kanban board by ID, including its full configuration (swimlanes, filters, sorting, card fields). |
| `PATCH` | `/v1/kanban/board/{boardId}` | `patchKanbanBoard` | Partially updates fields of an existing Kanban board by ID. |
| `PUT` | `/v1/kanban/board/{boardId}` | `updateKanbanBoard` | Fully replaces the configuration of an existing Kanban board by ID. |
| `GET` | `/v1/kanban/boards` | `getKanbanBoards` | Returns a list of all Kanban boards accessible to the authenticated user. |
| `DELETE` | `/v1/kanban/org/default-board` | `clearDefaultKanbanBoard` | Removes the default board configuration for the organization. |
| `PUT` | `/v1/kanban/org/default-board` | `setDefaultKanbanBoard` | Sets a Kanban board as the default board for the organization. |

### Query

_Endpoints for querying and autocompleting Flows data used to populate Kanban cards. These endpoints support filtering, sorting, and pagination of the underlying workflow task dataset._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/kanban/query/flows:autocomplete` | `flowsAutocomplete` | Returns autocomplete suggestions for a given attribute in the Flows dataset. |
| `POST` | `/v1/kanban/query/flows:execute` | `executeFlowsQuery` | Executes a query against the Flows dataset and returns paginated results for use in Kanban card rendering. |

---

_Generiert aus der OpenAPI-Spec von `kanban-client` (@epilot Client 1.4.2). Nicht von Hand bearbeiten._
