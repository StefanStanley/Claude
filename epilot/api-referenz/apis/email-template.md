# Email template API

> Slug `email-template` · OpenAPI-Version `1.1.0` · 7 Operationen

Email template API service

## Zugriff

| | |
| --- | --- |
| Base URL | `https://email-template.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/email-template.yaml |
| Docs | https://docs.epilot.io/api/email-template |
| SDK | `epilot.emailTemplate` aus `@epilot/sdk/email-template` (Einzelpaket: `@epilot/email-template-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### Email templates

_Email template service_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/email-template/templates` | `saveTemplate` | Create or update a template. |
| `GET` | `/v1/email-template/templates/{id}` | `getTemplateDetail` | Get email template by ID |
| `PUT` | `/v1/email-template/templates/{id}` | `updateTemplateDetail` | Update email template by ID |
| `POST` | `/v1/email-template/templates:bulkSendMessage` | `bulkSendMessage` | Send emails to multiple recipients using a template |
| `POST` | `/v1/email-template/templates:revert` | `revertToOriginalTemplate` | Revert to the original system generated email template |

### Variables

_Variable service_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/email-template/templates:replace` | `replaceVariables` | **deprecated** · Get template detail and replace all variables (template variables and document generation) |
| `POST` | `/v1/email-template/templates:replaceAsync` | `replaceVariablesAsync` | This endpoint allows to initiate an asynchronous process in replacing the template details & generating the documents. |

---

_Generiert aus der OpenAPI-Spec von `email-template-client` (@epilot Client 2.2.5). Nicht von Hand bearbeiten._
