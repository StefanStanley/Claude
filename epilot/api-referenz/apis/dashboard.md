# Dashboard API

> Slug `dashboard` · OpenAPI-Version `0.0.1` · 18 Operationen

API to store the dashboard configuration for the epilot 360 dashboard

## Zugriff

| | |
| --- | --- |
| Base URL | `https://dashboard.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/dashboard.yaml |
| Docs | https://docs.epilot.io/api/dashboard |
| SDK | `epilot.dashboard` aus `@epilot/sdk/dashboard` (Einzelpaket: `@epilot/dashboard-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### Dashboards

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/dashboard/dashboards` | `listDashboards` | List dashboards available to the user |
| `POST` | `/v1/dashboard/dashboards` | `createDashboard` | Create new dashboard |
| `GET` | `/v1/dashboard/dashboards/favorites` | `listFavoriteDashboardIds` | Returns the current user's favorited dashboard ids, with no dashboard metadata. |
| `DELETE` | `/v1/dashboard/dashboards/{id}` | `deleteDashboard` | Delete a dashboard by ID |
| `GET` | `/v1/dashboard/dashboards/{id}` | `getDashboard` | Get dashboard by ID |
| `PATCH` | `/v1/dashboard/dashboards/{id}` | `patchDashboard` | Partially update a dashboard by ID. |
| `PUT` | `/v1/dashboard/dashboards/{id}` | `putDashboard` | Update a dashboard by ID |
| `DELETE` | `/v1/dashboard/dashboards/{id}/favorite` | `unfavoriteDashboard` | Removes the current user's favorite for the dashboard. |
| `PUT` | `/v1/dashboard/dashboards/{id}/favorite` | `favoriteDashboard` | Marks the dashboard as favorited by the current user. |

### Insights

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/dashboard/insights` | `listInsights` | List insights (saved charts) available to the user |
| `POST` | `/v1/dashboard/insights` | `createInsight` | Create a new insight (saved chart). |
| `GET` | `/v1/dashboard/insights/tags` | `listInsightTags` | List the distinct tags used by insights in the organization (for filter facets) |
| `DELETE` | `/v1/dashboard/insights/{id}` | `deleteInsight` | Delete an insight by ID. |
| `GET` | `/v1/dashboard/insights/{id}` | `getInsight` | Get insight by ID |
| `PATCH` | `/v1/dashboard/insights/{id}` | `patchInsight` | Partially update an insight by ID. |
| `PUT` | `/v1/dashboard/insights/{id}` | `putInsight` | Replace an insight's content by ID. |

### Visualisations

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/dashboard/visualisations` | `listAvailableVisualisations` | Returns list of available Visualisations to configure new dashboard tiles |

### Examples

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/dashboard/examples` | `listAvailableExamples` | Returns list of available exampless for visualisations to configure new dashboard tiles |

---

_Generiert aus der OpenAPI-Spec von `dashboard-client` (@epilot Client 2.1.1). Nicht von Hand bearbeiten._
