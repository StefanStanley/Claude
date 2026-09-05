# Journey API

> Slug `journey` · OpenAPI-Version `1.4.3` · 18 Operationen

API to configure journeys

## Zugriff

| | |
| --- | --- |
| Base URL | `https://journey-config.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/journey-config.yaml |
| Docs | https://docs.epilot.io/api/journey |
| SDK | `epilot.journey` aus `@epilot/sdk/journey` (Einzelpaket: `@epilot/journey-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `PortalAuth` (http/bearer)

## Endpunkte

### Journeys

_Journey operations_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/journey/button-options` | `getButtonOptions` | Get button options from a csv file. |
| `PATCH` | `/v1/journey/configuration` | `patchUpdateJourney` | Update a Journey (partially / patch). |
| `POST` | `/v1/journey/configuration` | `createJourney` | Create a Journey |
| `PUT` | `/v1/journey/configuration` | `updateJourney` | Update a Journey |
| `POST` | `/v1/journey/configuration/search` | `searchJourneys` | Search Journeys |
| `DELETE` | `/v1/journey/configuration/{id}` | `removeJourney` | Remove journey by id |
| `GET` | `/v1/journey/configuration/{id}` | `getJourney` | Get journey by id. |
| `GET` | `/v1/journey/configuration/{id}/environment` | `getJourneyEnvironment` | Resolve the environment variables referenced by this journey. |
| `POST` | `/v1/journey/document:generate` | `generateDocument` | Builds document generated from a template with journey values." |
| `GET` | `/v1/journey/environment-variables` | `getJourneyEnvironmentVariables` | List the organization's environment variables that a journey block may use as an options source. |
| `GET` | `/v1/journey/organization/{id}` | `getJourneysByOrgId` | Get all journeys by organization id |
| `GET` | `/v1/journey/products/{id}` | `getJourneyProducts` | Get products available in the journey by id. |
| `GET` | `/v1/journey/{id}/settings` | `getSettingsForJourney` | Get settings related to the journey using journey ID. |

### Journeys V2

_Journey V2 operations_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `PATCH` | `/v2/journey/configuration` | `patchUpdateJourneyV2` | Update a Journey (partially / patch). |
| `POST` | `/v2/journey/configuration` | `createJourneyV2` | Create a Journey |
| `PUT` | `/v2/journey/configuration` | `updateJourneyV2` | Update a Journey |
| `DELETE` | `/v2/journey/configuration/{id}` | `removeJourneyV2` | Remove journey by id |
| `GET` | `/v2/journey/configuration/{id}` | `getJourneyV2` | Get journey by id |

---

_Generiert aus der OpenAPI-Spec von `journey-client` (@epilot Client 0.6.0). Nicht von Hand bearbeiten._
