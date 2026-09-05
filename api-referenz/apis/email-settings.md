# Messaging Settings API

> Slug `email-settings` · OpenAPI-Version `1.5.0` · 48 Operationen

The Messaging Settings API provides comprehensive management of email configurations for epilot organizations.

## Overview

This API enables organizations to:
- **Email Addresses**: Configure sender email addresses, set primary addresses, and manage email aliases
- **Email Signatures**: Create and manage HTML email signatures that can be associated with email addresses
- **Custom Domains**: Add and verify custom email domains for professional branding
- **Shared Inboxes**: Organize incoming emails into categorized inboxes with team assignments
- **Microsoft 365 Integration**: Connect Outlook mailboxes for seamless email synchronization

## Key Concepts

### Email Addresses
Email addresses represent the sender identities used when composing emails. Each address can have:
- A display name (e.g., "Sales Team")
- Assigned users and groups who can send from this address
- A default signature
- Association with a shared inbox

### Shared Inboxes
Shared inboxes help teams organize and manage incoming emails. Features include:
- Color-coded categorization
- Team member assignments
- Routing rules for incoming messages

### Email Signatures
HTML signatures that are automatically appended to outgoing emails. Signatures can include:
- Rich text formatting
- Images and logos
- Contact information

### Custom Domains
Organizations can configure custom email domains to send emails from their own domain (e.g., `support@yourcompany.com`). This requires:
1. Adding the domain
2. Configuring DNS records
3. Verifying domain ownership

## Authentication

All endpoints require authentication via Bearer token (JWT) unless otherwise specified.
Use the `x-epilot-org-id` header to specify the target organization when using shared tenant access.

## Zugriff

| | |
| --- | --- |
| Base URL | `https://email-settings.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/email-settings.yaml |
| Docs | https://docs.epilot.io/api/email-settings |
| SDK | `epilot.emailSettings` aus `@epilot/sdk/email-settings` (Einzelpaket: `@epilot/email-settings-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `AsOrganization` (apiKey, Header `x-ivy-org-id`), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### Email addresses

_Manage email sender addresses for your organization. Email addresses define the identities from which emails can be sent. Each address can be configured with display names, user/group assignments, default signatures, and shared inbox associations._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/email-settings/email-addresses` | `listEmailAddresses` | Retrieves all email addresses configured for the organization. |
| `POST` | `/v2/email-settings/email-addresses` | `addEmailAddress` | Adds a new email address to the organization. |
| `PUT` | `/v2/email-settings/email-addresses/epilot:provision` | `provisionEpilotEmailAddress` | Provisions or reactivates an epilot-managed email address for the organization. |
| `POST` | `/v2/email-settings/email-addresses/primary` | `setEmailAddressPrimary` | Sets the specified email address as the primary address for the organization. |
| `DELETE` | `/v2/email-settings/email-addresses/{id}` | `deleteEmailAddress` | Permanently deletes an email address from the organization. |
| `GET` | `/v2/email-settings/email-addresses/{id}` | `getEmailAddress` | Retrieves the details of a specific email address by its ID. |
| `PUT` | `/v2/email-settings/email-addresses/{id}` | `updateEmailAddress` | Updates the configuration of an existing email address. |

### Shared inboxes

_Shared inboxes provide team-based email organization. They allow multiple users to collaborate on incoming messages with features like color-coding, assignee management, and email routing. A default inbox is always available and does not need to be explicitly created._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/email-settings/shared-inboxes` | `listSharedInboxes` | Retrieves all shared inboxes configured for the organization. |
| `POST` | `/v2/email-settings/shared-inboxes` | `addSharedInbox` | Creates a new shared inbox for the organization. |
| `DELETE` | `/v2/email-settings/shared-inboxes/{id}` | `deleteSharedInbox` | Deletes a shared inbox and reroutes all associated emails to a successor inbox. |
| `GET` | `/v2/email-settings/shared-inboxes/{id}` | `getSharedInbox` | Retrieves the details of a specific shared inbox by its ID. |
| `PUT` | `/v2/email-settings/shared-inboxes/{id}` | `updateSharedInbox` | Updates the configuration of an existing shared inbox. |

### Inbox buckets

_Inbox buckets are internal storage containers associated with shared inboxes. Each shared inbox has a corresponding bucket for message storage. The default bucket is always available._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/email-settings/inbox-buckets` | `listInboxBuckets` | Retrieves all inbox buckets for the organization. |

### O365 Outlook Connection

_Microsoft Office 365 Outlook integration endpoints. These endpoints enable organizations to: - Initiate OAuth connections with Microsoft 365 - Connect Outlook shared mailboxes - Manage connection status and tokens - Disconnect integrations when needed_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/outlook/calendar/admin-consent-status` | `getCalendarAdminConsentStatus` | Reports whether the caller's organization can connect personal Outlook |
| `DELETE` | `/v2/outlook/calendar/me` | `disconnectMyCalendar` | Removes the calling user's personal calendar connection. |
| `GET` | `/v2/outlook/calendar/me` | `getMyCalendarConnection` | Returns the calling user's personal Outlook calendar connection, |
| `POST` | `/v2/outlook/connect` | `connectOutlook` | Returns the Microsoft authorization URL for Outlook OAuth. |
| `POST` | `/v2/outlook/connection/disconnect` | `disconnectOutlook` | Removes the Microsoft 365 / Outlook connection for a specific tenant. |
| `GET` | `/v2/outlook/connection/status` | `getOutlookConnectionStatus` | Returns all Microsoft 365 / Outlook connections for the organization. |
| `POST` | `/v2/outlook/mailbox/connect` | `connectOutlookMailbox` | Connects an Outlook mailbox: |
| `GET` | `/v2/outlook/mailbox/mappings` | `getConnectedOutlookEmails` | Returns all Outlook email addresses connected to the organization. |
| `POST` | `/v2/outlook/mailbox/{email}/disconnect` | `disconnectOutlookMailbox` | Disconnect Outlook Mailbox |
| `POST` | `/v2/outlook/mailbox/{email}/sync` | `startMailboxSync` | Start Mailbox Sync |
| `POST` | `/v2/outlook/mailbox/{email}/sync/retry` | `retryMailboxSync` | Retry Failed Messages |
| `GET` | `/v2/outlook/mailbox/{email}/sync/status` | `getMailboxSyncStatus` | Get Mailbox Sync Status |
| `GET` | `/v2/outlook/oauth/callback` | `outlookOAuthCallback` | Exchanges authorization code for tokens and stores them. |

### Custom SMTP

_Custom SMTP connection management. Lets organizations configure their own outbound SMTP server (e.g. Mailgun, SendGrid, a self-hosted Postfix) for sending emails from epilot via their existing provider. Credentials are encrypted at rest using a customer-managed KMS key. Only outbound sending is supported — replies do not come back into epilot._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/smtp/connections` | `listSmtpConnections` | Returns all custom SMTP connections configured for the organization. |
| `POST` | `/v2/smtp/connections` | `createSmtpConnection` | Creates a new custom SMTP connection. |
| `DELETE` | `/v2/smtp/connections/{connectionId}` | `deleteSmtpConnection` | Deletes a custom SMTP connection. |
| `GET` | `/v2/smtp/connections/{connectionId}` | `getSmtpConnection` | Returns a single custom SMTP connection by id. |
| `PUT` | `/v2/smtp/connections/{connectionId}` | `updateSmtpConnection` | Partial update; omitted fields keep their existing values. |
| `POST` | `/v2/smtp/connections/{connectionId}/test` | `testSmtpConnection` | Re-runs a live SMTP verify against the saved configuration (EHLO + AUTH + NOOP + QUIT) |
| `GET` | `/v2/smtp/senders` | `listSmtpSenders` | Returns every address registered to send through a custom SMTP connection. |
| `POST` | `/v2/smtp/senders` | `connectSmtpSender` | Registers an address as a sender on a custom SMTP connection: |
| `DELETE` | `/v2/smtp/senders/{email}` | `disconnectSmtpSender` | Removes a sender address: deletes the email address and its binding to the SMTP |

### Channels

_Channel integration endpoints. Channels represent external communication providers (e.g., Microsoft Teams, WhatsApp) that can be connected to an epilot organization._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v2/channels/msteams/connect` | `connectMsTeams` | Connects Microsoft Teams channel (click-to-call deep links, meetings) for the organization. |
| `POST` | `/v2/channels/msteams/disconnect` | `disconnectMsTeams` | Disconnects Microsoft Teams channel for the organization. |
| `GET` | `/v2/channels/msteams/status` | `getMsTeamsStatus` | Returns the connection status of the Microsoft Teams channel for the organization. |

### Settings

_Generic settings management for various email configuration types: - **signature**: HTML email signatures - **email_domain**: Custom email domains - **email_address**: Sender email addresses - **whitelist_email_address**: Addresses exempt from duplicate detection - **restrict_duplicates_within**: Time window for duplicate email detection_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `DELETE` | `/v1/email-settings` | `deleteSetting` | Deletes a setting by its ID and type. |
| `GET` | `/v1/email-settings` | `getSettings` | Retrieves settings of a specific type for the organization. |
| `POST` | `/v1/email-settings` | `addSetting` | Creates a new setting of the specified type. |
| `POST` | `/v1/email-settings/{id}` | `updateSetting` | Updates an existing setting identified by its ID. |

### Domains

_Custom email domain management. Add, verify, and configure custom domains to send emails from your organization's domain. Domain verification requires proper DNS configuration including MX records and SPF/DKIM settings._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `DELETE` | `/v1/email-settings/domain` | `deleteDomain` | Removes a custom email domain from the organization. |
| `GET` | `/v1/email-settings/domain` | `getDomains` | Retrieves all custom email domains for the organization. |
| `POST` | `/v1/email-settings/domain` | `addDomain` | Adds a custom email domain to the organization. |
| `POST` | `/v1/email-settings/domain/dns-records:verify` | `verifyDnsRecords` | Verifies that the domain's DNS records (MX, TXT, CNAME) are correctly configured |
| `POST` | `/v1/email-settings/domain/name-servers:verify` | `verifyNameServers` | Verifies that the domain's name server (NS) records are correctly configured. |
| `POST` | `/v1/email-settings/domain:verify` | `verifyDomain` | Verifies ownership and configuration of a custom email domain. |

---

_Generiert aus der OpenAPI-Spec von `email-settings-client` (@epilot Client 2.2.0). Nicht von Hand bearbeiten._
