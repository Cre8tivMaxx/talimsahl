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
        ? `Outstanding ${frappe.format(d.outstanding_amount, { fieldtype: "Currency" })}`
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
  meta2: (d) => (d.modified ? `Updated ${frappe.datetime.comment_when(d.modified)}` : ""),
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

  const meta1 = cfg.meta1(doc);
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

function renderViewSwitcher(listview) {
  const $wrap = listview.$frappe_list || listview.page.main;
  if (!$wrap || $wrap.find(".ts-view-switcher").length) return;
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
          }
        });
      return;
    }
    listview.refresh && listview.refresh();
  });
  const $page = listview.page && listview.page.main;
  if ($page && $page.find(".result-list, .frappe-list").first().length) {
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
    if (listview.$result) listview.$result.removeClass("ts-card-grid");
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

if (window.$) {
  $(document).on("list_view_render", (e, listview) => decorate(listview));
}
