# Webhooks

> Slug `webhooks` · OpenAPI-Version `1.0.0` · 15 Operationen

Service for configuring webhooks on different events

## Zugriff

| | |
| --- | --- |
| Base URL | `https://webhooks.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/webhooks.yaml |
| Docs | https://docs.epilot.io/api/webhooks |
| SDK | `epilot.webhooks` aus `@epilot/sdk/webhooks` (Einzelpaket: `@epilot/webhooks-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### webhooks

_Configure and trigger webhooks_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/webhooks/.well-known/public-key` | `getPublicKey` | Returns the platform-level Ed25519 public key used to verify |
| `GET` | `/v1/webhooks/configs` | `getConfigs` | Search Webhook Client Configs |
| `POST` | `/v1/webhooks/configs` | `createConfig` | Create Webhook Client Config |
| `DELETE` | `/v1/webhooks/configs/{configId}` | `deleteConfig` | Delete Webhook Client Config |
| `GET` | `/v1/webhooks/configs/{configId}` | `getConfig` | Get webhook config by id |
| `PUT` | `/v1/webhooks/configs/{configId}` | `updateConfig` | Update Webhook Client Config |
| `GET` | `/v1/webhooks/configs/{configId}/events` | `getWehookEvents` | **deprecated** · This endpoint is deprecated and will be removed on 2025-12-31. |
| `POST` | `/v1/webhooks/configs/{configId}/events/replay-batch` | `batchReplayEvents` | Replay a batch of webhook events |
| `GET` | `/v1/webhooks/configs/{configId}/events/{eventId}` | `getEventById` | Get a webhook event by its id |
| `POST` | `/v1/webhooks/configs/{configId}/events/{eventId}/replay` | `replayEvent` | Replay a webhook event |
| `POST` | `/v1/webhooks/configs/{configId}/example` | `getWebhookExample` | Generate an example payload for a webhook configuration based on trigger type |
| `POST` | `/v1/webhooks/configs/{configId}/test-oauth` | `testOAuth` | Test OAuth connection |
| `POST` | `/v1/webhooks/configs/{configId}/trigger` | `triggerWebhook` | triggers a webhook event either async or sync |
| `GET` | `/v1/webhooks/configured-events` | `getConfiguredEvents` | Retrieve events that can trigger webhooks |

### Events

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v2/webhooks/configs/{configId}/events` | `getWebhookEventsV2` | List webhook events and filter them by status, timestamp, etc. |

---

_Generiert aus der OpenAPI-Spec von `webhooks-client` (@epilot Client 2.21.5). Nicht von Hand bearbeiten._
