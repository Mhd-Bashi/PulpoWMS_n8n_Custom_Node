# PRD: n8n Community Node for Pulpo WMS

GitHub issue: https://github.com/Mhd-Bashi/PulpoWMS_n8n_Custom_Node/issues/1

## Problem Statement

Users who manage warehouse operations in Pulpo WMS need to integrate their WMS data with external systems (ERPs, e-commerce platforms, reporting tools) using n8n workflow automation. Currently there is no community node for Pulpo WMS, so users must hand-craft HTTP Request nodes with manual auth token management, hard-coded filter strings, and no schema awareness — resulting in brittle workflows, silent auth failures, and significant setup overhead for each integration.

## Solution

Build and publish `n8n-nodes-pulpo-wms` — an n8n community node package that provides authenticated, schema-aware access to the Pulpo WMS API. The package includes:

- A **credentials type** using OAuth2 Resource Owner Password Credentials grant (username + password + environment), matching the Pulpo `/auth` endpoint and handling token acquisition automatically.
- A **programmatic-style action node** covering 7 resources with appropriate CRUD operations, hybrid filtering, pagination control, custom attribute schema extension, and dynamic dropdowns for warehouse and location selection.
- A **trigger node** for two real-time events (goods receipt, new/updated sales order) using webhooks as the primary mechanism with polling as fallback.
- A **Jest test suite** covering the transport layer, loadOptions methods, and trigger behavior.

## User Stories

1. As a warehouse operations manager, I want to authenticate to Pulpo WMS using my username and password inside n8n, so that I do not need to manually generate and rotate API tokens.
2. As a workflow builder, I want to select between Test and Live Pulpo environments in the credentials, so that I can safely develop against the test environment before going live.
3. As a workflow builder, I want clear feedback when my credentials are invalid, so that I can diagnose connection failures immediately.
4. As a workflow builder, I want to search products with filters and a "Return All" toggle, so that I can retrieve product catalogues of any size reliably.
5. As a workflow builder, I want to get a single product by ID, so that I can look up product details within a workflow.
6. As a workflow builder, I want to create a product in Pulpo WMS, so that I can sync new items from an ERP or e-commerce platform.
7. As a workflow builder, I want to update an existing product by ID, so that I can keep product attributes, dimensions, and pricing in sync with upstream systems.
8. As a workflow builder, I want to search third parties (suppliers/customers) with filters, so that I can look up contact records for order processing.
9. As a workflow builder, I want to get a single third party by ID, so that I can enrich order data with full contact details.
10. As a workflow builder, I want to create a third party in Pulpo WMS, so that I can onboard new suppliers or customers automatically.
11. As a workflow builder, I want to update a third party by ID, so that I can keep contact information current.
12. As a workflow builder, I want to search purchase orders with filters, so that I can report on or process open POs in bulk.
13. As a workflow builder, I want to get a single purchase order by ID, so that I can retrieve full PO details including line items.
14. As a workflow builder, I want to create a purchase order in Pulpo WMS, so that I can generate POs from upstream procurement systems.
15. As a workflow builder, I want to update a purchase order by ID, so that I can sync PO status or delivery dates from external sources.
16. As a workflow builder, I want to search sales orders with filters, so that I can retrieve orders for reporting, fulfilment tracking, or downstream processing.
17. As a workflow builder, I want to get a single sales order by ID, so that I can retrieve full order details including line items, ship-to address, and shipment instructions.
18. As a workflow builder, I want to create a sales order in Pulpo WMS, so that I can push orders from e-commerce platforms or ERPs into the WMS.
19. As a workflow builder, I want to update a sales order by ID, so that I can sync order changes (priority, delivery date, notes) from upstream systems.
20. As a workflow builder, I want to search incoming goods with filters, so that I can report on goods receipt history.
21. As a workflow builder, I want to get a single incoming good by ID, so that I can retrieve full receipt details including items, batches, and quantities.
22. As a workflow builder, I want to search sales order fulfillments using a hybrid filter set (warehouse, state, date range, free-text search, view_attributes projection, additional filters), so that I can build advanced reporting workflows like the fulfillment export query used in production.
23. As a workflow builder, I want to specify a `view_attributes` comma-separated list on the fulfillments search, so that I can limit the API response to only the fields I need.
24. As a workflow builder, I want to search inventory stocks filtered by location, zone, rack, batch, barcode, or physical coordinates, so that I can audit stock levels in specific warehouse areas.
25. As a workflow builder, I want to remove a stock quantity from a location by specifying product, location, batch, and quantity, so that I can automate stock adjustments for damaged or returned goods.
26. As a workflow builder, I want a "Return All" toggle on every list operation, so that I can choose between fetching everything automatically or controlling pagination manually with limit and offset.
27. As a workflow builder, I want to select a warehouse from a live dropdown, so that I do not need to look up and hard-code warehouse IDs.
28. As a workflow builder, I want to select a location from a live dropdown, so that I do not need to look up and hard-code location IDs for stock operations.
29. As a workflow builder, I want to declare custom product attribute field names in the node configuration, so that those fields appear as individually mappable outputs in downstream steps.
30. As a workflow builder, I want to declare custom purchase order attribute field names, so that custom PO properties are individually mappable in my workflow.
31. As a workflow builder, I want to declare custom sales order attribute field names, so that merchant-specific order properties are individually mappable.
32. As a workflow builder, I want to declare custom sales order item attribute field names, so that line-item custom properties are individually mappable.
33. As a trigger user, I want my workflow to fire automatically when a goods receipt is created in Pulpo, so that I can react to warehouse receiving events in real time.
34. As a trigger user, I want my workflow to fire automatically when a sales order is created or updated in Pulpo, so that I can propagate order changes to downstream systems without polling.
35. As a trigger user, I want the trigger to use webhooks as the primary delivery mechanism, so that events arrive in near real-time.
36. As a trigger user, I want the trigger to fall back to polling when webhooks are unavailable, so that my workflow continues to work in environments where webhook delivery is unreliable.
37. As a trigger user, I want to select a warehouse when configuring a trigger, so that I only receive events for the relevant warehouse.
38. As a trigger user, I want the trigger to deduplicate events correctly, so that the same incoming good or sales order does not trigger my workflow twice.
39. As a workflow builder, I want clear, descriptive field hints on every input, so that I understand what each parameter does without consulting external documentation.
40. As a workflow builder, I want the node to surface Pulpo API errors with a readable message, so that I can diagnose failures without inspecting raw HTTP responses.

## Implementation Decisions

### Architecture

- **Node style:** Programmatic (`execute()` method). Chosen because the node requires pagination across multiple API calls, complex filter construction, dynamic schema extension for custom attributes, and live dropdown population.
- **Two node files:** `PulpoWms.node.ts` (action node) and `PulpoWmsTrigger.node.ts` (trigger node).
- **Credentials:** `PulpoWmsApi.credentials.ts` — username, password (password type), environment select (Test=`eu-show` / Live=`eu`). Token acquired per-request via `POST /auth` in the transport layer. Credential test calls `/auth` directly.

### Modules

**1. Credentials (`credentials/PulpoWmsApi.credentials.ts`)**
- Properties: `username`, `password`, `environment`
- `test` block: POST to `/auth` with credentials; success = valid
- No `authenticate` property — token acquisition is handled in the transport layer

**2. Transport layer (`nodes/PulpoWms/transport/request.ts`)**
- `pulpoRequest(context, method, endpoint, body?, qs?)` — acquires token via POST /auth, makes API call with Bearer header, throws `NodeApiError` on non-2xx, returns `null` on 404
- `pulpoRequestAll(context, endpoint, resultKey, qs?)` — loops with `limit=100`/`offset` until `records.length >= total_results`; returns flat array

**3. LoadOptions (`nodes/PulpoWms/methods/loadOptions.ts`)**
- `getWarehouses()` — `GET /warehouses` → `[{ name, value: id }]`
- `getLocations()` — `GET /warehouses/locations` → `[{ name, value: id }]`

**4. Resource descriptions (`nodes/PulpoWms/descriptions/`)**
- `product.ts` — getAll, get, create, update; custom product attributes as additionalFields `attributes` JSON
- `thirdParty.ts` — getAll, get, create, update
- `purchaseOrder.ts` — getAll, get, create, update; custom PO attributes
- `salesOrder.ts` — getAll, get, create, update; custom SO attributes + SO item attributes
- `incomingGood.ts` — getAll, get (read-only)
- `salesOrderFulfillment.ts` — getAll with: `warehouse_id` (dropdown), `state`, `delivery_date` from/to (mapped to `between:`), `__search` field, `view_attributes` free-text, `capped_limit` toggle, additional filters key-value collection
- `inventoryStock.ts` — getAll (location/zone/rack/batch/barcode/coordinates filters), remove (product_id, location_id, batch_id, quantity)
- `shared.ts` — Return All toggle, limit, offset fields reused across resources

**5. Main action node (`nodes/PulpoWms/PulpoWms.node.ts`)**
- Programmatic `execute()` routing by resource then operation
- `loadOptions` and `methods` wired up
- `continueOnFail()` supported on all operations

**6. Trigger node (`nodes/PulpoWms/PulpoWmsTrigger.node.ts`)**
- Events: `goodsReceipt` (webhook type: `incoming_good_created`) and `newUpdatedSalesOrder` (types: `sales_order_created`, `sales_order_updated`)
- `webhookMethods.default.create` — POST /webhook with `url`, `allowed_types`, `warehouse_id`
- `webhookMethods.default.delete` — DELETE /webhook/{id}
- Polling fallback: `GET /reception/incoming_goods` (cursor: `inserted_at`) and `GET /sales/orders` (cursor: `updated_at`)
- Dedup: `{id}|{inserted_at}|{sequence_number}` for goods receipt; `{id}|{updated_at}` for sales orders

### Key API conventions
- Base URL: `https://{environment}.pulpo.co/api/v1`
- Auth: POST `/auth` with form-encoded `username`, `password`, `scope=default`, `grant_type=password`
- Pagination: `limit` + `offset`; response envelope contains `total_results`
- Filter syntax: `field=operator:value` (e.g. `delivery_date=between:2025-07-01,2025-07-31`, `state=ended`)
- Field-specific search: `__search=field|contains:value`
- Field projection: `view_attributes=field1,field2,...`
- Result cap bypass: `capped_limit=0`

### Custom attributes
Exposed as `additionalFields` → `attributes` JSON object on input for create/update operations. On output, `attributes` is returned as a structured object. Users declare custom attribute field names to make them individually mappable downstream (matching Workato schema-designer behavior).

## Testing Decisions

**What makes a good test:** Assert external behavior through the module's public interface — what it returns, what HTTP calls it makes, what errors it throws. No internal state inspection.

| Module | What to test |
|---|---|
| Transport (`request.ts`) | `pulpoRequest` returns parsed body on 2xx; throws `NodeApiError` on 4xx/5xx; returns `null` on 404; `pulpoRequestAll` accumulates pages and stops when `total_results` reached |
| LoadOptions (`loadOptions.ts`) | `getWarehouses` and `getLocations` map API list responses to `[{ name, value }]` correctly |
| Trigger (`PulpoWmsTrigger.node.ts`) | `poll` advances cursor to last timestamp; `webhookMethods.create` posts correct payload; `webhookMethods.delete` calls correct endpoint; dedup keys are correct for both event types |

**Test tooling:** Jest + `jest-mock-extended` for n8n execution context mocking. Mirror Weclapp node's `__tests__/` structure.

## Out of Scope

- Resources beyond the 7 agreed (picking, packing, shipping, counting, replenishment, kitting, warehouses/locations CRUD, billing, notifications, devices, merchants)
- Delete operations on any resource
- Binary/attachment handling
- Multi-region support beyond `eu-show` (Test) and `eu` (Live)
- n8n Cloud strict-mode submission

## Further Notes

- The Workato connector (`Workato_Pulpo_Connector.rb`) and the Weclapp node are the primary reference implementations for auth flow, trigger design, dedup strategy, and module organisation.
- The Pulpo API auth endpoint uses form-encoded POST (`Content-Type: application/x-www-form-urlencoded`).
- `package.json` registers both `PulpoWms.node.js` and `PulpoWmsTrigger.node.js` under `n8n.nodes`.
- `CHANGELOG.md` must be updated when the implementation is complete.
- Reference production fulfillments query: `GET /sales/orders/fulfillments?limit=2000&offset=0&delivery_date=between:2025-07-01+22:00:00,2025-07-31+21:59:59&warehouse_id=221&__search=shipping_method_name|contains:Altruan&state=ended&view_attributes=id,order_num,...&capped_limit=0`
- Reference stock operations: `GET /inventory/stocks?location_id=537959` and `POST /inventory/stocks/remove` (body: `quantity`, `location_id`, `product_id`, `batch_id`)
