# Issue #2: Foundation — Credentials, Transport & Node Skeleton

GitHub: https://github.com/Mhd-Bashi/PulpoWMS_n8n_Custom_Node/issues/2
Type: AFK
Blocked by: None

## What to build

Replace the declarative stub with a fully working programmatic foundation:
- `PulpoWmsApi.credentials.ts` — OAuth2 Resource Owner Password Credentials grant (username, password, environment select: Test=eu-show / Live=eu); token via POST to /auth; auto-refresh on 401; test endpoint GET /iam/users/me
- `transport/request.ts` — `pulpoRequest()` and `pulpoRequestAll()` helpers
- `PulpoWms.node.ts` — programmatic class with execute() routing skeleton
- `package.json` — register both action node and trigger node in n8n.nodes

## Acceptance criteria

- [ ] Credentials implement OAuth2 password grant with environment selection
- [ ] Test endpoint hits GET /iam/users/me
- [ ] pulpoRequest() builds base URL from environment, injects Bearer token, throws NodeApiError on non-2xx
- [ ] pulpoRequestAll() loops limit/offset until total_results exhausted
- [ ] PulpoWms.node.ts is programmatic with working execute() skeleton
- [ ] package.json registers both node dist paths
- [ ] npm run build, lint, typecheck all pass
