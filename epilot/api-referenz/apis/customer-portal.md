# Portal API

> Slug `customer-portal` · OpenAPI-Version `1.0.0` · 167 Operationen

Backend for epilot portals - End Customer Portal & Installer Portal

## Zugriff

| | |
| --- | --- |
| Base URL | `https://customer-portal-api.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/customer-portal.yaml |
| Docs | https://docs.epilot.io/api/customer-portal |
| SDK | `epilot.customerPortal` aus `@epilot/sdk/customer-portal` (Einzelpaket: `@epilot/customer-portal-client`) |

**Security Schemes:** `PortalAuth` (http/bearer), `EpilotAuth` (http/bearer), `EitherAuth` (http/bearer), `AsOrganization` (apiKey, Header `x-ivy-org-id`), `ExternalOIDCAuth` (http/bearer)

## Endpunkte

### ECP

_APIs defined for a portal user_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/portal/exports` | `createExport` | Request an asynchronous CSV export of the portal user's entities for one schema. |
| `GET` | `/v1/portal/exports/{jobId}` | `getExport` | Get the status of an export job, including the download URL once ready. |
| `GET` | `/v2/portal/automation-context` | `getAutomationContext` | Retrieves the automation context. |
| `GET` | `/v2/portal/billing/events` | `getBillingEvents` | Fetch billing events for a portal user |
| `PUT` | `/v2/portal/campaign/{campaign_id}/entity:status` | `updateCampaignPortalBlockStatus` | Updates the status of a campaign portal block for multiple recipients. |
| `GET` | `/v2/portal/config/triggered-journeys/{trigger_name}` | `getTriggeredJourney` | Returns the auto-triggered journey configured for the given trigger |
| `GET` | `/v2/portal/consumption` | `getConsumption` | Get energy consumption data between a given time period. |
| `GET` | `/v2/portal/contact` | `getContact` | Retrieves the contact of the logged in user. |
| `PATCH` | `/v2/portal/contact` | `updateContact` | **deprecated** · Updates the contact details. |
| `GET` | `/v2/portal/contract` | `getAllContracts` | **deprecated** · Get all contracts for a portal user. |
| `POST` | `/v2/portal/contract/by-identifiers` | `addContractByIdentifiers` | Self-assign contract(s) by pre-configured identifiers. |
| `GET` | `/v2/portal/contract/{id}` | `getContract` | **deprecated** · Get a contract by id. |
| `PATCH` | `/v2/portal/contract/{id}` | `updateContract` | **deprecated** · Update a contract by id. |
| `POST` | `/v2/portal/contract/{id}/resolve-templates` | `getContractWithTemplates` | Resolve Handlebars templates against a contract's related meters and return the contract with templates_output populated per meter. |
| `GET` | `/v2/portal/costs` | `getCosts` | Get energy cost data between a given time period. |
| `GET` | `/v2/portal/engagement/tasks` | `getOutstandingTasks` | Get outstanding workflow tasks for the portal user |
| `GET` | `/v2/portal/entities-by-payment/{id}` | `searchPaymentRelationsInEntities` | Search for entities that have the payment relation with the given payment id |
| `POST` | `/v2/portal/entities/workflows/linearized/batch` | `getEntityPortalWorkflowsBatch` | Batch variant of `getEntityPortalWorkflows`: returns portal-relevant workflows for |
| `PUT` | `/v2/portal/entity/activity` | `createCustomEntityActivity` | Create a custom activity that can be displayed in activity feed of an entity. |
| `DELETE` | `/v2/portal/entity/file` | `deleteEntityFile` | Delete files from an entity |
| `POST` | `/v2/portal/entity/file` | `saveEntityFile` | Add files to an entity |
| `POST` | `/v2/portal/entity/{schema}/access` | `triggerEntityAccessEvent` | Trigger entity access event for a portal user |
| `POST` | `/v2/portal/entity/{slug}` | `createPortalUserEntity` | **deprecated** · **EXPERIMENTAL — do not rely on this endpoint.** It is unstable, currently limited to the `asset` schema, and may change or be removed without notice; third… |
| `PATCH` | `/v2/portal/entity/{slug}/{id}` | `patchPortalUserEntity` | **deprecated** · **EXPERIMENTAL — do not rely on this endpoint.** It is unstable, currently limited to the `asset` schema, and may change or be removed without notice; third… |
| `GET` | `/v2/portal/entity/{slug}/{id}/workflows` | `getEntityWorkflows` | Get all workflows associated with an entity (requires access to the entity) |
| `GET` | `/v2/portal/entity/{slug}/{id}/workflows/linearized` | `getEntityPortalWorkflows` | Get all portal-relevant workflows associated with an entity (requires access to the entity), |
| `POST` | `/v2/portal/entity:get` | `getPortalUserEntity` | Get a single entity for a portal user |
| `POST` | `/v2/portal/entity:search` | `searchPortalUserEntities` | Search all entities of a portal user |
| `POST` | `/v2/portal/metering/reading` | `createMeterReading` | Inserts a new meter reading. |
| `GET` | `/v2/portal/metering/reading/allowed-range/{meter_id}` | `getAllowedMeterReadingRange` | Get allowed reading range for all counters of a meter from the configured |
| `POST` | `/v2/portal/metering/reading/photo` | `uploadMeterReadingPhoto` | Uploads a Meter Reading photo and - if enabled - gives back data extracted from the photo. |
| `POST` | `/v2/portal/metering/readings` | `getMeterReadings` | Fetches meter readings for a counter and optionally resolves Handlebars |
| `GET` | `/v2/portal/notifications` | `listPortalNotifications` | Lists the 360 notifications addressed to the authenticated portal user, newest first. |
| `PUT` | `/v2/portal/notifications/entity:status` | `updateNotificationsStatus` | Updates the statuses of multiple notifications at once. |
| `PUT` | `/v2/portal/notifications/read-all` | `markAllPortalNotificationsRead` | Marks all notifications of the authenticated portal user as read. |
| `GET` | `/v2/portal/notifications/unread-count` | `getPortalNotificationsUnreadCount` | Returns the number of unread notifications for the authenticated portal user. |
| `PUT` | `/v2/portal/notifications/{id}/read` | `markPortalNotificationRead` | Marks a single notification of the authenticated portal user as read. |
| `POST` | `/v2/portal/opportunities/search` | `getSearchResultsForOpportunities` | **deprecated** · Get all opportunity with the given searched attributes. |
| `GET` | `/v2/portal/opportunities/searchable-attributes` | `getSearchableAttributesForOpportunities` | **deprecated** · Get all opportunity searchable attributes for a portal user. |
| `GET` | `/v2/portal/opportunities/{id}` | `getOpportunity` | **deprecated** · Get an opportunity by id. |
| `PATCH` | `/v2/portal/opportunities/{id}` | `updateOpportunity` | **deprecated** · Update an opportunity by id. |
| `GET` | `/v2/portal/opportunity` | `getAllOpportunities` | **deprecated** · Get all opportunities of a portal user. |
| `GET` | `/v2/portal/order` | `getAllOrders` | **deprecated** · Get all orders for the portal user. |
| `GET` | `/v2/portal/order/{id}` | `getOrder` | **deprecated** · Get an order by id. |
| `PATCH` | `/v2/portal/order/{id}` | `updateOrder` | **deprecated** · Update an order by id. |
| `POST` | `/v2/portal/order/{id}/acceptance` | `postOrderAcceptance` | Accept/decline an offer by id |
| `GET` | `/v2/portal/org/settings` | `getOrganizationSettings` | **deprecated** · Retrieves the organization settings. |
| `GET` | `/v2/portal/pages` | `getPortalPages` | Fetch all portal pages |
| `GET` | `/v2/portal/pages/{id}` | `getPortalPage` | Fetch a portal page by id |
| `GET` | `/v2/portal/pages/{id}/blocks` | `getPortalPageBlocks` | Fetch all portal page blocks |
| `GET` | `/v2/portal/pages/{id}/blocks/{block_id}` | `getPortalPageBlock` | Fetch a portal page block by id |
| `GET` | `/v2/portal/prices` | `getPrices` | Get energy prices data between a given time period. |
| `POST` | `/v2/portal/proxy/execute` | `portalProxyExecute` | Execute an Integration Hub managed-call use case on behalf of a portal user. |
| `GET` | `/v2/portal/request` | `getAllRequests` | **deprecated** · Get all opportunities & orders of a portal user. |
| `GET` | `/v2/portal/resolve:seamless-link` | `getResolvedSeamlessLink` | Retrieves a resolved seamless portal link. |
| `GET` | `/v2/portal/schemas` | `getSchemas` | Retrieves the schemas. |
| `POST` | `/v2/portal/token/revoke` | `revokeToken` | Revokes all of the access tokens for the given Refresh Token. |
| `POST` | `/v2/portal/token/validate` | `validateToken` | Validates Portal Token is valid. |
| `DELETE` | `/v2/portal/user` | `deletePortalUser` | Delete the portal user |
| `GET` | `/v2/portal/user` | `getPortalUser` | Get the portal user details |
| `PATCH` | `/v2/portal/user` | `updatePortalUser` | Update the portal user details |
| `PUT` | `/v2/portal/user/change/password` | `changePortalUserPassword` | Hand over a password change to the third-party system configured via the `changePassword` portal extension hook. |
| `GET` | `/v2/portal/user/file/{id}` | `getFileById` | **deprecated** · Fetch a document with ID. |
| `POST` | `/v2/portal/user/file/{id}/downloaded` | `trackFileDownloaded` | Track that user has downloaded a file |
| `GET` | `/v2/portal/user/file/{id}/preview` | `getFilePreview` | resolves an in-portal preview for a file. |
| `GET` | `/v2/portal/user/files` | `getAllFiles` | **deprecated** · Fetch all documents under the related entities of a contact. |
| `GET` | `/v2/portal/user/files/count-by-entity` | `getFilesCountByEntity` | **deprecated** · Fetch file counts for all ECP user related entities |
| `PUT` | `/v2/portal/user/update/email` | `updatePortalUserEmail` | Update portal user email |
| `GET` | `/v2/portal/visualization/metadata` | `getVisualizationMetadata` | Returns runtime metadata describing how a visualization (consumption / price / cost chart) should be rendered for a given portal context (meter, contract, etc). |
| `POST` | `/v2/portal/visualization:export` | `prepareVisualizationExport` | Asks an installed App to prepare a downloadable export of a visualization (consumption chart, dynamic tariff chart, etc.). |
| `PUT` | `/v2/portal/workflow/{workflow_id}/{step_id}:markDone` | `updateWorkflowStepAsDone` | Update a workflow step as done |
| `GET` | `/v2/portal/{slug}/{id}:validateRule` | `validateCadenceEntityEditRules` | Validate if cadence rule is valid for an entity |
| `POST` | `/v3/portal/entity/{schema}/access` | `triggerEntityAccessEventV3` | Trigger entity access event for a portal user. |
| `POST` | `/v3/portal/partner/invite` | `invitePartner` | Invites a partner to a portal |
| `GET` | `/v3/portal/partner/list` | `listBusinessPartners` | Lists all business partners linked to the businessaccount |
| `POST` | `/v3/portal/partner/{partner_id}/disable` | `disablePartner` | Disables a partner from a portal |
| `POST` | `/v3/portal/partner/{partner_id}/enable` | `enablePartner` | Enables a partner from a portal |
| `POST` | `/v3/portal/partner/{partner_id}/resend-invitation` | `resendPartnerInvitation` | Resends an invitation email to a partner |
| `DELETE` | `/v3/portal/partner/{partner_id}/revoke` | `revokePartner` | Revokes a partner from a portal |

### ECP Admin

_APIs defined for a ECP Admin_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/portal/mobile-config` | `getMobileConfig` | Returns the portal's mobile app configuration. |
| `PUT` | `/v1/portal/mobile-config` | `putMobileConfig` | Merges the provided fields into the portal's mobile app configuration |
| `POST` | `/v2/portal/admin:login-as-user` | `loginToPortalAsUser` | Generate a token to log in to a portal impersonating a users. |
| `POST` | `/v2/portal/can-trigger-portal-flow` | `canTriggerPortalFlow` | Returns whether the user can trigger a portal flow |
| `DELETE` | `/v2/portal/config` | `deletePortal` | Deletes the portal. |
| `GET` | `/v2/portal/config` | `getPortalConfig` | Retrieves the portal configuration. |
| `GET` | `/v2/portal/configs` | `getAllPortalConfigs` | Retrieves all portal configurations. |
| `GET` | `/v2/portal/configure-distribution` | `configureDistribution` | Configure the distribution for the portal's custom domain |
| `GET` | `/v2/portal/contact/valid/secondary/attributes` | `getValidSecondaryAttributes` | Get valid secondary attributes that are used while mapping a contact on registration |
| `GET` | `/v2/portal/ecp/contact` | `getECPContact` | Get the Contact by id |
| `GET` | `/v2/portal/email-templates` | `getEmailTemplates` | Retrieves the email templates of a portal |
| `POST` | `/v2/portal/email-templates` | `upsertEmailTemplates` | Upserts the email templates of a portal |
| `GET` | `/v2/portal/entity/identifiers/{slug}` | `getEntityIdentifiers` | Retrieve a list of entity identifiers used for entity search by portal users. |
| `GET` | `/v2/portal/extensions` | `getPortalExtensions` | Retrieves the installed portal extensions. |
| `GET` | `/v2/portal/external-links` | `getExternalLinks` | Retrieves the portal configuration external links. |
| `GET` | `/v2/portal/extra-permission-attributes` | `extraPermissionAttributes` | Retrieves the extra permission attributes. |
| `GET` | `/v2/portal/org/portal/config` | `getOrgPortalConfig` | Retrieves the portal configuration for the organization. |
| `POST` | `/v2/portal/pages` | `createPortalPage` | Create a new portal page |
| `GET` | `/v2/portal/pages/default` | `getDefaultPages` | Fetch all default portal pages |
| `POST` | `/v2/portal/pages/interpolate` | `interpolatePortalPages` | Interpolate template variables in portal pages without reading from the database. |
| `DELETE` | `/v2/portal/pages/{id}` | `deletePortalPage` | Delete a portal page by id |
| `PUT` | `/v2/portal/pages/{id}` | `updatePortalPage` | Update a portal page by id |
| `POST` | `/v2/portal/pages/{id}/blocks` | `createPortalPageBlock` | Create a new portal page block |
| `DELETE` | `/v2/portal/pages/{id}/blocks/{block_id}` | `deletePortalPageBlock` | Delete a portal page block by id |
| `PUT` | `/v2/portal/pages/{id}/blocks/{block_id}` | `updatePortalPageBlock` | Update a portal page block by id |
| `POST` | `/v2/portal/portal` | `upsertPortal` | Upserts the settings for a portal of an organization. |
| `POST` | `/v2/portal/portal/files` | `savePortalFiles` | Add files to portal |
| `POST` | `/v2/portal/recipients-to-notify` | `getRecipientsToNotifyOnAutomation` | Get recipients to notify on automation |
| `GET` | `/v2/portal/registration/identifiers` | `getRegistrationIdentifiers` | Get valid attributes from entities that can be used as identifier to map contact to user on registration |
| `POST` | `/v2/portal/replace-ecp-template-variables` | `replaceECPTemplateVariables` | Replaces the template variables of a portal |
| `GET` | `/v2/portal/resolve:external-link/{id}` | `getResolvedExternalLink` | **deprecated** · Retrieves a resolved portal external link. |
| `POST` | `/v2/portal/user/resend/confirmation-email/{id}` | `resendConfirmationEmail` | Resend confirmation email |
| `GET` | `/v2/portal/users/by-related-entity` | `fetchPortalUsersByRelatedEntity` | Get all users for a given entity |
| `POST` | `/v2/portal/validate/caa-records` | `validateCaaRecords` | Validates the CAA records of a portal |
| `GET` | `/v2/portal/widgets` | `getPortalWidgets` | **deprecated** · Retrieves the widgets of a portal. |
| `POST` | `/v2/portal/widgets` | `upsertPortalWidget` | **deprecated** · Upsert widget for a portal of an organization. |
| `POST` | `/v3/portal/config` | `createPortalConfig` | Creates a new portal configuration. |
| `POST` | `/v3/portal/config/clone` | `clonePortalConfig` | Creates a new portal by cloning configuration and pages from an existing portal. |
| `POST` | `/v3/portal/config/swap` | `swapPortalConfig` | Swaps the portal configuration of two portals. |
| `DELETE` | `/v3/portal/config/{portal_id}` | `deletePortalConfig` | Deletes a specific portal configuration by ID. |
| `GET` | `/v3/portal/config/{portal_id}` | `getPortalConfigV3` | Retrieves a specific portal configuration by ID. |
| `PUT` | `/v3/portal/config/{portal_id}` | `putPortalConfig` | Updates a specific portal configuration by ID. |
| `GET` | `/v3/portal/configs` | `listAllPortalConfigs` | Retrieves all portal configurations. |
| `GET` | `/v3/portal/configure-distribution` | `configureDistributionV3` | Configure the distribution for the portal's custom domain |
| `GET` | `/v3/portal/email-templates/{portal_id}` | `getEmailTemplatesByPortalId` | Retrieves the email templates of a portal by portal ID |
| `POST` | `/v3/portal/email-templates/{portal_id}` | `upsertEmailTemplatesByPortalId` | Upserts the email templates of a portal by portal ID |
| `POST` | `/v3/portal/email-templates:list-references` | `listEmailTemplateReferences` | Read-only sibling of migrateEmailTemplateReferences. |
| `POST` | `/v3/portal/email-templates:migrate-references` | `migrateEmailTemplateReferences` | Walk every email-template config row in the caller's org and re-point any |
| `GET` | `/v3/portal/extensions` | `getPortalExtensionsV3` | Retrieves the installed portal extensions. |
| `GET` | `/v3/portal/external-links` | `getExternalLinksV3` | Retrieves the portal configuration external links. |
| `GET` | `/v3/portal/org/portal/config` | `getOrgPortalConfigV3` | Retrieves the portal configuration for the organization. |
| `POST` | `/v3/portal/portal/files` | `savePortalFilesV3` | Add files to portal by portal_id |
| `GET` | `/v3/portal/resolve:external-link/{id}` | `getResolvedExternalLinkV3` | **deprecated** · Retrieves a resolved portal external link. |
| `POST` | `/v3/portal/validate/caa-records` | `validateCaaRecordsV3` | Validates the CAA records of a portal |
| `POST` | `/v3/portal/verify-dns` | `verifyDns` | Manually triggers DNS verification for a portal's domain setup. |
| `GET` | `/v3/portal/widgets` | `getPortalWidgetsV3` | Retrieves the widgets of a portal by portal_id. |
| `POST` | `/v3/portal/widgets` | `upsertPortalWidgetV3` | Upsert widget for a portal by portal_id. |

### Public

_Public APIs_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/portal/public-widgets` | `getPublicPortalWidgets` | **deprecated** · Retrieves the public widgets of a portal. |
| `GET` | `/v2/portal/public/config` | `getPortalConfigByDomain` | Retrieves the portal configuration by domain. |
| `POST` | `/v2/portal/public/contact/exists` | `checkContactExists` | True if contact with given identifiers exists. |
| `GET` | `/v2/portal/public/extensions` | `getPublicPortalExtensionDetails` | Get public extension details shown to end customers and configuring users. |
| `DELETE` | `/v2/portal/public/m-login/deregister/{client_id}/{user_id}` | `deRegisterMLoginUser` | Deregisters a user from the M Login client |
| `POST` | `/v2/portal/public/m-login/notify-interest-change/{client_id}/{user_id}` | `notifyMLoginInterestChange` | Notifies the interest change of a user in the M Login client |
| `GET` | `/v2/portal/public/org/settings` | `getOrganizationSettingsByDomain` | Retrieves organization settings by domain. |
| `GET` | `/v2/portal/public/pages` | `getPublicPages` | Fetch all public portal pages |
| `GET` | `/v2/portal/public/portal/config` | `getPublicPortalConfig` | Retrieves the public portal configuration. |
| `GET` | `/v2/portal/public/schemas` | `getSchemasByDomain` | Retrieves schemas by domain. |
| `POST` | `/v2/portal/public/sso/callback` | `ssoCallback` | Handles the callback from the external SSO provider, validates the authorization `code` |
| `GET` | `/v2/portal/public/sso/providers/{provider_slug}` | `getSSOProvider` | Returns the public configuration of a single SSO identity provider with env var |
| `POST` | `/v2/portal/public/sso/redirect` | `ssoRedirect` | Handles the redirect from the external SSO provider. |
| `POST` | `/v2/portal/public/user` | `createUser` | **deprecated** · Registers a portal user |
| `GET` | `/v2/portal/public/user/entry-point` | `getUserEntryPoint` | Get the entry point for the user |
| `GET` | `/v2/portal/public/user/exists` | `userExists` | Checks whether a user exists in the portal |
| `GET` | `/v2/portal/user/confirm` | `confirmUser` | Confirm a portal user |
| `GET` | `/v2/portal/user/confirm/{id}` | `confirmUserWithUserId` | Confirm a portal user |
| `POST` | `/v3/portal/public/account/exists` | `checkAccountExists` | True if account with given identifiers exists. |
| `POST` | `/v3/portal/public/contact/exists` | `checkContactExistsV3` | True if contact with given identifiers exists. |
| `GET` | `/v3/portal/public/extensions` | `getPublicPortalExtensionDetailsV3` | Get public extension details shown to end customers and configuring users. |
| `GET` | `/v3/portal/public/portal/config` | `getPublicPortalConfigV3` | Retrieves the public portal configuration. |
| `GET` | `/v3/portal/public/schemas` | `getPublicSchemasV3` | Retrieves schemas by portal. |
| `POST` | `/v3/portal/public/user` | `createUserV3` | Registers a portal user. |
| `GET` | `/v3/portal/public/user/exists` | `userExistsV3` | Checks whether a user exists in the portal. |
| `GET` | `/v3/portal/public/widgets` | `getPublicPortalWidgetsV3` | Retrieves the public widgets of a portal. |

### Activity

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/portal/entity/{slug}/{id}/activity` | `getEntityActivityFeed` | Get activity feed for an entity |

### Balance

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/portal/billing/customers/balance` | `getCustomerBalance` | Get total balance across all contracts and orders of a customer entity. |

### Billing Accounts

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/portal/billing/accounts/{id}` | `getBillingAccount` | Get a billing account by id. |

### Login

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v2/portal/public/sso/login` | `ssoLogin` | Initiate login using external SSO identity. |
| `POST` | `/v3/portal/public/sso/login` | `ssoLoginV3` | Initiate login using external SSO identity. |

---

_Generiert aus der OpenAPI-Spec von `customer-portal-client` (@epilot Client 0.44.0). Nicht von Hand bearbeiten._
