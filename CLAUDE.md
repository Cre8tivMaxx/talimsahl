# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this app is

`talimsahl` is a **Frappe v16 app that reskins Frappe Desk in place** as the "Talim Sahl" product. There is no separate SPA — Desk (`/app`) itself is restyled via aggressive CSS overrides plus a custom workspace landing and a branded `/login` page.

Shape of the app:
- **`talimsahl/public/css/brand-tokens.css`** — single source of brand colors (teal `#0D9B8A`, navy `#1B3A6B`, CTA blue `#2831AD`, soft bg `#E8F4F1`).
- **`talimsahl/public/css/desk-overrides.css`** — the workhorse. Loaded into Desk via `app_include_css`. Redefines Frappe CSS variables at `:root:root` specificity (beats `:root` declarations from `erpnext.bundle.css` without `!important`). Restyles navbar, sidebar, forms, lists, buttons, workspace widgets, indicators, modals.
- **`talimsahl/public/css/talimsahl.css`** — portal + `/login` only. Loaded via `web_include_css`. Does **not** affect Desk.
- **`talimsahl/public/scss/website_theme_overrides.scss`** — brand SCSS vars piped into Frappe's website theme pipeline.
- **`talimsahl/www/login.html`** — branded `/login` page. Extends `templates/web.html`. Keeps Frappe's auth selectors (`.form-login`, `#login_email`, `.btn-login`, `.for-login`, `.for-email-login`, `.for-signup`, `.for-forgot`, `.for-login-with-email-link`) so Frappe's `login.js` still binds.
- **`talimsahl/install.py`** — idempotent brand settings (`after_install` + `after_migrate`). Writes Website Settings + Navbar Settings, customizes the Education workspace via `scripts/customize_workspace.py`.
- **`talimsahl/scripts/customize_workspace.py`** — rebrands the Education workspace's shortcuts + icon. Idempotent.

No DocTypes, no Python business logic, no fixtures.

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
