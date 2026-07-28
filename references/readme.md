# Octopus Design System

Octopus is a **Speaker Preview Manager**: a kiosk/tablet app used at medical congresses so a session's speaker can preview their own session details (schedule, session abstract, speaker bio, sponsor logo, and a follow-me QR code) before going on stage. Screens observed are all in English UI chrome with Spanish session content (the source events are Spanish-language medical congresses), e.g. "INTERNATIONAL CONGRESS OF VARIATIC SURGERY".

**Sources provided:** six PNG screenshots (`uploads/1-portada.png` splash, `2-bloques.png` schedule, `3-sesiones.png` session detail, `4-disertantes*.png` speaker detail with/without sponsor) plus `uploads/logo_octopus.png`. No Figma file, codebase, or component library was attached — this system was built by reading the screenshots directly, so treat the four flows in `ui_kits/speaker-preview-manager/` as the ground truth for this product; there is no deeper source to cross-reference.

Given color: primary blue `#214080`. Given font: "NunitoSans or similar" — matched exactly to **Nunito Sans** on Google Fonts (loaded via `tokens/typography.css`, no substitution needed).

## Index
- `styles.css` — root stylesheet, imports everything in `tokens/`
- `tokens/` — colors, typography, spacing, effects (shadows/motion)
- `assets/` — logo, cropped icon mark, social glyphs, original reference screenshots
- `components/core/` — Button, IconButton, SectionLabel, Panel
- `components/navigation/` — Tabs
- `components/data/` — ScheduleTable
- `components/social/` — SocialIcons
- `ui_kits/speaker-preview-manager/` — full click-through recreation: Splash → Schedule → Session → Speaker
- `guidelines/` — foundation specimen cards (colors, type, spacing, radii/shadows, logo, icons)

## Components
- **Button** — pill or circular action button; variants primary (accent blue), navy, outline, ghost
- **IconButton** — small circular icon-only control (back, forward, refresh, play, close)
- **SectionLabel** — heading with a short blue accent bar (the source's one border/accent motif)
- **Panel** — flat white container, thin border, no radius, no shadow
- **Tabs** — flat top-bordered date-switcher tabs
- **ScheduleTable** — session list with navy header row and per-row enter action
- **SocialIcons** — row of copied Facebook/Instagram/LinkedIn/Twitter glyphs

### Intentional additions
None of the above were invented beyond what the four screens show; every component maps directly to a UI element visible in the source screenshots. No brand component library existed to enumerate against, so this is a from-scratch minimal set sized to the one product.

## Content fundamentals
- **UI chrome language:** English ("WELCOME", "ROOM A", "FOLLOW ME", "Enter/End/Session"). **Session content is data-driven** and appears in Spanish in the sample screens (session titles, speaker bios) — the app is a shell around congress-supplied content, so copy language follows whatever the event organizer provides.
- **Tone:** utilitarian, kiosk/operational — short labels, no marketing voice, no taglines beyond "Speaker Preview Manager" under the logo.
- **Casing:** section labels and table headers are Title Case or ALL CAPS ("WELCOME", "FOLLOW ME", "ROOM A"); body/bio copy is normal sentence case.
- **Voice:** no first/second person address anywhere — it's informational display copy (names, times, abstracts), not conversational UI copy.
- **Emoji:** none.

## Visual foundations
- **Color:** one brand navy (`#214080`) for headings/chrome/table-header fills, one bright accent blue (`#0d6efd`) for primary actions and links, a soft mid-blue (`#6798e9`) for secondary accents (tab underline, the "A" in "ROOM A", section-label bars). Backgrounds are near-white/pale-blue (`#f7f9fe`); surfaces are pure white. A single warm accent (`#c8703e`) appears once, on the session-title/topic line — likely a per-event content color rather than chrome, kept as a documented token since it recurs across screens.
- **Type:** one family, Nunito Sans, across every screen — a rounded-but-not-playful grotesque. Headings use black/bold weight; body copy is regular weight, fairly small (13–17px) reflecting a data-dense kiosk table UI rather than a marketing surface.
- **Backgrounds:** flat pale-blue page background, no images, no gradients, no textures or patterns anywhere in the source.
- **Animation:** none observed (static kiosk screenshots) — components here use only subtle hover-brightness/press-scale, no bounce/spring easing.
- **Hover/press states:** not visible in static screenshots; components extrapolate a conservative brightness bump on hover and a slight scale-down on press, consistent with a touch-kiosk context (no darkening, no color inversion).
- **Borders/shadows:** the session-detail panel uses a thin light-blue 1px border with **zero corner radius** — deliberately flat, not a rounded "card." Buttons are the only rounded elements (pill or full circle) and carry a soft blue drop shadow; nothing else casts a shadow.
- **Corner radii:** 0 on panels/tables, full pill/circle on buttons only — no in-between radius anywhere in the source.
- **Cards:** there is no elevated/shadowed "card" pattern in this product; the closest equivalent (session-detail box) is a flat bordered `Panel`, not a shadowed card.
- **Imagery:** none — no photography, illustration, or hero imagery; the only raster content is the sponsor logo slot and a generated QR code, both third-party/dynamic, not brand assets.
- **Layout:** fixed header (logo mark + congress title + room indicator) and a thin navy footer bar pinned on every screen; content area scrolls/changes between them. Bottom-right floating circular nav (back/reset) is a persistent fixed element across all inner screens.
- **Transparency/blur:** none used.

## Iconography
- No icon font or SVG icon set was present in the source — only four **social brand glyphs** (Facebook, Instagram, LinkedIn, Twitter), which were cropped directly from the speaker-detail screenshot and copied into `assets/icons/social/` (do not redraw these; swap in official brand SVGs if higher-res versions are available).
- The play/settings/back/forward/refresh/close glyphs used in `IconButton` are **not** present as source assets (they're implied by round buttons in the screenshots) — they were built as simple inline stroke-SVGs matching the buttons' weight, since no icon set exists to copy from. Flag: if the real app uses a specific icon font/library for these, swap `IconButton`'s inline paths for it.
- No emoji or unicode-glyph icons are used anywhere.

## Fonts
Nunito Sans loaded from Google Fonts (`tokens/typography.css`) — an exact match to the requested "NunitoSans", so no substitution or missing-file follow-up is needed.

## Logo
`assets/logo_octopus.png` (full wordmark) and `assets/logo-mark.png` (icon-only crop) came from `uploads/logo_octopus.png`. Treat this as the real Octopus mark — do not redraw or approximate it.
