// Talim Sahl — Desk reskin JS bundle
// Loaded into Frappe Desk (/app) via app_include_js.
// esbuild auto-picks up *.bundle.js entries.

// Tier-4 (kept)
import "./reskin/form_hero";

// Tier-5 (new — structural reskin)
import "./reskin/page_chrome";
import "./reskin/workspace_dashboard";
import "./reskin/list_v2";
import "./reskin/form_v2";

// Superseded (no longer imported):
//  - ./reskin/sidebar.js        → Frappe's native sidebar is kept; styled
//    via CSS (desk-overrides.css §4) instead of replaced.
//  - ./reskin/sidebar_v2.js     → same: native sidebar kept, not overridden.
//  - ./reskin/card_list_view.js → replaced by list_v2.js
