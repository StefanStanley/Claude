# Deduplication API

> Slug `deduplication` · OpenAPI-Version `3.0.0` · 10 Operationen

Backend for Epilot Deduplication feature

## Zugriff

| | |
| --- | --- |
| Base URL | `https://deduplication.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/deduplication.yaml |
| Docs | https://docs.epilot.io/api/deduplication |
| SDK | `epilot.deduplication` aus `@epilot/sdk/deduplication` (Einzelpaket: `@epilot/deduplication-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### Allgemein

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/deduplicate` | `deduplicate` | Deduplicates Entities |
| `POST` | `/v1/deduplicate/job` | `deduplicateAsync` | Submits an async deduplication job. |
| `GET` | `/v1/deduplicate/jobs/{jobId}` | `getDeduplicationJob` | Returns the current status of an async deduplication job |
| `POST` | `/v1/detect-duplicates` | `detectDuplicates` | Detects potential duplicate entities for the given entity using the schema's prioritized uniqueness rules. |
| `POST` | `/v1/duplicates/dismiss` | `dismissDuplicates` | Confirms entities as NOT duplicates: clears the internal duplicate-detection flags (_matching_entities) on each given entity, so they stop appearing as open… |
| `GET` | `/v1/uniqueness-criteria` | `listUniquenessCriteria` | Lists UniquenessCriteria for the requesting organization. |
| `POST` | `/v1/uniqueness-criteria` | `createUniquenessCriteria` | Creates a new UniquenessCriteria record. |
| `DELETE` | `/v1/uniqueness-criteria/{schema}` | `deleteUniquenessCriteria` | Delete a UniquenessCriteria record. |
| `GET` | `/v1/uniqueness-criteria/{schema}` | `getUniquenessCriteria` | Fetch a single UniquenessCriteria record. |
| `PUT` | `/v1/uniqueness-criteria/{schema}` | `updateUniquenessCriteria` | Replace the matchRules on an existing UniquenessCriteria record. |

---

_Generiert aus der OpenAPI-Spec von `deduplication-client` (@epilot Client 0.4.0). Nicht von Hand bearbeiten._
