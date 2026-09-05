# Notes API

> Slug `notes` · OpenAPI-Version `2.6.0` · 14 Operationen

Facade API Backend for Epilot Notes feature

## Zugriff

| | |
| --- | --- |
| Base URL | `https://notes.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/notes.yaml |
| Docs | https://docs.epilot.io/api/notes |
| SDK | `epilot.notes` aus `@epilot/sdk/notes` (Einzelpaket: `@epilot/notes-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### Notes

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/note` | `createNote` | Creates a new Note entry |
| `DELETE` | `/v1/note/{id}` | `deleteNote` | Deletes a single Note entry based on it's Entity ID |
| `GET` | `/v1/note/{id}` | `getNote` | Retrieves a single Note entry based on it's Entity ID |
| `PATCH` | `/v1/note/{id}` | `patchNote` | Updates an existing Note entry |
| `PUT` | `/v1/note/{id}` | `updateNote` | Updates an existing Note entry |
| `GET` | `/v1/note/{id}/context` | `getNoteContexts` | Gets all the Entity and non-Entity records the Note is contextually attached to |
| `GET` | `/v1/notes/{entity_id}` | `getNotesByContext` | **deprecated** · Given a `context_type`, returns a list of Notes that belong to that context within the specified `id`. |
| `POST` | `/v1/notes:search` | `searchNotesByContext` | Search for a paginated list of Notes based on one or more contexts |

### Pinning

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/note/{id}/pin` | `pinNote` | Pins a single Note entry based on it's Entity ID |

### Reactions

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/note/{id}/reaction` | `addNoteReaction` | Adds an emoji reaction to a note |
| `DELETE` | `/v1/note/{id}/reaction/{emoji_shortcode}` | `removeNoteReaction` | Removes an emoji reaction from a note |
| `POST` | `/v1/note/{id}/reactions/toggle` | `toggleNoteReactions` | Toggles multiple emoji reactions on a note. |

### Archive

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/note/{id}/archive` | `archiveNote` | Archives a root Note entry by setting its `_archived_at` timestamp to the current server time. |
| `POST` | `/v1/note/{id}/unarchive` | `unarchiveNote` | Unarchives a root Note entry by clearing its `_archived_at` value. |

---

_Generiert aus der OpenAPI-Spec von `notes-client` (@epilot Client 0.23.1). Nicht von Hand bearbeiten._
