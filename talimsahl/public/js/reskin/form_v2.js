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
    { label: "Program", value: (f) => f.doc.program || "—" },
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
          ? frappe.format(f.doc.outstanding_amount, { fieldtype: "Currency" })
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

function injectTabs(frm) {
  const $layout = frm.$wrapper.find(".form-layout").first();
  if (!$layout.length || $layout.find(".ts-form-tabs").length) return;
  const $sections = $layout.find("> .form-page > .form-section, > .form-section").filter(
    (i, el) => $(el).find(".section-head").length > 0
  );
  if ($sections.length < 2) return;

  const tabs = [];
  $sections.each((idx, el) => {
    const $sec = $(el);
    const label = $sec.find(".section-head").first().text().trim() || `Section ${idx + 1}`;
    $sec.attr("data-ts-section-idx", idx);
    if (idx > 0) $sec.css("display", "none");
    tabs.push({ idx, label });
  });

  const $tabs = $(
    `<div class="ts-form-tabs" role="tablist">
      ${tabs
        .map(
          (t) =>
            `<button type="button" class="ts-form-tab${t.idx === 0 ? " active" : ""}" data-ts-tab="${t.idx}" role="tab">${frappe.utils.escape_html(t.label)}</button>`
        )
        .join("")}
    </div>`
  );
  $tabs.on("click", "button.ts-form-tab", function () {
    const target = $(this).data("ts-tab");
    $tabs.find("button").removeClass("active");
    $(this).addClass("active");
    $layout
      .find("[data-ts-section-idx]")
      .each((_, sec) =>
        $(sec).css("display", String($(sec).data("ts-section-idx")) === String(target) ? "" : "none")
      );
  });

  // Prepend after summary strip if present, else first
  const $strip = $layout.find(".ts-summary-strip");
  if ($strip.length) $strip.after($tabs);
  else $layout.prepend($tabs);
}

function injectActionBar(frm) {
  if (!frm.page || !frm.page.wrapper) return;
  const $wrapper = frm.$wrapper;
  if ($wrapper.find(".ts-form-action-bar").length) return;
  const $titleArea = frm.page.$title_area;
  if (!$titleArea || !$titleArea.length) return;

  const $bar = $(`
    <div class="ts-form-action-bar">
      <div class="ts-action-status" data-status></div>
      <div class="ts-action-spacer"></div>
      <div class="ts-action-primary" data-primary></div>
      <div class="ts-action-menu" data-menu></div>
    </div>
  `);

  // Move primary action button(s)
  const $primary = frm.page.wrapper.find(".standard-actions .primary-action, .standard-actions .btn-primary").first();
  if ($primary.length) $bar.find("[data-primary]").append($primary);

  // Move menu (kebab)
  const $menu = frm.page.wrapper.find(".standard-actions .menu-btn-group, .standard-actions .actions-btn-group").first();
  if ($menu.length) $bar.find("[data-menu]").append($menu);

  // Status indicator (Frappe renders .indicator-pill near the title)
  const $indicator = frm.page.wrapper.find(".indicator-pill").first();
  if ($indicator.length) $bar.find("[data-status]").append($indicator);

  $titleArea.after($bar);
}

function refreshActionBarStatus(frm) {
  const $bar = frm.$wrapper.find(".ts-form-action-bar [data-status]");
  if (!$bar.length) return;
  const $indicator = frm.page.wrapper.find(".indicator-pill").first();
  if ($indicator.length && !$bar.is($indicator.parent())) {
    $bar.empty().append($indicator);
  }
}

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
  injectTabs(frm);
  injectActionBar(frm);
  injectRightRail(frm);

  if (!first) {
    refreshSummaryStrip(frm);
    refreshActionBarStatus(frm);
  }
}

if (window.$) {
  $(document).on("form-load form-refresh", (e, frm) => applyFormV2(frm));
}
