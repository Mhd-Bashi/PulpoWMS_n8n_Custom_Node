# ISSUES

Local issue files from `.ai/issues/` are provided at start of context. Parse them to understand the open issues.

You will work on the AFK issues only, not the HITL ones.

You've also been passed a file containing the last few commits. Review these to understand what work has been done.

If all AFK tasks are complete, output <promise>NO MORE TASKS</promise>.

---

# TASK SELECTION

Pick the next task. Prioritize tasks in this order:

1. Critical bugfixes
2. Development infrastructure
   - This includes tests, types, scripts, CI setup, and node scaffolding
3. Tracer bullets for new features
   - Build minimal end-to-end slices first before expanding
4. Polish and quick wins
5. Refactors

---

# EXPLORATION

Explore the repo before making changes. Understand architecture, patterns, and existing constraints.

---

# IMPLEMENTATION (STRICT TECH CONSTRAINTS)

Use `/tdd` to complete the task.

## Node authoring rules
- All nodes must be implemented as **programmatic TypeScript classes** implementing `INodeType`
- Every node file must export a class with a `description: INodeTypeDescription` property and an `execute()` method
- Use `IExecuteFunctions` as the context type inside `execute()`; never use raw `this` access outside n8n's provided helpers
- All node inputs/outputs must be declared in `description.inputs` / `description.outputs`
- Node properties must be defined in `description.properties` using `INodeProperties` — no ad-hoc property access
- Use `this.getNodeParameter()` for all user-facing parameter reads inside `execute()`
- Credentials must be declared in `description.credentials` and accessed via `this.getCredentials()`
- Never hardcode secrets or auth tokens in node logic
- HTTP requests must use `this.helpers.httpRequest()` or `this.helpers.httpRequestWithAuthentication()` — never use `fetch`, `axios`, or `node-fetch` directly
- Return data as `INodeExecutionData[][]` — always wrap items with `{ json: ... }`, and include `pairedItem` where applicable
- Error handling must use `NodeOperationError` or `NodeApiError` from `n8n-workflow` — never throw plain `Error`
- If the node supports multiple operations, implement an `operation` parameter and route logic cleanly with a switch or strategy map

## Credential authoring rules
- Credentials must implement `ICredentialType`
- Declare all fields in `properties: INodeProperties[]`
- Set `authenticate` for credentials that inject into requests automatically
- Use `test` block to validate credentials against a real endpoint where possible

## Package & tooling rules
- Package must use `n8n-nodes-base` peer dependency pattern — do not bundle n8n itself
- `package.json` must include `n8n.nodes` and `n8n.credentials` arrays pointing to compiled dist paths
- All source in `src/`, compiled output in `dist/` via `tsc`
- `tsconfig.json` must target `ES2019` or later and output CommonJS (`"module": "commonjs"`)
- Linting must use `@typescript-eslint` — match the rule set in `.eslintrc.js` if it exists
- Do not introduce new `npm` packages without justification; prefer utilities already available via `n8n-workflow`

## Architecture rules
- One class per file — node class and credential class must not share a file
- Nodes must be stateless — no module-level mutable state
- Keep `execute()` readable: extract sub-logic into private methods or helper modules, not inline
- Icon must be an SVG placed alongside the node file and referenced in `description.icon`

---

# FEEDBACK LOOPS

Before committing, run all of the following and fix every issue:

- `npm run lint` — zero ESLint errors required
- `npm run typecheck` — zero TypeScript errors required
- `npm run build` — `dist/` must compile cleanly
- `npm run test` — all unit tests must pass
- Manually verify node loads in n8n: run `n8n start` with `N8N_CUSTOM_EXTENSIONS` pointing to the package and confirm the node appears in the editor without console errors

---

# COMMIT

Make a git commit. The commit message must include:

1. Key decisions made
2. Files changed
3. Blockers or notes for next iteration

---

# TASK COMPLETION

If the task is complete:
- Move the issue file to `.ai/issues/done/`

If the task is incomplete:
- Add a note to the issue file explaining what was done and what remains

---

# FINAL RULES

- ONLY WORK ON A SINGLE TASK
- Always prefer correctness and n8n API consistency over speed
- Do not skip lint, type checks, or build steps
- Do not introduce new libraries without justification