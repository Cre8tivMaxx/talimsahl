# Skill Build Spec: `frappe-impeccable`

**Hand this entire document to an AI with a fresh context window. It is self-contained.**

---

## What you are building

A new Claude Code skill called **`frappe-impeccable`**, installed at
`~/.claude/skills/frappe-impeccable/`. It is the merger of three capabilities
into one skill:

1. **impeccable** commands (live, document, craft, shape, audit, polish, bolder,
   quieter, typeset, colorize, layout, animate, delight, overdrive, clarify,
   adapt, optimize) — adapted for Frappe's architecture (no HMR, no Vite, no
   injectable HTML entry file).

2. **frappe-visual-reviewer** — authenticated screenshot loop: mints a Frappe
   session sid server-side, injects it into Playwright Chromium, captures
   full-page screenshots of live Desk routes, reports console errors.

3. **Code navigator** — instant grep that maps any visual symptom (CSS selector,
   JS event, element class) to the exact `file:line` that controls it across the
   app's CSS and JS files. The AI never has to read whole files to find where
   to edit.

**This skill is app-agnostic.** It works in any Frappe app that customizes
Desk or portal UI. It discovers what files to search and build by reading
the app's `hooks.py`, not by hardcoding filenames. The first thing every
script does is detect the bench root, the site, and the current app from
the working directory.

---

## Generic design — the core principle

Every script must be runnable from **any directory inside a Frappe bench**
and figure out the rest automatically:

```
User runs: /frappe-impeccable live /app/home
Script runs from: /home/frappe/frappe-bench-16/apps/myapp

→ Walks up CWD to find bench root (has sites/common_site_config.json)
→ Reads sites/currentsite.txt for site name
→ Reads sites/common_site_config.json for webserver_port
→ Detects app name from CWD (dirname = "myapp")
→ Reads apps/myapp/hooks.py → parses app_include_css, app_include_js
→ Resolves those paths → these are the files nav.mjs searches
→ Reads apps/myapp/hooks.py → parses after_install / after_migrate → finds install.py
→ Runs gen_sid.py under bench env/bin/python → mints Administrator sid
→ Launches Playwright with that sid → navigates to /app/home
→ All done — no hardcoded paths anywhere
```

---

## File structure to create

```
~/.claude/skills/frappe-impeccable/
├── SKILL.md
├── package.json
├── scripts/
│   ├── gen_sid.py           # COPY verbatim from frappe-visual-reviewer
│   ├── review.mjs           # COPY verbatim from frappe-visual-reviewer
│   ├── context.mjs          # discovers app, bench, CSS/JS files, prints JSON
│   ├── live.mjs             # starts Playwright CSS-injection session
│   ├── live-inject.mjs      # injects CSS into live Desk via Playwright
│   ├── live-screenshot.mjs  # authenticated screenshot → JPEG
│   ├── live-accept.mjs      # writes accepted CSS to the right source file
│   ├── live-status.mjs      # reports current live session state
│   ├── nav.mjs              # CODE NAVIGATOR: grep → file:line results
│   ├── bench.mjs            # shared helpers: detect bench/app/port, mint sid, build
│   └── detect.mjs           # heuristic: which Frappe surfaces need attention
├── references/
│   ├── frappe-selectors.md  # stable Frappe v16 selector inventory (framework-level, generic)
│   ├── frappe-review-checklist.md  # COPY verbatim from frappe-visual-reviewer
│   ├── live.md
│   ├── document.md
│   ├── craft.md
│   ├── audit.md
│   ├── polish.md
│   ├── bolder.md
│   ├── quieter.md
│   ├── typeset.md
│   ├── colorize.md
│   ├── layout.md
│   ├── animate.md
│   ├── delight.md
│   └── adapt.md
└── sessions/                # runtime live-session journals (gitignored)
```

---

## scripts/bench.mjs — the discovery foundation

Every other script imports from here. Write it first.

```javascript
// scripts/bench.mjs
import { execSync, spawnSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, resolve } from 'path';
import { fileURLToPath } from 'url';

/**
 * Walk up from startDir until we find a directory containing
 * sites/common_site_config.json — that's the bench root.
 */
export function detectBench(startDir = process.cwd()) {
  let cur = resolve(startDir);
  while (true) {
    if (existsSync(join(cur, 'sites', 'common_site_config.json'))) return cur;
    const parent = dirname(cur);
    if (parent === cur) throw new Error(
      `Could not find a Frappe bench root from ${startDir}. ` +
      `Run this script from inside a bench tree.`
    );
    cur = parent;
  }
}

/**
 * Detect which app the user is currently working in.
 * Strategy (first match wins):
 *   1. --app flag passed explicitly
 *   2. CWD is inside bench/apps/<appname>/  → use appname
 *   3. bench/sites/currentsite.txt exists, read installed_apps from site DB
 *      — but this requires frappe, so skip unless nothing else works
 *   4. Error with helpful message
 */
export function detectApp(benchRoot, explicitApp = null) {
  if (explicitApp) return explicitApp;

  const cwd = resolve(process.cwd());
  const appsDir = join(benchRoot, 'apps');

  // Check if CWD is inside bench/apps/<something>/
  if (cwd.startsWith(appsDir + '/')) {
    const rel = cwd.slice(appsDir.length + 1);
    const appName = rel.split('/')[0];
    if (appName) return appName;
  }

  // Fallback: list apps dir, exclude frappe/erpnext/hrms/education (core apps),
  // return first custom app found
  const coreApps = new Set(['frappe', 'erpnext', 'hrms', 'education', 'payments',
    'lending', 'healthcare', 'manufacturing', 'agriculture']);
  const appDirs = readdirSync(appsDir).filter(d => {
    if (coreApps.has(d)) return false;
    return existsSync(join(appsDir, d, 'hooks.py'));
  });
  if (appDirs.length === 1) return appDirs[0];
  if (appDirs.length > 1) throw new Error(
    `Multiple custom apps found: ${appDirs.join(', ')}. ` +
    `Run from inside an app directory or pass --app <name>.`
  );
  throw new Error('No custom app found. Pass --app <name>.');
}

/**
 * Detect the default site name.
 */
export function detectSite(benchRoot, explicitSite = null) {
  if (explicitSite) return explicitSite;
  const f = join(benchRoot, 'sites', 'currentsite.txt');
  if (existsSync(f)) return readFileSync(f, 'utf8').trim();
  throw new Error('No --site given and no currentsite.txt. Pass --site <sitename>.');
}

/**
 * Read webserver_port from common_site_config.json, default 8000.
 */
export function detectPort(benchRoot) {
  const f = join(benchRoot, 'sites', 'common_site_config.json');
  if (existsSync(f)) {
    try {
      return JSON.parse(readFileSync(f, 'utf8')).webserver_port || 8000;
    } catch { /* ignore */ }
  }
  return 8000;
}

/**
 * Parse hooks.py of the given app and return the CSS + JS files loaded
 * into Desk (app_include_css, app_include_js) and portal (web_include_css,
 * web_include_js). Paths are relative to the app's public/ directory;
 * we resolve them to absolute paths.
 *
 * This is the key to being app-agnostic: we never hardcode filenames.
 */
export function discoverAppAssets(benchRoot, appName) {
  const appRoot = join(benchRoot, 'apps', appName);
  const hooksPy = join(appRoot, 'hooks.py');
  if (!existsSync(hooksPy)) throw new Error(`hooks.py not found at ${hooksPy}`);

  const src = readFileSync(hooksPy, 'utf8');

  function extractList(key) {
    // Match: key = ["...", "...",] or key = ["..."]  (multiline too)
    const re = new RegExp(`${key}\\s*=\\s*\\[([\\s\\S]*?)\\]`, 'm');
    const m = src.match(re);
    if (!m) return [];
    return [...m[1].matchAll(/["']([^"']+)["']/g)].map(x => x[1]);
  }

  const deskCss = extractList('app_include_css');
  const deskJs  = extractList('app_include_js');
  const webCss  = extractList('web_include_css');
  const webJs   = extractList('web_include_js');

  // Frappe resolves these paths from the app's public/ directory.
  // e.g. "/assets/myapp/css/desk.css" → appRoot/public/css/desk.css
  function resolve_asset(assetPath) {
    // Strip leading /assets/<appname>/ if present
    const stripped = assetPath.replace(new RegExp(`^/?assets/${appName}/`), '');
    // Also strip /assets/ prefix alone (some apps do /assets/myapp.css)
    const stripped2 = stripped.replace(/^\/assets\//, '');
    const candidate = join(appRoot, 'public', stripped2);
    if (existsSync(candidate)) return candidate;
    // Try without the "public" segment (some apps put files at app root level)
    const candidate2 = join(appRoot, stripped2);
    if (existsSync(candidate2)) return candidate2;
    return null; // file may not exist yet (new project)
  }

  // Also discover JS reskin modules: any *.js files in public/js/ subdirectories
  // that are imported by bundle files, found by scanning for *.bundle.js
  const publicJs = join(appRoot, 'public', 'js');
  const bundleFiles = [];
  const reskinModules = [];
  if (existsSync(publicJs)) {
    function walk(dir) {
      for (const f of readdirSync(dir)) {
        const full = join(dir, f);
        if (statSync(full).isDirectory()) { walk(full); continue; }
        if (f.endsWith('.bundle.js')) bundleFiles.push(full);
        else if (f.endsWith('.js')) reskinModules.push(full);
      }
    }
    walk(publicJs);
  }

  return {
    appRoot,
    appName,
    hooksPy,
    deskCss: deskCss.map(resolve_asset).filter(Boolean),
    deskJs:  deskJs.map(resolve_asset).filter(Boolean),
    webCss:  webCss.map(resolve_asset).filter(Boolean),
    webJs:   webJs.map(resolve_asset).filter(Boolean),
    bundleFiles,
    reskinModules,
    // All CSS + JS files nav.mjs should search
    searchable: [
      ...deskCss.map(resolve_asset).filter(Boolean),
      ...webCss.map(resolve_asset).filter(Boolean),
      ...deskJs.map(resolve_asset).filter(Boolean),
      ...webJs.map(resolve_asset).filter(Boolean),
      ...bundleFiles,
      ...reskinModules,
      hooksPy,
      join(appRoot, 'install.py'),
    ].filter((v, i, a) => v && a.indexOf(v) === i), // deduplicate
  };
}

/**
 * Find the bundled Playwright Chromium binary.
 * Playwright MCP is pinned to "chrome" channel (not installed on most dev machines).
 * Always use playwright-core + explicit executablePath.
 */
export function findChromium() {
  const base = join(process.env.HOME, '.cache', 'ms-playwright');
  if (!existsSync(base)) throw new Error(
    'Playwright Chromium not found. Run: npx playwright install chromium'
  );
  const result = spawnSync('find', [base, '-name', 'chrome', '-type', 'f'],
    { encoding: 'utf8' });
  const paths = (result.stdout || '').trim().split('\n').filter(Boolean);
  if (!paths.length) throw new Error(
    'Chromium binary not found under ~/.cache/ms-playwright'
  );
  // Prefer the newest one if multiple versions exist
  return paths.sort().at(-1);
}

/**
 * Mint a Frappe session sid for the given user without a password.
 * MUST run gen_sid.py under the bench's own Python (env/bin/python),
 * not system Python — needs frappe importable.
 */
export function mintSid(benchRoot, site, user = 'Administrator') {
  const genSidPy = join(dirname(fileURLToPath(import.meta.url)), 'gen_sid.py');
  const python   = join(benchRoot, 'env', 'bin', 'python');
  const sitesDir = join(benchRoot, 'sites');
  const result   = spawnSync(python, [genSidPy, '--site', site, '--user', user],
    { encoding: 'utf8', cwd: sitesDir });
  if (result.status !== 0) throw new Error(
    `gen_sid.py failed: ${result.stderr || result.error}`
  );
  return result.stdout.trim();
}

/**
 * Run bench build for a specific app. Runs from bench root.
 */
export function benchBuild(benchRoot, appName) {
  return spawnSync('bench', ['build', '--app', appName],
    { cwd: benchRoot, stdio: 'inherit', encoding: 'utf8' });
}

/**
 * Clear Frappe caches for the site.
 */
export function clearCache(benchRoot, site) {
  spawnSync('bench', ['--site', site, 'clear-cache'],
    { cwd: benchRoot, stdio: 'inherit' });
  spawnSync('bench', ['--site', site, 'clear-website-cache'],
    { cwd: benchRoot, stdio: 'inherit' });
}
```

---

## scripts/context.mjs — app discovery + state summary

Reads all flags, calls bench.mjs discovery functions, prints a JSON summary.
No hardcoded app names or paths.

```bash
# Usage (all flags optional — auto-detected from CWD if omitted)
node scripts/context.mjs [--app myapp] [--site mysite] [--bench /path/to/bench]
```

Output:
```json
{
  "bench": "/home/frappe/frappe-bench-16",
  "site": "erp.local",
  "port": 8002,
  "appName": "myapp",
  "appRoot": "/home/frappe/frappe-bench-16/apps/myapp",
  "hasDesign": false,
  "hasProduct": false,
  "assets": {
    "deskCss": ["/abs/path/to/desk-overrides.css", "/abs/path/to/brand-tokens.css"],
    "deskJs": ["/abs/path/to/desk_reskin.bundle.js"],
    "webCss": ["/abs/path/to/portal.css"],
    "reskinModules": ["/abs/path/to/navbar.js", "/abs/path/to/sidebar.js"]
  },
  "searchable": ["...all paths nav.mjs should search..."],
  "lastBuild": "2026-06-22T14:30:22Z"
}
```

The AI reads this JSON at the start of every command. From this point on it
knows exactly which files exist and where — no guessing, no hardcoding.

`hasDesign` is true if `DESIGN.md` exists in the appRoot.
`hasProduct` is true if `PRODUCT.md` exists in the appRoot.
`lastBuild` is the mtime of the newest file in `appRoot/public/css/` or
`appRoot/<appname>/public/css/` (Frappe puts built assets in the latter for
installed apps). Whichever is newer.

---

## scripts/nav.mjs — CODE NAVIGATOR

```bash
# Usage
node scripts/nav.mjs --query ".list-row-head" [--app myapp] [--bench /path]
node scripts/nav.mjs --query "--primary"
node scripts/nav.mjs --query "form-hero"
node scripts/nav.mjs --query "app_include_css"
```

### How it discovers what to search

It does NOT have a hardcoded file list. It calls `discoverAppAssets()` from
`bench.mjs` to get the `searchable` array, then searches all of them.

```javascript
import { detectBench, detectApp, detectSite, discoverAppAssets } from './bench.mjs';
import { readFileSync, existsSync } from 'fs';
import { parseArgs } from 'util';

const { values } = parseArgs({ options: {
  query:  { type: 'string' },
  app:    { type: 'string' },
  bench:  { type: 'string' },
} });

const benchRoot = detectBench(values.bench);
const appName   = detectApp(benchRoot, values.app);
const assets    = discoverAppAssets(benchRoot, appName);

const query = values.query;
const results = [];

for (const filePath of assets.searchable) {
  if (!existsSync(filePath)) continue;
  const lines = readFileSync(filePath, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (!line.includes(query)) return;
    const before = lines.slice(Math.max(0, i - 2), i).join('\n');
    const after  = lines.slice(i + 1, i + 4).join('\n');
    results.push({
      file: filePath.replace(benchRoot + '/', ''),  // relative to bench root
      line: i + 1,
      snippet: line.trim().slice(0, 120),
      context: (before + '\n' + line + '\n' + after).slice(0, 300),
      relevance: classifyHit(line, query, filePath),
    });
  });
}

// Sort: selector-definition first, then css-variable-definition, then the rest
results.sort((a, b) => relevanceScore(b.relevance) - relevanceScore(a.relevance));
console.log(JSON.stringify(results.slice(0, 20), null, 2));
```

Relevance classification (`classifyHit`):
- `selector-definition` — CSS file, line contains query + `{`
- `css-variable-definition` — line matches `--<query>:` or `--<query> :`
- `token-usage` — line contains `var(--` + query
- `js-reference` — file ends in `.js`
- `python-reference` — file ends in `.py`
- `selector-usage` — everything else that matches

Relevance score order: selector-definition > css-variable-definition > token-usage
> selector-usage > js-reference > python-reference

Cap at 20 results. Each result's `file` path is relative to the bench root so
it's readable and consistent regardless of where the bench lives.

### Why this is the skill's superpower

Without nav.mjs, the AI reads 1500-line CSS files to find one rule — burning
~3000 tokens and 10 seconds of read time. With nav.mjs, the answer is:

```
apps/myapp/public/css/desk-overrides.css:847  .list-row-head {
```

The AI makes one targeted edit at line 847. Total token cost: ~200.

---

## scripts/live.mjs — Frappe live mode (Playwright CSS injection)

### Why not impeccable's live.mjs

impeccable requires: a Vite/Next/Bun dev server, HMR, an injectable HTML
entry file, and `live.js` served from a local port. Frappe has none of these.
Frappe Desk is served by gunicorn; CSS requires `bench build` to compile.

### The alternative: Playwright addStyleTag

`page.addStyleTag({ content: cssRule })` applies CSS instantly to the live
Desk — no build step. The injection survives navigation within the same
browser context. When the user accepts a variant, we write it to the source
CSS file (discovered via `discoverAppAssets`) and run `bench build` once.

### Interface

```bash
node scripts/live.mjs [--app myapp] [--site erp.local] [--bench /path] [--stop SESSION_ID]
```

Start: discovers bench/app/port, mints sid, launches Playwright Chromium with
the sid cookie, saves `sessions/<timestamp>/session.json`:

```json
{
  "id": "fi_20260622_143022",
  "appName": "myapp",
  "benchRoot": "/home/frappe/frappe-bench-16",
  "site": "erp.local",
  "port": 8002,
  "baseUrl": "http://localhost:8002",
  "sid": "<minted-sid>",
  "browserWSEndpoint": "ws://127.0.0.1:...",
  "injectedCSS": [],
  "deskCssFiles": ["/abs/path/to/desk-overrides.css"],
  "started": "2026-06-22T14:30:22Z"
}
```

`deskCssFiles` is populated from `discoverAppAssets().deskCss` — this is
where `live-accept.mjs` will write the final accepted CSS.

Stop: `--stop SESSION_ID` closes the browser and removes the session file.

---

## scripts/live-inject.mjs

```bash
node scripts/live-inject.mjs \
  --session fi_20260622_143022 \
  --css "html:root, :root:root { --primary: #0D9B8A; }"
```

Connects to the existing browser context (via `browserWSEndpoint` from
session.json), injects the CSS via `page.addStyleTag({ content })`. Returns:

```json
{
  "ok": true,
  "tagHandle": "fi-tag-3",
  "note": "Injected — preview only. Call live-accept.mjs to persist."
}
```

Does NOT write to any file. Does NOT run bench build.

---

## scripts/live-screenshot.mjs

```bash
node scripts/live-screenshot.mjs \
  --session fi_20260622_143022 \
  --route /app/home \
  [--mobile]
```

Connects to existing browser context, navigates if needed, waits for
`networkidle`, verifies `frappe.session.user !== 'Guest'`, takes full-page
screenshot. Saves to `sessions/<id>/screenshots/shot_<n>.jpg` (JPEG, quality
75, max-width 1200px). Returns:

```json
{
  "ok": true,
  "path": "sessions/fi_20260622_143022/screenshots/shot_003.jpg",
  "route": "/app/home",
  "loggedInAs": "Administrator",
  "consoleErrors": [],
  "viewport": "desktop"
}
```

If `loggedInAs` is `"Guest"`, the sid expired or was rejected. The AI must
re-run `live.mjs` to mint a fresh session and retry.

---

## scripts/live-accept.mjs

```bash
node scripts/live-accept.mjs \
  --session fi_20260622_143022 \
  --css ".list-row-head { background: var(--subtle-fg); }" \
  --target-file "/abs/path/to/desk-overrides.css" \
  --after-line 847
```

Writes the accepted CSS rule to the target file at the correct position
(after the line indicated by nav.mjs, or appended to end of file).

Uses a simple strategy:
1. If `--after-line` provided: insert after that line number (from nav.mjs results).
2. If a matching selector block already exists in the file: replace it.
3. Otherwise: append to end of file with a comment `/* accepted via frappe-impeccable */`.

After writing: runs `bench build --app <appName>` and `bench --site <site> clear-cache`.
Reports build output. Returns:

```json
{
  "ok": true,
  "file": "apps/myapp/public/css/desk-overrides.css",
  "line": 847,
  "buildOk": true,
  "buildOutput": "...bench build stdout..."
}
```

---

## SKILL.md — the manifest

```markdown
---
name: frappe-impeccable
description: Use when designing, iterating, reviewing, auditing, or polishing
  any Frappe Desk reskin or portal UI. App-agnostic — auto-detects the current
  app from CWD. Combines authenticated live CSS injection (no HMR needed),
  impeccable-style design commands adapted for Frappe's architecture, screenshot
  verification with admin session, and a code navigator that maps any visual
  symptom to the exact file:line to edit.
version: 1.0.0
user-invocable: true
argument-hint: "[live|document|craft|shape|audit|polish|bolder|quieter|typeset|colorize|layout|animate|delight|adapt|nav] [target]"
---
```

### Setup section in SKILL.md

Run at the start of EVERY command invocation:

1. Run `node scripts/context.mjs` from the current working directory.
   Read the JSON. This tells you:
   - The bench root, site, port, app name, app root
   - Which CSS/JS files the app loads into Desk (from hooks.py)
   - Which files nav.mjs will search
   - Whether DESIGN.md / PRODUCT.md exist

2. Read `references/frappe-selectors.md` once per session. These are
   Frappe v16 stable selectors — framework-level, same for every app.

3. If `hasDesign: false` and the command is anything other than `document`,
   note it once: "DESIGN.md not found — consider running `/frappe-impeccable
   document` to capture this app's visual system." Never block on this.

4. The `assets.deskCss` array from context.mjs output is the list of CSS
   files the AI should edit. Never edit any other file for CSS changes.
   Never guess filenames — trust context.mjs.

### Commands table

| Command | Purpose |
|---|---|
| `live [route]` | Playwright CSS injection loop: screenshot → nav → inject → iterate → accept |
| `document` | Extract DESIGN.md from hooks.py + CSS files + computed styles |
| `craft [feature]` | End-to-end: shape → build → verify |
| `shape [feature]` | Plan UX/UI approach before touching any code |
| `audit [route]` | Frappe-review-checklist + nav.mjs file:line for every finding |
| `polish [target]` | Final quality pass before commit |
| `bolder [target]` | Amplify bland/safe areas of the reskin |
| `quieter [target]` | Pull back aggressive overrides |
| `typeset [target]` | Typography hierarchy improvements |
| `colorize [target]` | Color strategy |
| `layout [target]` | Spacing and rhythm |
| `animate [target]` | Purposeful motion |
| `delight [target]` | Micro-interaction personality touches |
| `adapt [target]` | Responsive + RTL fixes |
| `nav <query>` | Find file:line for any selector, CSS var, class, or JS symbol |

### Routing rules

Same as impeccable: first word matches a command → load `references/<cmd>.md`
and follow it. No match → run context.mjs, suggest top 2–3 commands based on
signals. Never auto-run; always confirm with user.

---

## references/live.md

### The Frappe live loop

```
SETUP:
  1. node scripts/live.mjs → SESSION_ID
  2. node scripts/live-screenshot.mjs --session ID --route /app/<target>
  3. Read screenshot. Identify what to improve.

ITERATE:
  4. node scripts/nav.mjs --query <selector>  ← MANDATORY before any CSS edit
     Read file:line from output.
  5. Plan 3 CSS variant approaches (different axes, same brand).
  6. For each variant:
     a. node scripts/live-inject.mjs --session ID --css "RULE"
     b. node scripts/live-screenshot.mjs --session ID --route /app/<target>
     c. Read screenshot → good? → ACCEPT. Need tweak? → inject new CSS.
  7. Also test RTL (if app supports Arabic):
     node scripts/live-inject.mjs adds rule, then separately:
     evaluate(() => document.documentElement.setAttribute('dir','rtl'))
     screenshot again.

ACCEPT:
  8. node scripts/live-accept.mjs --session ID --css "RULE" \
        --target-file <path from nav.mjs> --after-line <line from nav.mjs>
  9. Bench build runs automatically inside live-accept.mjs.
  10. Final screenshot confirms the built asset matches the injected preview.

CLEANUP:
  11. node scripts/live.mjs --stop SESSION_ID
```

### Frappe CSS injection rules (MANDATORY)

- **Never inject `display:none` on functional Frappe DOM.** Style in place.
- Override CSS variables with `html:root, :root:root` prefix (specificity 0,2,0
  beats Frappe's `:root` at 0,1,0 — no `!important` needed).
- For element overrides, target stable Frappe selectors directly.
- Injected CSS is preview-only. `live-accept.mjs` makes it permanent.
- The target file for writing is `assets.deskCss[0]` from context.mjs (the
  first/primary Desk CSS file). If the app has multiple Desk CSS files, check
  nav.mjs output to determine which one already defines the selector.

### Variant planning (same discipline as impeccable)

Plan 3 variants, each varying a different primary axis:
- **Color strategy** — how much brand color the surface carries
- **Density** — airy / comfortable / dense
- **Hierarchy** — which element commands the eye via scale/weight/contrast

All 3 must read as the same brand. Never introduce new palette hues in variants.
Use the palette from DESIGN.md if it exists; otherwise read from the app's CSS
variables discovered by context.mjs.

---

## references/document.md

When invoked, the AI must:

1. Run `context.mjs` → read `assets.deskCss` and `assets.webCss`.
2. Read each file in `assets.deskCss` in full (they are the app's CSS source).
3. Run `nav.mjs --query ":root"` to find all variable declarations.
4. Run `nav.mjs --query "@font-face"` to find custom fonts.
5. Run `nav.mjs --query "transition"` to find motion declarations.
6. Read `hooks.py` to understand what the app registers (after_install, etc.).

Generate `DESIGN.md` in the app root with:
- **App identity** (app name, Frappe version, what the app customizes)
- **Brand palette** (all CSS vars with their values)
- **CSS variable override strategy** (which specificity selector the app uses)
- **Surfaces styled** (navbar, sidebar, form, list, workspace, etc.)
- **Typography** (font families, scale)
- **Motion** (transitions/animations found)
- **Reskin approach** (stable-selector discipline, no functional DOM moves)
- **Key files** (with paths relative to bench root, from context.mjs output)
- **Gotchas** (any per-app quirks found in the CSS — e.g. RTL overrides,
  login page selector comments, etc.)

---

## references/audit.md

When invoked:

1. `context.mjs` → get session details.
2. `live.mjs` → mint session.
3. `live-screenshot.mjs --route <route> --mobile` (both viewports).
4. Read screenshots.
5. Score against `frappe-review-checklist.md` section by section.
6. For EVERY finding: run `nav.mjs --query <selector>` and include `file:line`
   in the report. The user should never have to search for where to fix.
7. Verdict: SHIP / FIX-FIRST / BLOCK.
8. FIX-FIRST items: propose the exact CSS change + the `live` command to iterate.

---

## references/craft.md

When invoked with a feature target (e.g. `craft sidebar quick actions`):

**Phase 1 — Shape (plan first)**
1. `context.mjs` → understand current state.
2. `live-screenshot.mjs` → see the surface.
3. Identify which Frappe selectors the feature targets.
4. Run `nav.mjs` for each relevant selector.
5. List: which CSS rules to add/modify, which file, which line, any JS changes.
6. Confirm plan with user.

**Phase 2 — Build**
1. For each CSS change: `nav.mjs` first → edit at the correct line.
2. For JS changes: edit the reskin module.
3. After all edits: `bench build --app <appName>` + `clear-cache`.

**Phase 3 — Verify**
1. `live-screenshot.mjs` on affected routes.
2. Score against checklist.
3. If issues: fix and repeat Phase 2–3.
4. Report: screenshots + verdict.

---

## references/frappe-selectors.md

This file is **app-agnostic** — it documents Frappe v16 framework selectors
that are stable across ALL apps. Write it as a compact reference:

```markdown
# Frappe v16 Stable Selector Inventory

These selectors are rendered by Frappe's own Python/JS for every app.
They do not change per-app. Pin to Frappe v16.x and re-verify after minor upgrades.

## Navbar
- `header.navbar` — native navbar (hide with body class, never remove)
- `.search-bar`, `.navbar-search` — search input
- `.dropdown-notifications`, `.notifications-icon` — notification bell
- `.dropdown-navbar-user` — user avatar + dropdown menu

## Sidebar
- `.body-sidebar` — sidebar container
- `.sidebar-item`, `.sidebar-item.selected` — nav item, active state
- `.sidebar-toggle-btn` — mobile hamburger

## List view
- `.result-list` — list body
- `.list-row` — individual row
- `.list-row-head` — column header row
- `.list-filters` — filter bar
- `.indicator-pill` — status badge
- `.list-paging-area` — pagination bar
- `.bulk-action-options` — bulk action bar

## Form
- `.form-section` — section card wrapper
- `.section-head`, `.section-body` — section header/body
- `.frappe-control` — any form field control
- `.form-grid` — child table grid
- `.standard-actions` — Save/Cancel/etc. button bar (NEVER hide)
- `frm.page.$title_area` — form title area

## Workspace
- `.widget-box` — widget container
- `.number-widget-box` — number card
- `.links-widget-box` — quick links
- `.shortcut-widget-box` — shortcut

## Modal / Dialog
- `.modal-dialog`, `.modal-content`, `.modal-header`, `.modal-body`, `.modal-footer`

## Indicators
- `.indicator-pill.green|red|blue|orange|yellow|gray`

## CSS variable root (how to override)
- `html:root, :root:root { }` — beats Frappe's `:root { }` (specificity 0,2,0 > 0,1,0)
- Key vars (present in all Frappe apps):
  `--primary`, `--primary-color`, `--navbar-bg`, `--sidebar-active-color`,
  `--bg-color`, `--border-color`, `--text-color`, `--heading-color`,
  `--card-bg`, `--modal-bg`, `--btn-default-bg`, `--sidebar-bg`

## Login page (portal — never remove these from HTML)
- `#login_email`, `#login_password`, `.btn-login` — auth inputs
- `.for-login`, `.for-signup`, `.for-forgot`, `.for-login-with-email-link` — section toggles
- `.form-login` — login form wrapper

## Do-Not-Touch (functional, never relocate or display:none)
- `.standard-actions` — form save buttons
- Login selectors above — `login.js` binds to them at runtime
```

---

## package.json

```json
{
  "name": "frappe-impeccable",
  "version": "1.0.0",
  "type": "module",
  "description": "Frappe Desk design iteration: live CSS injection + screenshot + code navigator. App-agnostic.",
  "scripts": {
    "postinstall": "npx playwright install chromium 2>/dev/null || true"
  },
  "dependencies": {
    "playwright-core": "^1.48.0"
  }
}
```

---

## Testing the skill after building

Run from inside any Frappe app directory:

```bash
# 1. Context — should auto-detect bench, site, port, app name, and CSS files
cd /path/to/bench/apps/myapp
node ~/.claude/skills/frappe-impeccable/scripts/context.mjs
# Expected: JSON with appName, bench, port, assets.deskCss populated from hooks.py

# 2. Nav — should return hits in the app's own CSS files (not hardcoded paths)
node ~/.claude/skills/frappe-impeccable/scripts/nav.mjs --query ".list-row"
# Expected: JSON array, file paths are relative to bench root

# 3. Live session
node ~/.claude/skills/frappe-impeccable/scripts/live.mjs
# Expected: session JSON with browserWSEndpoint and deskCssFiles

# 4. Screenshot
node ~/.claude/skills/frappe-impeccable/scripts/live-screenshot.mjs \
  --session <ID> --route /app/home
# Expected: JPEG saved, loggedInAs: "Administrator"

# 5. Inject CSS
node ~/.claude/skills/frappe-impeccable/scripts/live-inject.mjs \
  --session <ID> --css "body { outline: 2px solid red; }"
# Expected: ok:true, and a red outline visible in browser

# 6. Stop
node ~/.claude/skills/frappe-impeccable/scripts/live.mjs --stop <ID>
```

Verify on TWO different apps (e.g. talimsahl and a second custom app) to confirm
generic detection works. If step 1 prints the wrong app name, fix `detectApp()`
in bench.mjs.

---

## Source files to copy verbatim

From `~/.claude/skills/frappe-visual-reviewer/scripts/`:
- `gen_sid.py` → copy to `scripts/gen_sid.py` (no changes)
- `review.mjs` → copy to `scripts/review.mjs` (no changes)

From `~/.claude/skills/frappe-visual-reviewer/references/`:
- `frappe-review-checklist.md` → copy to `references/frappe-review-checklist.md`

These are tested and working. Do not rewrite them.

---

## Integration with frappe-visual-reviewer

The existing `frappe-visual-reviewer` skill is not deprecated. It remains the
right tool for batch review (multiple routes, full report.json).

`frappe-impeccable audit` delegates to it for screenshot capture:

```bash
~/.claude/skills/frappe-visual-reviewer/review.sh \
  --site <site> --routes <routes> --mobile
```

Then reads the output screenshots and report.json, and appends nav.mjs
`file:line` hits for each checklist finding — turning "this looks wrong"
into "fix it at `apps/myapp/public/css/desk.css:847`".

---

## What makes this skill generic (summary)

| Concern | How it's handled |
|---|---|
| App name | Detected from CWD (`apps/<appname>/`) |
| CSS files to edit | Parsed from `hooks.py → app_include_css` |
| JS files to search | Parsed from `hooks.py → app_include_js` + `public/js/` walk |
| Bench root | Walk up CWD for `sites/common_site_config.json` |
| Site name | `sites/currentsite.txt` |
| Port | `sites/common_site_config.json → webserver_port` |
| Bench python | `<benchRoot>/env/bin/python` |
| Chromium binary | `~/.cache/ms-playwright/chromium-*/chrome-linux/chrome` |
| `bench build` app arg | `--app <detected appName>` |

The only thing that is NOT generic is `references/frappe-selectors.md` —
but that's intentional. Those are Frappe v16 framework selectors, identical
across all apps. They are framework knowledge, not app knowledge.
