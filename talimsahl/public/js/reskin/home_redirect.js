// Default-landing redirect: send users to the Home workspace when they hit /app
// with no route. Only fires when Home workspace is available.

function maybeRedirect() {
	if (!window.frappe || !frappe.router) return;
	// v16: frappe.get_route_str() is `current_route.join("/")` — current_route
	// is null until the first route resolves, so guard before calling it.
	if (!frappe.router.current_route) return;
	const route = frappe.get_route_str ? frappe.get_route_str() : "";
	if (route !== "" && route !== "Workspaces") return;
	const workspaces = frappe.boot && frappe.boot.allowed_workspaces;
	if (!workspaces) return;
	const hasHome = workspaces.some((w) => w.name === "Home" || w.title === "Home");
	// v16 routes workspaces as /app/<slug>, not the legacy /desk#Workspaces/Home.
	// Use frappe.set_route(slug) — passing ("Workspaces","Home") produces the
	// deprecated two-segment URL.
	if (hasHome) frappe.set_route("home");
}

if (window.frappe && frappe.after_ajax) {
	frappe.after_ajax(() => {
		maybeRedirect();
		if (frappe.router && frappe.router.on) {
			frappe.router.on("change", maybeRedirect);
		}
	});
}
