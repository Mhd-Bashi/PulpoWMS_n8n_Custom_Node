# n8n-nodes-pulpo-wms

An n8n community node for [Pulpo WMS](https://pulpo.co) — a cloud-based warehouse management system. Use it to automate warehouse operations: manage products, purchase orders, sales orders, incoming goods, inventory stock, fulfillments, third parties, and more.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Or install directly from the n8n UI: **Settings → Community Nodes → Install** → enter `n8n-nodes-pulpo-wms`.

## Credentials

The node uses Pulpo WMS's OAuth 2.0 password-grant flow.

**Prerequisites:**
1. An active Pulpo WMS account
2. Your environment subdomain (e.g. `mycompany` from `mycompany.pulpo.co`)

**Setup in n8n:**
1. In any Pulpo WMS node, click **Create new credential**
2. Fill in:
   - **Environment** — your subdomain (e.g. `mycompany`)
   - **Username** — your Pulpo WMS login email
   - **Password** — your Pulpo WMS password
3. Click **Save** — the node tests the credentials automatically

A token is acquired per request and is not stored between executions.

## Operations

### Pulpo WMS (action node)

| Resource | Operations |
|---|---|
| **Product** | Get Many, Get, Create, Update |
| **Purchase Order** | Get Many, Get, Create, Update |
| **Sales Order** | Get Many, Get, Create, Update |
| **Sales Order Fulfillment** | Get Many (all or by sales order), Get |
| **Incoming Good** | Get Many, Get, Create |
| **Inventory Stock** | Get Many, Remove |
| **Third Party** | Get Many, Get, Create, Update |

**Live dropdowns** — Warehouse and Location fields load options directly from your Pulpo WMS account.

### Pulpo WMS Trigger (trigger node)

Starts a workflow when a Pulpo WMS event occurs.

| Event | Description |
|---|---|
| **New Goods Receipt** | Fires when an incoming good document is created |
| **New/Updated Sales Order** | Fires when a sales order is created or updated |

The trigger registers a webhook in your Pulpo WMS account scoped to a specific warehouse. It automatically creates the webhook when the workflow is activated and removes it when deactivated.

## Compatibility

- Tested against n8n `1.x`
- Uses Pulpo WMS REST API v1 (`/api/v1`)

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Pulpo WMS website](https://pulpo.co)
- [Pulpo WMS API documentation](https://pulpo.co/api-docs)
- [Source code](https://github.com/Mhd-Bashi/PulpoWMS_n8n_Custom_Node)

## Version history

### 0.1.0
Initial release with full CRUD coverage for all core Pulpo WMS resources, live warehouse/location dropdowns, and webhook-based triggers.
