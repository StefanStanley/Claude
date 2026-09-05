# File API

> Slug `file` · OpenAPI-Version `1.13.0` · 37 Operationen

The File API enables you to upload, store, manage, and share files within the epilot platform.

## Key Features
- **Upload files** to temporary storage and save them permanently as File entities
- **Generate previews** (thumbnails) for images and documents
- **Create public links** to share private files externally
- **Organize files** into collections for better management
- **Version control** with automatic file versioning on updates

## File Upload Workflow
1. Call `uploadFileV2` to get a pre-signed S3 URL
2. Upload your file directly to S3 using the pre-signed URL (PUT request)
3. Call `saveFileV2` with the S3 reference to create a permanent File entity

## Changelog
<a href="changelog">View API Changelog</a>

## Zugriff

| | |
| --- | --- |
| Base URL | `https://file.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/file.yaml |
| Docs | https://docs.epilot.io/api/file |
| SDK | `epilot.file` aus `@epilot/sdk/file` (Einzelpaket: `@epilot/file-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `CookieAuth` (apiKey)

## Endpunkte

### File

_Core file operations for uploading, saving, retrieving, and deleting files._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/files/download:verify` | `verifyCustomDownloadUrl` | Verify that a custom download URL is valid and has not expired. |
| `POST` | `/v1/files/public/upload` | `uploadFilePublic` | Create a pre-signed S3 URL for uploading a file without authentication. |
| `GET` | `/v1/files/{id}/download` | `downloadFile` | Generate a pre-signed download URL for a file. |
| `GET` | `/v1/files/{id}/summary` | `getFileSummary` | Get summary text for a file entity together with the current summary job status when available. |
| `POST` | `/v1/files/{id}/summary-jobs` | `createFileSummaryJob` | Create or return the current AI summary job for a file entity. |
| `GET` | `/v1/files/{id}/summary-jobs/current` | `getCurrentFileSummaryJob` | Get the latest AI summary job for the file entity's current source. |
| `GET` | `/v1/files/{id}/summary-jobs/{job_id}` | `getFileSummaryJob` | Get an AI summary job by id. |
| `GET` | `/v1/files/{id}/summary/feedback` | `getFileSummaryFeedback` | Get file summary feedback |
| `PUT` | `/v1/files/{id}/summary/feedback` | `putFileSummaryFeedback` | Submit file summary feedback |
| `POST` | `/v1/files/{id}/summary:generate` | `generateFileSummary` | Compatibility alias for creating or returning the current AI summary job for a file entity. |
| `GET` | `/v1/files/{id}/text` | `getFileText` | Get the plain-text representation of a file entity. |
| `POST` | `/v1/files:downloadFiles` | `downloadFiles` | Bulk generate pre-signed download URLs for multiple files in a single request. |
| `POST` | `/v1/files:downloadS3` | `downloadS3File` | Generate a pre-signed download URL for a file using its S3 reference. |
| `POST` | `/v1/files:zipJob` | `createZipJob` | Create a background job to ZIP multiple files and send a download link via email. |
| `GET` | `/v1/files:zipJob/{job_id}` | `getZipJob` | Get the status of a ZIP job |
| `POST` | `/v2/files` | `saveFileV2` | Saves a permanent file entity. |
| `POST` | `/v2/files/upload` | `uploadFileV2` | Create pre-signed S3 URL to upload a file to keep temporarily (one week). |
| `DELETE` | `/v2/files/{id}` | `deleteFile` | Delete a file entity by id |
| `GET` | `/v2/files/{id}` | `getFile` | Get a file entity by id |

### Preview

_Generate thumbnail previews for files. Supports images, PDFs, and common document formats._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/files/public/{id}/preview` | `previewPublicFile` | Generate a thumbnail preview for a public file entity. |
| `GET` | `/v1/files/{id}/preview` | `previewFile` | Generate a thumbnail preview for a file entity. |
| `GET` | `/v1/files:previewS3` | `previewS3FileGet` | Get a thumbnail preview from an S3 reference using query parameters. |
| `POST` | `/v1/files:previewS3` | `previewS3File` | Generate a thumbnail preview from an S3 reference. |

### Public Links

_Create shareable public links for private files._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `DELETE` | `/v1/files/public/links/{id}` | `revokePublicLink` | Revokes a given public link by ID |
| `GET` | `/v1/files/public/links/{id}/{filename}` | `accessPublicLink` | Access a file via its public link. |
| `GET` | `/v1/files/{id}/public/links` | `listPublicLinksForFile` | Fetches all public links previously generated for a file |
| `POST` | `/v1/files/{id}/public/links` | `generatePublicLink` | Generate a public link to share a private file externally. |

### Session

_Browser session management for cookie-based authentication._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `DELETE` | `/v1/files/session` | `deleteSession` | End a browser session by deleting the token cookie. |
| `GET` | `/v1/files/session` | `getSession` | Start a browser session by converting a Bearer token into a server-side cookie. |

### Deprecated

_Legacy API endpoints scheduled for removal._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/files` | `saveFile` | **deprecated** · **DEPRECATED** - Will be removed on **2025-06-30**. |
| `POST` | `/v1/files/upload` | `uploadFile` | **deprecated** · **DEPRECATED** - Will be removed on **2025-06-30**. |

### File Collections

_Organize files into collections (folders) for better management._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/collections/{schemaSlug}` | `getGlobalFileCollections` | Get all global file collections for a specific schema. |
| `GET` | `/v1/entity/{id}/collections/{collectionSlug}/files` | `getFilesInCollection` | Get all files within a specific collection for an entity. |
| `GET` | `/v1/{slug}/collections` | `getUserSchemaFileCollections` | Get all file collections for the current user within a specific schema. |
| `POST` | `/v1/{slug}/collections` | `createUserSchemaFileCollection` | Create a new file collection for the current user within a specific schema. |
| `DELETE` | `/v1/{slug}/collections/{collectionSlug}` | `deleteUserSchemaFileCollection` | Delete a file collection. |
| `PUT` | `/v1/{slug}/collections/{collectionSlug}` | `updateUserSchemaFileCollection` | Update an existing file collection. |

---

_Generiert aus der OpenAPI-Spec von `file-client` (@epilot Client 1.28.2). Nicht von Hand bearbeiten._
