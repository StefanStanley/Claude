# AI Agents API

> Slug `ai-agents` · OpenAPI-Version `3.0.0` · 21 Operationen

API for configuring and invoking AI agents in epilot platform

## Zugriff

| | |
| --- | --- |
| Base URL | `https://ai-agents.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/ai-agents.yaml |
| Docs | https://docs.epilot.io/api/ai-agents |
| SDK | `epilot.aiAgents` aus `@epilot/sdk/ai-agents` (Einzelpaket: `@epilot/ai-agents-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### Agents Configuration

_Everything about AI Agent configuration_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/agents` | `listAgents` | Lists agents from both system skills and custom agents. |
| `POST` | `/v1/agents` | `createAgent` | Creates a new custom agent. |
| `DELETE` | `/v1/agents/{agent_id}` | `deleteAgentById` | Deletes a custom agent. |
| `GET` | `/v1/agents/{agent_id}` | `getAgentById` | Retrieves an agent by ID. |
| `PUT` | `/v1/agents/{agent_id}` | `updateAgentById` | Updates a custom agent. |

### Agent Execution

_Execute AI agents and manage executions_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/agents/{agent_id}/execute` | `executeAgent` | Executes an agent (system skill or custom agent). |
| `POST` | `/v1/agents/{agent_id}/execute/stream` | `executeAgentStream` | Executes an agent with real-time streaming of tokens and tool events. |
| `GET` | `/v1/executions` | `listExecutions` | List executions |
| `DELETE` | `/v1/executions/{execution_id}` | `cancelExecution` | Cancel execution |
| `GET` | `/v1/executions/{execution_id}` | `getExecution` | Get execution by ID |
| `POST` | `/v1/executions/{execution_id}/approve` | `approveExecution` | Approves a pending tool action when execution is in waiting_approval status |
| `GET` | `/v1/executions/{execution_id}/feedback` | `getExecutionFeedback` | Get execution feedback |
| `PUT` | `/v1/executions/{execution_id}/feedback` | `putExecutionFeedback` | Submit execution feedback |
| `POST` | `/v1/executions/{execution_id}/reject` | `rejectExecution` | Rejects a pending tool action when execution is in waiting_approval status |
| `GET` | `/v1/executions/{execution_id}/stream` | `streamExecution` | Reconnects to an execution's event stream after approval. |
| `GET` | `/v1/executions/{execution_id}/trace` | `getExecutionTrace` | Returns the step-by-step reasoning and tool calls for ReAct mode executions. |

### Chat

_Streaming chat with AI agents_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/chat` | `chat` | Initiates a streaming chat session with an AI agent. |

### Conversations

_Manage conversation history_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/conversations` | `listConversations` | Lists conversations for the authenticated user, sorted by most recent. |
| `DELETE` | `/v1/conversations/{conversation_id}` | `deleteConversation` | Deletes a conversation and all its messages. |
| `GET` | `/v1/conversations/{conversation_id}` | `getConversation` | Retrieves a conversation and its message history. |
| `POST` | `/v1/conversations/{conversation_id}/feedback` | `submitConversationFeedback` | Records a thumbs up/down (with optional comment) for the assistant turn identified by its Langfuse trace id. |

---

_Generiert aus der OpenAPI-Spec von `ai-agents-client` (@epilot Client 0.2.6). Nicht von Hand bearbeiten._
