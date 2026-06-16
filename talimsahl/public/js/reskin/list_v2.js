// List v2: full card template + view switcher + filter chips + empty state.
// Strategy: on list_view_render, for non-denylisted doctypes, rebuild each
// .list-row's inner DOM into a card scaffold, MOVING (not cloning) the
// checkbox and title-link nodes so Frappe's selection / navigation bindings
// stay live.

// ----- Per-doctype meta map (edit me) -----
// Each entry tells the card what to surface as the two meta lines under the
// title. Field names refer to fields on the doctype. The first line is the
// "primary meta", the second is the "secondary meta". Add new doctypes as
// you go; unknown doctypes fall through to the GENERIC template.
const DOCTYPE_META = {
  Student: {
    icon: "🎓",
    meta1: (d) => d.student_email_id || d.student_mobile_number || "",
    meta2: (d) => d.program || d.student_category || "",
    status: (d) => (d.enabled ? "Active" : "Inactive"),
    statusKind: (d) => (d.enabled ? "ok" : "muted"),
  },
  Program: {
    icon: "📚",
    meta1: (d) => d.program_name || d.program_abbreviation || "",
    meta2: (d) => d.department || "",
    status: (d) => d.program_code || "",
    statusKind: () => "info",
  },
  Fees: {
    icon: "💳",
    meta1: (d) =>
      d.student_name ? `${d.student_name}${d.program ? " · " + d.program : ""}` : d.student || "",
    meta2: (d) => (d.due_date ? `Due ${d.due_date}` : ""),
    status: (d) =>
      d.outstanding_amount > 0
        ? `Outstanding ${format_currency(d.outstanding_amount)}`
        : "Paid",
    statusKind: (d) => (d.outstanding_amount > 0 ? "warn" : "ok"),
  },
  "Student Attendance": {
    icon: "✅",
    meta1: (d) => `${d.student_name || d.student || ""} · ${d.date || ""}`,
    meta2: (d) => d.course_schedule || d.program || "",
    status: (d) => d.status || "",
    statusKind: (d) => {
      const s = (d.status || "").toLowerCase();
      if (s === "present") return "ok";
      if (s === "absent") return "danger";
      return "muted";
    },
  },
};

const GENERIC_META = {
  icon: "📄",
  meta1: (d) => d.modified_by || d.owner || "",
  // prettyDate returns plain text ("1 week ago"); comment_when wraps it in
  // a <span>, which escapeHtml() would then render as literal tags.
  meta2: (d) => (d.modified ? `Updated ${frappe.datetime.prettyDate(d.modified)}` : ""),
  status: () => "",
  statusKind: () => "muted",
};

const CARD_DENYLIST = new Set([
  "Bank Transaction",
  "Stock Ledger Entry",
  "GL Entry",
  "Journal Entry",
  "Payment Entry",
  "Sales Invoice Item",
  "Purchase Invoice Item",
]);

function userOptedOut() {
  try {
    return localStorage.getItem("ts_card_view") === "off";
  } catch (e) {
    return false;
  }
}

function viewMode() {
  try {
    return localStorage.getItem("ts_list_view_mode") || "cards";
  } catch (e) {
    return "cards";
  }
}

function setViewMode(mode) {
  try {
    localStorage.setItem("ts_list_view_mode", mode);
  } catch (e) {
    /* ignore */
  }
}

function avatarLetter(d) {
  const s = d.name || d.title || "?";
  return String(s).trim()[0].toUpperCase();
}

function escapeHtml(s) {
  if (s == null) return "";
  return frappe.utils.escape_html(String(s));
}

function buildCard($row, doc, cfg) {
  if ($row.hasClass("ts-card-row")) return;
  const $checkbox = $row.find(".list-row-checkbox").first();
  const $titleLink = $row.find(".list-subject a, .list-row-col a.ellipsis").first();
  const titleText = $titleLink.length ? $titleLink.text().trim() : doc.name;
  const href = $titleLink.attr("href") || `/app/${frappe.router.slug(doc.doctype)}/${encodeURIComponent(doc.name)}`;

  const rawMeta1 = cfg.meta1(doc);
  // Suppress meta1 when it duplicates the card title (e.g. Program.program_name === name)
  const meta1 = rawMeta1 && rawMeta1.trim() !== titleText.trim() ? rawMeta1 : "";
  const meta2 = cfg.meta2(doc);
  const status = cfg.status(doc);
  const kind = cfg.statusKind(doc);

  const $card = $(`
    <div class="ts-list-card">
      <div class="ts-list-card-head">
        <div class="ts-card-checkbox-slot"></div>
        <div class="ts-card-avatar">${cfg.icon || avatarLetter(doc)}</div>
        <div class="ts-card-titleblock">
          <a class="ts-card-title" href="${href}">${escapeHtml(titleText)}</a>
          ${meta1 ? `<div class="ts-card-meta1">${escapeHtml(meta1)}</div>` : ""}
        </div>
        ${status ? `<span class="ts-card-status ts-status-${kind}">${escapeHtml(status)}</span>` : ""}
      </div>
      ${meta2 ? `<div class="ts-card-meta2">${escapeHtml(meta2)}</div>` : ""}
    </div>
  `);

  if ($checkbox.length) $card.find(".ts-card-checkbox-slot").append($checkbox);
  $row.addClass("ts-card-row").empty().append($card);
}

function renderEmptyState(listview) {
  const $result = listview.$result;
  if (!$result || $result.find(".list-row").length > 0) {
    $result.find(".ts-empty-state").remove();
    return;
  }
  if ($result.find(".ts-empty-state").length) return;
  const dt = listview.doctype;
  const $empty = $(`
    <div class="ts-empty-state">
      <div class="ts-empty-icon">📭</div>
      <h3>No ${escapeHtml(__(dt))} yet</h3>
      <p>Create your first record to get started.</p>
      <button class="btn btn-primary ts-empty-cta">+ New ${escapeHtml(__(dt))}</button>
    </div>
  `);
  $empty.find(".ts-empty-cta").on("click", () => {
    if (listview.make_new_doc) listview.make_new_doc();
    else frappe.new_doc(dt);
  });
  $result.append($empty);
}

function updateActiveButton($page, mode) {
  if (!$page) return;
  const $buttons = $page.find(".ts-view-switcher button");
  $buttons.removeClass("active");
  $buttons.filter(`[data-mode="${mode}"]`).addClass("active");
}

function renderViewSwitcher(listview) {
  const $page = listview.page && $(listview.page.main);
  if (!$page || !$page.length) return;
  // Guard in the same scope as the insertion. If the toolbar already exists,
  // refresh chips + active state instead of re-injecting.
  if ($page.find(".ts-list-toolbar").length) {
    renderFilterChips(listview);
    updateActiveButton($page, viewMode());
    return;
  }
  const current = viewMode();
  const $switcher = $(`
    <div class="ts-list-toolbar">
      <div class="ts-view-switcher" role="tablist">
        <button data-mode="cards" class="${current === "cards" ? "active" : ""}">Cards</button>
        <button data-mode="rows" class="${current === "rows" ? "active" : ""}">Rows</button>
        <button data-mode="kanban" class="${current === "kanban" ? "active" : ""}">Kanban</button>
      </div>
      <div class="ts-filter-chips" data-filter-chips></div>
    </div>
  `);
  $switcher.find("button").on("click", function () {
    const mode = $(this).data("mode");
    setViewMode(mode);
    if (mode === "kanban") {
      // Try first Kanban for this doctype
      frappe.db
        .get_list("Kanban Board", {
          filters: { reference_doctype: listview.doctype },
          fields: ["name"],
          limit: 1,
        })
        .then((rows) => {
          if (rows && rows.length) {
            frappe.set_route("List", listview.doctype, "Kanban", rows[0].name);
          } else {
            frappe.msgprint(__("No Kanban exists for {0}.", [listview.doctype]));
            setViewMode("cards");
            updateActiveButton($page, "cards");
          }
        });
      return;
    }
    updateActiveButton($page, mode);
    decorate(listview);
    listview.refresh && listview.refresh();
  });
  if ($page.find(".result-list, .frappe-list").first().length) {
    $page.find(".result-list, .frappe-list").first().before($switcher);
  }
}

function renderFilterChips(listview) {
  const $chips = $(listview.page.main).find("[data-filter-chips]");
  if (!$chips.length) return;
  $chips.empty();
  let filters = [];
  try {
    filters = listview.filter_area ? listview.filter_area.get() : [];
  } catch (e) {
    filters = [];
  }
  if (!filters || filters.length === 0) return;
  filters.forEach((f) => {
    // f is [doctype, fieldname, operator, value]
    const [, field, op, val] = f;
    const label = `${field} ${op} ${Array.isArray(val) ? val.join(",") : val}`;
    const $chip = $(
      `<button class="ts-filter-chip" title="Click to remove">${escapeHtml(label)} <span aria-hidden="true">×</span></button>`
    );
    $chip.on("click", () => {
      listview.filter_area.remove(field);
    });
    $chips.append($chip);
  });
}

function decorate(listview) {
  if (!listview || listview.view_name !== "List") return;
  if (CARD_DENYLIST.has(listview.doctype) || userOptedOut()) return;
  const mode = viewMode();
  if (mode !== "cards") {
    if (listview.$result) {
      listview.$result.removeClass("ts-card-grid");
      // Strip card scaffolding so the transition is visible immediately,
      // even before Frappe's next render() rebuilds row inner DOM.
      listview.$result.find(".ts-card-row").each(function () {
        const $row = $(this);
        $row.find(".ts-list-card").remove();
        $row.removeClass("ts-card-row");
      });
    }
    renderViewSwitcher(listview);
    renderFilterChips(listview);
    return;
  }

  if (listview.$result) listview.$result.addClass("ts-card-grid");
  renderViewSwitcher(listview);
  renderFilterChips(listview);

  const cfg = DOCTYPE_META[listview.doctype] || GENERIC_META;
  const data = listview.data || [];
  const $rows = listview.$result.find(".list-row").not(".list-row-head");
  $rows.each((idx, el) => {
    const $row = $(el);
    const doc = data[idx];
    if (!doc) return;
    buildCard($row, { ...doc, doctype: listview.doctype }, cfg);
  });

  renderEmptyState(listview);
}

// v16 fires no `list_view_render` jQuery event. Hook the ListView class
// instead: base_list.js runs `render(); after_render();` in sequence, so by
// after_render() the .list-row nodes and `this.data` are fully populated and
// `this` is the listview instance decorate() expects.
function patchListView() {
  const LV = window.frappe && frappe.views && frappe.views.ListView;
  if (!LV) return false;
  if (LV.prototype.__ts_list_v2_patched) return true;
  const orig = LV.prototype.after_render;
  LV.prototype.after_render = function () {
    if (orig) orig.apply(this, arguments);
    try {
      decorate(this);
    } catch (err) {
      console.error("[talimsahl] list_v2 decorate failed", err);
    }
  };
  LV.prototype.__ts_list_v2_patched = true;
  return true;
}

function initListV2() {
  if (patchListView()) return;
  let tries = 0;
  const timer = setInterval(() => {
    if (patchListView() || ++tries > 20) clearInterval(timer);
  }, 250);
}

// Register extra fields so list queries fetch what card templates need.
// frappe.listview_settings is processed by Frappe before the first render.
const LIST_EXTRA_FIELDS = {
  Student: ["student_email_id", "student_mobile_number", "program", "student_category", "enabled"],
  Program: ["program_name", "department", "program_code", "program_abbreviation"],
  Fees: ["student_name", "program", "due_date", "outstanding_amount"],
  "Student Attendance": ["student_name", "date", "status", "course_schedule", "program"],
};

function registerAddFields() {
  frappe.listview_settings = frappe.listview_settings || {};
  Object.entries(LIST_EXTRA_FIELDS).forEach(([dt, fields]) => {
    const existing = frappe.listview_settings[dt] || {};
    frappe.listview_settings[dt] = {
      ...existing,
      add_fields: [...new Set([...(existing.add_fields || []), ...fields])],
    };
  });
}

if (window.frappe && frappe.after_ajax) {
  frappe.after_ajax(() => { registerAddFields(); initListV2(); });
} else {
  document.addEventListener("DOMContentLoaded", () => { registerAddFields(); initListV2(); });
}
