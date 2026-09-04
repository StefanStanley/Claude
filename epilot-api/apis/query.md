# Query API

> Slug `query` · OpenAPI-Version `0.2.0` · 21 Operationen

The Query API provides access to epilot's business analytics capabilities, enabling teams to query entity operations, workflow executions, and automation data stored in the epilot data lake.

**Key capabilities**

- **Entity queries** – Aggregate and filter entity operation events (create, update, delete) and point-in-time entity snapshots using `executeEntitiesQuery`.
- **Workflow analytics** – Query workflow execution counts, time series, phase durations, and task overviews using `executeWorkflowsQuery`.
- **Automation analytics** – Inspect automation execution history and list automation definitions via `executeAutomationQuery`.
- **Datalake V2 views** – Create and manage materialized SQL views over epilot data using `createOrUpdateView` and related endpoints.
- **BI tool integration** – Generate and manage ClickHouse credentials for connecting external BI tools (e.g. Tableau, Power BI) directly to the epilot data warehouse.
- **Semantic model** – Retrieve the semantic data model for agent/tool consumption via `getSemanticModel`.

**Concepts**

- **Measures** – Quantitative values to aggregate (e.g. `count_operations`, `count_entities`).
- **Dimensions** – Categorical groupings (e.g. `entity_attribute`, `time_with_granularity`).
- **Filters** – Constraints narrowing the dataset (e.g. time range, entity schema, workflow state).
- **Datasets** – Named data sources available for querying. Discover them with `listAvailableDatasetsV2`.

**Authentication**

All endpoints require a valid epilot Bearer token.

## Zugriff

| | |
| --- | --- |
| Base URL | `https://query.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/query.yaml |
| Docs | https://docs.epilot.io/api/query |
| SDK | `epilot.query` aus `@epilot/sdk/query` (Einzelpaket: `@epilot/query-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### Datasets

_Endpoints for discovering available datasets grouped by domain (entity, workflow, etc.)_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/query/datasets` | `listAvailableDatasetsV2` | Lists all available datasets grouped by domain |

### Query

_Execute analytical queries against epilot entity and workflow datasets._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v2/query/domain/automations:execute` | `executeAutomationQuery` | Query Automation Analytics Datasets. |
| `POST` | `/v2/query/domain/entities:execute` | `executeEntitiesQuery` | Execute queries against entities datasets. |
| `GET` | `/v2/query/domain/workflows/definitions` | `listWorkflowDefinitions` | Lists available worflow definitions with their ids, names and start times |
| `GET` | `/v2/query/domain/workflows/definitions/{workflowDefinitionId}/phases` | `listWorkflowPhasesByDefinitionId` | Retrieves the workflow phases associated with a given workflow definition ID. |
| `GET` | `/v2/query/domain/workflows/phases` | `listPhaseNames` | Lists phase names of an org. |
| `POST` | `/v2/query/domain/workflows:execute` | `executeWorkflowsQuery` | Query Workflow Analytics Datasets. |

### V1

_V1 query endpoints (maintained for backwards compatibility – prefer V2 endpoints for new integrations)_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/query/datasets` | `listDatasets` | Get list of available datasets |
| `POST` | `/v1/query:execute` | `executeQuery` | Execute queries against datasets. |

### V2

_V2 query endpoints including semantic model, autocomplete, and direct SQL-like query execution_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/query/autocomplete` | `autocomplete` | Generic autocomplete endpoint for querying distinct values across datasets. |
| `GET` | `/v2/query/semantic-model` | `getSemanticModel` | Get the semantic model for agent/tool consumption. |
| `GET` | `/v2/query/workflows:autocomplete` | `workflowsAutocomplete` | Autocomplete Workflows data |
| `POST` | `/v2/query:execute` | `executeQueryV2` | Execute queries against datasets. |

### Datalake V2

_Manage materialized SQL views and table relationships in the epilot data lake._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/datalake/relationships` | `getAllRelationships` | Retrieve all table relationships configured for the organization's data lake. |
| `POST` | `/datalake/relationships` | `createOrUpdateRelationship` | Define or update a relationship between two tables in the data lake. |
| `GET` | `/datalake/views` | `getAllViews` | Retrieve all materialized data lake views configured for the organization. |
| `POST` | `/datalake/views` | `createOrUpdateView` | Create or update a materialized SQL view in the epilot data lake. |
| `GET` | `/datalake/views/{view_slug}` | `getView` | Retrieve the definition and attributes of a specific data lake view by its slug. |

### CredentialsV2

_Manage ClickHouse credentials for connecting external BI tools directly to the epilot data warehouse_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v2/query/credentials:generate` | `generateCredentialsV2` | Generate credentials for the epilot datalake for connecting other BI tools with ClickHouse |
| `GET` | `/v2/query/credentials:list` | `listCredentialsV2` | List all the credentialof Clickhouse for the organization here |
| `POST` | `/v2/query/credentials:revoke` | `revokeCredentialsV2` | Revoke credentials for the epilot datalake for connecting other BI tools with Clickhouse |

---

_Generiert aus der OpenAPI-Spec von `query-client` (@epilot Client 0.5.4). Nicht von Hand bearbeiten._
