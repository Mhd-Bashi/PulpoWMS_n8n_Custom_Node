# Building a New n8n Community Node — Setup & Prompt Guide

How to brief Claude efficiently when starting a new custom node from scratch.

---

## Supporting Files to Prepare

### 1. OpenAPI spec (`openapi.yaml` or `openapi.json`) — most important
Gives endpoint paths, field names, types, required vs optional, and request/response shapes without guessing. If the API has no spec, a structured markdown API reference works but adds back-and-forth.

### 2. `.ai/prompt.md` — implementation brief

```markdown
## Target API
- Base URL pattern: `https://{tenant}.example.com/api/v1`
- Auth: API key in header `AuthenticationToken` (or OAuth, Basic, etc.)

## Resources to implement
| Resource | Operations | Notes |
|---|---|---|
| customer | getById, search, create, update, delete | has customAttributes |
| invoice | getById, search, create | date fields: invoiceDate, dueDate |
| document | getById, search | read-only — no create/update/delete |

## Special behaviors
- All date fields come as Unix timestamps (ms) — convert to/from ISO 8601
- Pagination: `page` + `pageSize` params; response shape: `{ result: [...], totalPages: N }`
- List endpoints accept a `serializeNulls` param — omit it
```

### 3. Reference node (optional, speeds up style matching)
If you already have a built node, point to it so the new one matches code style exactly without re-deriving conventions.

---

## The Prompt Template

```
Build an n8n community node for [SERVICE NAME].

API spec: @openapi.yaml
Implementation rules: @.ai/prompt.md
Follow patterns from: @nodes/Weclapp/Weclapp.node.ts

Package name: n8n-nodes-[service]
Credential: [e.g. "API key passed as header AuthenticationToken"]

Start with a plan — list resources, their operations, and any API quirks —
then implement one resource at a time.
```

---

## What Slows Things Down vs What Speeds Them Up

| Without good prep | With good prep |
|---|---|
| Deriving field names from prose docs | OpenAPI spec → fields extracted directly |
| Discovering pagination pattern mid-build | State it upfront in `.ai/prompt.md` |
| Finding read-only resources after implementing create/update | Mark them in the resource table |
| No style reference → inconsistent code | Point to an existing node file |

The minimum viable setup is: **OpenAPI spec + resource table in `.ai/prompt.md`**. With those two, a full node (credentials, main node, trigger, tests, README) can be done in one session.

---

## File Structure to Create Upfront

```
n8n-nodes-[service]/
├── .ai/
│   ├── prompt.md          ← implementation brief (see above)
│   └── openapi.yaml       ← API spec
├── nodes/
│   └── [Service]/
│       ├── [Service].node.ts
│       ├── [Service].node.json     ← codex (must exist next to .node.ts)
│       ├── [Service].svg           ← icon
│       ├── WeclappTrigger.node.ts  ← if webhooks are supported
│       ├── WeclappTrigger.node.json
│       └── descriptions/
│           ├── shared.ts
│           └── [resource].ts       ← one file per resource
├── credentials/
│   └── [Service]Api.credentials.ts
└── package.json
```

> See `PUBLISHING_GUIDE.md` for everything needed after the node is built — npm setup, GitHub Actions, and n8n verification.

> See `FLOWS_NAMING_CONVENTIONS.md` ONLY when you're asked to build a flow for everything needed for naming the flow.


## Useful n8n Links:
[Docker Installation: ](https://docs.n8n.io/hosting/installation/docker/#prerequisites)
[Install private nodes: ](https://docs.n8n.io/integrations/creating-nodes/deploy/install-private-nodes)
[Submit community nodes: ](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes)
[Creator Portal: ](https://creators.n8n.io/nodes/n8n-nodes-weclapp/integration)
[SSL Error when using HTTP node: ](https://community.n8n.io/t/ssl-error-when-using-http-node/29928/4)
**ERROR**: SSL Issue: consider using the ‘Ignore SSL issues’ option
write EPROTO 384B3317447F0000:error:0A000438:SSL routines:ssl3_read_bytes:tlsv1 alert internal error:…/deps/openssl/openssl/ssl/record/rec_layer_s3.c:1586:SSL alert number 80

**Potential Solution:**
Remove the Host header from your HTTP Request and let me know if that works? I have a feeling it might solve the problem.
