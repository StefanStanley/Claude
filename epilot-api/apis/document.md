# Document API

> Slug `document` · OpenAPI-Version `1.0.0` · 3 Operationen

A document generation API that allows you to generate documents from templates with variables.

[Feature Documentation](https://docs.epilot.io/docs/files/document-generation)

## Zugriff

| | |
| --- | --- |
| Base URL | `https://document.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/document.yaml |
| Docs | https://docs.epilot.io/api/document |
| SDK | `epilot.document` aus `@epilot/sdk/document` (Einzelpaket: `@epilot/document-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### Documents

_Document Generation_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v2/documents:convert` | `convertDocument` | Converts a document to a different format. |
| `POST` | `/v2/documents:generate` | `generateDocumentV2` | Generates documents from templates with variables. |
| `POST` | `/v2/documents:meta` | `getTemplateMeta` | Get metadata for a document template |

---

_Generiert aus der OpenAPI-Spec von `document-client` (@epilot Client 0.19.2). Nicht von Hand bearbeiten._
