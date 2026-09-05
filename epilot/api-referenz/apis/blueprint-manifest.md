# Blueprint Manifest API

> Slug `blueprint-manifest` · OpenAPI-Version `4.8.0` · 73 Operationen

Service to create and install Blueprint Manifest files

## Zugriff

| | |
| --- | --- |
| Base URL | `https://blueprint-manifest.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/blueprint-manifest.yaml |
| Docs | https://docs.epilot.io/api/blueprint-manifest |
| SDK | `epilot.blueprintManifest` aus `@epilot/sdk/blueprint-manifest` (Einzelpaket: `@epilot/blueprint-manifest-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### Jobs

_Manage Export and Import Jobs_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/blueprint-manifest/jobs/{job_id}` | `getJob` | **deprecated** · Get the current status of a blueprint (export or import) |
| `GET` | `/v2/blueprint-manifest/jobs` | `listBlueprintJobs` | List all blueprint jobs |
| `GET` | `/v2/blueprint-manifest/jobs/{job_id}` | `getBlueprintJob` | Poll the current state of a job. |
| `POST` | `/v2/blueprint-manifest/jobs/{job_id}:cancel` | `cancelBlueprintJob` | Cancel a blueprint job if it is still running. |
| `POST` | `/v2/blueprint-manifest/jobs/{job_id}:continue` | `continueInstallationJob` | Resume an installation job that is paused at `status: "WAITING_USER_ACTION"` after |
| `POST` | `/v2/blueprint-manifest/jobs/{job_id}:retry` | `retryInstallationJob` | Retry a finished V3 installation job whose status is `FAILED` or |

### Export

_Export a Blueprint Manifest_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/blueprint-manifest/jobs/{job_id}:exportManifest` | `exportManifest` | **deprecated** · Triggers exporting a manifest file using selected resoruce ids for a job created with `createExportJob` |
| `POST` | `/v1/blueprint-manifest/jobs:createExport` | `createExport` | **deprecated** · Creates a new Export Job with a list of available resources to export from the passed root resource. |

### Import

_Install or update a Blueprint Manifest_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/blueprint-manifest/jobs/{job_id}:applyPlan` | `applyPlan` | **deprecated** · Apply a plan returned by `createPlan`. |
| `POST` | `/v1/blueprint-manifest/jobs:createPlan` | `createPlan` | **deprecated** · Creates a new import job from an uploaded manifest file and returns the plan. |
| `POST` | `/v1/blueprint-manifest:uploadManifest` | `uploadManifest` | Create pre-signed S3 URL to upload a manifest file. |

### Manifests

_Manage installed Manifests_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/blueprint-manifest/manifests` | `listInstalledManifests` | **deprecated** · List Blueprint Manifests installed to the organization |
| `DELETE` | `/v1/blueprint-manifest/manifests/{manifest_id}` | `deleteManifest` | **deprecated** · Remove installed manifest from the org |
| `GET` | `/v1/blueprint-manifest/manifests/{manifest_id}` | `getManifest` | **deprecated** · Get installed Manifest by ID |
| `PUT` | `/v1/blueprint-manifest/manifests/{manifest_id}` | `updateManifest` | **deprecated** · Update an installed manifest |

### Blueprints

_Manage Custom and Installed Blueprints_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v2/blueprint-manifest/blueprint:install` | `installBlueprint` | **deprecated** · Kick off a new blueprint installation job. |
| `GET` | `/v2/blueprint-manifest/blueprints` | `listBlueprints` | List Custom and Installed Blueprints |
| `POST` | `/v2/blueprint-manifest/blueprints` | `createBlueprint` | Create a Blueprint |
| `DELETE` | `/v2/blueprint-manifest/blueprints/{blueprint_id}` | `deleteBlueprint` | Delete a Blueprint |
| `GET` | `/v2/blueprint-manifest/blueprints/{blueprint_id}` | `getBlueprint` | Get Blueprint by ID |
| `PUT` | `/v2/blueprint-manifest/blueprints/{blueprint_id}` | `updateBlueprint` | Update a Blueprint |
| `POST` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/notes` | `addBlueprintNote` | Append an internal note to a blueprint. |
| `DELETE` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/notes/{note_id}` | `deleteBlueprintNote` | Remove a single internal note from a blueprint. |
| `PATCH` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/notes/{note_id}` | `updateBlueprintNote` | Rewrite the text of an existing internal note. |
| `POST` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/resources` | `addBlueprintResource` | Add a resource to a Blueprint |
| `DELETE` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/resources/bulk` | `bulkDeleteBlueprintResources` | Bulk delete resources in a Blueprint |
| `POST` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/resources/bulk` | `bulkAddBlueprintResources` | Bulk Add resources in a Blueprint |
| `PUT` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/resources/bulk` | `bulkUpdateBlueprintResources` | Bulk update resources in a Blueprint |
| `DELETE` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/resources/{resource_id}` | `deleteBlueprintResource` | Delete a resource from a Blueprint |
| `PUT` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/resources/{resource_id}` | `updateBlueprintResource` | Update a resource in a Blueprint |
| `POST` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/resources:syncDependencies` | `syncDependencies` | Sync dependencies of all root resources in a Blueprint |
| `POST` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/validate` | `validateBlueprint` | **deprecated** · Start a blueprint validation job. |
| `POST` | `/v2/blueprint-manifest/blueprints/{blueprint_id}:export` | `exportBlueprint` | **deprecated** · Kick off a new blueprint export job. |
| `POST` | `/v2/blueprint-manifest/blueprints/{blueprint_id}:format-description` | `formatBlueprintDescription` | Format a blueprint description as markdown using AI. |
| `POST` | `/v2/blueprint-manifest/blueprints/{blueprint_id}:verify` | `verifyBlueprint` | Start a blueprint verification job. |
| `GET` | `/v2/blueprint-manifest/blueprints:marketplace` | `listInstalledMarketplaceBlueprints` | List installed Marketplace Blueprints for the organization. |
| `POST` | `/v2/blueprint-manifest/blueprints:pre-install` | `preInstallBlueprint` | Pre-install a Blueprint based on a blueprint file. |
| `GET` | `/v2/blueprint-manifest/blueprints:preview/{preview_id}` | `getBlueprintPreview` | Get Blueprint Preview by ID |
| `POST` | `/v2/blueprint-manifest/blueprints:publish` | `publishBlueprint` | Publish a blueprint to the marketplace. |
| `POST` | `/v2/blueprint-manifest/blueprints:suggest-resources` | `suggestBlueprintResources` | Suggest resources to add to a blueprint based on a natural-language prompt. |
| `GET` | `/v2/blueprint-manifest/marketplace/slugs` | `listMarketplaceSlugs` | List all available marketplace blueprint slugs from Webflow CMS. |
| `POST` | `/v3/blueprint-manifest/blueprint:install` | `installBlueprintV3` | Install a blueprint into a single destination org using the V3 engine (direct API |
| `GET` | `/v3/blueprint-manifest/blueprints/{blueprint_id}/deployments/{job_id}/health-report` | `getDeploymentHealthReportV3` | Returns the most recent health report produced for this deployment |
| `GET` | `/v3/blueprint-manifest/blueprints/{blueprint_id}/deployments/{job_id}/restore-preview` | `getRestorePreview` | Computes what would happen if the user triggered a restore on this |
| `POST` | `/v3/blueprint-manifest/blueprints/{blueprint_id}/deployments/{job_id}:health-check` | `triggerDeploymentHealthCheckV3` | Starts a read-only health scan of the resources this deployment's |
| `POST` | `/v3/blueprint-manifest/blueprints/{blueprint_id}/deployments/{job_id}:restore` | `restoreBlueprintDeploymentV3` | Roll a deployment back to its pre-install state. |
| `GET` | `/v3/blueprint-manifest/blueprints/{blueprint_id}/lineage` | `getBlueprintLineageV3` | Returns the lineage registry entries for a blueprint's resources in the current org. |
| `POST` | `/v3/blueprint-manifest/blueprints/{blueprint_id}:publish` | `publishBlueprintV3` | Starts an asynchronous V3 publication. |
| `POST` | `/v3/blueprint-manifest/blueprints:pre-install` | `preInstallBlueprintV3` | Validates a signed V3 package and returns the destination-specific resource plan used by the install UI. |
| `POST` | `/v3/blueprint-manifest/bulk-installs` | `createBulkInstallV3` | Install one source blueprint into many destination organizations in a single |
| `GET` | `/v3/blueprint-manifest/bulk-installs/{bulk_job_id}` | `getBulkInstallV3` | Returns the bulk install parent with aggregate status and counts. |
| `GET` | `/v3/blueprint-manifest/bulk-installs/{bulk_job_id}/targets` | `listBulkInstallTargetsV3` | Pages through the bulk install's target rows. |
| `POST` | `/v3/blueprint-manifest/bulk-installs/{bulk_job_id}/targets/{destination_org_id}:retry` | `retryBulkInstallTargetV3` | Retries a single failed target. |

### Marketplace Listings

_Manage marketplace listings for blueprints_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/blueprints/{blueprint_id}/marketplace-listing` | `getMarketplaceListing` | Get marketplace listing for a blueprint including all versions |
| `POST` | `/v1/blueprints/{blueprint_id}/marketplace-listing` | `createMarketplaceListing` | Create a marketplace listing for a blueprint. |
| `GET` | `/v1/marketplace-listings` | `listMarketplaceListings` | List all marketplace listings for the authenticated organization |
| `DELETE` | `/v1/marketplace-listings/{listing_id}` | `deleteMarketplaceListing` | Delete listing and all versions |
| `GET` | `/v1/marketplace-listings/{listing_id}` | `getMarketplaceListingById` | Get marketplace listing by listing ID including all versions |
| `PATCH` | `/v1/marketplace-listings/{listing_id}` | `updateMarketplaceListing` | Update listing-level fields |

### Marketplace Listing Versions

_Manage versions for marketplace listings_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/marketplace-listings/{listing_id}/versions` | `listMarketplaceListingVersions` | List all versions for a listing, newest first |
| `POST` | `/v1/marketplace-listings/{listing_id}/versions` | `createMarketplaceListingVersion` | Create a draft version; auto-snapshots resources, requiredFeatures, recommendedApps from current blueprint |
| `PATCH` | `/v1/marketplace-listings/{listing_id}/versions/{version_id}` | `updateMarketplaceListingVersion` | Update updateNote, requiredFeatures, or recommendedApps on a draft version |
| `POST` | `/v1/marketplace-listings/{listing_id}/versions/{version_id}/publish` | `publishMarketplaceListingVersion` | Publish a draft version; archives the previous live version |

### Patches

_Manage blueprint patches for mass rollouts_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/patches` | `listPatches` | **deprecated** · List all patches for a blueprint. |
| `POST` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/patches` | `createPatch` | **deprecated** · Create a new patch for a blueprint. |
| `GET` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/patches/{patch_id}` | `getPatch` | **deprecated** · Get a patch by ID, including per-org execution results. |
| `POST` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/patches/{patch_id}/orgs/{org_id}:retry` | `retryPatchOrg` | **deprecated** · Retry a failed patch execution for a specific org. |
| `POST` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/patches/{patch_id}:apply` | `applyPatch` | **deprecated** · Apply a patch to a single destination org. |
| `POST` | `/v2/blueprint-manifest/blueprints/{blueprint_id}/patches:detect` | `detectPatchChanges` | **deprecated** · Detect changes between the current state of a blueprint's resources and its tfstate baseline. |

### Uniqueness Criteria

_Configure per-org field sets used to match existing resources during install_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/blueprint-manifest/uniqueness-criteria` | `listUniquenessCriteria` | List all custom uniqueness criteria configured for the caller's organization. |
| `DELETE` | `/v1/blueprint-manifest/uniqueness-criteria/{resource_type}` | `deleteUniquenessCriteria` | Remove the custom criteria for a resource type, reverting to the default fields. |
| `GET` | `/v1/blueprint-manifest/uniqueness-criteria/{resource_type}` | `getUniquenessCriteria` | Get the configured uniqueness criteria for a specific resource type, if any. |
| `PUT` | `/v1/blueprint-manifest/uniqueness-criteria/{resource_type}` | `putUniquenessCriteria` | Set or replace the uniqueness criteria for a resource type. |

---

_Generiert aus der OpenAPI-Spec von `blueprint-manifest-client` (@epilot Client 5.6.0). Nicht von Hand bearbeiten._
