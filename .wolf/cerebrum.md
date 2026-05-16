# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-05-14

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** talimsahl
- **Description:** A Frappe / ERPNext custom branding app that rebrands the Desk and portal to

- **Select bug root cause (2026-05-16):** `height: 36px` + `line-height: 1.4` + no `font-size` on `appearance: none` select caused selected-value clipping. Fix: `font-size: var(--ts-control-font)` + `line-height: normal` (UA-native centering). `height: fixed` is fine as long as line-height is `normal`.
- **Identity principle:** "Colored Frappe" = flooding large surfaces (navbar, list header) with brand color. Fix: neutral surfaces everywhere; brand color only on interactive states, accents, focus rings. Key changes: navbar gradient→solid navy, list-row-head dark-navy→neutral with teal underline.
- **CSS variable strategy:** New scale tokens added to `html:root, :root:root` block in desk-overrides.css — `--ts-control-h`, `--ts-control-font`, `--ts-radius-sm/md/lg`, `--text-*`. Never put non-color tokens in brand-tokens.css.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
