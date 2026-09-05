# Validation Rules API

> Slug `validation-rules` · OpenAPI-Version `1.0.0` · 7 Operationen

The Validation Rules API manages reusable input validation rules for epilot journeys and entity attributes.

Validation rules define constraints for user input (e.g. regex patterns, numeric ranges, character counts) that can be applied to journey blocks or entity schema attributes.

Key capabilities:
- Define validation rules using regex patterns, character patterns, or numeric constraints
- Apply rules to journey blocks or entity schema attributes via the `used_by` association
- Manage the lifecycle of rules (create, read, update, delete)
- Compose complex validation logic using AND/OR/NOT condition combinators

## Rule schema versions

The `rule` property holds one of two shapes, identified by the document's `_schema_version`:
- `v1`: a json-rules-engine condition tree (regex/pattern/numeric) with static comparison values only.
- `v2`: a declarative rule with predefined comparison operators whose comparison values may be static,
  dynamic (a path into runtime context declared via `contexts`,
  e.g. `contract.installment_amount`) or relative dates. v2 shapes carry an `input_type` property.
Converting a rule between schema versions is not supported.

## Zugriff

| | |
| --- | --- |
| Base URL | `https://validation-rules.sls.epilot.io` |
| OpenAPI-Spec | https://docs.api.epilot.io/validation-rules.yaml |
| Docs | https://docs.epilot.io/api/validation-rules |
| SDK | `epilot.validationRules` aus `@epilot/sdk/validation-rules` (Einzelpaket: `@epilot/validation-rules-client`) |

**Security Schemes:** `EpilotAuth` (http/bearer), `EpilotPublicAuth` (http/bearer)

## Endpunkte

### Validation Rules

_CRUD endpoints for managing validation rules within an organization. All endpoints require an epilot bearer token and operate within the authenticated organization's scope. Rules are identified by a unique `ruleId` and can be referenced by journey blocks or entity attributes via the `used_by` field._

| Methode | Pfad | Operation | Beschreibung |
| --- | --- | --- | --- |
| `GET` | `/v1/validation-rules` | `getValidationRules` | Returns all validation rules belonging to the authenticated user's organization. |
| `POST` | `/v1/validation-rules` | `createValidationRule` | Creates a new validation rule for the authenticated organization. |
| `DELETE` | `/v1/validation-rules/{ruleId}` | `deleteValidationRule` | Permanently deletes a validation rule by ID. |
| `GET` | `/v1/validation-rules/{ruleId}` | `getValidationRuleById` | Retrieves a specific validation rule by its unique ID. |
| `PATCH` | `/v1/validation-rules/{ruleId}` | `updateValidationRule` | Partially updates an existing validation rule by ID. |
| `DELETE` | `/v1/validation-rules/{ruleId}/used-by` | `removeUsedByReference` | Removes a specific `used_by` reference from an existing validation rule. |
| `POST` | `/v1/validation-rules/{ruleId}/used-by` | `addUsedByReference` | Adds a single `used_by` reference to an existing validation rule. |

---

_Generiert aus der OpenAPI-Spec von `validation-rules-client` (@epilot Client 1.5.0). Nicht von Hand bearbeiten._
