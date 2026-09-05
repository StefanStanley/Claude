# Submission API

> Slug `submission` · OpenAPI-Version `1.0.0` · 2 Operationen

Use this API to handle submissions entities from external sources e.g. journeys and frontends

## Zugriff

| | |
| --- | --- |
| Base URL | `https://submission.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/submission-api.yaml |
| Docs | https://docs.epilot.io/api/submission |
| SDK | `epilot.submission` aus `@epilot/sdk/submission` (Einzelpaket: `@epilot/submission-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### Submissions

_Journey Submission_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/submission/nonce/{nonce_id}` | `getNonce` | Check if a nonce was already used (aka exists in storage) |
| `POST` | `/v1/submission/submissions` | `createSubmission` | Creates a submission from a public facing Journey |

---

_Generiert aus der OpenAPI-Spec von `submission-client` (@epilot Client 1.8.4). Nicht von Hand bearbeiten._
