// SUPERSEDED by sidebar_v2.js (Tier-5). Kept on disk for reference; no longer imported from the bundle.
// Adds a "Quick Actions" block at the top of Frappe's workspace sidebar.

const QUICK_LINKS = [
	{ label: "Students", route: "/app/student", icon: "🎓" },
	{ label: "Programs", route: "/app/program", icon: "📚" },
	{ label: "Attendance", route: "/app/student-attendance", icon: "✅" },
	{ label: "Fees", route: "/app/fees", icon: "💳" },
];

function injectQuickActions() {
	const sidebar = document.querySelector(".body-sidebar");
	if (!sidebar || sidebar.querySelector(".ts-quick-actions")) return false;

	const block = document.createElement("div");
	block.className = "ts-quick-actions";
	block.innerHTML = QUICK_LINKS.map(
		(l) => `<a href="${l.route}"><span>${l.icon}</span><span>${l.label}</span></a>`
	).join("");
	sidebar.prepend(block);
	return true;
}

function init() {
	if (injectQuickActions()) return;
	let tries = 0;
	const timer = setInterval(() => {
		if (injectQuickActions() || ++tries > 20) clearInterval(timer);
	}, 250);
}

if (window.frappe && frappe.after_ajax) {
	frappe.after_ajax(init);
} else {
	document.addEventListener("DOMContentLoaded", init);
}
