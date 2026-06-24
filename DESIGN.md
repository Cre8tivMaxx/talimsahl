---
name: Talim Sahl
description: A branded Frappe Desk reskin for Arabic educational institutions — official, precise, and bilingual.
colors:
  trust-teal: "#0D9B8A"
  trust-teal-deep: "#087C6F"
  registry-navy: "#1B3A6B"
  registry-navy-deep: "#122A50"
  command-cobalt: "#2831AD"
  command-cobalt-deep: "#1E2589"
  ink: "#1D1E20"
  muted: "#525252"
  surface-soft: "#E8F4F1"
  canvas: "#F6F8FA"
  surface: "#FFFFFF"
  border: "#E5EAEE"
  border-dark: "#D5DBE2"
typography:
  display:
    fontFamily: "Inter, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Inter, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 600
    lineHeight: 1.4
  title:
    fontFamily: "Inter, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Inter, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1.4
  data:
    fontFamily: "Inter, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.command-cobalt}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.command-cobalt-deep}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.registry-navy}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.registry-navy}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "38px"
  chip:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.registry-navy}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
---

# Design System: Talim Sahl

## 1. Overview

**Creative North Star: "The Civil Registry"**

Talim Sahl is the interface of a public institution that happens to be beautiful. It carries the visual grammar of official authority — Navy structure, Teal operational markers, Cobalt commands — but is free of the cold anonymity that plagues ERP software. Every surface signals that serious work happens here, and that the institution chose this product because it reflects their standards, not just their budget.

The system is bilingual by architecture, not by afterthought. Inter and Noto Sans Arabic share the same font stack at the same weight and size. RTL overrides are structural; Arabic text does not feel translated. A registrar opening the same screen in Arabic or English should have an identical experience of density, legibility, and hierarchy.

Design decisions are made by subtraction. The canvas is quiet so the three brand colors carry meaning when they appear. Navy claims headings and structural chrome. Teal signals "this is interactive, this is active, this is now." Cobalt says "this is the action that matters." A screen where all three appear together is a screen with a clear flow. A screen with none is information at rest.

**Key Characteristics:**
- Three-color hierarchy with strict role separation (Navy = structure, Teal = state, Cobalt = primary action)
- Flat elevation vocabulary: depth from hairline borders and surface tinting, not from shadows
- Bilingual-first: Inter + Noto Sans Arabic as a unified stack, not a fallback chain
- Institutional density: data-rich layouts with 38px controls, 14px body, 1.6 line height
- RTL-safe component patterns throughout (inset box-shadow instead of border-left for sidebar accent)

## 2. Colors: The Civil Registry Palette

Three colors, three functions. The palette is precise and non-negotiable.

### Primary
- **Trust Teal** (#0D9B8A): The active-state color. Appears on focus rings (3px glow at 18% opacity), sidebar active indicators, list header underlines, card hover borders, and checkbox/radio accents. Never used decoratively. If Teal is visible, something is selected, focused, or hovered.
- **Trust Teal Deep** (#087C6F): The hover and pressed state for Teal-colored elements. Also used in green semantic indicator pills for text color.

### Secondary
- **Registry Navy** (#1B3A6B): The structural color. Owns the navbar background, all heading text (`h1`–`h4`), sidebar item text, list column headers, table headers, modal titles, and widget titles. The color of authority.
- **Registry Navy Deep** (#122A50): Navbar hover states and the darkest structural layer.

### Tertiary
- **Command Cobalt** (#2831AD): Reserved exclusively for primary action buttons. The only fully saturated color the user will click. Its rarity is its weight.
- **Command Cobalt Deep** (#1E2589): Primary button hover and the focus glow ring on primary buttons (18% opacity).

### Neutral
- **Ink** (#1D1E20): Primary body text. Near-black, not pure black, to reduce harshness on the off-white canvas.
- **Muted** (#525252): Control labels, secondary metadata, placeholder-adjacent text. Must still pass 4.5:1 on the canvas and surface backgrounds.
- **Surface Soft** (#E8F4F1): Teal-tinted near-white. Used for sidebar hover backgrounds, active sidebar items, row hover states, and secondary button backgrounds. The only "warm" surface in the system, and it tilts toward Teal not warmth.
- **Canvas** (#F6F8FA): The page background. Blue-gray tinted, not warm. Cards and forms sit on top of it.
- **Surface** (#FFFFFF): Card and form field backgrounds. Pure white against the canvas creates the only depth in the system.
- **Border** (#E5EAEE): Standard dividers, input strokes, card edges. Hairline presence.
- **Border Dark** (#D5DBE2): Emphasized borders for table cells and structural dividers.

### Named Rules
**The One-Color-One-Job Rule.** Navy for structure, Teal for state, Cobalt for action. Never use Cobalt for decoration, Teal for headings, or Navy for buttons. If a new surface needs color, assign it to one of these roles explicitly — do not reach for a fourth color.

**The Rarity Rule.** Cobalt appears once per screen: on the primary CTA. If it appears more than once, one instance is wrong.

## 3. Typography

**Display / Body Font:** Inter (with Noto Sans Arabic as the bilingual partner)
**Mono:** system-ui mono stack (for code snippets and data fields only)

**Character:** Inter and Noto Sans Arabic share the same x-height and stroke weight at the sizes this system uses. They are not a Latin font plus an Arabic fallback; they are two partners in one stack. The type system is a single-family system: no display serif, no secondary sans. Hierarchy comes from weight contrast (400 body, 500 labels, 600 titles, 700 display) and size steps of 1.12–1.25.

### Hierarchy
- **Display** (700, 18px, 1.3, -0.01em): Page titles, DocType names in the form hero header. Appears at the top of a form view or workspace card header. Never in lists or tables.
- **Headline** (600, 15.5px, 1.4): Section headers within forms, workspace widget titles, modal headings. The label before a group of related fields.
- **Title** (600, 14px, 1.5): Column headers in list views, sidebar group labels, table `<th>` elements. Same size as body; differentiated by weight only.
- **Body** (400, 14px, 1.6): All data entry text, field values, list row content, help text. The dominant voice on every screen.
- **Label** (500, 12.5px, 1.4): Control labels (`control-label`), field names, form-level metadata. Medium weight to distinguish from body without competing with it.
- **Data** (400, 11px, 1.4): Timestamps, IDs, secondary metadata, indicator pill text. Compact; used where density is required.

### Named Rules
**The One Stack Rule.** Inter and Noto Sans Arabic are always declared together: `"Inter", "Noto Sans Arabic", system-ui, sans-serif`. Never separate them. Arabic text that falls back to a system Arabic font will render at a different weight and undermine bilingual parity.

**The Fixed Scale Rule.** No clamp-based fluid type. Controls render at consistent device DPI; a sidebar label that shrinks on a narrower panel looks broken, not responsive. All sizes are fixed px values declared as CSS custom properties.

## 4. Elevation

Talim Sahl is flat by default. Depth is communicated through surface contrast (white cards on gray canvas), hairline border contrast (border-color on surface), and border-color transitions on hover (border shifts to Trust Teal). Shadows are used structurally, not decoratively.

### Shadow Vocabulary
- **Flat** (`0 1px 2px rgba(15, 23, 42, 0.04)`): Applied to all cards, workspace widgets, and number cards at rest. Barely perceptible — its job is to confirm the surface, not to lift it. Used via `--ts-shadow-flat`.
- **Elevated** (`0 8px 24px rgba(15, 23, 42, 0.12)`): Reserved for modals and dialogs. Signals that a new layer is blocking the content below. Used via `--ts-shadow-elev`.
- **Dropdown** (`0 4px 12px rgba(15, 23, 42, 0.08)`): Awesomplete dropdowns and context menus. Between Flat and Elevated.

### Named Rules
**The Flat-By-Default Rule.** Cards, forms, lists, and panels are flat at rest. The Flat shadow confirms the surface without lifting it. If a designer reaches for a larger shadow on a card, they are solving a problem that should be solved with surface-color contrast instead.

**The No-Lift Rule.** Cards do not `translateY` on hover. Hover state is a border-color transition from `--border-color` to `--ts-primary`. Motion is reserved for state transitions in the product register, not for decoration.

## 5. Components

### Buttons
Precise and restrained: minimal padding, consistent shape, no decorative shadows at rest.
- **Shape:** Gently rounded (6px — `--ts-radius-sm`)
- **Primary:** Command Cobalt background (#2831AD), white text, 8px 16px padding, weight 500
- **Primary Hover:** Command Cobalt Deep (#1E2589), cobalt focus glow `0 0 0 3px rgba(40,49,173,0.18)`
- **Default:** White background, standard border (#E5EAEE), Registry Navy text (#1B3A6B)
- **Default Hover:** Surface Soft background (#E8F4F1), border shifts to Trust Teal
- **Secondary:** Surface Soft background, no visible border, Registry Navy text
- **All buttons:** 150ms ease transition on background, border, and box-shadow

### Inputs / Fields
- **Style:** White background, 1px standard border, 8px radius (`--ts-radius-md`), 38px height
- **Font:** 13.5px (`--ts-control-font`), body weight 400
- **Focus:** Border shifts to Trust Teal, `0 0 0 3px rgba(13,155,138,0.18)` focus glow ring, background stays white
- **Label:** 12.5px, weight 500, Muted color (#525252) — never the same color as the field value
- **Select:** Same stroke and height; custom chevron SVG (navy color) inlined as `background-image`. RTL variant mirrors the chevron and padding.

### Cards / Containers
- **Corner Style:** Gently rounded (10px — `--ts-radius-lg`)
- **Background:** White (#FFFFFF) on Canvas (#F6F8FA)
- **Shadow:** Flat only (`0 1px 2px rgba(15,23,42,0.04)`)
- **Border:** 1px standard border (#E5EAEE); transitions to Trust Teal on hover
- **Internal Padding:** 16px–20px (`--spacing-md` to `--spacing-lg`)
- **Hover:** Border-color transitions to Trust Teal in 120ms. No transform. No shadow change.

### Chips / Tags
- **Style:** Surface Soft background (#E8F4F1), Registry Navy text, 6px radius
- **Filter chips:** Small version (12.5px label weight), standard border at rest; Trust Teal border when active

### Indicator Pills
Semantic color system. Pills are `border-radius: 999px`, weight 500, 11px text.
- **Green (active/submitted):** Teal-tinted bg `rgba(13,155,138,0.12)`, Trust Teal Deep text (#087C6F)
- **Blue (in progress):** Cobalt-tinted bg `rgba(40,49,173,0.12)`, Command Cobalt Deep text (#1E2589)
- **Red (cancelled/overdue):** `rgba(220,53,69,0.12)`, #B23B47 text
- **Orange/Yellow (pending):** `rgba(245,158,11,0.12)`, #B45309 text
- **Gray (draft/inactive):** `rgba(82,82,82,0.10)`, Muted text (#525252)

### Navigation / Sidebar
- **Style:** 240px width, 1px right border, white background
- **Item default:** 14px body weight, Registry Navy text, no background
- **Item hover:** Surface Soft background (#E8F4F1), 8px radius
- **Item active:** Surface Soft background, Trust Teal text, `box-shadow: inset 3px 0 0 #0D9B8A` (LTR) / `inset -3px 0 0 #0D9B8A` (RTL). Never `border-left`: the inset box-shadow avoids layout reflow and mirrors correctly in RTL.

### List View
- **Header row:** White background, bottom border 2px Trust Teal, column titles Title weight (600)
- **Data rows:** No background at rest, 1px bottom border, 120ms hover to Surface Soft
- **Row text:** Registry Navy (#1B3A6B) for primary column, Muted for secondary columns

### Modals / Dialogs
- **Shape:** 10px radius, 1px standard border
- **Shadow:** Elevated (`0 8px 24px rgba(15,23,42,0.12)`)
- **Header:** 1px bottom border, title at Headline weight (600, 15.5px) in Registry Navy

## 6. Do's and Don'ts

### Do:
- **Do** use `box-shadow: inset 3px 0 0 var(--ts-primary)` for the sidebar active indicator — never `border-left`. It avoids layout reflow and works correctly in RTL without a separate override.
- **Do** pair Inter and Noto Sans Arabic in every `font-family` declaration, in that order. They are one stack, not a Latin font with an Arabic fallback.
- **Do** reserve Command Cobalt (#2831AD) for primary action buttons only. One per screen. Its rarity is its authority.
- **Do** use Trust Teal for all interactive state signals: focus rings, sidebar active, hover borders, checkbox accents. Never for headings or static text.
- **Do** express hover state as a border-color transition (→ Trust Teal) rather than `translateY` or shadow increase.
- **Do** include `html[dir="rtl"]` overrides for any component using directional properties (`padding-inline`, `border-left`, `border-right`, `box-shadow` inset values).
- **Do** test all text against 4.5:1 minimum contrast — including Muted (#525252) on Canvas (#F6F8FA) and on Surface Soft (#E8F4F1).
- **Do** include `@media (prefers-reduced-motion: reduce)` for every transition or animation, collapsing to an instant state change.

### Don't:
- **Don't** build an interface that looks like a heavy enterprise ERP — SAP-gray utilitarian grids with zero brand expression. Every screen carries the three-color hierarchy.
- **Don't** introduce Western EdTech brightness — primary-color saturation, playful iconography, student-first layouts. This interface is for registrars and administrators, not 14-year-olds.
- **Don't** let the UI read as raw Frappe/ERPNext: unstyled blue links, system-font defaults, unbranded modal headers.
- **Don't** use generic SaaS dashboard patterns: pastel card grids, gradient accent bars, identical widget rows, hero metric templates (big number + small label + gradient accent).
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe on cards, list rows, or callouts. Use a full border, background tint, or the inset box-shadow pattern instead.
- **Don't** use gradient text (`background-clip: text` with a gradient). Use solid Registry Navy or Trust Teal.
- **Don't** use glassmorphism as a default. Backdrop-filter belongs to modals at most, never to cards or panels.
- **Don't** add uppercase tracked eyebrows above every section (small ALL-CAPS text with wide letter-spacing). This is a saturated AI pattern, not a brand system.
- **Don't** add a fourth brand color. If a semantic role needs color (warning, error, info, success), use the established semantic vocabulary in the indicator pills system — never a new brand color.
- **Don't** use `translateY` card lifts on hover. The hover contract is border-color → Trust Teal, nothing more.
