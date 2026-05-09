app_name = "talimsahl"
app_title = "تعليم سهل"
app_publisher = "Taliem Sahl"
app_description = "Brand theme for Taliem Sahl — bilingual (Arabic/English) ERP rebrand."
app_email = "notabdelrahmanelsayed@gmail.com"
app_license = "mit"

app_logo_url = "/assets/talimsahl/images/logo.png"

# Desk assets
app_include_css = "/assets/talimsahl/css/talimsahl.css"
app_include_js = "/assets/talimsahl/js/talimsahl.js"

# Web/portal assets (login, www pages, portal)
web_include_css = "/assets/talimsahl/css/talimsahl.css"

# Inject brand variables into the website theme SCSS pipeline
website_theme_scss = "talimsahl/public/scss/website_theme_overrides"

# Favicon + splash for the public web side
website_context = {
    "favicon": "/assets/talimsahl/images/favicon.png",
    "splash_image": "/assets/talimsahl/images/logo.png",
    "brand_html": '<img src="/assets/talimsahl/images/logo.png" alt="Taliem Sahl" style="height:32px;">',
}

# Apply Website Settings + Navbar Settings on install and after every migration
after_install = "talimsahl.install.apply_brand_settings"
after_migrate = "talimsahl.install.apply_brand_settings"
