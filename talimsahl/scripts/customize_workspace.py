"""One-shot customizer for the Education workspace.

Run with:  bench --site <site> execute talimsahl.scripts.customize_workspace.run

Idempotent — safe to re-run. Designed to be invoked once after Education is
installed; the result is exported into talimsahl/fixtures/workspace.json so
future sites pick it up automatically via Frappe's fixture loader.
"""

import frappe

WORKSPACE = "Education"
# IMPORTANT: Frappe v16 builds the workspace URL by slugifying `title`.
# Non-ASCII chars + `|` + spaces produce a slug the router can't resolve,
# so we keep title/label = "Education" (route-stable) and rebrand visually
# via icon, shortcuts, page bg, navbar — not via the workspace name itself.
LABEL = "Education"
ICON = "non-profit"

SHORTCUTS = [
    ("Student", "Student", "blue"),
    ("Program Enrollment", "Program Enrollment", "green"),
    ("Fees", "Fees", "orange"),
    ("Student Attendance", "Student Attendance", "purple"),
    ("Assessment Result", "Assessment Result", "red"),
]


def run():
    if "education" not in frappe.get_installed_apps():
        print("education app not installed — skipping")
        return
    if not frappe.db.exists("Workspace", WORKSPACE):
        print(f"Workspace {WORKSPACE} missing — skipping")
        return

    ws = frappe.get_doc("Workspace", WORKSPACE)
    ws.label = LABEL
    ws.title = LABEL
    ws.icon = ICON
    ws.public = 1
    ws.is_hidden = 0

    ws.shortcuts = []
    for label, link_to, color in SHORTCUTS:
        if not frappe.db.exists("DocType", link_to):
            continue
        ws.append(
            "shortcuts",
            {"label": label, "type": "DocType", "link_to": link_to, "color": color},
        )

    ws.flags.ignore_permissions = True
    ws.flags.ignore_mandatory = True
    ws.save()
    frappe.db.commit()
    print(f"OK: {WORKSPACE} → label={ws.label!r}, shortcuts={len(ws.shortcuts)}")
