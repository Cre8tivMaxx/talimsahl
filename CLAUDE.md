# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.


# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this app is

`talimsahl` is a **Frappe v16 app that reskins Frappe Desk in place** as the "Talim Sahl" product. There is no separate SPA — Desk (`/app`) itself is restyled via aggressive CSS overrides plus a custom workspace landing and a branded `/login` page.

Shape of the app:
- **`talimsahl/public/css/brand-tokens.css`** — single source of brand colors (teal `#0D9B8A`, navy `#1B3A6B`, CTA blue `#2831AD`, soft bg `#E8F4F1`).
- **`talimsahl/public/css/desk-overrides.css`** — the workhorse. Loaded into Desk via `app_include_css`. Redefines Frappe CSS variables at `:root:root` specificity (beats `:root` declarations from `erpnext.bundle.css` without `!important`). Restyles navbar, sidebar, forms, lists, buttons, workspace widgets, indicators, modals. Also defines the Tier-4 shells (`.ts-navbar`, `.ts-quick-actions`, `.ts-card-grid`, `.ts-form-hero`) consumed by the JS bundle.
- **`talimsahl/public/css/talimsahl.css`** — portal + `/login` only. Loaded via `web_include_css`. Does **not** affect Desk.
- **`talimsahl/public/scss/website_theme_overrides.scss`** — brand SCSS vars piped into Frappe's website theme pipeline.
- **`talimsahl/public/js/desk_reskin.bundle.js`** — Tier-4 JS bundle. Loaded into Desk via `app_include_js`. esbuild auto-picks up `*.bundle.js`. Imports the modules under `public/js/reskin/`.
- **`talimsahl/public/js/reskin/navbar.js`** — mounts the `.ts-navbar` gradient shell and **moves** Frappe's `.search-bar`, `.dropdown-notifications`, and `.dropdown-navbar-user` DOM nodes into it. Frappe's `toolbar.js` bindings stay live because nodes are moved, not cloned. Original `header.navbar` is hidden via `body.ts-shell-active > header.navbar { display: none }`.
- **`talimsahl/public/js/reskin/sidebar.js`** — injects a Quick Actions block at the top of `.body-sidebar` (Students / Programs / Attendance / Fees).
- **`talimsahl/public/js/reskin/home_redirect.js`** — redirects `/app` with no route to the Home workspace via `frappe.router`.
- **`talimsahl/public/js/reskin/form_hero.js`** — prepends a hero header (icon + doctype eyebrow) above the form title via `form-load` / `form-refresh` events.
- **`talimsahl/public/js/reskin/card_list_view.js`** — listens for `list_view_render`, adds `.ts-card-grid` to the result list so rows render as a grid of cards. Denylist for dense ledger-like doctypes (GL Entry, Stock Ledger Entry, Bank Transaction, Journal/Payment Entry); user opt-out via `localStorage.ts_card_view = "off"`.
- **`talimsahl/www/login.html`** — branded `/login` page. Extends `templates/web.html`. Keeps Frappe's auth selectors (`.form-login`, `#login_email`, `.btn-login`, `.for-login`, `.for-email-login`, `.for-signup`, `.for-forgot`, `.for-login-with-email-link`) so Frappe's `login.js` still binds.
- **`talimsahl/install.py`** — idempotent brand settings (`after_install` + `after_migrate`). Writes Website Settings + Navbar Settings, customizes the Education workspace, and creates the Home workspace as default landing.
- **`talimsahl/scripts/customize_workspace.py`** — rebrands the Education workspace's shortcuts + icon. Idempotent.
- **`talimsahl/scripts/create_home_workspace.py`** — creates the "Home" workspace with `is_default = 1, sequence_id = 0` and a curated shortcut list. Idempotent.

No DocTypes, no Python business logic, no fixtures.

## Upgrade risk (Tier-4 JS layer)

The JS modules under `public/js/reskin/` are coupled to Frappe v16's DOM contract. Selectors that must remain stable for the reskin to keep working:
- `header.navbar`, `.search-bar` / `.navbar-search`, `.dropdown-notifications` / `.notifications-icon`, `.dropdown-navbar-user`, `.body-sidebar` — used by `navbar.js` + `sidebar.js`.
- `.list-row`, `.list-row-head`, `.result-list`, the `list_view_render` jQuery event — used by `card_list_view.js`.
- `frm.page.$title_area`, the `form-load` / `form-refresh` events — used by `form_hero.js`.
- `frappe.router.on("change")`, `frappe.boot.allowed_workspaces` — used by `home_redirect.js`.

Pin to Frappe v16.17.x and re-verify after every minor upgrade. If a class is renamed, the navbar shell will visibly break (empty search slot) — easy to detect.

## Commands

All `bench` commands run from `/home/frappe/frappe-bench-16`.

```bash
# Rebuild CSS assets (picks up desk-overrides.css + brand-tokens.css)
bench build --app talimsahl

# Clear caches after CSS / template changes
bench --site erp.local clear-cache
bench --site erp.local clear-website-cache

# Re-apply brand singletons + workspace customization
bench --site erp.local execute talimsahl.install.apply_brand_settings

# Install on a fresh site
bench --site <site> install-app talimsahl

# Lint Python
ruff check talimsahl/
ruff format talimsahl/
```

## Architecture

### CSS variable override strategy

Frappe's Desk reads CSS variables (`--primary`, `--navbar-bg`, `--sidebar-active-color`, `--bg-color`, `--border-color`, etc.) from `:root` in its bundle. ERPNext's bundle adds more. We override them in `desk-overrides.css` using `html:root, :root:root` selectors — specificity (0,2,0) beats (0,1,0), so we win regardless of load order without resorting to `!important`.

Surface-level overrides (navbar bg, list-row-head, .form-section card styling, button radii) target Frappe's stable selectors. Selectors are framework-rendered, so they cover every DocType automatically — no per-doctype work required for the bulk of the reskin.

### Hooks

- `app_include_css` → loads brand-tokens.css + desk-overrides.css into Desk (`/app`).
- `web_include_css` → loads brand-tokens.css + talimsahl.css into portal + `/login`.
- `website_theme_scss` → injects brand vars into Frappe's website theme SCSS pipeline.
- `after_install` / `after_migrate` → `talimsahl.install.apply_brand_settings`.

### Workspace landing

`scripts/customize_workspace.py` mutates the Education workspace in place (keeps title="Education" for route-stability) — sets icon, public/visible flags, and a curated shortcut list (Student, Program Enrollment, Fees, Student Attendance, Assessment Result). Runs on every migrate via `install.py`.

### Install hook

`install.py` → `apply_brand_settings()` writes:
- `Website Settings`: `app_name`, `brand_html`, `favicon`, `splash_image`, `footer_powered=""`, `copyright`, `hide_footer_signup`, `disable_signup`.
- `Navbar Settings`: `app_logo`, `logo_width`.
- Workspace customization (if Education app present).

Idempotent. Re-runs on every `bench migrate`.

## Where to make a change

| Want to change… | Edit |
|---|---|
| Desk colors, navbar, sidebar, forms, lists, buttons | `talimsahl/public/css/desk-overrides.css` |
| Brand colors (single source) | `talimsahl/public/css/brand-tokens.css` |
| `/login` page markup | `talimsahl/www/login.html` |
| `/login` + portal CSS | `talimsahl/public/css/talimsahl.css` |
| Public website theme vars | `talimsahl/public/scss/website_theme_overrides.scss` |
| Website Settings / Navbar Settings | `talimsahl/install.py` → re-run `apply_brand_settings` |
| Workspace shortcuts / icon | `talimsahl/scripts/customize_workspace.py` |
| Logo / favicon | drop into `talimsahl/public/images/`, then `bench build --app talimsahl` |
| Per-doctype tweaks (banners, indicator labels) | add `doctype_js` entry in `hooks.py` + script under `public/js/doctype_polish/` |

## Reskin gotchas

- **CSS load order**: ERPNext's `app_include_css` loads first. The `:root:root` specificity bump in `desk-overrides.css` is what makes our variables win. If a future override stops applying, double-check the selector specificity rather than reaching for `!important`.
- **Selector stability**: Frappe v16 selectors (`.navbar`, `.body-sidebar`, `.form-section`, `.list-row-head`, `.frappe-control`, `.indicator-pill`, `.widget-box`) are stable across point releases. Validate after any v16 minor upgrade.
- **Login.html selectors**: `login.js` binds to `.form-login`, `#login_email`, `#login_password`, `.btn-login`, and the section toggles `.for-login`, `.for-email-login`, `.for-signup`, `.for-forgot`, `.for-login-with-email-link`. Hide them with CSS — never remove them from the template.
- **Workspace name**: keep `title = "Education"` — Frappe v16 builds the URL by slugifying `title`, and non-ASCII chars produce broken routes.
- **RTL**: Desk is LTR-first. The `html[dir="rtl"]` overrides in `desk-overrides.css` flip the section-head accent border and the number-card left border. Test with `frappe.boot.lang == "ar"`.
- **Font flash**: Inter + Noto Sans Arabic are loaded via `@import url(...)` in CSS. For zero-flash, switch to `<link rel="preload">` injected via Frappe's `app_include_head` hook.

## Compatibility

Frappe **v16.17.2** at `/home/frappe/frappe-bench-16`. Default test site `erp.local`. Webserver port `8002`. Socketio `9002`.
