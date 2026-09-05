# Pricing API

> Slug `pricing` · OpenAPI-Version `1.2.1` · 34 Operationen

The `pricing-api` hub sets the foundations for the following Pricing APIs:

### Order API
This api enables the management of orders in epilot 360, providing features such as:
 - Automatic calculation of totals and price breakdowns for taxes on the Order entity
 - Product and pricing data validation

### Shopping Cart API
Used to interact with a cart during a customer's checkout session, providing:
 - An unified data model to model a Shopping Cart
 - Product and pricing data validation
 - Checkout a cart into an order or quote

### Catalog API
Provides a way to query the entire catalog of products and prices.

### Availability API
Provides endpoints for querying products availability by a set of predefined dimensions.

### Spot Market API
Provides endpoints to fetch (historic) spot market price data.

### External Integrations API
Provides endpoints for external integrations. E.g. GetAG.

### External Catalog API
Provides endpoints for external catalog.

### Product Recommendations API
Provides endpoints for product recommendations.

### Conditional Pricing API
Provides endpoints for resolving conditional Products, Prices and Coupons, and for authoring the conditions they vary by.

## Zugriff

| | |
| --- | --- |
| Base URL | `https://pricing-api.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/pricing-api.yaml |
| Docs | https://docs.epilot.io/api/pricing |
| SDK | `epilot.pricing` aus `@epilot/sdk/pricing` (Einzelpaket: `@epilot/pricing-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotPublicAuth` (http/bearer)

## Endpunkte

### Order API

_This api enables the management of orders in epilot 360, providing features such as: - Automatic calculation of totals and price breakdowns for taxes on the Order entity - Product and pricing data validation_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/order` | `createOrder` | Create an order |
| `PUT` | `/v1/order/{id}` | `putOrder` | Update an existing Order |
| `POST` | `/v1/pricing:compute` | `$calculatePricingDetails` | Computes a set of pricing details that can be persisted on an entity with the pricing capability enabled, e.g: Orders or Contracts. |

### Cart API

_Used to interact with a cart during a customer's checkout session, providing: - An unified data model to model a Shopping Cart - Product and pricing data validation - Checkout a cart into an order or quote_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/public/cart:checkout` | `$checkoutCart` | Checkouts a cart and executes the specified checkout `mode` process. |

### Catalog API

_Provides a way to query the entire catalog of products and prices._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/catalog` | `$privateSearchCatalog` | Provides a querying functionalities over products and prices of the Catalog for a given organization. |
| `POST` | `/v1/public/catalog` | `$searchCatalog` | Provides a querying functionalities over products and prices of the Catalog for a given organization. |

### Promo Codes API

_This API enables the validation of promo codes within journeys, their uniqueness and availability_

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/public/validate-promo-codes` | `$validatePromoCodes` | Validate a list of promo codes against a list of coupons |

### Availability API

_Provides endpoints for querying products availability by a set of predefined dimensions._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/public/availability:check` | `$availabilityCheck` | The availability check endpoint |
| `GET` | `/v1/validate-availability/{id}` | `$validateAvailabilityFile` | Validates an availability file, it returns an array of errors if the file is invalid |

### Spot Market API

_Provides endpoints to fetch (historic) spot market data._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/public/averageMarketPrice` | `$averageMarketPrice` | Get the average energy prices for a given time period, market and bidding zone. |
| `GET` | `/v1/public/historicMarketPrices` | `$historicMarketPrices` | Get a series of historic energy prices for a given time period, market and bidding zone. |

### External Integrations API

_Provides endpoints for external integrations. E.g. GetAG._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/integration/{integrationId}/credentials` | `$getCredentials` | Gets the credentials for a given integration / organization |
| `DELETE` | `/v1/integration/{integrationId}/credentials:delete` | `$deleteCredentials` | Delete the credentials for a given integration / organization |
| `PUT` | `/v1/integration/{integrationId}/credentials:save` | `$saveCredentials` | Saves the credentials for a given integration / organization |
| `POST` | `/v1/public/integration/{integrationId}/compute-price` | `$computePrice` | Returns the price for a given product type based on location and consumption |
| `POST` | `/v1/public/integration/{integrationId}/product-recommendations` | `$searchExternalProductRecommendations` | Returns the list of available product recommendations with computed prices based on a given context and for a given org integration. |
| `POST` | `/v1/public/integration/{integrationId}/products` | `$searchExternalProducts` | Returns the list of available products with computed prices based on a given context and for a given org integration. |
| `POST` | `/v1/public/integration/{integrationId}/providers:search` | `$searchProviders` | Returns the list of providers available based on a given location |
| `POST` | `/v1/public/integration/{integrationId}/streets:search` | `$searchStreets` | Returns the list of streets available for a given postal code and city |

### External Catalog API

_Provides endpoints for external catalog._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/public/external-catalog/product-recommendations` | `$getExternalCatalogProductRecommendations` | Returns the list of available external catalog products recommendations based on a given context |
| `POST` | `/v1/public/external-catalog/products` | `$getExternalCatalogProducts` | Returns the list of available external catalog products with computed prices based on a given context |

### Product Recommendations API

_Provides endpoints for product recommendations._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `POST` | `/v1/public/product-recommendations` | `$productRecommendations` | Get a list of product recommendations based on the search parameters. |

### Conditional Pricing API

_Provides endpoints for resolving conditional Products, Prices and Coupons — the variant of an entity that applies to a given context — and for authoring the conditions they vary by._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/conditional-pricing/{slug}/condition-sets` | `$getConditionSets` | Returns the condition sets built in for one conditional entity type: the situations a |
| `POST` | `/v1/conditional-pricing/{slug}/entities/{entity_id}/variants` | `$createConditionalVariant` | Creates one variant of a conditional entity, together with the first version carrying its |
| `DELETE` | `/v1/conditional-pricing/{slug}/entities/{entity_id}/variants/{variant_id}` | `$deleteConditionalVariant` | Removes one variant of a conditional entity: the condition tuple it holds, its registration |
| `GET` | `/v1/conditional-pricing/{slug}/entities/{entity_id}/variants/{variant_id}` | `$getActiveConditionalVariantVersion` | Returns the version of this variant that is currently in effect — the one with the latest |
| `PATCH` | `/v1/conditional-pricing/{slug}/entities/{entity_id}/variants/{variant_id}` | `$patchActiveConditionalVariantVersion` | Changes only the fields it names on the version currently in effect. |
| `PUT` | `/v1/conditional-pricing/{slug}/entities/{entity_id}/variants/{variant_id}` | `$replaceActiveConditionalVariantVersion` | Replaces the values of the version currently in effect, wholesale. |
| `POST` | `/v1/conditional-pricing/{slug}/entities/{entity_id}/variants/{variant_id}/versions` | `$appendConditionalVariantVersion` | Appends a version to a variant: a new set of values taking effect at its own instant. |
| `DELETE` | `/v1/conditional-pricing/{slug}/entities/{entity_id}/variants/{variant_id}/versions/{valid_from}` | `$deleteConditionalVariantVersion` | Removes one version of a variant. |
| `GET` | `/v1/conditional-pricing/{slug}/entities/{entity_id}/variants/{variant_id}/versions/{valid_from}` | `$getConditionalVariantVersion` | Returns one specific version of a variant, by the instant it takes effect — what a form editing |
| `PATCH` | `/v1/conditional-pricing/{slug}/entities/{entity_id}/variants/{variant_id}/versions/{valid_from}` | `$patchConditionalVariantVersion` | Changes only the fields it names on one version, addressed by its `valid_from`. |
| `PUT` | `/v1/conditional-pricing/{slug}/entities/{entity_id}/variants/{variant_id}/versions/{valid_from}` | `$replaceConditionalVariantVersion` | Replaces one version's values wholesale, addressed by its `valid_from`. |
| `POST` | `/v1/conditional-pricing:resolve` | `$resolveConditionalEntity` | Resolves which of a conditional entity's variants apply to a situation, and returns each one |

---

_Generiert aus der OpenAPI-Spec von `pricing-client` (@epilot Client 3.57.0). Nicht von Hand bearbeiten._
