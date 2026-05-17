// Workspace dashboard: prepend a custom stat-card + activity panel to the
// Home workspace page. Listens to frappe.router; mounts when route is
// /app or /app/home and bails on every other route.

const MOUNT_GUARD = "ts-dashboard-mounted";

const STAT_CARDS = [
  {
    key: "students",
    label: "Active Students",
    icon: "🎓",
    fetch: () =>
      frappe.db
        .count("Student", { filters: { enabled: 1 } })
        .catch(() => frappe.db.count("Student"))
        .catch(() => 0),
    format: (v) => (v == null ? "—" : String(v)),
    route: "/app/student",
  },
  {
    key: "programs",
    label: "Programs",
    icon: "📚",
    fetch: () => frappe.db.count("Program").catch(() => 0),
    format: (v) => (v == null ? "—" : String(v)),
    route: "/app/program",
  },
  {
    key: "attendance",
    label: "Today's Attendance",
    icon: "✅",
    fetch: async () => {
      const today = frappe.datetime.get_today();
      const filters = { date: today };
      const total = await frappe.db.count("Student Attendance", { filters }).catch(() => 0);
      if (!total) return { pct: null, total: 0, present: 0 };
      const present = await frappe.db
        .count("Student Attendance", { filters: { ...filters, status: "Present" } })
        .catch(() => 0);
      return { pct: Math.round((present / total) * 100), total, present };
    },
    format: (v) => {
      if (!v || v.total === 0) return "—";
      return `${v.pct}%`;
    },
    sublabel: (v) => (v && v.total ? `${v.present}/${v.total} present` : "no records"),
    route: "/app/student-attendance",
  },
  {
    key: "fees",
    label: "Outstanding Fees",
    icon: "💳",
    fetch: () =>
      frappe.db
        .get_list("Fees", {
          filters: [["outstanding_amount", ">", 0]],
          // v16: string SQL funcs in `fields` are rejected — use the dict form.
          // A bare SUM with no group_by already collapses to one total row;
          // v16's group_by validator rejects the old `1=1` collapse trick.
          fields: [{ SUM: "outstanding_amount", as: "total" }],
          limit: 1,
        })
        .then((rows) => (rows && rows[0] && rows[0].total) || 0)
        .catch(() => 0),
    format: (v) => {
      if (v == null) return "—";
      // format_currency returns a plain string; frappe.format(Currency) wraps
      // its output in a <div>, which the stat cell's textContent shows raw.
      try {
        return format_currency(v);
      } catch (e) {
        return String(v);
      }
    },
    route: "/app/fees?outstanding_amount=%3E%2C0",
  },
];

function isHomeRoute() {
  if (!window.frappe) return false;
  const r = (frappe.get_route && frappe.get_route()) || [];
  if (r.length === 0) return true;
  if (r[0] === "Workspaces" && (!r[1] || r[1] === "Home")) return true;
  return false;
}

function renderShell() {
  const wrap = document.createElement("section");
  wrap.className = "ts-dashboard";
  wrap.dataset.ts = MOUNT_GUARD;
  wrap.innerHTML = `
    <header class="ts-dashboard-greeting">
      <h2>Welcome back${
        frappe.session && frappe.session.user_fullname ? `, ${frappe.utils.escape_html(frappe.session.user_fullname.split(" ")[0])}` : ""
      }</h2>
      <p>Here's what's happening today.</p>
    </header>
    <div class="ts-stat-grid">
      ${STAT_CARDS.map(
        (c) => `
        <a class="ts-stat-card" data-stat="${c.key}" href="${c.route}">
          <div class="ts-stat-icon">${c.icon}</div>
          <div class="ts-stat-body">
            <div class="ts-stat-label">${c.label}</div>
            <div class="ts-stat-value" data-stat-value>…</div>
            <div class="ts-stat-sub" data-stat-sub></div>
          </div>
        </a>`
      ).join("")}
    </div>
    <section class="ts-activity-panel">
      <h3>Recent activity</h3>
      <ul class="ts-activity-feed" data-activity>
        <li class="ts-activity-empty">Loading…</li>
      </ul>
    </section>
  `;
  return wrap;
}

async function populateStats(root) {
  await Promise.all(
    STAT_CARDS.map(async (c) => {
      const cell = root.querySelector(`[data-stat="${c.key}"]`);
      if (!cell) return;
      try {
        const v = await c.fetch();
        cell.querySelector("[data-stat-value]").textContent = c.format(v);
        if (c.sublabel) cell.querySelector("[data-stat-sub]").textContent = c.sublabel(v);
      } catch (e) {
        cell.querySelector("[data-stat-value]").textContent = "—";
      }
    })
  );
}

async function populateActivity(root) {
  const feed = root.querySelector("[data-activity]");
  if (!feed) return;
  try {
    const rows = await frappe.db.get_list("Comment", {
      fields: ["name", "content", "reference_doctype", "reference_name", "owner", "creation"],
      filters: [["comment_type", "in", ["Comment", "Info"]]],
      order_by: "creation desc",
      limit: 10,
    });
    if (!rows || rows.length === 0) {
      feed.innerHTML = `<li class="ts-activity-empty">No recent activity.</li>`;
      return;
    }
    feed.innerHTML = rows
      .map((r) => {
        const text = (r.content || "").replace(/<[^>]+>/g, "").slice(0, 140);
        const when = frappe.datetime.comment_when(r.creation);
        const ref = r.reference_doctype
          ? `<a href="/app/${frappe.router.slug(r.reference_doctype)}/${encodeURIComponent(
              r.reference_name
            )}">${frappe.utils.escape_html(r.reference_name || "")}</a>`
          : "";
        return `<li>
          <div class="ts-activity-meta">
            <span class="ts-activity-when">${when}</span>
            ${ref ? `<span class="ts-activity-ref">${ref}</span>` : ""}
          </div>
          <div class="ts-activity-text">${frappe.utils.escape_html(text)}</div>
        </li>`;
      })
      .join("");
  } catch (e) {
    feed.innerHTML = `<li class="ts-activity-empty">Couldn't load activity.</li>`;
  }
}

function unmount() {
  document.querySelectorAll(`[data-ts="${MOUNT_GUARD}"]`).forEach((el) => el.remove());
}

function mount() {
  if (!isHomeRoute()) {
    unmount();
    return;
  }
  if (document.querySelector(`[data-ts="${MOUNT_GUARD}"]`)) return;
  const host = document.querySelector(".layout-main-section");
  if (!host) return;
  const node = renderShell();
  host.prepend(node);
  populateStats(node);
  populateActivity(node);
}

function init() {
  mount();
  if (window.frappe && frappe.router && frappe.router.on) {
    frappe.router.on("change", () => setTimeout(mount, 50));
  }
}

if (window.frappe && frappe.after_ajax) {
  frappe.after_ajax(init);
} else {
  document.addEventListener("DOMContentLoaded", init);
}
