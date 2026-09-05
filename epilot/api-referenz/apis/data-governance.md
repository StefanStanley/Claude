# Data Governance API

> Slug `data-governance` · OpenAPI-Version `1.2.0` · 10 Operationen

The **Data Governance API** provides a set of endpoints for managing the lifecycle of
entity data within the epilot platform. It enables organizations to define governance
policies — such as automated data deletion rules — and execute them against any entity
schema (currently limited to Contacts).

## Core Concepts

### Data Lifecycle Configs
A **config** defines a data lifecycle policy for a given entity schema. Each config consists of:
- A **base view** (saved entity view) that identifies candidate entities
- **Advanced filters** not available in standard entity tables (e.g. only contacts where all related opportunities have a workflow status of CLOSED)
- A **schedule** controlling how often the policy runs (e.g. every 90 days)
- **Related entity handling** — which linked entities should be deleted alongside the primary entity
- An **action type** (currently only `deletion`)

Configs can be enabled or disabled and are evaluated on a recurring schedule.

### Auditable Jobs
Every deletion — whether manual or automatic — produces an **auditable job** with full
traceability. Each job records its status, timing, trigger type, and generates a
downloadable CSV report detailing exactly which entities were affected.

### Query
The query endpoint allows previewing which entities match a data lifecycle config
before it is executed, combining a saved view with additional data governance
filters.

### Data Recovery
Deleted entities are moved to the trash where they remain recoverable for 30 days.
After this retention period, deletion becomes permanent and irreversible.

## Authentication
All endpoints require a valid epilot OAuth2 bearer token passed in the
`Authorization` header. Optionally, the `x-epilot-org-id` header can be used
to target a specific organization for shared-tenant access.

## Zugriff

| | |
| --- | --- |
| Base URL | `https://data-governance.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/data-governance.yaml |
| Docs | https://docs.epilot.io/api/data-governance |
| SDK | `epilot.dataGovernance` aus `@epilot/sdk/data-governance` (Einzelpaket: `@epilot/data-governance-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### Query

_Preview which entities match a data lifecycle config by combining a saved view with additional data governance filters._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/data-governance/v1/{entity_schema}/query` | `queryEntities` | Query entities matching a data lifecycle config |

### Data Lifecycle Configs

_Create, update, list, and retrieve data lifecycle configurations that define automated actions (e.g., deletion) on entity data._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/data-governance/v1/configs` | `listConfigs` | List data lifecycle configs |
| `GET` | `/data-governance/v1/configs/{config_id}` | `getConfig` | Get a config by ID |
| `POST` | `/data-governance/v1/{entity_schema}/configs` | `upsertConfig` | Create or update a data lifecycle config |

### Auditable Jobs

_Every deletion produces an auditable job with full traceability. Create, list, retrieve, and update job runs. Includes report download._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/data-governance/v1/configs/{config_id}/jobs` | `createJobForConfig` | Trigger a manual job run for a config |
| `GET` | `/data-governance/v1/jobs` | `listJobs` | List job runs |
| `GET` | `/data-governance/v1/jobs/{job_id}` | `getJob` | Get a job by ID |
| `GET` | `/data-governance/v1/jobs/{job_id}/report-url` | `getJobReportUrl` | Get report download URL for a job |
| `POST` | `/data-governance/v1/{entity_schema}/jobs` | `createJob` | Create a new job run |
| `PATCH` | `/data-governance/v1/{entity_schema}/jobs/{job_id}` | `updateJob` | Update an existing job run |

---

_Generiert aus der OpenAPI-Spec von `data-governance-client` (@epilot Client 2.1.2). Nicht von Hand bearbeiten._
