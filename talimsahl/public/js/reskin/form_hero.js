// Adds a branded hero header above the form title with doctype eyebrow + icon.
// The eyebrow links back to the doctype's list view.

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
	// Frappe slugifies doctypes: lowercase + hyphens. Extract from existing breadcrumb
	// to be robust, or fall back to manual slug.
	const $listCrumb = frm.page.wrapper && frm.page.wrapper.find(".navbar-breadcrumbs .title-text:not(.title-text-form)");
	const listHref = ($listCrumb && $listCrumb.length)
		? $listCrumb.attr("href")
		: "/desk/" + frm.doctype.toLowerCase().replace(/ /g, "-");

	$head.prepend(
		`<div class="ts-form-hero">
			<div class="ts-hero-icon">${iconHtml}</div>
			<div class="ts-hero-meta">
				<a href="${listHref}" class="ts-hero-eyebrow" data-doctype="${frm.doctype}">${eyebrow}</a>
			</div>
		</div>`
	);
}

if (window.$) {
	$(document).on("form-load form-rename form-refresh", (e, frm) => injectHero(frm));
}
