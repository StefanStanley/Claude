# Partner Directory API

> Slug `partner-directory` · OpenAPI-Version `1.7.0` · 17 Operationen

The Partner Directory API enables organizations to manage partnerships within the epilot platform.

- **Partner Directory Management**: Maintain a directory of partner organizations that collaborate with your business
- **Partner Invitations**: Invite external organizations to become partners through a secure token-based invitation flow
- **Assignable Search**: Find users and organizations that can be assigned to tasks, workflows, or entities across your organization and partners
- **Partner User Management**: Manage users within partner organizations, including creating users and assigning roles
- **Geolocation Services**: Convert addresses to geographic coordinates for partner location-based features

## Zugriff

| | |
| --- | --- |
| Base URL | `https://partner-directory-api.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/partner-directory-api.yaml |
| Docs | https://docs.epilot.io/api/partner-directory |
| SDK | `epilot.partnerDirectory` aus `@epilot/sdk/partner-directory` (Einzelpaket: `@epilot/partner-directory-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `AsOrganization` (apiKey, Header `x-ivy-org-id`)

## Endpunkte

### Partners

_Operations for managing the partner directory including: - Inviting new partners to collaborate - Approving or rejecting partner requests - Searching for assignable users and organizations across partners - Looking up partners by invitation token - Converting addresses to geolocation coordinates for partner location features_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/geolocation/text:search` | `searchGeolocationForText` | Converts an address string to geographic coordinates (latitude and longitude). |
| `POST` | `/v1/partner-directory/public/activate` | `activatePartner` | Activates a partner account using an invitation token. |
| `GET` | `/v1/partner-directory/public/getPartnerByToken` | `getPartnerByToken` | Retrieves partner information using an invitation token. |
| `POST` | `/v1/partners/assignables:batchGet` | `batchGetAssignable` | Retrieve multiple assignable users or groups by their IDs in a single request. |
| `POST` | `/v1/partners/assignables:search` | `searchAssignable` | Search for users and organizations that can be assigned to tasks, workflows, or entities. |
| `POST` | `/v1/partners/{id}/approve` | `approvePartner` | Approves a pending partner request, allowing the partner to begin collaboration. |
| `POST` | `/v1/partners/{id}/reject` | `rejectPartner` | Rejects a pending partner request, declining the partnership. |
| `POST` | `/v2/partners/{id}/invite` | `invitePartnerV2` | Sends an invitation email to a partner organization to begin collaboration. |

### Partner Users

_Operations for managing users within partner organizations: - Listing users in a partner organization - Creating new users in partner organizations - Deleting users from partner organizations - Managing roles and role assignments for partner users_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/partners/{orgId}/roles` | `getPartnerRoles` | Retrieves all roles defined for a partner organization. |
| `POST` | `/v2/partners/{orgId}/roles` | `createPartnerRole` | Creates a new role for a partner organization. |
| `DELETE` | `/v2/partners/{orgId}/roles/{roleId}` | `deletePartnerRole` | Delete a role from a partner organization |
| `PUT` | `/v2/partners/{orgId}/roles/{roleId}` | `updatePartnerRole` | Updates an existing role in a partner organization. |
| `GET` | `/v2/partners/{orgId}/users` | `getPartnerUsers` | Retrieves all users belonging to a partner organization along with their assigned roles. |
| `POST` | `/v2/partners/{orgId}/users` | `createPartnerUser` | Creates a new user in a partner organization. |
| `DELETE` | `/v2/partners/{orgId}/users/{userId}` | `deletePartnerUser` | Removes a user from a partner organization. |
| `DELETE` | `/v2/partners/{orgId}/users/{userId}/roles` | `unassignPartnerUserRoles` | Removes one or more roles from a user in a partner organization. |
| `POST` | `/v2/partners/{orgId}/users/{userId}/roles` | `assignPartnerUserRoles` | Assigns one or more roles to a user in a partner organization. |

---

_Generiert aus der OpenAPI-Spec von `partner-directory-client` (@epilot Client 0.16.2). Nicht von Hand bearbeiten._
