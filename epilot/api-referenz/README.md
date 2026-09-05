# epilot API – Überblick

Referenz zu **51 epilot-APIs** mit zusammen **1141 Operationen**, erzeugt aus den offiziellen OpenAPI-Specs.

Offizielle Doku: https://docs.epilot.io/api · Specs: https://docs.api.epilot.io/ · SDK: https://github.com/epilot-dev/sdk-js

## Wie epilot aufgebaut ist

epilot ist kein Monolith mit einer API, sondern eine Sammlung eigenständiger Services. Jeder hat eine eigene Base URL nach dem Muster `https://<service>.sls.epilot.io` und eine eigene OpenAPI-Spec. Authentifizierung, Fehlerformat und Org-Kontext sind über alle Services hinweg identisch – siehe [Authentifizierung](./authentifizierung.md).

Der Einstieg ist fast immer die **Entity API**: Kontakte, Aufträge, Produkte, Verträge – alles ist eine Entity mit einem konfigurierbaren Schema. Die anderen Services referenzieren Entities über `entity_id` und `slug`.

## APIs nach Domäne

### Daten & Modell

Das Fundament: Entities sind das flexible Datenmodell von epilot. Alles andere haengt daran.

| API | Ops | Base URL | Zweck |
| --- | --- | --- | --- |
| [Entity API](./apis/entity.md) | 88 | `https://entity.sls.epilot.io` | Flexible data layer for epilot Entities. |
| [Query API](./apis/query.md) | 21 | `https://query.sls.epilot.io` | The Query API provides access to epilot's business analytics capabilities, enabling teams to query entity operations, workflow… |
| [Entity Mapping API](./apis/entity-mapping.md) | 12 | `https://entity-mapping.sls.epilot.io` | API Backend for mapping source entity into target entities |
| [Deduplication API](./apis/deduplication.md) | 10 | `https://deduplication.sls.epilot.io` | Backend for Epilot Deduplication feature |
| [Data Governance API](./apis/data-governance.md) | 10 | `https://data-governance.sls.epilot.io` | The **Data Governance API** provides a set of endpoints for managing the lifecycle of entity data within the epilot platform. I… |
| [Validation Rules API](./apis/validation-rules.md) | 7 | `https://validation-rules.sls.epilot.io` | The Validation Rules API manages reusable input validation rules for epilot journeys and entity attributes. |
| [Snapshot API](./apis/snapshot.md) | 12 | `https://snapshot.sls.epilot.io` | Point-in-time backups of epilot configuration with restore. |
| [Blueprint Manifest API](./apis/blueprint-manifest.md) | 73 | `https://blueprint-manifest.sls.epilot.io` | Service to create and install Blueprint Manifest files |
| [Environments API](./apis/environments.md) | 8 | `https://environments.sls.epilot.io` | API for managing organization environment variables and secrets |
| [Sandbox API](./apis/sandbox.md) | 7 | `https://sandbox.sls.epilot.io` | API to set up pipeline connections between epilot orgs to sync and promote configurations (from sandbox to production and vice-… |
| [Configuration Hub API](./apis/configuration-hub.md) | 21 | `https://configuration-hub.sls.epilot.io` | Lightweight index API for exploring epilot organization configurations. |

### Vertrieb & Kundenschnittstelle

Journeys (Online-Strecken), Preise, Angebote und das Kundenportal.

| API | Ops | Base URL | Zweck |
| --- | --- | --- | --- |
| [Journey API](./apis/journey.md) | 18 | `https://journey-config.sls.epilot.io` | API to configure journeys |
| [Submission API](./apis/submission.md) | 2 | `https://submission.sls.epilot.io` | Use this API to handle submissions entities from external sources e.g. journeys and frontends |
| [Pricing API](./apis/pricing.md) | 34 | `https://pricing-api.sls.epilot.io` | The `pricing-api` hub sets the foundations for the following Pricing APIs: |
| [Pricing Tier API](./apis/pricing-tier.md) | 1 | – | Pricing Tier API |
| [Targeting API](./apis/targeting.md) | 16 | `https://targeting.sls.epilot.io` | API for Targeting |
| [Portal API](./apis/customer-portal.md) | 167 | `https://customer-portal-api.sls.epilot.io` | Backend for epilot portals - End Customer Portal & Installer Portal |
| [Design Builder API v2](./apis/design.md) | 14 | `https://design-builder-api.sls.epilot.io` | – |
| [Sharing API](./apis/sharing.md) | 12 | `https://sharing-api.sls.epilot.io` | REST API for managing partner sharing configurations and entity sharing. |
| [Partner Directory API](./apis/partner-directory.md) | 17 | `https://partner-directory-api.sls.epilot.io` | The Partner Directory API enables organizations to manage partnerships within the epilot platform. |

### Prozesse & Automatisierung

Workflows, Automationen und die Arbeitsoberflaeche der Sachbearbeitung.

| API | Ops | Base URL | Zweck |
| --- | --- | --- | --- |
| [Workflows Definitions](./apis/workflow-definition.md) | 22 | `https://workflows-definition.sls.epilot.io` | The Workflows Definitions API enables you to create, manage, and configure reusable workflow templates within your organization… |
| [Workflows Executions](./apis/workflow.md) | 25 | `https://workflows-execution.sls.epilot.io` | ## Overview The Workflows Executions API manages the runtime instances of workflow processes within an organization. While **Wo… |
| [Automation API](./apis/automation.md) | 17 | `https://automation.sls.epilot.io` | API Backend for epilot Automation Workflows feature |
| [Kanban API](./apis/kanban.md) | 10 | `https://kanban.sls.epilot.io` | The Kanban API provides board management and data query capabilities for epilot's Kanban view feature. |
| [Calendar API](./apis/calendar.md) | 28 | `https://calendar.sls.epilot.io` | epilot's calendar API. |
| [Notes API](./apis/notes.md) | 14 | `https://notes.sls.epilot.io` | Facade API Backend for Epilot Notes feature |
| [Dashboard API](./apis/dashboard.md) | 18 | `https://dashboard.sls.epilot.io` | API to store the dashboard configuration for the epilot 360 dashboard |
| [AI Agents API](./apis/ai-agents.md) | 21 | `https://ai-agents.sls.epilot.io` | API for configuring and invoking AI agents in epilot platform |

### Kommunikation & Dokumente

E-Mail, Nachrichten, Vorlagen und Dateiablage.

| API | Ops | Base URL | Zweck |
| --- | --- | --- | --- |
| [Message API](./apis/message.md) | 54 | `https://message.sls.epilot.io` | Send and receive email messages via your epilot organization |
| [Messaging Settings API](./apis/email-settings.md) | 48 | `https://email-settings.sls.epilot.io` | The Messaging Settings API provides comprehensive management of email configurations for epilot organizations. |
| [Email template API](./apis/email-template.md) | 7 | `https://email-template.sls.epilot.io` | Email template API service |
| [Template Variables API](./apis/template-variables.md) | 12 | `https://template-variables-api.sls.epilot.io` | This API provides dynamic template processing and variable management, seamless Handlebars template compilation, custom variabl… |
| [Notification API](./apis/notification.md) | 14 | `https://notification.sls.epilot.io` | Notification API for epilot 360 |
| [Document API](./apis/document.md) | 3 | `https://document.sls.epilot.io` | A document generation API that allows you to generate documents from templates with variables. |
| [File API](./apis/file.md) | 37 | `https://file.sls.epilot.io` | The File API enables you to upload, store, manage, and share files within the epilot platform. |

### Abrechnung & Messwesen

Billing und Zaehlerdaten.

| API | Ops | Base URL | Zweck |
| --- | --- | --- | --- |
| [Billing API](./apis/billing.md) | 14 | `https://billing.sls.epilot.io` | API to manage billing data for epilot contracts and orders. |
| [Metering API](./apis/metering.md) | 21 | `https://metering.sls.epilot.io` | The Metering API manages smart meter data, meter counters, and meter readings for epilot customers and administrators. |

### Plattform, Integration & Zugriff

Apps, Webhooks, Events, Tokens, Nutzer und Rechte.

| API | Ops | Base URL | Zweck |
| --- | --- | --- | --- |
| [App API](./apis/app.md) | 36 | `https://app.sls.epilot.io` | API for managing app publishing and installed app. |
| [Integration Toolkit API](./apis/integration-toolkit.md) | 70 | `https://integration-toolkit.sls.epilot.io` | API for integrating with external systems in a standardised way. |
| [Webhooks](./apis/webhooks.md) | 15 | `https://webhooks.sls.epilot.io` | Service for configuring webhooks on different events |
| [Event Catalog API](./apis/event-catalog.md) | 14 | `https://event-catalog.sls.epilot.io` | Manages the catalog of business events available in epilot |
| [Access Token API](./apis/access-token.md) | 9 | `https://access-token.sls.epilot.io` | Generate Access Tokens for 3rd party applications that need access to epilot APIs. |
| [User API](./apis/user.md) | 42 | `https://user.sls.epilot.io` | Manage users in epilot organization(s) |
| [Organization API](./apis/organization.md) | 8 | `https://organization-v2.sls.epilot.io` | The Organization API provides endpoints for managing epilot tenant organizations. |
| [Permissions API](./apis/permissions.md) | 13 | `https://permissions.sls.epilot.io` | Flexible Role-based Access Control for epilot |
| [Audit Log](./apis/audit-logs.md) | 2 | `https://audit-logs.sls.epilot.io` | Service for managing and retrieving auditing logs in the scope of an organization |
| [Consent API](./apis/consent.md) | 3 | `https://consent.sls.epilot.io` | Consent Management for epilot customer entities |
| [Purpose API](./apis/purpose.md) | 6 | `https://purpose.sls.epilot.io` | Purpose API - enables the management of purposes for the epilot platform. |

### Hilfsdienste

Kleine Nachschlage-APIs.

| API | Ops | Base URL | Zweck |
| --- | --- | --- | --- |
| [Address API](./apis/address.md) | 3 | `https://address.sls.epilot.io` | API for address based operations on the Epilot platform |
| [Address Suggestions API](./apis/address-suggestions.md) | 4 | `https://address-suggestions-api.sls.epilot.io` | – |
| [Iban API](./apis/iban.md) | 1 | `https://iban-api.sls.epilot.io` | API Backend for epilot Iban feature. |

## Diese Referenz aktualisieren

```bash
git clone --depth 1 https://github.com/epilot-dev/sdk-js /tmp/sdk-js
python3 epilot/api-referenz/tools/generate_docs.py /tmp/sdk-js
```

_Stand: 2026-09-05 · generiert, nicht von Hand gepflegt._
