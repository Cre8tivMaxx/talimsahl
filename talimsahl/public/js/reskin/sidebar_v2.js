// Sidebar v2: replace .body-sidebar content with a curated nav tree.
// Frappe's default sidebar items stay in DOM (hidden via CSS) so any
// frappe.router bindings on them remain live — we just visually swap.

// ----- Nav config (edit me) -----
// Sections render top-to-bottom. Each item routes via frappe.set_route on click.
// Icons are emoji for now (zero-dependency). Swap to frappe.utils.icon later if desired.
const NAV_CONFIG = [
  {
    section: "Operations",
    items: [
      { label: "Dashboard", route: "/app/home", icon: "🏠" },
      { label: "Students", route: "/app/student", icon: "🎓" },
      { label: "Programs", route: "/app/program", icon: "📚" },
      { label: "Attendance", route: "/app/student-attendance", icon: "✅" },
      { label: "Fees", route: "/app/fees", icon: "💳" },
    ],
  },
  {
    section: "Insights",
    items: [
      { label: "Reports", route: "/app/query-report", icon: "📊" },
      { label: "Dashboards", route: "/app/dashboard", icon: "📈" },
    ],
  },
  {
    section: "Admin",
    items: [
      { label: "Users", route: "/app/user", icon: "👥" },
      { label: "Settings", route: "/app/system-settings", icon: "⚙️" },
    ],
  },
];

const STATE_KEY = "ts_sidebar_state";

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    /* quota / private mode — ignore */
  }
}

function currentRoutePath() {
  if (!window.frappe || !frappe.get_route_str) return "";
  // frappe.get_route_str returns "DocType/Student" form; normalize to "/app/<doctype>"
  const r = frappe.get_route_str();
  if (!r) return "/app";
  return "/app/" + r.split("/").map(encodeURIComponent).join("/");
}

function renderTree(state) {
  const tree = document.createElement("nav");
  tree.className = "ts-sidebar";
  const here = currentRoutePath();

  NAV_CONFIG.forEach((section, idx) => {
    const collapsed = state[section.section] === true;
    const sec = document.createElement("div");
    sec.className = "ts-sidebar-section" + (collapsed ? " ts-collapsed" : "");
    sec.dataset.section = section.section;

    sec.innerHTML =
      `<button class="ts-sidebar-header" type="button" aria-expanded="${!collapsed}">
        <span>${section.section}</span>
        <span class="ts-chev" aria-hidden="true">▾</span>
      </button>
      <ul class="ts-sidebar-items">
        ${section.items
          .map((it) => {
            const active = here.startsWith(it.route) ? " ts-active" : "";
            return `<li>
              <a class="ts-sidebar-item${active}" href="${it.route}" data-route="${it.route}">
                <span class="ts-sidebar-icon">${it.icon}</span>
                <span class="ts-sidebar-label">${it.label}</span>
              </a>
            </li>`;
          })
          .join("")}
      </ul>`;
    tree.appendChild(sec);
  });

  return tree;
}

function bindCollapse(root) {
  root.querySelectorAll(".ts-sidebar-header").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sec = btn.closest(".ts-sidebar-section");
      const name = sec.dataset.section;
      const state = loadState();
      state[name] = !sec.classList.toggle("ts-collapsed") ? false : true;
      btn.setAttribute("aria-expanded", String(!state[name]));
      saveState(state);
    });
  });
}

function highlightActiveRoute(root) {
  const here = currentRoutePath();
  root.querySelectorAll(".ts-sidebar-item").forEach((a) => {
    const r = a.dataset.route;
    a.classList.toggle("ts-active", here.startsWith(r));
  });
}

function mount() {
  if (document.querySelector(".ts-sidebar")) return true;
  const host = document.querySelector(".body-sidebar");
  if (!host) return false;
  const tree = renderTree(loadState());
  host.prepend(tree);
  bindCollapse(tree);
  document.body.classList.add("ts-sidebar-v2");
  if (window.frappe && frappe.router && frappe.router.on) {
    frappe.router.on("change", () => highlightActiveRoute(tree));
  }
  return true;
}

function init() {
  if (mount()) return;
  let tries = 0;
  const timer = setInterval(() => {
    if (mount() || ++tries > 20) clearInterval(timer);
  }, 250);
}

if (window.frappe && frappe.after_ajax) {
  frappe.after_ajax(init);
} else {
  document.addEventListener("DOMContentLoaded", init);
}
