app_name = "talimsahl"
app_title = "تعليم سهل"
app_publisher = "Talim Sahl"
app_description = "Brand theme for Talim Sahl — bilingual (Arabic/English) ERP rebrand."
app_email = "notabdelrahmanelsayed@gmail.com"
app_license = "mit"

app_logo_url = "/assets/talimsahl/images/logo.png"

# Desk (/app) reskin — loaded into Frappe Desk only.
app_include_css = [
	"/assets/talimsahl/css/brand-tokens.css",
	"/assets/talimsahl/css/desk-overrides.css",
]
app_include_js = [
	"desk_reskin.bundle.js",
]

# Web/portal assets (login page, www pages, public portal).
web_include_css = [
	"/assets/talimsahl/css/brand-tokens.css",
	"/assets/talimsahl/css/talimsahl.css",
]

# Inject brand variables into the website theme SCSS pipeline
website_theme_scss = "talimsahl/public/scss/website_theme_overrides"

# Favicon + splash for the public web side
website_context = {
	"favicon": "/assets/talimsahl/images/favicon.png",
	"splash_image": "/assets/talimsahl/images/logo.png",
	"brand_html": '<img src="/assets/talimsahl/images/logo.png" alt="Talim Sahl" style="height:32px;">',
}

# Apply Website Settings + Navbar Settings on install and after every migration
after_install = "talimsahl.install.apply_brand_settings"
after_migrate = "talimsahl.install.apply_brand_settings"

# Workspace customization is applied programmatically from install.py
# (see _apply_workspace_if_education_present). Not exported as a fixture
# because Frappe's fixture loader enforces stricter validation than doc.save().

