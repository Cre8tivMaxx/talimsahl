// Adds a branded hero header above the form title with doctype eyebrow + icon.

function injectHero(frm) {
	if (!frm || !frm.page) return;
	const $head =
		frm.page.$title_area || (frm.page.wrapper && frm.page.wrapper.find(".title-area"));
	if (!$head || !$head.length) return;
	if ($head.find(".ts-form-hero").length) return;

	const meta = (frappe.get_meta && frappe.get_meta(frm.doctype)) || {};
	const iconName = meta.icon || "file";
	let iconHtml;
	try {
		iconHtml = (frappe.utils && frappe.utils.icon)
			? frappe.utils.icon(iconName, "md")
			: "📄";
	} catch (e) {
		iconHtml = "📄";
	}
	const eyebrow = (window.__ ? __(frm.doctype) : frm.doctype);

	$head.prepend(
		`<div class="ts-form-hero">
			<div class="ts-hero-icon">${iconHtml}</div>
			<div class="ts-hero-meta">
				<div class="ts-hero-eyebrow">${eyebrow}</div>
			</div>
		</div>`
	);
}

if (window.$) {
	$(document).on("form-load form-rename form-refresh", (e, frm) => injectHero(frm));
}
