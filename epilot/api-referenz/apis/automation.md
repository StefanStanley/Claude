# Automation API

> Slug `automation` · OpenAPI-Version `1.4.1` · 17 Operationen

API Backend for epilot Automation Workflows feature

## Zugriff

| | |
| --- | --- |
| Base URL | `https://automation.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/automation.yaml |
| Docs | https://docs.epilot.io/api/automation |
| SDK | `epilot.automation` aus `@epilot/sdk/automation` (Einzelpaket: `@epilot/automation-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### flows

_Automation flows_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/automation/flows` | `searchFlows` | Search available automation flows |
| `POST` | `/v1/automation/flows` | `createFlow` | Create new automation flow |
| `DELETE` | `/v1/automation/flows/{flow_id}` | `deleteFlow` | Update automation flow by id |
| `GET` | `/v1/automation/flows/{flow_id}` | `getFlow` | List available automation flows |
| `PUT` | `/v1/automation/flows/{flow_id}` | `putFlow` | Update automation flow by id |
| `POST` | `/v1/automation/flows:batchGet` | `batchGetFlows` | Get multiple automation flows by their IDs |

### executions

_Automation executions_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/automation/executions` | `getExecutions` | List automation executions |
| `POST` | `/v1/automation/executions` | `startExecution` | Start new automation execution |
| `DELETE` | `/v1/automation/executions/{execution_id}` | `cancelExecution` | Cancel automation execution |
| `GET` | `/v1/automation/executions/{execution_id}` | `getExecution` | Get automation execution |
| `DELETE` | `/v1/automation/executions/{execution_id}/schedules/{schedule_id}` | `cancelSchedule` | Cancel a scheduled automation |
| `POST` | `/v1/automation/executions/{execution_id}/{action_id}/retrigger` | `retriggerAction` | Retry a specific automation execution action which failed / is stuck. |
| `POST` | `/v1/automation/executions:search` | `searchExecutions` | Search automation executions of an entity with cursor-based pagination. |
| `POST` | `/v1/automation/public/executions:resume` | `resumeExecutionWithToken` | Resume a paused automation execution using a unique resume token. |

### bulk

_Bulk job for triggering automation executions_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/automation/executions/bulk-jobs` | `bulkTriggerExecutions` | Create a bulk job that triggers multiple automation executions |
| `GET` | `/v1/automation/executions/bulk-jobs/{job_id}` | `getBulkJob` | Get the status of a bulk job that triggers multiple automation executions |
| `PATCH` | `/v1/automation/executions/bulk-jobs/{job_id}` | `patchBulkJob` | Approve / Cancel bulk job that triggers multiple automation executions |

---

_Generiert aus der OpenAPI-Spec von `automation-client` (@epilot Client 2.38.0). Nicht von Hand bearbeiten._
