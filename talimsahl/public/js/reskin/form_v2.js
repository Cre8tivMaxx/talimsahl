// Form v2: section-tabs + sticky action bar + right rail + summary strip.
// Idempotency guard: frm.$wrapper.hasClass("ts-form-v2"). All node moves use
// jQuery .append/.prepend (move semantics) so Frappe's existing bindings stay
// live on the moved nodes.

// ----- Summary strip config (edit me) -----
// For these doctypes, prepend a 3-4 cell strip with key fields read from frm.doc.
// Each cell: { label, value(frm) }
const SUMMARY_STRIPS = {
  Student: [
    { label: "Email", value: (f) => f.doc.student_email_id || "—" },
    { label: "Mobile", value: (f) => f.doc.student_mobile_number || "—" },
    { label: "Program", value: (f) => f.doc.custom_program || "—" },
    { label: "Status", value: (f) => (f.doc.enabled ? "Active" : "Inactive") },
  ],
  Program: [
    { label: "Code", value: (f) => f.doc.program_code || "—" },
    { label: "Department", value: (f) => f.doc.department || "—" },
    { label: "Abbreviation", value: (f) => f.doc.program_abbreviation || "—" },
  ],
  Fees: [
    { label: "Student", value: (f) => f.doc.student_name || f.doc.student || "—" },
    { label: "Due", value: (f) => f.doc.due_date || "—" },
    {
      label: "Outstanding",
      value: (f) =>
        f.doc.outstanding_amount != null
          ? format_currency(f.doc.outstanding_amount)
          : "—",
    },
    { label: "Status", value: (f) => f.doc.status || "—" },
  ],
  "Student Attendance": [
    { label: "Student", value: (f) => f.doc.student_name || f.doc.student || "—" },
    { label: "Date", value: (f) => f.doc.date || "—" },
    { label: "Status", value: (f) => f.doc.status || "—" },
  ],
};

const FORM_DENYLIST = new Set([
  // Dense ledger/transactional doctypes where tabs/right rail break layout
  "GL Entry",
  "Stock Ledger Entry",
  "Bank Transaction",
]);

function injectSummaryStrip(frm) {
  const cfg = SUMMARY_STRIPS[frm.doctype];
  if (!cfg) return;
  const $layout = frm.$wrapper.find(".form-layout").first();
  if (!$layout.length || $layout.find(".ts-summary-strip").length) return;
  const cells = cfg
    .map(
      (c) =>
        `<div class="ts-summary-cell">
          <div class="ts-summary-label">${frappe.utils.escape_html(c.label)}</div>
          <div class="ts-summary-value">${frappe.utils.escape_html(String(c.value(frm)))}</div>
        </div>`
    )
    .join("");
  const $strip = $(`<div class="ts-summary-strip">${cells}</div>`);
  $layout.prepend($strip);
}

function refreshSummaryStrip(frm) {
  const cfg = SUMMARY_STRIPS[frm.doctype];
  if (!cfg) return;
  const $strip = frm.$wrapper.find(".ts-summary-strip");
  if (!$strip.length) return;
  $strip.find(".ts-summary-cell").each(function (idx) {
    const c = cfg[idx];
    if (!c) return;
    $(this)
      .find(".ts-summary-value")
      .text(String(c.value(frm)));
  });
}

// Note: no custom tab injection. Frappe v16 forms render native tabs
// (.form-tabs); a parallel tab system would fight Frappe's own switching.
// Native tabs are left stock — brand colors reach them via desk-overrides.css.

// Note: no custom action bar. Frappe's Save / Actions / menu buttons and the
// Ctrl+S binding are left in .standard-actions where Frappe manages them —
// moving those nodes broke Save and the keyboard shortcut. Brand styling for
// the standard action buttons lives in desk-overrides.css.

function injectRightRail(frm) {
  const $sidebar = frm.$wrapper.find(".form-sidebar").first();
  if (!$sidebar.length || $sidebar.hasClass("ts-form-right-rail")) return;
  $sidebar.addClass("ts-form-right-rail");
}

function applyFormV2(frm) {
  if (!frm || !frm.doctype) return;
  if (FORM_DENYLIST.has(frm.doctype)) return;
  if (!frm.$wrapper) return;

  const first = !frm.$wrapper.hasClass("ts-form-v2");
  frm.$wrapper.addClass("ts-form-v2");

  injectSummaryStrip(frm);
  injectRightRail(frm);

  if (!first) {
    refreshSummaryStrip(frm);
  }
}

if (window.$) {
  $(document).on("form-load form-refresh", (e, frm) => applyFormV2(frm));
}
