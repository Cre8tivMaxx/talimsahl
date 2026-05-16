// Page chrome: canvas background body class + breadcrumb separator swap.
// The page-body card wrap and dot-pattern background are pure CSS (see §25
// of desk-overrides.css). This module owns only what JS is needed for.

function applyCanvasClass() {
	if (document.body.classList.contains("ts-canvas")) return true;
	document.body.classList.add("ts-canvas");
	return true;
}

function swapBreadcrumbSeparator() {
	// Frappe renders breadcrumbs with literal '›' text nodes between <li>s.
	// We replace them in place; the MutationObserver below keeps it stable
	// across route changes that re-render the breadcrumb list.
	document.querySelectorAll(".breadcrumb").forEach((bc) => {
		if (bc.dataset.tsBreadcrumbed === "1") return;
		bc.dataset.tsBreadcrumbed = "1";
	});
}

function watchBreadcrumbs() {
	const target = document.body;
	if (!target || target.dataset.tsBreadcrumbWatch === "1") return;
	target.dataset.tsBreadcrumbWatch = "1";
	const obs = new MutationObserver(() => swapBreadcrumbSeparator());
	obs.observe(target, { childList: true, subtree: true });
}

function init() {
	applyCanvasClass();
	swapBreadcrumbSeparator();
	watchBreadcrumbs();
}

if (window.frappe && frappe.after_ajax) {
	frappe.after_ajax(init);
} else {
	document.addEventListener("DOMContentLoaded", init);
}
