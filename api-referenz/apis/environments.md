# Environments API

> Slug `environments` · OpenAPI-Version `1.0.1` · 8 Operationen

API for managing organization environment variables and secrets

## Zugriff

| | |
| --- | --- |
| Base URL | `https://environments.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/environments.yaml |
| Docs | https://docs.epilot.io/api/environments |
| SDK | `epilot.environments` aus `@epilot/sdk/environments` (Einzelpaket: `@epilot/environments-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### environments

_Environment variables and secrets management_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/environments` | `listEnvironmentVariables` | List all environment variables for the organization. |
| `POST` | `/v1/environments` | `createEnvironmentVariable` | Create a new environment variable or secret for the organization. |
| `GET` | `/v1/environments/groups` | `listEnvironmentGroups` | List all environment groups for the organization. |
| `DELETE` | `/v1/environments/groups/{name}` | `deleteEnvironmentGroup` | Deletes a group. |
| `PUT` | `/v1/environments/groups/{name}` | `putEnvironmentGroup` | Create or update an environment group by name. |
| `DELETE` | `/v1/environments/{key}` | `deleteEnvironmentVariable` | Delete an environment variable by key. |
| `GET` | `/v1/environments/{key}` | `getEnvironmentVariable` | Get an environment variable by key. |
| `PUT` | `/v1/environments/{key}` | `updateEnvironmentVariable` | Create or update an environment variable. |

---

_Generiert aus der OpenAPI-Spec von `environments-client` (@epilot Client 0.3.1). Nicht von Hand bearbeiten._
