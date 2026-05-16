// Custom navbar shell: wraps Frappe's existing nav controls into our gradient header.
// Moves DOM nodes (not clones) so Frappe's toolbar.js bindings stay live.

const LOGO_URL = "/assets/talimsahl/images/logo.png";

function renderShell(brandName, lang) {
	const shell = document.createElement("div");
	shell.className = "ts-navbar";
	if (lang === "ar") shell.setAttribute("dir", "rtl");
	shell.innerHTML = `
		<a class="ts-brand" href="/app">
			<img src="${LOGO_URL}" alt="${brandName}">
			<span>${brandName}</span>
		</a>
		<div class="ts-slot" data-slot="search"></div>
		<div class="ts-right">
			<div class="ts-slot" data-slot="notifications"></div>
			<div class="ts-slot" data-slot="user"></div>
		</div>
	`;
	return shell;
}

function mountShell() {
	if (document.querySelector(".ts-navbar")) return;
	const navbar = document.querySelector("header.navbar");
	if (!navbar) return false;

	const lang = (window.frappe && frappe.boot && frappe.boot.lang) || "en";
	const brandName = (window.frappe && frappe.boot && frappe.boot.app_name) || "Talim Sahl";
	const shell = renderShell(brandName, lang);
	document.body.prepend(shell);

	// Move search bar (autocomplete + global search input live here)
	const search = navbar.querySelector(".search-bar, .navbar-search");
	if (search) shell.querySelector("[data-slot=search]").append(search);

	// Move notifications dropdown
	const notif = navbar.querySelector(".dropdown-notifications, .notifications-icon");
	if (notif) shell.querySelector("[data-slot=notifications]").append(notif);

	// Move user dropdown
	const user = navbar.querySelector(".dropdown-navbar-user, .navbar-user");
	if (user) shell.querySelector("[data-slot=user]").append(user);

	document.body.classList.add("ts-shell-active");
	return true;
}

function init() {
	if (mountShell()) return;
	// Retry shortly if navbar wasn't ready yet
	let tries = 0;
	const timer = setInterval(() => {
		if (mountShell() || ++tries > 20) clearInterval(timer);
	}, 250);
}

if (window.frappe && frappe.after_ajax) {
	frappe.after_ajax(init);
} else {
	document.addEventListener("DOMContentLoaded", init);
}
