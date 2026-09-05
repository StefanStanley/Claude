# Entity API

> Slug `entity` · OpenAPI-Version `2.10.0` · 88 Operationen

Flexible data layer for epilot Entities.

Use this API configure and access your business objects like Contacts, Opportunities and Products.

[Feature Documentation](https://docs.epilot.io/docs/entities/flexible-entities)

## Zugriff

| | |
| --- | --- |
| Base URL | `https://entity.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/entity.yaml |
| Docs | https://docs.epilot.io/api/entity |
| SDK | `epilot.entity` aus `@epilot/sdk/entity` (Einzelpaket: `@epilot/entity-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### Schemas

_Model Entities_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/entity/schemas` | `listSchemas` | Get the latest versions of all schemas |
| `POST` | `/v1/entity/schemas/attributes` | `createSchemaAttribute` | Create a schema attribute |
| `DELETE` | `/v1/entity/schemas/attributes/{composite_id}` | `deleteSchemaAttribute` | Deletes an attribute from a schema |
| `GET` | `/v1/entity/schemas/attributes/{composite_id}` | `getSchemaAttribute` | Get a schema attribute from given attribute ID |
| `PUT` | `/v1/entity/schemas/attributes/{composite_id}` | `putSchemaAttribute` | Updates an attribute in the schema |
| `GET` | `/v1/entity/schemas/blueprints` | `listSchemaBlueprints` | List canonical versions of all available schemas |
| `POST` | `/v1/entity/schemas/capabilities` | `createSchemaCapability` | Create a schema capability |
| `DELETE` | `/v1/entity/schemas/capabilities/{composite_id}` | `deleteSchemaCapability` | Deletes a Capability from a schema |
| `GET` | `/v1/entity/schemas/capabilities/{composite_id}` | `getSchemaCapability` | Get a schema capability from given capability ID |
| `PUT` | `/v1/entity/schemas/capabilities/{composite_id}` | `putSchemaCapability` | Adds or updates an capability in the schema |
| `POST` | `/v1/entity/schemas/group` | `createSchemaGroup` | Create a schema group |
| `DELETE` | `/v1/entity/schemas/group/{composite_id}` | `deleteSchemaGroup` | Deletes a Capability from a schema |
| `GET` | `/v1/entity/schemas/group/{composite_id}` | `getSchemaGroup` | Get a schema group from given group composite ID |
| `PUT` | `/v1/entity/schemas/group/{composite_id}` | `putSchemaGroup` | Adds or updates an capability in the schema |
| `POST` | `/v1/entity/schemas/headline` | `createSchemaGroupHeadline` | Create a headline in a schema group |
| `DELETE` | `/v1/entity/schemas/headline/{composite_id}` | `deleteSchemaGroupHeadline` | Deletes a group headline from a schema |
| `GET` | `/v1/entity/schemas/headline/{composite_id}` | `getSchemaGroupHeadline` | Get a group headline from schema from given headline composite ID |
| `PUT` | `/v1/entity/schemas/headline/{composite_id}` | `putSchemaGroupHeadline` | Adds or updates a group headline in the schema |
| `DELETE` | `/v1/entity/schemas/{slug}` | `deleteSchema` | Delete a schema, or a specific version of a schema |
| `GET` | `/v1/entity/schemas/{slug}` | `getSchema` | Gets the latest version of the Schema. |
| `PUT` | `/v1/entity/schemas/{slug}` | `putSchema` | Create or update a schema with a new version. |
| `GET` | `/v1/entity/schemas/{slug}/capabilities/available` | `listAvailableCapabilities` | List available capabilities for schema |
| `POST` | `/v1/entity/schemas/{slug}/freeze` | `freezeSchema` | **deprecated** · Deprecated no-op: schema freezing is retired and every read returns the latest version. |
| `GET` | `/v1/entity/schemas/{slug}/json/example` | `getSchemaExample` | Get a full example entity for the given schema |
| `GET` | `/v1/entity/schemas/{slug}/json/schema` | `getJsonSchema` | Get formal JSON schema definition draft 2020-12 for the given epilot schema |
| `GET` | `/v1/entity/schemas/{slug}/taxonomy/{taxonomySlug}` | `listTaxonomyClassificationsForSchema` | List taxonomy classifications for a given schema |
| `POST` | `/v1/entity/schemas/{slug}/unfreeze` | `unfreezeSchema` | **deprecated** · Deprecated: schema freezing is retired. |
| `GET` | `/v1/entity/schemas/{slug}/versions` | `getSchemaVersions` | Get all versions of this schema ordered by the latest versions including drafts. |
| `GET` | `/v2/entity/schemas` | `listSchemasV2` | Get the latest versions of all schemas. |

### Entities

_CRUD Access for Entities_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/entity/{slug}` | `createEntity` | Creates a new entity using a key. |
| `DELETE` | `/v1/entity/{slug}/{id}` | `deleteEntity` | Deletes an Entity |
| `GET` | `/v1/entity/{slug}/{id}` | `getEntity` | Gets Entity and relations by id. |
| `PATCH` | `/v1/entity/{slug}/{id}` | `patchEntity` | Partially updates an entity with the passed in entity data. |
| `PUT` | `/v1/entity/{slug}/{id}` | `updateEntity` | Updates an Entity |
| `GET` | `/v1/entity/{slug}/{id}/changesets` | `listChangesets` | Returns all pending changesets for an entity. |
| `POST` | `/v1/entity/{slug}/{id}/changesets/{attribute}:apply` | `applyChangeset` | Applies the proposed value from a pending changeset to the entity attribute |
| `POST` | `/v1/entity/{slug}/{id}/changesets/{attribute}:dismiss` | `dismissChangeset` | Removes a pending changeset without applying it. |
| `POST` | `/v1/entity/{slug}/{id}:reindex` | `reindexEntity` | Triggers a reindex for the Entity for search. |
| `PATCH` | `/v1/entity/{slug}/{id}:restore` | `restoreEntity` | Restores an entity by id |
| `PATCH` | `/v1/entity/{slug}:upsert` | `upsertEntity` | Create or update an entity using `unique_key` |
| `POST` | `/v1/entity/{slug}:validate` | `validateEntity` | Validates an entity against the schema. |
| `GET` | `/v1/entity:autocomplete` | `autocomplete` | Autocomplete entity attributes |
| `POST` | `/v1/entity:graph` | `queryEntityGraph` | Traverse an entity relationship graph starting from a seed entity. |
| `POST` | `/v1/entity:list` | `listEntities` | List entities that meet the specified conditions. |
| `POST` | `/v1/entity:search` | `searchEntities` | Search for entities. |
| `POST` | `/v1/entity:wipeAllEntities` | `wipeAllEntities` | Creates a request to queue the deletion of all entities in the system. |
| `GET` | `/v2/entity/{slug}/{id}` | `getEntityV2` | Gets Entity by id. |
| `POST` | `/v2/entity/{slug}:validate` | `validateEntityV2` | Validates an entity against the schema. |

### Relations

_Entity Relationships_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `DELETE` | `/v1/entity/{slug}/{id}/relations` | `removeRelations` | Disassociate one or more entities to parent entity by removing items to a relation attribute |
| `GET` | `/v1/entity/{slug}/{id}/relations` | `getRelations` | Returns 1st level direct relations for an entity. |
| `POST` | `/v1/entity/{slug}/{id}/relations` | `addRelations` | Relates one or more entities to parent entity by adding items to a relation attribute |
| `DELETE` | `/v1/entity/{slug}/{id}/relations/{attribute}/{entity_id}` | `deleteRelation` | Removes relation between two entities |
| `PUT` | `/v1/entity/{slug}/{id}/relations/{attribute}/{entity_id}` | `updateRelation` | Updates an existing relation between two entities. |
| `GET` | `/v2/entity/{slug}/{id}/relations` | `getRelationsV2` | Returns 1st level direct relations for an entity with pagination. |
| `GET` | `/v2/entity/{slug}/{id}/relations/count` | `getRelatedEntitiesCount` | Returns the amount of unique related entities for an entity - includes direct and reverse relations. |
| `GET` | `/v3/entity/{slug}/{id}/relations` | `getRelationsV3` | Returns 1st level direct relations for an entity with pagination. |

### Activity

_Entity Events_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/entity/activity` | `createActivity` | Create an activity that can be displayed in activity feeds. |
| `GET` | `/v1/entity/activity/{id}` | `getActivity` | Get activity by id |
| `POST` | `/v1/entity/activity/{id}:attach` | `attachActivity` | Attach existing activity to entity activity feeds |
| `GET` | `/v1/entity/{slug}/{id}/activity` | `getEntityActivityFeed` | Get activity feed for an entity |

### Import-Export

_Import and Export entities via portable files (CSV)_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/entity:abortImport` | `abortEntityImport` | Abort a running entity import |
| `POST` | `/v1/entity:export` | `exportEntities` | Export entity data in a CSV-format. |
| `POST` | `/v1/entity:import` | `importEntities` | Import Entities |

### Saved Views

_Saved Views for Entities_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/entity/view` | `createSavedView` | Creates a new saved view |
| `DELETE` | `/v1/entity/view/{id}` | `deleteSavedView` | Deletes a saved view |
| `GET` | `/v1/entity/view/{id}` | `getSavedView` | Gets Saved View configuration by id. |
| `PATCH` | `/v1/entity/view/{id}` | `patchSavedView` | Partially updates a saved view with the provided payload. |
| `PUT` | `/v1/entity/view/{id}` | `updateSavedView` | Updates a saved view |
| `GET` | `/v1/entity/views` | `listSavedViews` | Get the Saved Views based on the schema |
| `GET` | `/v1/entity/views/favorites` | `listFavoriteViewsForUser` | Get the Favorite Saved Views for user based on the schema |

### Taxonomy

_Taxonomies and Classifications_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/entity/taxonomies` | `listTaxonomies` | List taxonomies in an organization |
| `POST` | `/v1/entity/taxonomies` | `createTaxonomy` | Create a new taxonomy |
| `GET` | `/v1/entity/taxonomies/bulk-jobs` | `getTaxonomyBulkActionJobs` | Gets bulk actions jobs by job status: |
| `GET` | `/v1/entity/taxonomies/bulk-jobs/{job_id}` | `getTaxonomyBulkActionJobById` | Gets a bulk action job by job id |
| `POST` | `/v1/entity/taxonomies/bulk-jobs/{job_id}/cancel` | `cancelBulkAction` | Cancels a running bulk action job. |
| `POST` | `/v1/entity/taxonomies/classifications:delete` | `bulkDeleteClassifications` | Permanently deletes taxonomy classifications. |
| `POST` | `/v1/entity/taxonomies/classifications:merge` | `bulkMergeClassifications` | Merges classifications from one taxonomy into one individual classification, through a bulk async operation which |
| `POST` | `/v1/entity/taxonomies/classifications:move` | `bulkMoveClassifications` | Moves classifications from one taxonomy to another, through a bulk async operation which |
| `POST` | `/v1/entity/taxonomies/classifications:search` | `taxonomiesClassificationsSearch` | List taxonomy classifications in an organization based on taxonomy slug |
| `DELETE` | `/v1/entity/taxonomies/{taxonomySlug}` | `deleteTaxonomy` | Delete a taxonomy |
| `GET` | `/v1/entity/taxonomies/{taxonomySlug}` | `getTaxonomy` | Get taxonomy by slug |
| `PUT` | `/v1/entity/taxonomies/{taxonomySlug}` | `updateTaxonomy` | Update a taxonomy |
| `POST` | `/v1/entity/taxonomies/{taxonomySlug}/classifications` | `updateClassificationsForTaxonomy` | Update the classifications for a taxonomy |
| `GET` | `/v1/entity/taxonomies/{taxonomySlug}:autocomplete` | `taxonomyAutocomplete` | Taxonomies autocomplete |
| `POST` | `/v2/entity/taxonomies/classifications` | `createTaxonomyClassification` | Create a new classification for a taxonomy |
| `DELETE` | `/v2/entity/taxonomies/classifications/{classificationSlug}` | `deleteTaxonomyClassification` | Delete a classification for a taxonomy |
| `GET` | `/v2/entity/taxonomies/classifications/{classificationSlug}` | `getTaxonomyClassification` | Get a classification for a taxonomy by slug |
| `PUT` | `/v2/entity/taxonomies/classifications/{classificationSlug}` | `updateTaxonomyClassification` | Update a classification for a taxonomy |

---

_Generiert aus der OpenAPI-Spec von `entity-client` (@epilot Client 7.5.0). Nicht von Hand bearbeiten._
