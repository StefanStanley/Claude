# Entity Mapping API

> Slug `entity-mapping` · OpenAPI-Version `1.0.0` · 12 Operationen

API Backend for mapping source entity into target entities

## Zugriff

| | |
| --- | --- |
| Base URL | `https://entity-mapping.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/entity-mapping-api.yaml |
| Docs | https://docs.epilot.io/api/entity-mapping |
| SDK | `epilot.entityMapping` aus `@epilot/sdk/entity-mapping` (Einzelpaket: `@epilot/entity-mapping-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### mappings

_Entity Mapping Configs_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/mappings` | `storeConfig` | Store new MappingConfig |
| `GET` | `/v1/mappings/history` | `queryMappingHistory` | Get the Mapping History |
| `DELETE` | `/v1/mappings/{id}` | `deleteConfig` | Delete entity mapping config |
| `GET` | `/v1/mappings/{id}` | `getConfig` | Get latest version of a mapping config by id |
| `GET` | `/v1/mappings/{id}/versions` | `getAllVersions` | Get all version of MappingConfig |
| `POST` | `/v1/mappings/{id}/versions` | `storeNewVersion` | Store new version of MappingConfig |
| `GET` | `/v1/mappings/{id}/versions/{version}` | `getConfigVersion` | Get specific version of a mapping config by id & version |
| `POST` | `/v1/mappings:execute` | `executeMapping` | Execute entity mapping based on a config |
| `POST` | `/v1/mappings:search` | `searchConfigs` | Search mapping configs |
| `POST` | `/v1/relations:execute` | `executeRelations` | Execute relation mapping between source entity and target entities |
| `GET` | `/v2/mappings/{id}` | `getMappingConfig` | Get latest version of a mapping config by id V2 |
| `PUT` | `/v2/mappings/{id}` | `putMappingConfig` | Stores new version of entity mapping config |

---

_Generiert aus der OpenAPI-Spec von `entity-mapping-client` (@epilot Client 0.10.4-alpha.1). Nicht von Hand bearbeiten._
