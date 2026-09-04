# App API

> Slug `app` · OpenAPI-Version `2.0.0` · 36 Operationen

API for managing app publishing and installed app.

## Zugriff

| | |
| --- | --- |
| Base URL | `https://app.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/app.yaml |
| Docs | https://docs.epilot.io/api/app |
| SDK | `epilot.app` aus `@epilot/sdk/app` (Einzelpaket: `@epilot/app-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### App Configuration

_Create and manage app configurations_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/app-configurations` | `listConfigurations` | List all app configuration metadata owned by an organization. |
| `POST` | `/v1/app-configurations` | `createConfiguration` | Create a new private app configuration. |
| `GET` | `/v1/app-configurations/public` | `listPublicConfigurations` | List all publicly available app configurations that can be installed. |
| `GET` | `/v1/app-configurations/public/{appId}` | `getPublicConfiguration` | Retrieve the public configuration of an app to install in your tenant |
| `DELETE` | `/v1/app-configurations/{appId}` | `deleteConfiguration` | Delete app configuration |
| `GET` | `/v1/app-configurations/{appId}` | `getConfiguration` | Retrieve a specific app configuration |
| `PATCH` | `/v1/app-configurations/{appId}` | `patchMetadata` | Patch non-versioned configuration metadata of a given app configuration. |
| `POST` | `/v1/app-configurations/{appId}/bundle` | `createBundleUploadUrl` | Generate a presigned URL for uploading app bundle to /<app-id>/bundle.js path |
| `DELETE` | `/v1/app-configurations/{appId}/logo` | `deleteLogo` | Delete the app logo from /<app-id>/logo.png path |
| `POST` | `/v1/app-configurations/{appId}/logo` | `createLogoUploadUrl` | Generate a presigned URL for uploading app logo to /<app-id>/logo.png path |
| `GET` | `/v1/app-configurations/{appId}/versions` | `listVersions` | Retrieve a list of versions for an app configuration |
| `POST` | `/v1/app-configurations/{appId}/versions/{sourceVersion}/clone-to/{targetVersion}` | `cloneVersion` | Clone an existing app version to create a new version |
| `DELETE` | `/v1/app-configurations/{appId}/versions/{version}` | `deleteVersion` | Delete a specific version of an app configuration |
| `GET` | `/v1/app-configurations/{appId}/versions/{version}` | `getVersion` | Retrieve a specific version of an app configuration |
| `PATCH` | `/v1/app-configurations/{appId}/versions/{version}` | `patchVersion` | Patch an existing app version |
| `POST` | `/v1/app-configurations/{appId}/versions/{version}/components` | `createComponent` | Patch an existing app version to create/add a component |
| `DELETE` | `/v1/app-configurations/{appId}/versions/{version}/components/{componentId}` | `deleteComponent` | Delete a specific component from an app version |
| `PATCH` | `/v1/app-configurations/{appId}/versions/{version}/components/{componentId}` | `patchComponent` | Patch an existing app version to update its components |
| `GET` | `/v1/app-configurations/{appId}/versions/{version}/review` | `getReview` | Retrieve the review status of a specific app version |
| `POST` | `/v1/app-configurations/{appId}/versions/{version}/review` | `createReview` | Submit an app version for review to make it public |
| `POST` | `/v1/app-configurations/{appId}/zip` | `createZipUploadUrl` | Generate a presigned URL to upload a zip file with artifacts that will be unpacked in a new directory under the /<app-id>/ path |

### App Installation

_Install and uninstall apps_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/app` | `listInstallations` | Retrieve a list of installed apps for the organization. |
| `DELETE` | `/v1/app/{appId}` | `uninstall` | Uninstall an app by its ID. |
| `GET` | `/v1/app/{appId}` | `getInstallation` | Retrieve details of an installed app by its ID. |
| `PATCH` | `/v1/app/{appId}` | `patchInstallation` | Patch an installed app by its ID. |
| `POST` | `/v1/app/{appId}` | `install` | Upsert app installation by its ID. |
| `POST` | `/v1/app/{appId}/options/resolve` | `resolveOptions` | Resolve the effective app-level options of an installation, including decrypted sensitive values (secrets). |
| `POST` | `/v1/app/{appId}/promote-to/{version}` | `promoteVersion` | Update an installed app to a new version |
| `GET` | `/v1/public/app/{appId}/components/{componentId}` | `getPublicFacingComponent` | Retrieve public facing components for an installed app |

### App Analytics

_Analytics for installed apps_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/app-configurations/{appId}/events` | `queryEvents` | Query analytics events for a specific app with flexible filtering |
| `POST` | `/v1/app-events` | `ingestEvent` | Internal endpoint for services to submit app events for analytic purposes |

### App Proxy

_Forward requests to external APIs via registered proxy targets_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `DELETE` | `/v1/public/app/{appId}/proxy/{proxyName}/{path}` | `publicProxyDelete` | Forward a DELETE request to a registered proxy target from a public-facing component |
| `GET` | `/v1/public/app/{appId}/proxy/{proxyName}/{path}` | `publicProxyGet` | Forward a GET request to a registered proxy target from a public-facing component (e.g. |
| `PATCH` | `/v1/public/app/{appId}/proxy/{proxyName}/{path}` | `publicProxyPatch` | Forward a PATCH request to a registered proxy target from a public-facing component |
| `POST` | `/v1/public/app/{appId}/proxy/{proxyName}/{path}` | `publicProxyPost` | Forward a POST request to a registered proxy target from a public-facing component (e.g. |
| `PUT` | `/v1/public/app/{appId}/proxy/{proxyName}/{path}` | `publicProxyPut` | Forward a PUT request to a registered proxy target from a public-facing component |

---

_Generiert aus der OpenAPI-Spec von `app-client` (@epilot Client 0.16.0). Nicht von Hand bearbeiten._
