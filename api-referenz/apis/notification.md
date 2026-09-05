# Notification API

> Slug `notification` · OpenAPI-Version `1.7.0` · 14 Operationen

Notification API for epilot 360

## Zugriff

| | |
| --- | --- |
| Base URL | `https://notification.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/svc-notification-api.yaml |
| Docs | https://docs.epilot.io/api/notification |
| SDK | `epilot.notification` aus `@epilot/sdk/notification` (Einzelpaket: `@epilot/notification-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### Notification

_Notification_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/notification/notifications` | `getNotifications` | Get notifications |
| `POST` | `/v1/notification/notifications` | `createNotification` | Create a message that can be displayed in the notification panel. |
| `PUT` | `/v1/notification/notifications/mark` | `markAllAsRead` | Mark all as read |
| `GET` | `/v1/notification/notifications/{id}` | `getNotification` | Get the details of a single notification. |
| `PUT` | `/v1/notification/notifications/{id}/mark` | `markAsRead` | Mark as read |
| `GET` | `/v1/notification/unreads` | `getTotalUnread` | Get total unread |
| `GET` | `/v2/notification/notifications` | `getNotificationsV2` | Get notifications items. |

### Template

_Notification Template_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/notification/templates` | `listNotificationTemplates` | List notification templates with optional filtering and pagination |
| `POST` | `/v1/notification/templates` | `createNotificationTemplate` | Create a new notification template |
| `POST` | `/v1/notification/templates/send-preview` | `sendPreview` | Send a preview notification (both email and in-app) to the requesting user. |
| `DELETE` | `/v1/notification/templates/{id}` | `deleteNotificationTemplate` | Delete a notification template permanently |
| `GET` | `/v1/notification/templates/{id}` | `getNotificationTemplate` | Get a single notification template by ID |
| `PATCH` | `/v1/notification/templates/{id}` | `patchNotificationTemplate` | Partially update a notification template |
| `PUT` | `/v1/notification/templates/{id}` | `updateNotificationTemplate` | Update a notification template (full replacement) |

---

_Generiert aus der OpenAPI-Spec von `notification-client` (@epilot Client 0.13.2). Nicht von Hand bearbeiten._
