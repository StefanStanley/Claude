# Organization API

> Slug `organization` · OpenAPI-Version `1.1.0` · 8 Operationen

The Organization API provides endpoints for managing epilot tenant organizations.

## Overview

This API allows you to:
- **Retrieve organization details** - Get information about the current organization or a specific organization by ID
- **Update organization profiles** - Modify organization name, contact information, address, and branding assets
- **Manage organization settings** - Configure organization-wide settings such as feature flags and preferences
- **Branding configuration** - Set organization logos, email signatures, and style settings

## Organization Types

Organizations can be configured as:
- **Production** - Live production environments for real business operations
- **Sandbox** - Test environments linked to a parent production organization

## Zugriff

| | |
| --- | --- |
| Base URL | `https://organization-v2.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/organization-v2.yaml |
| Docs | https://docs.epilot.io/api/organization |
| SDK | `epilot.organization` aus `@epilot/sdk/organization` (Einzelpaket: `@epilot/organization-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### Organization

_Endpoints for managing organization profiles and information._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/organization/current` | `getCurrentOrganization` | Retrieves the organization associated with the authenticated user's current session. |
| `GET` | `/v2/organization/{org_id}` | `getOrganization` | Retrieves detailed information about a specific organization by its unique identifier. |
| `PATCH` | `/v2/organization/{org_id}` | `updateOrganization` | Updates an organization's profile information. |

### Organization Settings

_Endpoints for managing organization-wide configuration settings._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/organization/{org_id}/settings` | `getSettings` | Retrieves all configuration settings for an organization. |
| `DELETE` | `/v2/organization/{org_id}/settings/{key}` | `deleteSettingsValue` | Removes a specific organization setting identified by its key. |
| `PUT` | `/v2/organization/{org_id}/settings/{key}` | `putSettingsValue` | Creates or updates a specific organization setting identified by its key. |

### Feature Settings

_Feature flag metadata for the organization settings page._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/feature-settings` | `getFeatureSettings` | **deprecated** · Get platform configuration metadata |
| `GET` | `/v2/organization/feature-settings` | `getOrganizationFeatureSettings` | Get organization feature settings |

---

_Generiert aus der OpenAPI-Spec von `organization-client` (@epilot Client 0.15.1). Nicht von Hand bearbeiten._
