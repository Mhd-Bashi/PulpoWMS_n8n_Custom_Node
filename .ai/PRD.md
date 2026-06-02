# PRD: n8n Community Node for Weclapp

## Problem Statement

Weclapp is the primary ERP/CRM platform used for managing customers, orders, articles, shipments, and financials. Currently, workflow automations connecting Weclapp to other services are built in Workato using a custom Ruby connector. There is no official or community-maintained n8n node for Weclapp, which means teams cannot move Workato automations to n8n or build new Weclapp-integrated workflows in n8n without writing raw HTTP Request nodes. This creates high maintenance burden, poor discoverability, and no type-safety for field names.

## Solution

Build and publish `n8n-nodes-weclapp` — an n8n community node that provides a Weclapp action node and a Weclapp webhook trigger node. The node covers all entities and operations currently supported by the existing Workato connector, with the goal of enabling a full migration of Workato-based Weclapp automations to n8n and eventually expanding to the full Weclapp API surface (673 endpoints documented in the OpenAPI v2 spec).

The node follows the same TypeScript project structure as `n8n-nodes-trackpod`, which serves as the internal reference implementation.

## User Stories

1. As an n8n workflow author, I want to authenticate against my Weclapp tenant using my subdomain and API token, so that I can connect to the correct Weclapp instance without sharing credentials in plaintext.
2. As an n8n workflow author, I want n8n to verify my Weclapp credentials on save, so that I get immediate feedback if my token or subdomain is incorrect.
3. As an n8n workflow author, I want to select a Weclapp entity type (e.g. Sales Order, Party, Article) from a dropdown, so that I don't need to memorise API resource names.
4. As an n8n workflow author, I want to get a Weclapp record by its ID, so that I can retrieve the full details of a known record.
5. As an n8n workflow author, I want to create a new Weclapp record with typed input fields, so that I don't have to construct a raw JSON payload by hand.
6. As an n8n workflow author, I want required fields to be visually marked, so that I know what is mandatory before running a workflow.
7. As an n8n workflow author, I want to update an existing Weclapp record by ID, so that I can patch specific fields without overwriting the whole record.
8. As an n8n workflow author, I want to search Weclapp records using filter criteria, so that I can retrieve a filtered list without fetching all records.
9. As an n8n workflow author, I want to paginate search results using page/pageSize/sort parameters, so that I can control how many records are returned per execution.
10. As an n8n workflow author, I want to pass a raw custom query string to search, so that I can use advanced Weclapp filter syntax (e.g. `salesChannel-eq=NET1&createdDate-gt=1398436281262`) when the built-in fields are not sufficient.
11. As an n8n workflow author, I want dropdown fields (currency, payment method, shipment method, warehouse, sales channel, etc.) to be populated from my live Weclapp tenant, so that I select valid values instead of typing IDs from memory.
12. As an n8n workflow author, I want custom attribute fields defined in my Weclapp tenant to appear automatically in the input form for the relevant entity, so that I can read and write tenant-specific fields without switching to a raw HTTP node.
13. As an n8n workflow author, I want custom attribute fields to be correctly typed (date, number, boolean, select, multi-select), so that n8n validates my inputs.
14. As an n8n workflow author, I want the trigger node to register a webhook with Weclapp automatically when I activate my workflow, so that I don't have to manually set up webhooks in the Weclapp admin.
15. As an n8n workflow author, I want the trigger node to deregister its webhook when I deactivate or delete my workflow, so that Weclapp doesn't accumulate stale webhooks.
16. As an n8n workflow author, I want to select which entity type the trigger listens on, so that only events for the relevant entity fire my workflow.
17. As an n8n workflow author, I want to select which event types (Create, Update, Delete) trigger my workflow, so that I only react to the events I care about.
18. As an n8n workflow author, I want the trigger to output the full Weclapp entity payload received from the webhook, so that downstream nodes have complete record data without a follow-up Get call.
19. As an n8n workflow author, I want the action node to support `continueOnFail` mode, so that a single failing record does not abort the entire workflow.
20. As an n8n workflow author, I want 404 responses from Weclapp to return null/empty output rather than throwing an error, so that "record not found" cases can be handled gracefully with an IF node.
21. As an n8n workflow author, I want date/timestamp fields to display as human-readable ISO dates rather than epoch milliseconds, so that I can read and compare dates without conversion.
22. As an n8n workflow author, I want to create a comment on a Sales Order or Shipment, with the entity type and entity ID as required fields, so that I can automate internal notes.
23. As an n8n workflow author, I want to search for documents attached to a specific entity by providing the entityName and entityId, so that I can retrieve attachments in automated flows.
24. As a community node publisher, I want the package to follow n8n's community node conventions (package name `n8n-nodes-weclapp`, correct `n8n` block in package.json, MIT license), so that the node can be discovered and installed from the n8n community node registry.
25. As a community node publisher, I want the node to include a Weclapp SVG icon, so that it is visually identifiable in the n8n canvas.

## Implementation Decisions

### Module Architecture

**WeclappApi Credentials**
- Credential type with two fields: `subdomain` (text, required) and `apiToken` (password, required).
- Injects `AuthenticationToken: <token>` header on every request via n8n's generic auth mechanism.
- Test endpoint: `GET /user/count` — a lightweight read that validates both token and subdomain.

**Request Transport**
- Single async function `weclappRequest(context, method, endpoint, body?, qs?)` mirroring the Trackpod reference implementation.
- Constructs the base URL dynamically from the credential subdomain: `https://<subdomain>.weclapp.com/webapp/api/v2/<endpoint>`.
- Returns `null` on 404 (record not found).
- Throws `NodeApiError` on all other 4xx/5xx responses, surfacing the Weclapp error body.
- Content-Type header only set when a body is present (avoids server-side rejections on bodyless requests).

**Entity Definitions (14 modules)**
- One TypeScript file per entity, each exporting an `INodeProperties[]` array.
- Field names match the Weclapp API JSON property names exactly (camelCase).
- Required fields per operation (create vs update) expressed via `displayOptions`.
- Ignored fields (read-only server-computed values like `*Name` denormalised fields) are excluded from create/update forms.
- Date/timestamp fields annotated so values are converted between ISO string and epoch milliseconds in the transport layer.

Entities in scope for Phase 1:
`party`, `article`, `articleCategory`, `salesOrder`, `salesInvoice`, `salesOpenItem`, `purchaseOrder`, `purchaseInvoice`, `incomingGoods`, `shipment`, `quotation`, `comment`, `document`, `accountingTransaction`

**Options Loaders**
- One `loadOptionsMethod` function per reference list that Weclapp exposes as an API resource.
- Included loaders: currencies, paymentMethods, termOfPayments, shipmentMethods, shippingCarriers, warehouses, salesChannels, articleCategories, manufacturers, customsTariffNumbers, commercialLanguages, customerCategories, personDepartments, personRoles, leadRatings, leadSources, sectors, taxes, partyRatings, customerTopics, fulfillmentProviders, tags.
- Each loader calls `GET /<resource>` (or resource-specific endpoint), maps result to `{ name, value }` pairs.

**Custom Attributes Loader**
- Calls `GET /customAttributeDefinition?pageSize=1000` once at build-time.
- Filters by `entities` array to find attributes relevant to the selected entity.
- Maps Weclapp attribute types to n8n field descriptors:
  - `DATE` → `dateTime` control
  - `DECIMAL` / `INTEGER` → `number` control
  - `BOOLEAN` → `boolean` toggle with text override
  - `ENTITY` → `number` control (ID reference) with hint indicating entity type
  - `LIST` → `select` control with options from `selectableValues`
  - `MULTISELECT_LIST` → `multiOptions` control with same options
  - `TEXT` / `STRING` → `string` control
- Returns an `INodeProperties[]` appended to the entity's static field array.
- Field name convention: `customAttribute<id>` (matching Workato).

**Action Node**
- Single node class `Weclapp` with one `resource` dropdown listing all 14 entities.
- Four operations: `getById`, `create`, `update`, `searchRecords`.
- `getById`: `GET /<entityName>/id/<id>` — returns one record or null on 404.
- `create`: `POST /<entityName>?ignoreMissingProperties=true` — posts body, returns created record.
- `update`: `PUT /<entityName>/id/<id>?ignoreMissingProperties=true` — patches record, returns updated record.
- `searchRecords`: `GET /<entityName>` with `sort`, `pageSize`, `page`, and filter query params — returns `result[]` array.
- `continueOnFail()` supported on all operations.

**Trigger Node**
- Separate node class `WeclappTrigger`.
- Config fields: entity type (dropdown, same 14 entities), events (multi-select: Create, Update, Delete).
- `checkExists()` + `create()` lifecycle:
  - `POST /webhook` body: `{ entityName, url: <n8n webhook URL>, atCreate, atUpdate, atDelete }`.
  - Stores returned webhook `id` in static data.
- `delete()` lifecycle: `DELETE /webhook/id/<stored-id>`.
- `execute()`: passes through the raw Weclapp webhook payload as-is.

### API Version
Weclapp API v2 (`/webapp/api/v2/`).

### Date Handling
All Weclapp timestamps are epoch milliseconds. The transport layer converts to/from ISO 8601 strings at the boundary, consistent with Workato's `epoch_time_conversion` helper.

### Ignored / Denormalised Fields
Weclapp returns computed `*Name` fields (e.g. `shipmentMethodName`) alongside ID fields. These are excluded from create/update inputs (matching Workato's `ignoredCreateFields` / `ignoredUpdateFields`) to avoid API rejection.

### Project Structure
Mirrors `n8n-nodes-trackpod` exactly:
- `credentials/` — credential definition
- `nodes/Weclapp/` — action node, trigger node, SVG icon
- `nodes/Weclapp/descriptions/` — one file per entity
- `nodes/Weclapp/transport/` — request helper
- `package.json` — `n8n-nodes-weclapp`, MIT, author `muhammad.otahbashi@altruan.de`
- TypeScript target: CommonJS ES2019 (matching Trackpod)

## Testing Decisions

**What makes a good test here:** Tests should assert external behaviour — inputs in, outputs out — not inspect internal state or mock implementation details. The three modules below are pure-ish functions whose contracts are stable and testable without standing up n8n itself.

**Module 1: Request Transport**
- Test URL construction: given subdomain `acme`, endpoint `party`, expect URL `https://acme.weclapp.com/webapp/api/v2/party`.
- Test 404 handling: when Weclapp returns 404, function returns `null`.
- Test error propagation: when Weclapp returns 422, function throws `NodeApiError` with the response body.
- Test Content-Type: header present when body is non-empty, absent when body is empty/undefined.
- Prior art: Trackpod's `transport/request.ts` (same pattern, no existing tests — these will be the first).

**Module 2: Options Loaders**
- Test that each loader maps a mock Weclapp list response `{ result: [{id, name}] }` to `[{ name: 'My Name (123)', value: '123' }]`.
- Test that loaders using non-standard response shapes (e.g. `activeSalesChannels`) map correctly.
- Mock the HTTP call via `jest.fn()` on the context helper.

**Module 3: Custom Attributes Loader**
- Test each Weclapp attribute type produces the correct n8n field descriptor shape.
- `DATE` → field has `type: 'dateTime'`.
- `LIST` with three selectableValues → field has `type: 'options'` with three entries.
- `MULTISELECT_LIST` → field has `type: 'multiOptions'`.
- `BOOLEAN` → field has `type: 'boolean'` with a text toggle fallback.
- Test entity filter: attribute with `entities: ['article']` does NOT appear in party field list.
- Test name convention: attribute id `12345` → field name `customAttribute12345`.

**Test tooling:** Jest + ts-jest, matching the Trackpod project's setup.

## Out of Scope

- **API v1 support** — the node targets v2 only; v1 parity is not guaranteed.
- **Batch trigger** (`new_updated_records` batch mode from Workato) — polling-based batch trigger is not implemented; only webhook-based single-record trigger.
- **Polling fallback** for triggers — if webhook registration fails, the node errors rather than falling back to polling.
- **Entities beyond the 14 Phase-1 entities** — the remaining 160+ entities from the OpenAPI spec are deferred to Phase 2.
- **Write operations on Document and Accounting Transaction** — these entities are read/search-only in Phase 1 (matching Workato's `get_objects`-only listing).
- **File/attachment upload** — binary data handling is not in scope.
- **OAuth authentication** — Weclapp only exposes token-based auth; OAuth is not applicable.
- **n8n Cloud certification** — community node submission to the official n8n marketplace is deferred until the node is stable.

## Further Notes

- The Workato connector uses API v1; the new node targets v2. Field names and response shapes should be verified against the OpenAPI spec during implementation, as v2 may differ.
- Weclapp's `ignoreMissingProperties=true` query param on create/update is essential — without it the API rejects any request that omits non-required fields.
- The `comment` entity requires `entityName` and `entityId` as mandatory search fields; the entity definition must reflect this distinctly from other entities.
- Custom attribute IDs are tenant-specific; the `customAttribute<id>` naming convention must exactly match what Weclapp expects in the request body.
- When the trigger node registers a webhook, Weclapp may immediately send a test ping — the execute handler should return an empty array for unrecognised/test payloads.
- The Trackpod node (`n8n-nodes-trackpod` v0.1.5, authored by the same developer) serves as the canonical reference for project scaffolding, build config, credential structure, and transport layer pattern.
