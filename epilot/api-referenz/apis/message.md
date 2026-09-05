# Message API

> Slug `message` · OpenAPI-Version `1.5.0` · 54 Operationen

Send and receive email messages via your epilot organization

## Zugriff

| | |
| --- | --- |
| Base URL | `https://message.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/message.yaml |
| Docs | https://docs.epilot.io/api/message |
| SDK | `epilot.message` aus `@epilot/sdk/message` (Einzelpaket: `@epilot/message-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### Messages

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/message/messages` | `sendMessage` | Send an email message |
| `PUT` | `/v1/message/messages` | `updateMessage` | Update message metadata |
| `GET` | `/v1/message/messages/unread/{actor}` | `getUnread` | Get all unread messages by actor |
| `DELETE` | `/v1/message/messages/{id}` | `deleteMessage` | Immediately and permanently delete a message. |
| `GET` | `/v1/message/messages/{id}` | `getMessage` | Get an email message by id |
| `GET` | `/v1/message/messages/{id}/eml` | `getMessageEml` | Download a message as an EML file. |
| `POST` | `/v1/message/messages/{id}/read` | `markReadMessage` | Mark message as read |
| `POST` | `/v1/message/messages/{id}/spam` | `spamMessage` | Mark a single message as spam. |
| `POST` | `/v1/message/messages/{id}/trash` | `trashMessage` | Move a message to the trash |
| `POST` | `/v1/message/messages/{id}/unread` | `markUnreadMessage` | Mark message as unread |
| `POST` | `/v1/message/messages/{id}/unspam` | `unspamMessage` | Remove spam marking from a single message. |
| `POST` | `/v1/message/messages/{id}/untrash` | `untrashMessage` | Restore a trashed message |
| `POST` | `/v1/message/messages:search` | `searchMessages` | Search Messages |
| `POST` | `/v1/message/unread:counts` | `getUnreadCounts` | Unread counts for several named scopes in one request. |
| `GET` | `/v2/message/messages/{id}` | `getMessageV2` | - Fetches message by ID |
| `POST` | `/v2/message/messages/{id}/read` | `markReadMessageV2` | Mark message as read within a scope |
| `POST` | `/v2/message/messages/{id}/unread` | `markUnreadMessageV2` | Mark message as unread within a scope |

### Threads

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `PUT` | `/v1/message/threads` | `updateThread` | Modify thread metadata |
| `POST` | `/v1/message/threads/bulk:assign` | `bulkAssignThreads` | Assign many threads |
| `POST` | `/v1/message/threads/bulk:delete` | `threadBulkActionsDelete` | Performs a bulk permanent delete for all threads |
| `POST` | `/v1/message/threads/bulk:done` | `threadBulkActionsDone` | Perform a bulk action of marking an array of threads as done |
| `POST` | `/v1/message/threads/bulk:favorite` | `threadBulkActionsFavorite` | Perform a bulk action of marking an array of thread ids favorite |
| `POST` | `/v1/message/threads/bulk:move` | `bulkMoveThreads` | Move many threads to a different inbox |
| `POST` | `/v1/message/threads/bulk:open` | `threadBulkActionsOpen` | Perform a bulk action of marking an array of threads as open |
| `POST` | `/v1/message/threads/bulk:read` | `threadBulkActionsRead` | Perform a bulk action of marking an array of thread ids as read |
| `POST` | `/v1/message/threads/bulk:trash` | `threadBulkActionsTrash` | Perform a bulk action of trashing an array of threads |
| `POST` | `/v1/message/threads/bulk:unfavorite` | `threadBulkActionsUnfavorite` | Perform a bulk action of marking an array of thread ids unfavorited |
| `POST` | `/v1/message/threads/bulk:unread` | `threadBulkActionsUnread` | Perform a bulk action of marking an array of thread ids as unread |
| `POST` | `/v1/message/threads/bulk:untrash` | `threadBulkActionsUntrash` | Perform a bulk action of untrashing an array of threads |
| `DELETE` | `/v1/message/threads/{id}` | `deleteThread` | Immediately and permanently delete a thread. |
| `POST` | `/v1/message/threads/{id}/assign` | `assignThread` | Assign thread to entities |
| `POST` | `/v1/message/threads/{id}/assign:users` | `assignUsers` | Assign users to thread for receiving notifications. |
| `POST` | `/v1/message/threads/{id}/read` | `markReadThread` | Mark thread as read |
| `POST` | `/v1/message/threads/{id}/spam` | `spamThread` | Mark a thread as spam |
| `GET` | `/v1/message/threads/{id}/timeline` | `getThreadTimeline` | Get thread timeline |
| `POST` | `/v1/message/threads/{id}/trash` | `trashThread` | Move a thread to trash |
| `POST` | `/v1/message/threads/{id}/unassign` | `unassignThread` | Unassign thread from entities |
| `POST` | `/v1/message/threads/{id}/unread` | `markUnreadThread` | Mark thread as unread |
| `POST` | `/v1/message/threads/{id}/unspam` | `unspamThread` | Remove spam marking from a thread |
| `POST` | `/v1/message/threads/{id}/untrash` | `untrashThread` | Restore a trashed thread |
| `POST` | `/v1/message/threads/{id}:markAsDone` | `markThreadAsDone` | Mark thread as done |
| `POST` | `/v1/message/threads/{id}:markAsOpen` | `markThreadAsOpen` | Mark thread as open |
| `POST` | `/v1/message/threads/{id}:move` | `moveThread` | Move thread to a different Inbox |
| `DELETE` | `/v1/message/threads/{id}:pin` | `unpinThread` | Unpin a single thread |
| `POST` | `/v1/message/threads/{id}:pin` | `pinThread` | Pin a single thread |
| `POST` | `/v1/message/threads:search` | `searchThreads` | Search for threads of email messages. |
| `POST` | `/v1/message/threads:searchIds` | `searchIds` | Search threads and return all id's |
| `POST` | `/v2/message/threads/{id}/assign:users` | `assignUsersV2` | Assign users to thread. |
| `POST` | `/v2/message/threads/{id}/read` | `markReadThreadV2` | Mark thread as read within a scope |
| `POST` | `/v2/message/threads/{id}/unread` | `markUnreadThreadV2` | Mark thread as unread within a scope |
| `POST` | `/v2/message/threads:search` | `searchThreadsV2` | Search for threads of email messages. |
| `POST` | `/v2/message/threads:workload` | `getAssigneeWorkload` | Return the open-thread workload for a set of user ids. |

### Drafts

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/message/drafts` | `createDraft` | Create a new draft |
| `POST` | `/v1/message/drafts:send` | `sendDraft` | Send the existing draft to the recipients |

---

_Generiert aus der OpenAPI-Spec von `message-client` (@epilot Client 1.30.0). Nicht von Hand bearbeiten._
