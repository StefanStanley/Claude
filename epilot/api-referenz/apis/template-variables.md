# Template Variables API

> Slug `template-variables` · OpenAPI-Version `1.1.0` · 12 Operationen

This API provides dynamic template processing and variable management, seamless Handlebars template compilation, custom variable operations, and context-aware content generation across email, document templates and snippets.

## Zugriff

| | |
| --- | --- |
| Base URL | `https://template-variables-api.sls.epilot.io` <br> `https://template-variables-api.dev.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/template-variables.yaml |
| Docs | https://docs.epilot.io/api/template-variables |
| SDK | `epilot.templateVariables` aus `@epilot/sdk/template-variables` (Einzelpaket: `@epilot/template-variables-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-ivy-org-id`)

## Endpunkte

### Templates

_Template-based Operations_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/template-variables/categories` | `getCategories` | Get all template variable categories |
| `POST` | `/v1/template-variables:context` | `getVariableContext` | Get full variable context |
| `POST` | `/v1/template-variables:replace` | `replaceTemplates` | Replace variables in handlebars templates |
| `POST` | `/v1/template-variables:search` | `searchVariables` | Search variables |
| `POST` | `/v2/template:replace` | `replaceTemplatesV2` | Replace variables in templates (V2) |

### Custom Variables

_Custom Variables Operations_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/custom-variables` | `getCustomVariables` | Get custom variables |
| `POST` | `/v1/custom-variables` | `createCustomVariable` | Create custom variable |
| `GET` | `/v1/custom-variables/order-table-blueprint` | `getBluePrintTableConfig` | Get default table config |
| `DELETE` | `/v1/custom-variables/{id}` | `deleteCustomVariable` | Delete custom variable |
| `GET` | `/v1/custom-variables/{id}` | `getCustomVariable` | Get custom variable |
| `PUT` | `/v1/custom-variables/{id}` | `updateCustomVariable` | Update custom variable |
| `POST` | `/v1/custom-variables:search` | `searchCustomVariables` | Search custom variables |

---

_Generiert aus der OpenAPI-Spec von `template-variables-client` (@epilot Client 1.17.2). Nicht von Hand bearbeiten._
