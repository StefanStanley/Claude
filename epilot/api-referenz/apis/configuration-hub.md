# Configuration Hub API

> Slug `configuration-hub` · OpenAPI-Version `0.2.0` · 21 Operationen

Lightweight index API for exploring epilot organization configurations.

Provides a unified tree view across all config types. Returns summary metadata only —
the frontend calls individual epilot APIs directly (via @epilot/sdk) for full config payloads.

## Source APIs per resource type

Each resource type maps to a specific epilot API. The frontend should use the corresponding
@epilot/sdk client to fetch full config details (e.g., for the side panel JSON view).

| Resource Type | Source API | SDK Client |
|---|---|---|
| `journey` | journey.sls.epilot.io | `@epilot/sdk/journey` |
| `automation_flow` | automation.sls.epilot.io | `@epilot/sdk/automation` |
| `workflow_definition` | workflow-definition.sls.epilot.io | `@epilot/sdk/workflow-definition` |
| `closing_reason` | workflow-definition.sls.epilot.io | `@epilot/sdk/workflow-definition` |
| `flow_template` | workflow-definition.sls.epilot.io | `@epilot/sdk/workflow-definition` |
| `schema` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `taxonomy` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `taxonomy_classification` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `emailtemplate` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `product` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `price` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `tax` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `coupon` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `file` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `document_template` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `webhook` | webhooks.sls.epilot.io | `@epilot/sdk/webhooks` |
| `saved_view` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `dashboard` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `kanban` | kanban.sls.epilot.io | `@epilot/sdk/kanban` |
| `role` | permissions.sls.epilot.io | `@epilot/sdk/permissions` |
| `usergroup` | user.sls.epilot.io | `@epilot/sdk/user` |
| `validation_rule` | entity.sls.epilot.io | `@epilot/sdk/validation-rules` |
| `integration` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `app` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `designbuilder` | design-builder-api.sls.epilot.io | `@epilot/sdk/design` |
| `notification_template` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `custom_variable` | entity.sls.epilot.io | `@epilot/sdk/template-variables` |
| `environment_variable` | environments.sls.epilot.io | `@epilot/sdk/environments` |
| `entity_mapping` | entity-mapping.sls.epilot.io | `@epilot/sdk/entity-mapping` |
| `portal_config` | customer-portal.sls.epilot.io | `@epilot/sdk/customer-portal` |
| `target` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `product_recommendation` | entity.sls.epilot.io | `@epilot/sdk/entity` |
| `access_token` | access-token.sls.epilot.io | `@epilot/sdk/access-token` |

## Zugriff

| | |
| --- | --- |
| Base URL | `https://configuration-hub.sls.epilot.io` <br> `https://configuration-hub.dev.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/configuration-hub.yaml |
| Docs | https://docs.epilot.io/api/configuration-hub |
| SDK | `epilot.configurationHub` aus `@epilot/sdk/configuration-hub` (Einzelpaket: `@epilot/configuration-hub-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### Configs

_Configuration tree index_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/configs/index` | `getIndex` | Return the current index build state for the caller's organization. |
| `POST` | `/v1/configs/index:rebuild` | `rebuildIndex` | Rebuild the configuration index for the caller's organization. |
| `GET` | `/v1/configs/inventory` | `getConfigInventory` | Returns a fresh inventory of an org's configuration resources — `{ type, id }` identities only, |
| `GET` | `/v1/configs/types` | `listConfigTypes` | Returns the static list of available configuration types with display metadata. |
| `GET` | `/v1/configs/{type}` | `listConfigs` | List configs of a given type with pagination. |
| `GET` | `/v1/configs/{type}/{id}/dependencies` | `getConfigDependencies` | Get configs that are referenced by the given config. |
| `GET` | `/v1/configs/{type}/{id}/used_by` | `getConfigUsedBy` | Get configs that reference the given config (reverse dependencies). |

### Sync

_Cross-org configuration sync jobs_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/configs/sync-jobs` | `listSyncJobs` | List sync jobs scoped to the caller's organization, paginated with an opaque |
| `POST` | `/v1/configs/sync-jobs` | `createSyncJob` | Create a new cross-org sync job. |
| `GET` | `/v1/configs/sync-jobs/{id}` | `getSyncJob` | Fetch a single sync job by ID. |
| `POST` | `/v1/configs/sync-jobs/{id}/cancel` | `cancelSyncJob` | Cancel a running sync job. |
| `GET` | `/v1/configs/sync-jobs/{id}/resources` | `listSyncJobResources` | List the per-resource rows for a sync job. |
| `POST` | `/v1/configs/sync-jobs/{id}/retry` | `retrySyncJob` | Retry the unresolved resources from a prior sync job: `failed` rows, plus |

### Delete

_Bulk-delete jobs for configuration resources_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/configs/delete-jobs` | `listDeleteJobs` | List bulk-delete jobs scoped to the caller's organization, paginated |
| `POST` | `/v1/configs/delete-jobs` | `createDeleteJob` | Create a bulk-delete job for the caller's organization. |
| `GET` | `/v1/configs/delete-jobs/{id}` | `getDeleteJob` | Fetch a single bulk-delete job by ID. |
| `GET` | `/v1/configs/delete-jobs/{id}/resources` | `listDeleteJobResources` | List the per-resource rows for a delete job, cursor-paginated. |

### Compare

_Cross-org configuration comparison, match suggestions, and lineage operations_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/configs/compare` | `compareConfigs` | Compare the caller org's configs of a single type against another |
| `POST` | `/v1/configs/compare/suggestions` | `suggestMatches` | Run the sync-grade heuristic match (`lookupByHeuristic` — name / slug / |
| `DELETE` | `/v1/configs/lineage` | `breakLineage` | Delete a lineage entry from the caller org's partition (caller as sync |
| `POST` | `/v1/configs/lineage` | `confirmLineage` | Persist a lineage entry pairing a source-org config with a config in |

---

_Generiert aus der OpenAPI-Spec von `configuration-hub-client` (@epilot Client 0.3.1). Nicht von Hand bearbeiten._
