# Workflows Executions

> Slug `workflow` · OpenAPI-Version `1.0.0` · 25 Operationen

## Overview
The Workflows Executions API manages the runtime instances of workflow processes within an organization.
While **Workflow Definitions** (managed by the Workflows Definitions API) serve as reusable templates
that define the structure, phases, and tasks of a process, **Workflow Executions** are the active
instances created from those definitions.

## Key Concepts

### Definitions vs Executions
- **Definition (Template)**: A blueprint defining workflow structure, phases, tasks, conditions, and automation rules
- **Execution (Instance)**: A running instance of a definition, tracking actual progress, assignees, and status

### Execution Lifecycle
1. **STARTED**: Execution is active and tasks can be worked on
2. **DONE**: All required tasks are completed
3. **CLOSED**: Execution is terminated (completed successfully or cancelled with closing reasons)

### Task Types
- **Manual Tasks**: Require human action to complete
- **Automation Tasks**: Execute configured automations automatically
- **Decision Tasks**: Evaluate conditions to determine the next path in the workflow
- **AI Agent Tasks**: Execute AI-powered agents for intelligent task processing

### Contexts
Executions are linked to entity contexts (e.g., contacts, opportunities) that provide the data
context for the workflow and allow tracking which entities a workflow operates on.

## API Versions
- **V1 (`/v1/workflows/`)**: Legacy linear phase/section/step model (deprecated for new integrations)
- **V2 (`/v2/flows/`)**: Current graph-based model with advanced features like conditional branching,
  loops, and scheduling. **Recommended for all new integrations.**

## Zugriff

| | |
| --- | --- |
| Base URL | `https://workflows-execution.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/workflows-execution.yaml |
| Docs | https://docs.epilot.io/api/workflow |
| SDK | `epilot.workflow` aus `@epilot/sdk/workflow` (Einzelpaket: `@epilot/workflow-client`) |

**Security Schemes:** `BearerAuth` (http/bearer)

## Endpunkte

### Workflow Executions

_Manage V1 workflow executions (legacy linear model). Operations include starting new executions from definitions, retrieving execution details, updating execution status and assignees, and deleting executions. Use the Flows V2 endpoints for new integrations._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/workflows/executions` | `getExecutions` | Retrieve Workflow Executions. |
| `POST` | `/v1/workflows/executions` | `createExecution` | Creates a new V1 Workflow Execution from a workflow definition (template). |
| `POST` | `/v1/workflows/executions/search` | `searchExecutions` | **deprecated** · Search Workflow Executions by different filters. |
| `DELETE` | `/v1/workflows/executions/{executionId}` | `deleteExecution` | Delete workflow execution by id. |
| `GET` | `/v1/workflows/executions/{executionId}` | `getExecution` | Retrieves a complete V1 workflow execution by ID, including all steps information. |
| `PATCH` | `/v1/workflows/executions/{executionId}` | `updateExecution` | Patches updates like assignees, status, closingReason for a single Workflow Execution. |

### Workflow Steps

_Manage individual steps within V1 workflow executions (legacy). Steps represent discrete tasks that can be assigned to users, have due dates, and track completion status. Use the Flows V2 task endpoints for new integrations._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/workflows/executions/steps/search` | `searchSteps` | **deprecated** · Search workflow execution steps by different filters. |
| `POST` | `/v1/workflows/executions/{executionId}/steps` | `createStep` | Create a new step in current workflow execution. |
| `DELETE` | `/v1/workflows/executions/{executionId}/steps/{stepId}` | `deleteStep` | Deletes a step from a workflow execution. |
| `PATCH` | `/v1/workflows/executions/{executionId}/steps/{stepId}` | `updateStep` | Updates a workflow execution step with new values for status, assignees, due date, position, and more. |

### Closing Reasons

_Retrieve closing reasons configured for workflow executions. When a workflow is closed/cancelled, users can select from predefined closing reasons to document why the workflow ended. Closing reasons are snapshots from the definition at execution creation time._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/workflows/executions/{executionId}/closing-reasons` | `getClosingReasonExecution` | Shows all Closing Reasons defined at the moment of starting the Workflow Execution. |

### Flows V2

_**Recommended for new integrations.** Manage V2 flow executions using the graph-based execution model. This API version supports advanced features including: - Conditional branching with decision tasks - Automation tasks with configurable triggers - AI agent tasks for intelligent processing - Task scheduling (immediate, delayed, or relative to events) - Loop iterations for repeatable task sequences - Phase-based organization with progress tracking_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v2/flows/executions` | `startFlowExecution` | Starts a new Flow Execution based on a flow template (definition). |
| `DELETE` | `/v2/flows/executions/{execution_id}` | `deleteFlowExecution` | Deletes a specific execution of a flow, identified by id. |
| `GET` | `/v2/flows/executions/{execution_id}` | `getFlowExecution` | Retrieves a complete flow execution by ID, including all phases, tasks, edges, contexts, and analytics. |
| `PATCH` | `/v2/flows/executions/{execution_id}` | `patchFlowExecution` | Patch flow execution with new assignees, status, analytics & other changes. |
| `PATCH` | `/v2/flows/executions/{execution_id}/phases/{phase_id}` | `patchPhase` | Apply updates to a phase within flow execution |
| `POST` | `/v2/flows/executions/{execution_id}/schedules/{schedule_id}` | `cancelSchedule` | **deprecated** · Cancels a flow schedule, marking it as canceled. |
| `POST` | `/v2/flows/executions/{execution_id}/tasks` | `addTask` | Create a new task in current workflow execution. |
| `PATCH` | `/v2/flows/executions/{execution_id}/tasks/{task_id}` | `patchTask` | Updates attributes of a flow task including status, assignees, due date, and more. |
| `POST` | `/v2/flows/executions/{execution_id}/tasks/{task_id}/automation:run` | `runTaskAutomation` | Runs configured automation for a flow task |
| `POST` | `/v2/flows/executions/{execution_id}/tasks/{task_id}/execute` | `executeTask` | Executes any kind of flow task immediately. |
| `POST` | `/v2/flows/executions/{execution_id}/tasks/{task_id}/reconcile-automation` | `reconcileAutomationTask` | Reconciles an automation task's status against its linked automation execution. |
| `DELETE` | `/v2/flows/executions/{execution_id}/tasks/{task_id}/schedule` | `cancelTaskSchedule` | Cancels a scheduled task, deleting the schedule and marking the task as skipped. |
| `POST` | `/v2/flows/executions/{execution_id}/tasks/{task_id}/schedule/run-now` | `runTaskScheduleNow` | Cancels the pending schedule for a task and immediately triggers its automation execution. |
| `POST` | `/v2/flows/executions:search` | `searchFlowExecutions` | Search Flow Executions for a specific Entity. |

---

_Generiert aus der OpenAPI-Spec von `workflow-client` (@epilot Client 1.23.4). Nicht von Hand bearbeiten._
