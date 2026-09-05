# Audit Log

> Slug `audit-logs` · OpenAPI-Version `1.0.0` · 2 Operationen

Service for managing and retrieving auditing logs in the scope of an organization

## Zugriff

| | |
| --- | --- |
| Base URL | `https://audit-logs.sls.epilot.io` |
| Docs | https://docs.epilot.io/api/audit-logs |
| SDK | `epilot.auditLogs` aus `@epilot/sdk/audit-logs` (Einzelpaket: `@epilot/audit-logs-client`) |

## Endpunkte

### Audit Log

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/logs/{logId}` | `getLogById` | Retrieve Audit Log events |

### Events

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/logs` | `getLogs` | Retrieve Audit Log events. |

---

_Generiert aus der OpenAPI-Spec von `audit-logs-client` (@epilot Client 0.4.3). Nicht von Hand bearbeiten._
