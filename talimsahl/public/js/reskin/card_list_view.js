// SUPERSEDED by list_v2.js (Tier-5). Kept on disk for reference; no longer imported from the bundle.
// Card-grid list view: post-render decoration. Re-arranges existing list rows
// into a CSS grid via a wrapper class — keeps Frappe's selection/filter/scroll
// behavior intact (we only change visual layout, not DOM order).

const CARD_DENYLIST = new Set([
	"Bank Transaction",
	"Stock Ledger Entry",
	"GL Entry",
	"Journal Entry",
	"Payment Entry",
	"Sales Invoice Item",
	"Purchase Invoice Item",
]);

function userOptedOut() {
	try {
		return localStorage.getItem("ts_card_view") === "off";
	} catch (e) {
		return false;
	}
}

function shouldCardify(doctype) {
	if (userOptedOut()) return false;
	return !CARD_DENYLIST.has(doctype);
}

if (window.$) {
	$(document).on("list_view_render", (e, listview) => {
		if (!listview || listview.view_name !== "List") return;
		if (!shouldCardify(listview.doctype)) return;
		if (listview.$result) listview.$result.addClass("ts-card-grid");
	});
}
