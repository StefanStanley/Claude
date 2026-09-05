# Permissions API

> Slug `permissions` · OpenAPI-Version `1.2.1` · 13 Operationen

Flexible Role-based Access Control for epilot

## Zugriff

| | |
| --- | --- |
| Base URL | `https://permissions.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/permissions.yaml |
| Docs | https://docs.epilot.io/api/permissions |
| SDK | `epilot.permissions` aus `@epilot/sdk/permissions` (Einzelpaket: `@epilot/permissions-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### Roles

_Manage roles and grants_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/permissions/me` | `listCurrentRoles` | Returns roles and grants assigned to current user |
| `GET` | `/v1/permissions/refresh` | `refreshPermissions` | Makes sure the user has a role in the organization |
| `GET` | `/v1/permissions/roles` | `listAllRoles` | Returns list of all roles in organization |
| `POST` | `/v1/permissions/roles` | `createRole` | Create role |
| `DELETE` | `/v1/permissions/roles/{roleId}` | `deleteRole` | Delete role by id |
| `GET` | `/v1/permissions/roles/{roleId}` | `getRole` | Get role by id |
| `PUT` | `/v1/permissions/roles/{roleId}` | `putRole` | Create or update role |
| `POST` | `/v1/permissions/roles:search` | `searchRoles` | Search Roles |

### Assignments

_Assign roles to users_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/permissions/assignments` | `listAllAssignments` | Returns list of all assignments in organization |
| `GET` | `/v1/permissions/assignments/{userId}` | `getAssignedRolesForUser` | Get list of assigned roles by user id |
| `PUT` | `/v1/permissions/assignments/{userId}` | `assignRoles` | Assign / unassign roles to users. |
| `DELETE` | `/v1/permissions/assignments/{userId}/{roleId}` | `removeAssignment` | Remove role assignment from user |
| `POST` | `/v1/permissions/assignments/{userId}/{roleId}` | `addAssignment` | Assign a user to a role. |

---

_Generiert aus der OpenAPI-Spec von `permissions-client` (@epilot Client 0.17.0). Nicht von Hand bearbeiten._
