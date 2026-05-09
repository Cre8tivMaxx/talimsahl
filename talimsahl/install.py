import frappe

BRAND_NAME = "تعليم سهل"
BRAND_NAME_EN = "Taliem Sahl"
LOGO_URL = "/assets/talimsahl/images/logo.png"
FAVICON_URL = "/assets/talimsahl/images/favicon.png"


def apply_brand_settings():
    """Write Taliem Sahl branding into Website Settings + Navbar Settings.

    Idempotent — safe to call from after_install and after_migrate.
    """
    _apply_website_settings()
    _apply_navbar_settings()
    frappe.clear_cache()


def _apply_website_settings():
    ws = frappe.get_single("Website Settings")
    ws.app_name = BRAND_NAME
    ws.brand_html = (
        f'<img src="{LOGO_URL}" alt="{BRAND_NAME_EN}" '
        f'style="height:32px;vertical-align:middle;">'
    )
    ws.banner_image = LOGO_URL
    ws.favicon = FAVICON_URL
    ws.splash_image = LOGO_URL
    ws.footer_powered = ""
    ws.show_footer_on_login = 0
    ws.copyright = f"© {frappe.utils.now_datetime().year} {BRAND_NAME} — {BRAND_NAME_EN}"
    ws.hide_footer_signup = 1
    ws.flags.ignore_permissions = True
    ws.flags.ignore_mandatory = True
    ws.save()


def _apply_navbar_settings():
    if not frappe.db.exists("DocType", "Navbar Settings"):
        return
    nav = frappe.get_single("Navbar Settings")
    nav.app_logo = LOGO_URL
    nav.logo_width = 32
    nav.flags.ignore_permissions = True
    nav.flags.ignore_mandatory = True
    nav.save()
