# Calendar API

> Slug `calendar` · OpenAPI-Version `0.1.0` · 28 Operationen

epilot's calendar API.

Exposes calendars and events as first-class epilot resources.

## Zugriff

| | |
| --- | --- |
| Base URL | `https://calendar.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/calendar.yaml |
| Docs | https://docs.epilot.io/api/calendar |
| SDK | `epilot.calendar` aus `@epilot/sdk/calendar` (Einzelpaket: `@epilot/calendar-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### Absence

_User absence from calendar events and absence adjustments_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/calendar/absence/users` | `listUsersAbsence` | List organization users with known absence metadata in the requested time window. |
| `GET` | `/v1/calendar/absence/users/{user_id}` | `getUserAbsence` | Get known absence for a user in a time window. |
| `GET` | `/v1/calendar/absence/users/{user_id}/adjustments` | `listAbsenceAdjustments` | List absence adjustments for a user in a time window. |
| `POST` | `/v1/calendar/absence/users/{user_id}/adjustments` | `createAbsenceAdjustment` | Create a time-bound absence adjustment for a user in the caller organization. |
| `DELETE` | `/v1/calendar/absence/users/{user_id}/adjustments/{adjustment_id}` | `deleteAbsenceAdjustment` | Delete an absence adjustment. |
| `GET` | `/v1/calendar/absence/users/{user_id}/adjustments/{adjustment_id}` | `getAbsenceAdjustment` | Get an absence adjustment by ID. |
| `PATCH` | `/v1/calendar/absence/users/{user_id}/adjustments/{adjustment_id}` | `patchAbsenceAdjustment` | Update an absence adjustment in the caller organization. |
| `POST` | `/v1/calendar/absence:search` | `searchAbsence` | Search known absence for candidate users in the requested time window. |
| `POST` | `/v1/calendar/absence:search-now` | `searchNowAbsence` | Search known absence for candidate users at the current server time. |

### Calendars

_User and organization calendars_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/calendar` | `listCalendars` | List calendars visible to the caller. |
| `POST` | `/v1/calendar` | `createCalendar` | Create a native epilot calendar. |
| `POST` | `/v1/calendar/outlook/webhook` | `outlookWebhook` | Public Microsoft Graph webhook receiver for per-user Outlook calendar |
| `POST` | `/v1/calendar/sources/outlook` | `addOutlookCalendar` | Registers one of the caller's Outlook calendars as an epilot calendar. |
| `GET` | `/v1/calendar/sources/outlook/available` | `listOutlookCalendars` | Lists the calling user's Outlook calendars available to import as epilot calendars. |
| `DELETE` | `/v1/calendar/sources/outlook/{calendar_id}` | `deleteOutlookCalendar` | Disconnects a previously registered Outlook calendar. |
| `DELETE` | `/v1/calendar/{calendar_id}` | `deleteCalendar` | Delete a native epilot calendar or disconnect a synced calendar, including its locally stored events. |
| `GET` | `/v1/calendar/{calendar_id}` | `getCalendar` | Get a single calendar by its epilot ID. |
| `PATCH` | `/v1/calendar/{calendar_id}` | `updateCalendar` | Update local calendar details. |

### Calendar Events

_Calendar events_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/calendar/events` | `listEvents` | List events in a time window. |
| `POST` | `/v1/calendar/events` | `createEvent` | Create a native epilot calendar event. |
| `DELETE` | `/v1/calendar/events/{event_id}` | `deleteEvent` | Delete a native epilot calendar event. |
| `GET` | `/v1/calendar/events/{event_id}` | `getEvent` | Get a single event by its epilot ID. |
| `PATCH` | `/v1/calendar/events/{event_id}` | `updateEvent` | Update a native epilot calendar event. |
| `POST` | `/v1/calendar/events/{event_id}/share` | `shareEvent` | Share a calendar event with another user of the same organization, view-only. |
| `DELETE` | `/v1/calendar/events/{event_id}/share/{user_id}` | `unshareEvent` | Revoke a per-event share. |

### Working Hours

_Recurring weekly working hours of users_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `DELETE` | `/v1/calendar/working-hours/users/{user_id}` | `deleteWorkingHours` | Delete the working hours of a user. |
| `GET` | `/v1/calendar/working-hours/users/{user_id}` | `getWorkingHours` | Get the recurring weekly working hours of a user. |
| `PUT` | `/v1/calendar/working-hours/users/{user_id}` | `putWorkingHours` | Create or fully replace the working hours of a user in the caller organization. |

---

_Generiert aus der OpenAPI-Spec von `calendar-client` (@epilot Client 0.2.0). Nicht von Hand bearbeiten._
