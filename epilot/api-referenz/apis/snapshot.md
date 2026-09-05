# Snapshot API

> Slug `snapshot` · OpenAPI-Version `0.1.0` · 12 Operationen

Point-in-time backups of epilot configuration with restore.

Provides a safety net for configuration changes: every blueprint install,
every Configuration Hub sync, and every manual config change can be preceded
by a snapshot — giving operators a rollback point if something breaks.

See `docs/rfcs/RFC-snapshot-api.md` in the `blueprint-manifest-api` repo
for the full design.

## Zugriff

| | |
| --- | --- |
| Base URL | `https://snapshot.sls.epilot.io` <br> `https://snapshot.dev.sls.epilot.io` <br> `https://snapshot.staging.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/snapshot-api.yaml |
| Docs | https://docs.epilot.io/api/snapshot |
| SDK | `epilot.snapshot` aus `@epilot/sdk/snapshot` (Einzelpaket: `@epilot/snapshot-client`) |

**Security Schemes:** `EpilotAuth` (apiKey, Header `Authorization`)

## Endpunkte

### Snapshots

_Snapshot CRUD and restore operations_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/snapshots` | `listSnapshots` | List snapshots for the caller's organization, newest first. |
| `POST` | `/v1/snapshots` | `createSnapshot` | Create a new snapshot of the given resources. |
| `DELETE` | `/v1/snapshots/{id}` | `deleteSnapshot` | Delete a snapshot's metadata and S3 manifest. |
| `GET` | `/v1/snapshots/{id}` | `getSnapshot` | Fetch a snapshot's metadata. |
| `GET` | `/v1/snapshots/{id}/resources` | `listSnapshotResources` | List the resources captured in this snapshot. |
| `GET` | `/v1/snapshots/{id}/resources/{lineage_id}` | `getSnapshotResource` | Fetch one captured resource with its full payload. |
| `POST` | `/v1/snapshots/{id}:restore` | `restoreSnapshot` | Restore a snapshot to the org. |
| `POST` | `/v1/snapshots:capture-org` | `captureOrgSnapshot` | Snapshot the caller's whole organization now. |
| `POST` | `/v1/snapshots:list-dependencies` | `listDependencies` | Walk the dependency tree for a set of resources and return the full |

### ScheduledSnapshots

_Enrollment and configuration for scheduled org snapshots_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `DELETE` | `/v1/org-snapshot-schedule` | `deleteOrgSnapshotSchedule` | Remove the scheduled-snapshot enrollment for the caller's org. |
| `GET` | `/v1/org-snapshot-schedule` | `getOrgSnapshotSchedule` | Return the scheduled-snapshot enrollment config for the caller's org. |
| `PUT` | `/v1/org-snapshot-schedule` | `putOrgSnapshotSchedule` | Create or update the scheduled-snapshot enrollment config for the |

---

_Generiert aus der OpenAPI-Spec von `snapshot-client` (@epilot Client 0.2.0). Nicht von Hand bearbeiten._
