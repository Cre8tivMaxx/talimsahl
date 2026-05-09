# تعليم سهل — Taliem Sahl Theme

A Frappe / ERPNext custom branding app that rebrands the Desk and portal to
the Taliem Sahl visual identity (Arabic-first, bilingual).

## What it changes

- Navbar: navy (`#1B3A6B`)
- Primary buttons: CTA blue (`#2831AD`)
- Accents, links, focus rings: teal (`#0D9B8A`)
- Sidebar: light navy tint with teal active accent
- Cards / module tiles: rounded with subtle shadow + teal hover lift
- Typography: Inter (Latin) + Noto Sans Arabic (RTL)
- Login page: bilingual split-screen (navy brand panel + white form)
- Hides `Powered by Frappe` footer

## Install

```bash
cd /path/to/your/frappe-bench
bench get-app talimsahl /path/to/talimsahl   # or git URL
bench --site your-site install-app talimsahl
bench build --app talimsahl
bench --site your-site clear-cache
bench restart   # or `bench start` in dev
```

Hard-refresh the browser (Ctrl+Shift+R) to bust cached CSS.

## Swapping the logo

Drop your replacement files into:

```
talimsahl/public/images/logo.png         # main brand logo
talimsahl/public/images/logo-white.png   # for navy login panel
talimsahl/public/images/favicon.png      # browser tab icon
```

Then `bench build --app talimsahl && bench restart`.

## Color palette

| Role        | Hex       |
|-------------|-----------|
| Primary     | `#0D9B8A` |
| Secondary   | `#1B3A6B` |
| CTA         | `#2831AD` |
| Mid blue    | `#3973B7` |
| Light blue  | `#8AC9E8` |
| Text        | `#1D1E20` |
| Text muted  | `#525252` |

## Compatibility

Built and tested on Frappe **v16**. Should work on v15 with the same hooks.

## Contributing

```bash
cd apps/talimsahl
pre-commit install
```

## License

MIT