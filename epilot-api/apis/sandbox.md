# Sandbox API

> Slug `sandbox` · OpenAPI-Version `0.0.1` · 7 Operationen

API to set up pipeline connections between epilot orgs to sync and promote configurations (from sandbox to production and vice-versa)

## Zugriff

| | |
| --- | --- |
| Base URL | `https://sandbox.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/sandbox.yaml |
| Docs | https://docs.epilot.io/api/sandbox |
| SDK | `epilot.sandbox` aus `@epilot/sdk/sandbox` (Einzelpaket: `@epilot/sandbox-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### Pipelines

_Manage Sandbox Pipelines_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/sandbox/pipelines` | `listPipelines` | List pipelines the current organization is part of |
| `POST` | `/v1/sandbox/pipelines` | `createPipeline` | Create a new pipeline by passing an api token from another organization. |
| `DELETE` | `/v1/sandbox/pipelines/{pipeline_id}` | `deletePipeline` | Delete a pipeline by ID |
| `GET` | `/v1/sandbox/pipelines/{pipeline_id}` | `getPipeline` | Get pipeline by ID |
| `GET` | `/v1/sandbox/pipelines/{pipeline_id}/token` | `generatePipelineToken` | Generate a temporary pipeline access token to access the other org from the pipeline |

### Sandbox Requests

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/sandbox/requests` | `listSandboxRequests` | List sandbox requests from users |
| `POST` | `/v1/sandbox:request` | `requestSandbox` | Request a sandbox account for a user |

---

_Generiert aus der OpenAPI-Spec von `sandbox-client` (@epilot Client 0.4.3). Nicht von Hand bearbeiten._
