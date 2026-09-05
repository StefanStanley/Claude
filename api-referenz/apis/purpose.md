# Purpose API

> Slug `purpose` · OpenAPI-Version `1.0.0` · 6 Operationen

Purpose API - enables the management of purposes for the epilot platform. 

epilot 'Purposes' are a special system taxonomy used to tag and organize resources (entities, attributes, groups, automations, templates, etc.) across the platform.
In essence, purposes are deeply connected to what information users can see or not on epilot360 UIs based on the "purpose" of the tasks they have at hand.

## Zugriff

| | |
| --- | --- |
| Base URL | `https://purpose.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/purpose.yaml |
| Docs | https://docs.epilot.io/api/purpose |
| SDK | `epilot.purpose` aus `@epilot/sdk/purpose` (Einzelpaket: `@epilot/purpose-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### Purpose

_Purpose operations_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/purpose` | `createPurpose` | Create Purpose |
| `DELETE` | `/v1/purpose/{purposeId}` | `deletePurpose` | Delete Purpose |
| `GET` | `/v1/purpose/{purposeId}` | `getPurpose` | Get Purpose |
| `PUT` | `/v1/purpose/{purposeId}` | `updatePurpose` | Update Purpose |
| `POST` | `/v1/purpose:batchGet` | `batchGetPurposes` | Batch Get Purposes |
| `GET` | `/v1/purpose:search` | `searchPurposes` | Search Purposes |

---

_Generiert aus der OpenAPI-Spec von `purpose-client` (@epilot Client 0.1.1). Nicht von Hand bearbeiten._
