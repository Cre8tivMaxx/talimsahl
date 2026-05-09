// Talim Sahl — Desk client tweaks
(function () {
	const BRAND = "تعليم سهل — Talim Sahl";

	// Early paint: brand the splash background before CSS finishes loading
	try {
		const earlyStyle = document.createElement("style");
		earlyStyle.textContent =
			"html,body{background-color:#1B3A6B;}.splash,#body_div{background-color:#1B3A6B!important;}";
		(document.head || document.documentElement).appendChild(earlyStyle);
	} catch (e) {
		/* non-fatal */
	}

	function applyBrand() {
		try {
			if (window.frappe && frappe.boot) {
				frappe.boot.app_title = BRAND;
				if (frappe.boot.website_settings) {
					frappe.boot.website_settings.app_name = BRAND;
				}
			}
			document.title = document.title.replace(/^(ERPNext|Frappe)/i, "Talim Sahl");
			if (!document.title.includes("Talim Sahl") && !document.title.includes("تعليم")) {
				document.title = `Talim Sahl | ${document.title}`;
			}
		} catch (e) {
			// non-fatal
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", applyBrand);
	} else {
		applyBrand();
	}

	// Also run on Frappe's route change
	if (window.frappe && frappe.router) {
		frappe.router.on("change", applyBrand);
	}

	console.log("%cPowered by Talim Sahl ERP", "color:#0D9B8A;font-weight:bold;font-size:13px");
})();
