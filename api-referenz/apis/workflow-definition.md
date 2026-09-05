# Workflows Definitions

> Slug `workflow-definition` · OpenAPI-Version `1.1.0` · 22 Operationen

The Workflows Definitions API enables you to create, manage, and configure reusable workflow templates
within your organization. Workflow definitions serve as blueprints that define the structure and behavior
of business processes, which can then be instantiated as workflow executions.

## Core Concepts

### Workflow Definition (V1)
A workflow definition is a template that describes a business process. It consists of:
- **Sections**: Logical groupings (phases) that organize related steps together
- **Steps**: Individual tasks or actions that need to be completed within a section
- **Closing Reasons**: Predefined reasons that can be selected when closing/completing a workflow

### Flow Template (V2)
The modern workflow model that provides advanced capabilities:
- **Phases**: Named stages that group related tasks and track progress through the workflow
- **Tasks**: Individual units of work that can be manual, automated, AI-powered, or decision points
- **Edges**: Connections between tasks that define the flow sequence and support conditional branching
- **Triggers**: Define how a workflow is started (manual, automation, journey submission)

### Task Types (V2)
- **MANUAL**: Tasks assigned to users that require human action to complete
- **AUTOMATION**: Tasks that execute automated actions when reached
- **DECISION**: Conditional branching points that evaluate conditions to determine the next path
- **AI_AGENT**: Tasks that invoke AI agents to perform intelligent actions

## API Versions
- **V1 endpoints** (`/v1/workflows/...`): Legacy linear workflow model with sections and steps
- **V2 endpoints** (`/v2/flows/...`): Modern graph-based flow model with phases, tasks, and edges

## Zugriff

| | |
| --- | --- |
| Base URL | `https://workflows-definition.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/workflows-definition.yaml |
| Docs | https://docs.epilot.io/api/workflow-definition |
| SDK | `epilot.workflowDefinition` aus `@epilot/sdk/workflow-definition` (Einzelpaket: `@epilot/workflow-definition-client`) |

**Security Schemes:** `BearerAuth` (http/bearer)

## Endpunkte

### Workflows

_Manage V1 workflow definitions with sections and steps. These endpoints support the legacy linear workflow model where definitions contain a sequential flow of sections and steps._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/workflows/definitions` | `getDefinitions` | Retrieve all V1 workflow definitions belonging to the authenticated organization. |
| `POST` | `/v1/workflows/definitions` | `createDefinition` | Create a new V1 workflow definition. |
| `DELETE` | `/v1/workflows/definitions/{definitionId}` | `deleteDefinition` | Delete Workflow Definition. |
| `GET` | `/v1/workflows/definitions/{definitionId}` | `getDefinition` | Get specific Definition by id from the Organization. |
| `PUT` | `/v1/workflows/definitions/{definitionId}` | `updateDefinition` | Update Workflow Definition. |
| `GET` | `/v1/workflows/definitions/{definitionId}/closing-reasons` | `getWorkflowClosingReasons` | Returns all closing reasons defined for the workflow. |
| `PATCH` | `/v1/workflows/definitions/{definitionId}/closing-reasons` | `setWorkflowClosingReasons` | Sets which closing reasons are defined for this workflow, based on the entire closing reasons catalog. |
| `GET` | `/v1/workflows/limits/max-allowed` | `getMaxAllowedLimit` | Get limits and number of created executions for an Organization. |

### Flows V2

_Manage V2 flow templates with phases, tasks, and edges. The modern workflow model supports advanced features including conditional branching, multiple trigger types, automation tasks, AI agent tasks, and flexible task dependencies._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/flows/templates` | `listFlowTemplates` | List all Flow Templates for a customer. |
| `POST` | `/v2/flows/templates` | `createFlowTemplate` | Create a new Flow Template (V2 workflow definition). |
| `DELETE` | `/v2/flows/templates/{flowId}` | `deleteFlowTemplate` | Delete Flow Template. |
| `GET` | `/v2/flows/templates/{flowId}` | `getFlowTemplate` | Retrieve a specific flow template by its unique identifier. |
| `PUT` | `/v2/flows/templates/{flowId}` | `updateFlowTemplate` | Update Flow Template. |
| `POST` | `/v2/flows/templates/{flowId}/duplicate` | `duplicateFlowTemplate` | Create a copy of an existing flow template. |
| `POST` | `/v2/flows/templates:search` | `searchFlowTemplates` | Search for flow templates by name, trigger type, enabled status, and more. |

### Closing Reason

_Manage closing reasons that can be associated with workflows. Closing reasons provide predefined options for users to select when closing or completing a workflow execution, enabling better tracking and reporting of workflow outcomes._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/workflows/closing-reasons` | `getAllClosingReasons` | Get all Closing Reasons defined in the organization by default all Active. |
| `POST` | `/v1/workflows/closing-reasons` | `createClosingReason` | A created Closing Reason is stored for the organization and will be displayed in the library of reasons. |
| `GET` | `/v1/workflows/closing-reasons/{reasonId}` | `getClosingReasonV1` | **deprecated** · Get specific closing reason by id from the organisation. |
| `PATCH` | `/v1/workflows/closing-reasons/{reasonId}` | `changeReasonStatus` | Change the status of a Closing Reason (eg. |
| `DELETE` | `/v2/workflows/closing-reasons/{reasonId}` | `deleteClosingReason` | Permanently delete a closing reason (Using INACTIVE status is recommended instead) |
| `GET` | `/v2/workflows/closing-reasons/{reasonId}` | `getClosingReason` | Get specific closing reason by id from the organisation. |
| `PATCH` | `/v2/workflows/closing-reasons/{reasonId}` | `updateClosingReason` | Update an existing closing reason |

---

_Generiert aus der OpenAPI-Spec von `workflow-definition-client` (@epilot Client 1.22.5). Nicht von Hand bearbeiten._
