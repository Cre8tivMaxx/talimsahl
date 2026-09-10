import frappe
from frappe.www.login import get_context as default_login_get_context

no_cache = True


def get_context(context):
	"""Delegate to Frappe's default login context builder.

	talimsahl/www/login.html is a custom template with no matching controller
	of its own, so Frappe's TemplatePage never resolved a `get_context` for it
	(it only looks for a .py file inside the same app as the .html). That left
	`context.provider_logins` / `context.social_login` unset, so the Cre8tiv-Maxx
	SSO button (already wired into the template) never rendered. Reusing the
	upstream context keeps this in sync with Frappe's login behavior instead of
	duplicating it.
	"""
	return default_login_get_context(context)
