# Targeting API

> Slug `targeting` · OpenAPI-Version `1.1.0` · 16 Operationen

API for Targeting

## Zugriff

| | |
| --- | --- |
| Base URL | `https://targeting.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/targeting.yaml |
| Docs | https://docs.epilot.io/api/targeting |
| SDK | `epilot.targeting` aus `@epilot/sdk/targeting` (Einzelpaket: `@epilot/targeting-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### Campaign

_Campaign Endpoints_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/campaign/{campaign_id}/job` | `getCampaignJobStatus` | Get the status of a campaign's automation job |
| `GET` | `/v1/campaign/{campaign_id}/portals` | `getCampaignPortals` | Get the list of portals and its widgets where the campaign is used. |
| `POST` | `/v1/campaign/{campaign_id}/status` | `changeCampaignStatus` | Change the status of a campaign to a desired status. |
| `POST` | `/v1/campaign:discover` | `discoverCampaigns` | Given an entity, returns the Next Best Actions it should see on the Entity-UI channel. |
| `POST` | `/v1/campaign:match` | `matchCampaigns` | Match campaigns based on target entities. |
| `POST` | `/v1/campaign:setup` | `setupCampaign` | Creates a `campaign` entity together with its related entities and configurations in a single call. |

### Campaign Recipient

_Campaign Recipient Endpoints_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/campaign/{campaign_id}/email-stats` | `getEmailStats` | Aggregate email delivery counts for a campaign, for the KPI summary on the campaign UI. |
| `POST` | `/v1/campaign/{campaign_id}/recipient` | `createRecipient` | Creates a new recipient associated with a campaign. |
| `PATCH` | `/v1/campaign/{campaign_id}/recipient/{recipient_id}` | `updateRecipient` | Updates a recipient's attributes. |
| `POST` | `/v1/campaign/{campaign_id}/recipient/{recipient_id}/entity_ui:restore` | `restoreRecipientEntityUiStatus` | Undo a dismissal on the Entity-UI (Next Best Action) channel |
| `PATCH` | `/v1/campaign/{campaign_id}/recipient/{recipient_id}/entity_ui:status` | `updateRecipientEntityUiStatus` | Records a Next Best Action interaction for a recipient on the Entity-UI channel. |
| `PATCH` | `/v1/campaign/{campaign_id}/recipient/{recipient_id}/portal:status` | `updateRecipientPortalStatus` | Updates the portal status for a specific campaign recipient. |
| `GET` | `/v1/campaign/{campaign_id}/recipients` | `getRecipients` | Get a paginated list of recipients for a campaign. |

### Campaign Delivery

_Campaign Delivery Endpoints_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/campaign/{campaign_id}/automations:retrigger` | `retriggerCampaignAutomations` | Retrigger automation executions for specific campaign recipients that have failed. |

### Target

_Target Endpoints_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/target/queries` | `getTargetQueries` | Transform target filters into Lucene queries for the provided target IDs. |
| `POST` | `/v1/target:match` | `matchTargets` | Find targets from the provided list that include the provide entities. |

---

_Generiert aus der OpenAPI-Spec von `targeting-client` (@epilot Client 0.16.2). Nicht von Hand bearbeiten._
