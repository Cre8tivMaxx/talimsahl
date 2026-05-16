// Default-landing redirect: send users to the Home workspace when they hit /app
// with no route. Only fires when Home workspace is available.

function maybeRedirect() {
	if (!window.frappe || !frappe.router) return;
	const route = frappe.get_route_str ? frappe.get_route_str() : "";
	if (route !== "" && route !== "Workspaces") return;
	const workspaces = frappe.boot && frappe.boot.allowed_workspaces;
	if (!workspaces) return;
	const hasHome = workspaces.some((w) => w.name === "Home" || w.title === "Home");
	if (hasHome) frappe.set_route("Workspaces", "Home");
}

if (window.frappe && frappe.after_ajax) {
	frappe.after_ajax(() => {
		maybeRedirect();
		if (frappe.router && frappe.router.on) {
			frappe.router.on("change", maybeRedirect);
		}
	});
}
