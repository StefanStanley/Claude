# Billing API

> Slug `billing` · OpenAPI-Version `1.0.0` · 14 Operationen

API to manage billing data for epilot contracts and orders.

This API provides endpoints for managing financial transactions (Buchungssätze) related to
customer contracts (Verträge) including installments (Abschlagszahlungen), payments (Zahlungseingänge),
reimbursements (Rückerstattungen), and other billing events.

## Key Concepts

- **Billing Event (Buchungssatz)**: A single financial transaction entry in the billing ledger
- **Contract (Vertrag)**: A customer agreement linked to billing events
- **Balance (Kontostand)**: The current financial standing of a customer across all contracts

## Zugriff

| | |
| --- | --- |
| Base URL | `https://billing.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/billing.yaml |
| Docs | https://docs.epilot.io/api/billing |
| SDK | `epilot.billing` aus `@epilot/sdk/billing` (Einzelpaket: `@epilot/billing-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer)

## Endpunkte

### Billing Events

_Manage billing events (Buchungssätze) such as installments (Abschlagszahlungen), payments (Zahlungseingänge), reimbursements (Rückerstattungen), dunning fees (Mahngebühren), and other financial transactions._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/billing/events` | `getBillingEvents` | Retrieve and filter billing events (Buchungssätze) such as installments (Abschlagszahlungen), |
| `POST` | `/v1/billing/events` | `createBillingEvent` | Create a new billing event (Buchungssatz) such as an installment (Abschlagszahlung), |
| `DELETE` | `/v1/billing/events/{id}` | `deleteBillingEvent` | Delete an existing billing event (Buchungssatz). |
| `GET` | `/v1/billing/events/{id}` | `getBillingEvent` | Retrieve a single billing event (Buchungssatz) by its unique ID. |
| `PATCH` | `/v1/billing/events/{id}` | `updateBillingEvent` | Update an existing billing event (Buchungssatz). |
| `GET` | `/v1/billing/external/{external_id}` | `getBillingEventByExternalId` | Retrieve a billing event (Buchungssatz) by its external system identifier. |

### Contracts

_Manage contract entities (Verträge) within epilot 360._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/billing/contracts` | `createContractEntity` | Create a new contract entity (Vertrag) for billing purposes. |
| `DELETE` | `/v1/billing/contracts/{id}` | `deleteContractEntity` | Delete an existing contract entity (Vertrag). |
| `PATCH` | `/v1/billing/contracts/{id}` | `updateContractEntity` | Update an existing contract entity (Vertrag). |

### Balance

_Retrieve customer balance information (Kontostand)._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/billing/customers/{id}/balance` | `getCustomerBalance` | Retrieve the total balance (Kontostand) across all contracts and orders for a customer. |

### Pricing Information

_Read contract and billing account pricing information_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/billing/billing_accounts/{id}/pricing_information` | `getBillingAccountPricingInformation` | Get current pricing information for the active Contracts linked to a Billing Account. |
| `GET` | `/v1/billing/contracts/{id}/pricing_information` | `getContractPricingInformation` | Get current pricing information and recent configuration history for a Contract. |

### Configuration History

_Read billing configuration change history_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/billing/billing_accounts/{id}/configuration_history` | `getBillingAccountConfigurationHistory` | Get merged billing configuration history for active Contracts linked to a Billing Account. |
| `GET` | `/v1/billing/contracts/{id}/configuration_history` | `getContractConfigurationHistory` | Get billing configuration history for a Contract. |

---

_Generiert aus der OpenAPI-Spec von `billing-client` (@epilot Client 0.7.1). Nicht von Hand bearbeiten._
