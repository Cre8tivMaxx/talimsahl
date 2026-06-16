"""Create the Talim Sahl "Home" workspace as default landing.

Idempotent — safe to re-run from after_install / after_migrate.
"""

import json
import frappe

WORKSPACE = "Home"
ICON = "education"

# (label, link_to, color)
SHORTCUTS = [
    ("Students", "Student", "blue"),
    ("Programs", "Program", "green"),
    ("Attendance", "Student Attendance", "purple"),
    ("Fees", "Fees", "orange"),
    ("Assessments", "Assessment Result", "red"),
]

# Card Break groups: (label, [(link_label, link_type, link_to), ...])
CARD_GROUPS = [
    ("Students", [
        ("Student", "DocType", "Student"),
        ("Student Group", "DocType", "Student Group"),
        ("Program Enrollment", "DocType", "Program Enrollment"),
        ("Guardian", "DocType", "Guardian"),
    ]),
    ("Academics", [
        ("Program", "DocType", "Program"),
        ("Course", "DocType", "Course"),
        ("Academic Year", "DocType", "Academic Year"),
        ("Academic Term", "DocType", "Academic Term"),
        ("Course Schedule", "DocType", "Course Schedule"),
    ]),
    ("Fees", [
        ("Fees", "DocType", "Fees"),
        ("Fee Structure", "DocType", "Fee Structure"),
        ("Fee Category", "DocType", "Fee Category"),
    ]),
    ("Attendance", [
        ("Student Attendance", "DocType", "Student Attendance"),
        ("Student Leave Application", "DocType", "Student Leave Application"),
    ]),
    ("Assessment", [
        ("Assessment Plan", "DocType", "Assessment Plan"),
        ("Assessment Result", "DocType", "Assessment Result"),
    ]),
]

# EditorJS-style content layout — references shortcut labels + card group labels above
_CONTENT_LAYOUT = [
    {"id": "ts-sp1", "type": "spacer", "data": {"col": 12}},
    {"id": "ts-h1", "type": "header", "data": {"text": "<span class=\"h4\"><b>Your Shortcuts</b></span>", "col": 12}},
    {"id": "ts-sc1", "type": "shortcut", "data": {"shortcut_name": "Students", "col": 3}},
    {"id": "ts-sc2", "type": "shortcut", "data": {"shortcut_name": "Programs", "col": 3}},
    {"id": "ts-sc3", "type": "shortcut", "data": {"shortcut_name": "Attendance", "col": 3}},
    {"id": "ts-sc4", "type": "shortcut", "data": {"shortcut_name": "Fees", "col": 3}},
    {"id": "ts-sc5", "type": "shortcut", "data": {"shortcut_name": "Assessments", "col": 3}},
    {"id": "ts-sp2", "type": "spacer", "data": {"col": 12}},
    {"id": "ts-h2", "type": "header", "data": {"text": "<span class=\"h4\"><b>Reports &amp; Masters</b></span>", "col": 12}},
    {"id": "ts-c1", "type": "card", "data": {"card_name": "Students", "col": 4}},
    {"id": "ts-c2", "type": "card", "data": {"card_name": "Academics", "col": 4}},
    {"id": "ts-c3", "type": "card", "data": {"card_name": "Fees", "col": 4}},
    {"id": "ts-c4", "type": "card", "data": {"card_name": "Attendance", "col": 4}},
    {"id": "ts-c5", "type": "card", "data": {"card_name": "Assessment", "col": 4}},
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

    # Shortcuts
    ws.shortcuts = []
    for label, link_to, color in SHORTCUTS:
        if not frappe.db.exists("DocType", link_to):
            continue
        ws.append(
            "shortcuts",
            {"label": label, "type": "DocType", "link_to": link_to, "color": color},
        )

    # Card Break groups (the sidebar + "Reports & Masters" content)
    ws.links = []
    for group_label, items in CARD_GROUPS:
        ws.append("links", {"type": "Card Break", "label": group_label, "link_type": None, "link_to": None})
        for item_label, link_type, link_to in items:
            if not frappe.db.exists("DocType", link_to):
                continue
            ws.append("links", {"type": "Link", "label": item_label, "link_type": link_type, "link_to": link_to})

    # Content layout (block JSON — drives what actually renders on the page)
    ws.content = json.dumps(_CONTENT_LAYOUT)

    ws.flags.ignore_permissions = True
    ws.flags.ignore_mandatory = True
    ws.save()
    frappe.db.commit()
    print(f"OK: workspace {WORKSPACE!r} shortcuts={len(ws.shortcuts)} link_groups={len(CARD_GROUPS)} content_blocks={len(_CONTENT_LAYOUT)}")
