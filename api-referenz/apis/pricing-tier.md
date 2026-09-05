# Pricing Tier API

> Slug `pricing-tier` · OpenAPI-Version `1.0.0` · 1 Operationen

Pricing Tier API

## Zugriff

| | |
| --- | --- |
| Base URL | – (nicht in der Spec hinterlegt) |
| OpenAPI-Spec | https://docs.api.epilot.io/pricing-tier.yaml |
| Docs | https://docs.epilot.io/api/pricing-tier |
| SDK | `epilot.pricingTier` aus `@epilot/sdk/pricing-tier` (Einzelpaket: `@epilot/pricing-tier-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotOrg` (apiKey, Header `x-epilot-org-id`)

## Endpunkte

### Pricing Tier

_Pricing Tier_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v2/pricing-tiers/me` | `getCurrentPricingTier` | Get current pricing tier of logged in user |

---

_Generiert aus der OpenAPI-Spec von `pricing-tier-client` (@epilot Client 1.2.3). Nicht von Hand bearbeiten._
