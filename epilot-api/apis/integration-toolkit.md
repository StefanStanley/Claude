# Integration Toolkit API

> Slug `integration-toolkit` · OpenAPI-Version `1.22.0` · 70 Operationen

API for integrating with external systems in a standardised way.

## Zugriff

| | |
| --- | --- |
| Base URL | `https://integration-toolkit.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/integration-toolkit.yaml |
| Docs | https://docs.epilot.io/api/integration-toolkit |
| SDK | `epilot.integrationToolkit` aus `@epilot/sdk/integration-toolkit` (Einzelpaket: `@epilot/integration-toolkit-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### erp

_ERP integration endpoints_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/erp/tracking/acknowledgement` | `acknowledgeTracking` | Acknowledges an ERP tracking record by removing it from the tracking table, requires public authentication |
| `POST` | `/v1/erp/trigger` | `triggerErp` | Triggers the ERP integration process |
| `POST` | `/v1/erp/updates/direct_simulation` | `simulateDirect` | Dry run for direct-mode payloads: validates a `DirectPayload` against a `direct: true` |
| `POST` | `/v1/erp/updates/events` | `processErpUpdatesEvents` | **deprecated** · Handles updates from ERP systems and tracks them appropriately |
| `POST` | `/v1/erp/updates/mapping_simulation` | `simulateMapping` | Test mapping configuration by transforming a payload using the provided mapping rules without persisting data. |
| `POST` | `/v2/erp/updates/events` | `processErpUpdatesEventsV2` | **deprecated** · Handles updates from ERP systems using integration_id directly. |
| `POST` | `/v2/erp/updates/mapping_simulation` | `simulateMappingV2` | Test v2.0 mapping configuration by transforming a payload using the provided mapping rules without persisting data. |
| `POST` | `/v3/erp/updates/events` | `processErpUpdatesEventsV3` | Handles updates from ERP systems using integration_id directly. |

### erp-imports

_ERP pricing file import endpoints_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/erp/imports` | `listErpImports` | List recent pricing-file import jobs for the org, newest first. |
| `POST` | `/v2/erp/imports` | `createErpImport` | Register an already-uploaded file (S3 ref) as a pricing-file import job. |
| `DELETE` | `/v2/erp/imports/{importId}` | `deleteErpImport` | Remove an import and the file it owns. |
| `GET` | `/v2/erp/imports/{importId}` | `getErpImport` | Get a pricing-file import job (status, counts, result links). |
| `POST` | `/v2/erp/imports/{importId}:abort` | `abortErpImport` | Ask a running import to stop. |
| `POST` | `/v2/erp/imports/{importId}:execute` | `executeErpImport` | Confirm and run the write phase of a validated import. |
| `POST` | `/v2/erp/imports/{importId}:suggest-use-cases` | `suggestErpImportUseCases` | Rank the org's inbound use cases against this file's columns — the input to the ranked picker ("matches 6 of your 7 columns"). |
| `POST` | `/v2/erp/imports/{importId}:validate` | `validateErpImport` | Choose the use case to read this file with, and start the validate phase. |

### integrations

_Integration and Use Case management endpoints_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/entities/{entityId}/sync-status` | `getEntitySyncStatus` | Get the inbound ERP sync status of an entity: when each integration last |
| `GET` | `/v1/integrations` | `listIntegrations` | Retrieve all integrations for the authenticated organization |
| `POST` | `/v1/integrations` | `createIntegration` | Create a new integration configuration |
| `GET` | `/v1/integrations/secure-proxies` | `listSecureProxies` | Lists all secure_proxy use cases across all integrations for the authenticated organization. |
| `DELETE` | `/v1/integrations/{integrationId}` | `deleteIntegration` | Delete an integration and all its use cases |
| `GET` | `/v1/integrations/{integrationId}` | `getIntegration` | Retrieve a specific integration by its ID |
| `PUT` | `/v1/integrations/{integrationId}` | `updateIntegration` | Update an existing integration configuration |
| `DELETE` | `/v1/integrations/{integrationId}/app-mapping` | `deleteIntegrationAppMapping` | Removes a mapping from an app/component to an integration. |
| `PUT` | `/v1/integrations/{integrationId}/app-mapping` | `setIntegrationAppMapping` | Creates or updates a mapping from an app/component to an integration. |
| `POST` | `/v1/integrations/{integrationId}/commit-types` | `commitTypes` | Commits the generated types by locking use case configurations and updating version tracking. |
| `GET` | `/v1/integrations/{integrationId}/documentation` | `listDocumentationPages` | Retrieve all documentation pages of an integration, without their markdown content. |
| `DELETE` | `/v1/integrations/{integrationId}/documentation/{docId}` | `deleteDocumentationPage` | Delete a documentation page |
| `GET` | `/v1/integrations/{integrationId}/documentation/{docId}` | `getDocumentationPage` | Retrieve a single documentation page including its markdown content |
| `PUT` | `/v1/integrations/{integrationId}/documentation/{docId}` | `upsertDocumentationPage` | Create or update the documentation page identified by docId. |
| `POST` | `/v1/integrations/{integrationId}/events` | `queryEvents` | Query events for a specific integration |
| `POST` | `/v1/integrations/{integrationId}/events/replay` | `replayEvents` | Replay one or more events for a specific integration. |
| `POST` | `/v1/integrations/{integrationId}/generate-types` | `generateTypes` | Generates a complete TypeScript npm package with typed interfaces for all managed-call use cases. |
| `POST` | `/v1/integrations/{integrationId}/generate-types-preview` | `generateTypesPreview` | Analyses the JSONata mappings of all managed-call use cases in the integration and returns scaffolded type descriptors. |
| `GET` | `/v1/integrations/{integrationId}/outbound-status` | `getOutboundStatus` | Get the status of all outbound use cases for a specific integration. |
| `POST` | `/v1/integrations/{integrationId}/outbound/messages/ack` | `ackOutboundMessages` | Acknowledge polled outbound messages. |
| `GET` | `/v1/integrations/{integrationId}/outbound/messages/dlq` | `listOutboundDlqMessages` | List an integration's dead-lettered outbound queue messages |
| `POST` | `/v1/integrations/{integrationId}/outbound/messages/dlq/redrive` | `redriveOutboundDlqMessages` | Redrive selected dead-lettered messages back into the live stream. |
| `POST` | `/v1/integrations/{integrationId}/outbound/messages/poll` | `pollOutboundMessages` | Poll outbound messages for an integration's poll-mode use cases. |
| `POST` | `/v1/integrations/{integrationId}/outbound/messages/unblock` | `unblockOutboundStream` | Unblock an integration's outbound stream halted by the `block` |
| `GET` | `/v1/integrations/{integrationId}/use-cases` | `listUseCases` | Retrieve all use cases for a specific integration |
| `POST` | `/v1/integrations/{integrationId}/use-cases` | `createUseCase` | Create a new use case for an integration |
| `DELETE` | `/v1/integrations/{integrationId}/use-cases/{useCaseId}` | `deleteUseCase` | Delete a use case from an integration |
| `GET` | `/v1/integrations/{integrationId}/use-cases/{useCaseId}` | `getUseCase` | Retrieve a specific use case by its ID |
| `PUT` | `/v1/integrations/{integrationId}/use-cases/{useCaseId}` | `updateUseCase` | Update an existing use case configuration |
| `GET` | `/v1/integrations/{integrationId}/use-cases/{useCaseId}/history` | `listUseCaseHistory` | Retrieve historical versions of a use case's configuration. |
| `GET` | `/v2/integrations` | `listIntegrationsV2` | Retrieve all integrations with embedded use cases for the authenticated organization |
| `POST` | `/v2/integrations` | `createIntegrationV2` | Create a new integration with embedded use cases. |
| `DELETE` | `/v2/integrations/{integrationId}` | `deleteIntegrationV2` | Delete an integration and all its use cases |
| `GET` | `/v2/integrations/{integrationId}` | `getIntegrationV2` | Retrieve a specific integration with all its embedded use cases |
| `PUT` | `/v2/integrations/{integrationId}` | `updateIntegrationV2` | Update an existing integration with embedded use cases. |
| `GET` | `/v2/integrations/{integrationId}/notifications/history` | `listNotificationHistory` | Returns the cursor-paginated, newest-first notification history for an |
| `GET` | `/v2/integrations/{integrationId}/notifications/status` | `getNotificationStatus` | Returns the live per-rule alert state and (for 'auto' rules) the current |
| `POST` | `/v2/integrations/{integrationId}/notifications/test` | `testSendNotification` | Renders and sends ONE representative notification of the requested kind/type to |
| `GET` | `/v2/integrations/{integrationId}/use-cases/{useCaseId}/secure-proxy-whitelist` | `getSecureProxyWhitelist` | Returns the current allowed_domains, allowed_ips, and vpc_mode for a secure_proxy use case. |
| `PUT` | `/v2/integrations/{integrationId}/use-cases/{useCaseId}/secure-proxy-whitelist` | `updateSecureProxyWhitelist` | Replaces allowed_domains and/or allowed_ips on a secure_proxy use case. |
| `GET` | `/v2/integrations/{integrationId}/use-cases/{useCaseId}/secure-proxy-whitelist/history` | `listSecureProxyWhitelistHistory` | Returns the most recent USECASE_HISTORY entries for a secure_proxy use case, |

### monitoring

_Monitoring and analytics endpoints_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/integrations/{integrationId}/monitoring/access-logs` | `queryAccessLogs` | Query API access logs for a specific integration's organization. |
| `POST` | `/v1/integrations/{integrationId}/monitoring/inbound-events` | `queryInboundMonitoringEvents` | Query inbound monitoring events for a specific integration. |
| `POST` | `/v1/integrations/{integrationId}/monitoring/outbound-events` | `queryOutboundMonitoringEvents` | Query outbound monitoring events for a specific integration. |
| `POST` | `/v1/integrations/{integrationId}/monitoring/stats` | `getMonitoringStats` | Get aggregated statistics for both inbound and outbound monitoring events for a specific integration. |
| `POST` | `/v1/integrations/{integrationId}/monitoring/timeseries` | `getMonitoringTimeSeries` | Get time-series aggregated event counts for monitoring charts. |
| `POST` | `/v2/integrations/{integrationId}/monitoring/events` | `queryMonitoringEventsV2` | Query monitoring events from the unified erp_monitoring_v2 table. |
| `GET` | `/v2/integrations/{integrationId}/monitoring/events/{eventId}/associated` | `getAssociatedMonitoringEvents` | Returns all monitoring events sharing the same event_id, ordered chronologically. |
| `POST` | `/v2/integrations/{integrationId}/monitoring/external-events` | `ingestExternalMonitoringEvents` | Ingest monitoring spans produced by an EXTERNAL system (e.g. |
| `POST` | `/v2/integrations/{integrationId}/monitoring/stats` | `getMonitoringStatsV2` | Get aggregated statistics from the unified erp_monitoring_v2 table. |
| `POST` | `/v2/integrations/{integrationId}/monitoring/time-series` | `getMonitoringTimeSeriesV2` | Get time-series aggregated event counts from the unified erp_monitoring_v2 table. |
| `GET` | `/v2/integrations/{integrationId}/monitoring/traces/{correlationId}` | `getMonitoringTraceByCorrelation` | Returns the cross-system event trace for a `correlation_id`: every monitoring |

### managed-call

_Managed call endpoints for synchronous external API calls_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/managed-call/{slug}/execute` | `managedCallExecute` | Execute a managed call operation synchronously. |

### proxy

_Secure proxy endpoints_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/secure-proxy` | `secureProxy` | Routes an HTTP request through a VPC with either static IP egress or VPN secure link access. |

---

_Generiert aus der OpenAPI-Spec von `integration-toolkit-client` (@epilot Client 1.8.0). Nicht von Hand bearbeiten._
