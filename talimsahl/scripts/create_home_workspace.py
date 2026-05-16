"""Create the Talim Sahl "Home" workspace as default landing.

Idempotent — safe to re-run from after_install / after_migrate.
"""

import frappe

WORKSPACE = "Home"
ICON = "education"

# (label, link_to, color) — only inserted if DocType exists on the site.
SHORTCUTS = [
    ("Students", "Student", "blue"),
    ("Programs", "Program", "green"),
    ("Attendance", "Student Attendance", "purple"),
    ("Fees", "Fees", "orange"),
    ("Assessments", "Assessment Result", "red"),
]


def run() -> None:
    try:
        _create_or_update_home()
    except Exception as e:  # noqa: BLE001
        frappe.logger().warning(f"talimsahl: Home workspace setup failed: {e}")


def _create_or_update_home() -> None:
    if frappe.db.exists("Workspace", WORKSPACE):
        ws = frappe.get_doc("Workspace", WORKSPACE)
    else:
        ws = frappe.new_doc("Workspace")
        ws.name = WORKSPACE

    ws.title = WORKSPACE
    ws.label = WORKSPACE
    ws.icon = ICON
    ws.public = 1
    ws.is_hidden = 0
    if hasattr(ws, "sequence_id"):
        ws.sequence_id = 0
    if hasattr(ws, "is_default"):
        ws.is_default = 1

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
    print(f"OK: workspace {WORKSPACE!r} shortcuts={len(ws.shortcuts)}")
