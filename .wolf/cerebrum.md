# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-05-14

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

- **Verify UI/UX work in a real browser, yourself (2026-05-17):** Whenever doing
  UI/UX work, do not declare it done from code alone. Drive the live app with
  Playwright — execute → review the rendered result → fix → iterate — until the
  work genuinely ships clean. Class-presence checks are not enough; render
  screenshots and read them (HTML-escaping bugs only show visually).
- **Style, don't override Frappe's logic (2026-05-17):** The reskin must NOT
  move, replace, or hide Frappe's functional DOM (sidebar nav, Save/Actions
  buttons, keyboard bindings). Restyle native chrome via CSS. Moving nodes broke
  Save + Ctrl+S; replacing the sidebar produced a "useless" custom nav.

## Key Learnings

- **Project:** talimsahl
- **Description:** A Frappe / ERPNext custom branding app that rebrands the Desk and portal to

- **Select bug root cause (2026-05-16):** `height: 36px` + `line-height: 1.4` + no `font-size` on `appearance: none` select caused selected-value clipping. Fix: `font-size: var(--ts-control-font)` + `line-height: normal` (UA-native centering). `height: fixed` is fine as long as line-height is `normal`.
- **Identity principle:** "Colored Frappe" = flooding large surfaces (navbar, list header) with brand color. Fix: neutral surfaces everywhere; brand color only on interactive states, accents, focus rings. Key changes: navbar gradient→solid navy, list-row-head dark-navy→neutral with teal underline.
- **CSS variable strategy:** New scale tokens added to `html:root, :root:root` block in desk-overrides.css — `--ts-control-h`, `--ts-control-font`, `--ts-radius-sm/md/lg`, `--text-*`. Never put non-color tokens in brand-tokens.css.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

- [2026-05-17] `app_include_js` must reference the bundle by name
  (`"desk_reskin.bundle.js"`), NOT by absolute path. An absolute path serves the
  raw ES-module source — a plain `<script>` can't run `import` → SyntaxError →
  whole bundle dead. Frappe resolves the bare name through `assets.json`.
- [2026-05-17] Frappe v16 fires NO `list_view_render` jQuery event. Hook
  `frappe.views.ListView.prototype.after_render` instead.
- [2026-05-17] v16 `frappe.get_route_str()` is `current_route.join("/")` — it
  THROWS (not returns "") when the route is unresolved at boot. Guard with
  `if (!frappe.router.current_route) return;`.
- [2026-05-17] v16 `frappe.db.get_list` rejects string SQL funcs in `fields`
  (`"sum(x) as t"`) and the `group_by: "1=1"` collapse trick. Use the dict form
  `{ SUM: "field", as: "alias" }` with no group_by.
- [2026-05-17] `frappe.datetime.comment_when()` and `frappe.format(v,{fieldtype:
  "Currency"})` return HTML. Feeding them into `escapeHtml()`/`textContent`
  renders literal tags. Use plain-text helpers: `frappe.datetime.prettyDate()`,
  `format_currency()`.
- [2026-05-17] When deleting a function, delete its call sites too — left an
  `injectTabs(frm)` call after removing `injectTabs`, causing a ReferenceError
  that aborted the rest of `applyFormV2`.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->

- [2026-05-17] **Dropped navbar.js** — Frappe v16 has no top navbar
  (`header.navbar` → null); the sidebar houses search/notifications/user.
- [2026-05-17] **Removed `injectTabs`** — v16 forms ship native tabs; a parallel
  tab system would fight Frappe's. Native tabs kept, brand-styled via CSS.
- [2026-05-17] **Reverted `sidebar_v2.js` and `injectActionBar`** — per user:
  the reskin styles native chrome, never replaces/moves it. Custom sidebar and
  the lifted action bar were deleted; native sidebar + `.standard-actions` kept.
