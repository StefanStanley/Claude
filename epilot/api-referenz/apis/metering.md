# Metering API

> Slug `metering` · OpenAPI-Version `1.2.0` · 21 Operationen

The Metering API manages smart meter data, meter counters, and meter readings for epilot customers and administrators.

It supports two audiences:
- **ECP (End Customer Portal)**: Portal users can view their meters, counters, and submit readings via the customer portal.
- **ECP Admin**: Internal epilot users and ERP integrations can create, update, and bulk-manage meter readings.

Key capabilities:
- Retrieve meters and counters associated with a customer or contract
- Submit individual or bulk meter readings (with optional validation skip)
- Batch upsert/delete readings using the v2 endpoint
- Query historical readings by date interval with cumulative or relative consumption modes
- Retrieve allowed reading ranges to guide end customers entering readings

## Zugriff

| | |
| --- | --- |
| Base URL | `https://metering.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/metering.yaml |
| Docs | https://docs.epilot.io/api/metering |
| SDK | `epilot.metering` aus `@epilot/sdk/metering` (Einzelpaket: `@epilot/metering-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `PortalAuth` (http/bearer), `EitherAuth` (http/bearer), `AsOrganization` (apiKey, Header `x-ivy-org-id`)

## Endpunkte

### ECP

_APIs available to authenticated end customers via the Customer Portal (ECP). Customers can view their meters, retrieve meter counters, and submit meter readings._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/metering/contract/meters/{contract_id}` | `getMetersByContractId` | Retrieves all meters associated with a given contract entity. |
| `GET` | `/v1/metering/counter` | `getMeterCounters` | Retrieves all meter counters associated with a given meter. |
| `GET` | `/v1/metering/counter/{counter_id}` | `getCounterDetails` | Retrieves the full details of a single meter counter by its ID. |
| `GET` | `/v1/metering/meter` | `getCustomerMeters` | Retrieves all meters associated with the authenticated portal customer. |
| `GET` | `/v1/metering/meter/{id}` | `getMeter` | Retrieves the full details of a specific meter by ID, including related entities and available journey actions. |
| `PATCH` | `/v1/metering/meter/{id}` | `updateMeter` | Partially updates the details of a meter entity by ID. |
| `POST` | `/v1/metering/readings/{meter_id}` | `createPortalMeterReadings` | Inserts multiple meter readings at once for a given meter via the end customer portal. |

### ECP Admin

_APIs available to epilot internal users and ERP integrations. Administrators can create, update, delete, and bulk-manage meter readings, as well as trigger readings from journey submissions._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/metering/allowed/reading/{meter_id}` | `getAllowedReadingForMeter` | Returns the allowed min/max reading range for each counter of the given meter. |
| `POST` | `/v1/metering/reading` | `createMeterReading` | Inserts a new meter reading. |
| `POST` | `/v1/metering/reading/submission` | `createMeterReadingFromSubmission` | Creates meter readings from a journey submission payload. |
| `POST` | `/v1/metering/reading/with-meter` | `createReadingWithMeter` | Creates a meter reading along with meter lookup or creation by MA-LO ID and OBIS number. |
| `DELETE` | `/v1/metering/reading/{meter_id}/{counter_id}` | `deleteMeterReading` | Permanently deletes a meter reading identified by meter ID, counter ID, and timestamp. |
| `GET` | `/v1/metering/reading/{meter_id}/{counter_id}` | `getReadingsByInterval` | Retrieves all readings specified in an interval. |
| `PUT` | `/v1/metering/reading/{meter_id}/{counter_id}` | `updateMeterReading` | Updates an existing meter reading identified by meter ID, counter ID, and timestamp. |
| `POST` | `/v1/metering/readings` | `createMeterReadings` | Inserts multiple meter readings at once. |
| `POST` | `/v2/metering/readings` | `batchWriteMeterReadings` | Upserts or deletes multiple meter readings at once. |
| `POST` | `/v2/metering/readings/prune` | `pruneMeterReadings` | Deletes every reading of a meter whose `external_id` is NOT in the provided keep list — in a single request. |

### Metering

_APIs for managing meter reading changesets. Changesets represent pending reading changes that require approval before being applied to ClickHouse._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/metering/reading/{meter_id}/{counter_id}/changesets` | `getReadingChangesets` | List pending reading changesets for a counter |
| `PATCH` | `/v1/metering/reading/{meter_id}/{counter_id}/changesets/{changeset_id}` | `updateReadingChangeset` | Edit a pending reading changeset |
| `POST` | `/v1/metering/reading/{meter_id}/{counter_id}/changesets/{changeset_id}:apply` | `applyReadingChangeset` | Apply (approve) a pending reading changeset |
| `POST` | `/v1/metering/reading/{meter_id}/{counter_id}/changesets/{changeset_id}:dismiss` | `dismissReadingChangeset` | Dismiss (reject) a pending reading changeset |

---

_Generiert aus der OpenAPI-Spec von `metering-client` (@epilot Client 0.10.0). Nicht von Hand bearbeiten._
