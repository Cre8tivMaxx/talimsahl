# Product

## Register

product

## Users

Mixed school staff: administrative staff (student records, fees, program management, heavy data entry) and teachers (attendance, assessments, gradebooks, read-heavy with form submission). Both roles share the same desk. Users are bilingual — Arabic primary, English secondary — and range from digitally fluent to ERP-reluctant. The experience must be fast enough for administrative power users and legible enough for a teacher opening it twice a week.

## Product Purpose

Talim Sahl ("Easy Learning" in Arabic) reskins Frappe Desk as a first-class branded product for Arabic educational institutions using ERPNext/Frappe Education. The existing Frappe/ERPNext UI is functional but signals "generic open-source ERP" — Talim Sahl makes the same underlying tools feel like a purpose-built product the institution chose and is proud of. Success: staff stop thinking about the software and focus on the work.

## Brand Personality

Bold, polished, premium — a tier above any ERP the school has seen. Confident without being aggressive. The kind of interface that earns trust on first impression and keeps it through speed and coherence.

## Anti-references

- **Heavy enterprise ERP** (SAP, Oracle): gray utilitarian grids, zero brand expression, soul-crushing density. The color of a filing cabinet.
- **Western EdTech** (Canvas, Schoology, Seesaw): primary-color brightness, student-first toy-ish layouts, playful iconography that feels out of place for admin work. Built for 14-year-olds, not registrars.
- **Raw Frappe/ERPNext**: unstyled, blue-heavy, system-font defaults. The baseline we're escaping.
- **Generic SaaS dashboards**: pastel cards, gradient accent bars, identical widget grids. Indistinguishable from 1,000 other tools.

## Design Principles

1. **Premium means coherent.** Expensive-feeling software is coherent at every surface — not just the home workspace. Form views, list pages, modals, error states, empty states all carry the same visual grammar.
2. **Brand accent, neutral ground.** Teal and navy are precious; they signal action, state, and identity. The canvas they appear on should be clean and quiet so they pop. Never flood a surface with brand color.
3. **Bilingual is structural, not cosmetic.** RTL support is not a flip-bit toggle applied after the fact. Arabic text in every component must have the same visual weight, spacing, and legibility as English text.
4. **Fast over beautiful.** If an animation, shadow, or transition costs render budget, cut it. The design earns its keep through clarity, not decoration.
5. **Native Frappe chrome, branded expression.** Style what Frappe renders; never replace its DOM or JS. The reskin must survive every Frappe v16 minor upgrade without breakage.

## Accessibility & Inclusion

- WCAG 2.1 AA minimum for all text (4.5:1 body, 3:1 large/interactive)
- Noto Sans Arabic loaded alongside Inter — Arabic text must render at equivalent weight and size parity
- RTL layout support throughout (`html[dir="rtl"]` overrides in place)
- `prefers-reduced-motion` respected: transitions collapse to opacity fades
- Placeholder text must meet 4.5:1 (not the muted-gray default)
