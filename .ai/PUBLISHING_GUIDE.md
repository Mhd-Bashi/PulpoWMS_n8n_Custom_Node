\# n8n Community Node — Publishing & Verification Guide

Everything learned from publishing `n8n-nodes-weclapp` end-to-end.

---

## package.json — Required Fields

```json
{
  "name": "n8n-nodes-weclapp",
  "version": "0.2.4",
  "description": "...",
  "homepage": "https://github.com/<user>/<repo>#readme",
  "keywords": [
    "n8n-community-node-package",
    "weclapp"
  ],
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/<user>/<repo>.git"
  },
  "license": "MIT",
  "scripts": {
    "build": "tsc && find nodes \\( -name '*.svg' -o -name '*.node.json' \\) | while read f; do cp \"$f\" \"dist/${f}\"; done",
    "dev": "tsc --watch",
    "lint": "eslint . --ext .ts",
    "test": "jest --passWithNoTests",
    "prepublishOnly": "n8n-node prerelease",
    "release": "n8n-node release"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "strict": true,
    "credentials": [
      "dist/credentials/WeclappApi.credentials.js"
    ],
    "nodes": [
      "dist/nodes/Weclapp/Weclapp.node.js",
      "dist/nodes/Weclapp/WeclappTrigger.node.js"
    ]
  },
  "peerDependencies": {
    "n8n-workflow": "*"
  },
  "devDependencies": {
    "@n8n/node-cli": "latest",
    "release-it": "^20.0.1",
    "typescript": "^5.9.3"
  }
}
```

### Key rules
- `name` must start with `n8n-nodes-`
- `keywords` must include `n8n-community-node-package`
- `homepage` is required for verification (missed this, got feedback from n8n reviewer)
- `repository.url` must use `git+https://` prefix (npm auto-corrects it otherwise)
- **No runtime `dependencies`** — verified nodes cannot have any. Only `devDependencies` and `peerDependencies`.
- `n8n.strict: true` is required for verification
- `files` must include `dist`, `README.md`, and `LICENSE`

---

## Required Files Checklist

| File | Notes |
|---|---|
| `dist/nodes/*/Node.node.js` | Compiled node |
| `dist/nodes/*/Node.node.json` | Codex file — **must be copied to dist during build** |
| `dist/nodes/*/node.svg` | Icon — copied to dist during build |
| `dist/credentials/*.credentials.js` | Compiled credential |
| `README.md` | Must cover installation, credentials, operations |
| `LICENSE` | MIT or compatible |
| `package.json` | With all required fields above |

---

## Codex Files (Node.node.json)

Each node needs a codex file placed **next to** the `.node.ts` source file.
Named exactly `NodeName.node.json` (matches the `.node.ts` filename).

```json
{
  "node": "n8n-nodes-weclapp.weclapp",
  "nodeVersion": "1.0",
  "codexVersion": "1.0",
  "categories": ["Sales", "Productivity"],
  "resources": {
    "credentialDocumentation": [
      { "url": "https://github.com/<user>/<repo>#credentials" }
    ],
    "primaryDocumentation": [
      { "url": "https://github.com/<user>/<repo>#readme" }
    ]
  }
}
```

The `node` field format is `<package-name>.<nodeNameCamelCase>`.

> ⚠️ The build script must copy `.node.json` files to `dist/`. The default `tsc` command does NOT do this. See the `build` script above.

---

## GitHub Actions Workflows

### `.github/workflows/publish.yml`
Triggered on version tags (e.g. `0.2.4`). Publishes to npm with provenance.

```yaml
name: Publish

on:
  push:
    tags:
      - '*.*.*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run release
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Key points:
- `registry-url` in `setup-node` is **required** — it creates a `.npmrc` that wires `NODE_AUTH_TOKEN` to npm auth
- Use `NODE_AUTH_TOKEN` (not `NPM_TOKEN`) as the env var name in the run step
- `id-token: write` is required for npm provenance attestation

### `.github/workflows/ci.yml`
Runs on every push to main/master and on PRs.

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main, master]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

## Release Process (Step by Step)

### One-time npm setup

1. Create an npm account at [npmjs.com](https://npmjs.com)
2. Create a **Granular Access Token**:
   - npmjs.com → avatar → Access Tokens → Generate New Token → Granular Access Token
   - Packages: **All packages** (use this for first publish since package doesn't exist yet; after first publish, re-scope to specific package)
   - Permission: **Read and write**
3. Add the token as a GitHub secret:
   - GitHub repo → Settings → Secrets and variables → Actions → New repository secret
   - Name: `NPM_TOKEN`, Value: the token

### Every release

```bash
npm run release
```

This command (powered by `n8n-node release` / `release-it`) will:
1. Run lint + build
2. Prompt for version bump: patch / minor / major
3. Update `CHANGELOG.md`
4. Commit + create git tag + push to GitHub
5. GitHub Actions picks up the tag and publishes to npm **with provenance**

> ⚠️ `npm publish` directly is blocked by the `prepublishOnly` script.  
> Use `npm publish --ignore-scripts` only as a last resort for a first-time publish when GitHub Actions auth isn't working yet.

---

## Issues Faced & Solutions

### 1. `.venv/` and `.DS_Store` accidentally committed
**Cause:** `.gitignore` only had `node_modules/` and `dist/`.  
**Fix:** Add to `.gitignore`:
```
.venv/
.DS_Store
```
Then untrack: `git rm -r --cached .venv .DS_Store`

### 2. GitHub Actions: `ENEEDAUTH` — npm token not picked up
**Cause 1:** `NPM_TOKEN` secret was not saved in GitHub (showed as empty in logs).  
**Fix:** Go to GitHub repo → Settings → Secrets → verify `NPM_TOKEN` exists with a real value. GitHub masks set secrets as `***`; empty means it's not set.

**Cause 2:** Used `npm config set ... "$NPM_TOKEN"` in the workflow — unreliable.  
**Fix:** Use `setup-node` with `registry-url: 'https://registry.npmjs.org'` and pass `NODE_AUTH_TOKEN` as env var. This is the official GitHub Actions pattern.

### 3. Granular Access Token for a non-existent package
**Cause:** You can't scope a Granular Token to a package that doesn't exist on npm yet.  
**Fix:** For the very first publish, create the token with **All packages** scope. After the package is published, regenerate a token scoped to the specific package.

### 4. `npm publish` blocked by `prepublishOnly`
**Cause:** `n8n-node prerelease` intentionally blocks direct `npm publish` to force use of `npm run release`.  
**Fix for first-time workaround only:** `npm publish --ignore-scripts`

### 5. "Cannot set properties of undefined" error in n8n when installing
**Cause:** Codex `.node.json` files were not in the published `dist/` — the build script only copied SVGs.  
**Fix:** Update the build script to also copy `.node.json` files:
```bash
find nodes \( -name '*.svg' -o -name '*.node.json' \) | while read f; do cp "$f" "dist/${f}"; done
```

### 6. npm warning: `repository.url` was normalized
**Cause:** URL was `https://github.com/...` instead of `git+https://github.com/...`.  
**Fix:** Use `git+https://` prefix in `repository.url`.

### 7. n8n verification feedback: missing `homepage` field
**Fix:** Add to `package.json`:
```json
"homepage": "https://github.com/<user>/<repo>#readme"
```

### 8. `release-it`: "No commits since the latest tag"
**Cause:** Running `npm run release` again without any new commits.  
**Fix:** Make at least one real commit before running the next release.

### 9. GITHUB_TOKEN warning during `npm run release`
**Cause:** `release-it` wants a `GITHUB_TOKEN` to create a GitHub Release page.  
**This is just a warning** — not an error. The tag push and npm publish still work. Set `GITHUB_TOKEN` env var if you want release notes on GitHub too.

---

## n8n Community Node Verification Requirements

From [n8n docs](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/):

- Package name starts with `n8n-nodes-` or `@scope/n8n-nodes-`
- Keywords include `n8n-community-node-package`
- Exactly one third-party service per package (trigger node for the same service is allowed)
- No runtime `dependencies` — only `devDependencies` and `peerDependencies`
- TypeScript only
- All text (parameter names, descriptions, README) must be in **English**
- Must have a README with installation and credential setup instructions
- **From May 1 2026:** must be published via GitHub Actions with npm provenance

### Verification scanner
After publishing, run:
```bash
npx @n8n/scan-community-package n8n-nodes-weclapp
```
Must show: `✅ Package has passed all security checks`

### Submit for verification
Fill in the [n8n submission form](https://www.notion.so/n8n/Submit-a-community-node-for-verification-0f32a5bc894d4aa9a5b5c35ef5566f1a).

---

## Running n8n Locally with Docker

### Start n8n on default port 5678
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

### Start a second n8n instance on a different port (e.g. 5679)
Use a different port mapping, container name, and volume:
```bash
docker run -it --rm \
  --name n8n-test \
  -p 5679:5678 \
  -v n8n_test_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```
Open at `http://localhost:5679`

### Key flags
| Flag | Purpose |
|---|---|
| `-p 5679:5678` | Maps host port 5679 → container port 5678 |
| `-v n8n_test_data:/home/node/.n8n` | Named volume for persistent data (separate from main instance) |
| `--rm` | Auto-removes container on stop (clean slate) |
| `--name n8n-test` | Container name (must be unique) |

### Install community node in fresh instance
Settings → Community Nodes → Install → `n8n-nodes-weclapp`

### Run n8n locally without Docker (npm)
```bash
npm install -g n8n
n8n start
```
Or on a custom port:
```bash
n8n start --port 5679
```
Data is stored in `~/.n8n` by default.

---

## .gitignore (minimum)

```
node_modules/
dist/
*.js.map
.venv/
.DS_Store
```

## Useful Links:
[Submit community nodes: ](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes)
[Creator Portal: ](https://creators.n8n.io/nodes/n8n-nodes-weclapp/integration)