# User API

> Slug `user` · OpenAPI-Version `2.0.0` · 42 Operationen

Manage users in epilot organization(s)

## Zugriff

| | |
| --- | --- |
| Base URL | `https://user.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/user.yaml |
| Docs | https://docs.epilot.io/api/user |
| SDK | `epilot.user` aus `@epilot/sdk/user` (Einzelpaket: `@epilot/user-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### User V2

_User API V2_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/users` | `listUsersV2` | Get the list of organization users |
| `POST` | `/v2/users/invite` | `inviteUser` | Creates a new user in the caller's organization and sends an invite email to activate the user |
| `POST` | `/v2/users/invite:resendEmail` | `resendUserInvitation` | Resend user invitation email |
| `GET` | `/v2/users/me` | `getMeV2` | Get currently logged in user |
| `GET` | `/v2/users/me/passkeys` | `listPasskeys` | List all passkeys registered for the authenticated user. |
| `DELETE` | `/v2/users/me/passkeys/{credentialId}` | `deletePasskey` | Delete a passkey by credential ID. |
| `POST` | `/v2/users/me/passkeys:registerBegin` | `beginPasskeyRegistration` | Begin passkey registration flow for the authenticated user. |
| `POST` | `/v2/users/me/passkeys:registerComplete` | `completePasskeyRegistration` | Complete passkey registration by verifying the attestation response. |
| `GET` | `/v2/users/me/settings` | `listUserSettings` | List all setting scopes and keys available for the currently logged in user. |
| `GET` | `/v2/users/me/settings/{scope}` | `getUserSettingsScope` | Get all setting values for one scope for the currently logged in user. |
| `DELETE` | `/v2/users/me/settings/{scope}/{key}` | `deleteUserSetting` | Delete one setting value for the currently logged in user. |
| `GET` | `/v2/users/me/settings/{scope}/{key}` | `getUserSetting` | Get one setting value by scope and key for the currently logged in user. |
| `PUT` | `/v2/users/me/settings/{scope}/{key}` | `putUserSetting` | Create or replace one setting value for the currently logged in user. |
| `POST` | `/v2/users/public/activate` | `activateUser` | Activate user using an invite token |
| `GET` | `/v2/users/public/checkToken` | `checkInviteToken` | Check an invite token |
| `POST` | `/v2/users/public/passkeys:authenticateBegin` | `beginPasskeyAuthentication` | Begin passkey authentication flow. |
| `POST` | `/v2/users/public/passkeys:authenticateBeginDiscoverable` | `beginDiscoverablePasskeyAuthentication` | Begin discoverable passkey authentication flow (no email required). |
| `POST` | `/v2/users/public/passkeys:resolveCredential` | `resolveDiscoverableCredential` | Resolve user identity from a discoverable passkey assertion. |
| `DELETE` | `/v2/users/public/reject` | `rejectInvite` | Reject an invite |
| `POST` | `/v2/users/public/requestPasswordReset` | `requestPasswordReset` | Request a password reset email for the given email address. |
| `POST` | `/v2/users/public/resetPassword` | `resetPassword` | Set a new password using a reset token from the password reset email. |
| `POST` | `/v2/users/public/signup` | `signUpUser` | – |
| `GET` | `/v2/users/public/username/{username}:getLoginParameters` | `getUserLoginParametersV2` | Get user organization login parameters by username |
| `POST` | `/v2/users/public/verifyEmail` | `verifyEmailWithToken` | Update new email using an verification token |
| `POST` | `/v2/users/switchOrganization` | `switchOrganization` | Switch to another organization the user is part of |
| `DELETE` | `/v2/users/{id}` | `deleteUserV2` | Delete user by user id |
| `GET` | `/v2/users/{id}` | `getUserV2` | Get user details by user id |
| `PATCH` | `/v2/users/{id}` | `updateUserV2` | Update user details |
| `GET` | `/v2/users/{id}/groups` | `getGroupsForUser` | Get groups of a user |
| `POST` | `/v2/users:sendPasswordReset` | `sendUserPasswordReset` | Send a password reset email to a user in your organization. |

### User V1

_Legacy User API_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/users` | `listUsers` | Lists users in organizations you have access to |
| `GET` | `/v1/users/me` | `getMe` | Get currently logged in user |
| `GET` | `/v1/users/username/{username}:getLoginParameters` | `getUserLoginParameters` | Get user organization login parameters by username |
| `GET` | `/v1/users/{id}` | `getUser` | Get user by id |

### Group

_User Groups_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/groups` | `getGroups` | Lists groups in organizations you have access to |
| `POST` | `/v1/groups` | `createGroup` | Create a new group |
| `DELETE` | `/v1/groups/{id}` | `deleteGroup` | Delete group by id |
| `GET` | `/v1/groups/{id}` | `getGroup` | Get group by id |
| `PATCH` | `/v1/groups/{id}` | `updateGroup` | Update group by id |
| `POST` | `/v1/groups/{id}/user:next` | `advanceUserAssignment` | Advance user assignment to next user in line |

### Navigation

_Customized Workplace Navigation Configurations_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v2/user/navigations` | `createNavigation` | Create a new navigation configuration. |
| `GET` | `/v2/user/navigations/{id}` | `getNavigation` | Get a navigation configuration by ID |

---

_Generiert aus der OpenAPI-Spec von `user-client` (@epilot Client 3.15.0). Nicht von Hand bearbeiten._
