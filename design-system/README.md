Swiss Grid is the look of the DUV ultramarathon statistics site: modern, clean, built for numbers. Big condensed capitals and figures, heavy ink rules instead of boxes, a 12-column grid, square corners everywhere, and DUV red as the one signal colour. It comes in a light and a dark theme with the same structure.

## Content fundamentals

- **Voice:** factual and brief, like a results sheet. Name the race, the distance, the place, the people. No marketing adjectives, no exclamation marks, no emoji.
- **Language:** English interface copy; race and club names exactly as the organiser writes them, with their diacritics ("Sušice", "ČAU/Vyškov", "Köln").
- **Case:** headings, nav, labels, tags and table heads are set in capitals by the style (`text-transform: uppercase`), so write them in normal case in the source ("Results", "Overall winner").
- **Numbers:** distances with three decimals and a space before the unit ("187.207 km"); times as h:mm:ss ("7:51:23 h"); speeds with three decimals ("7.800 km/h"). Ranks in tables as two digits ("01"). Dates as "6–7 April 2024" in prose, "18 Fri" in the calendar. Countries as IOC codes (CZE, GER, SWE).
- **Editions:** "3rd edition" in a kicker or meta line, never inside the title.
- **Real copy:** "24 h · Road loop · 3rd edition" above "Cursor Poculum"; "6–7 April 2024 · Sušice, Czech Republic · 8 finishers · 6 M, 2 F".

## Visual foundations

### Colour
- Pages sit on `bg`; content blocks on `surface` panels with a `rule-hair` outline in `border`. Text is `fg`, secondary text `fg-muted`.
- The site header band is `header` with `header-fg` / `header-muted` text and always the white logo.
- **Red is a signal, not a decoration.** `brand` fills: the active nav underline, the primary button, solid WR/AR/NR markers, the DUV-Cup chip. `brand-ink` text: the kicker above a title, the winner's rank, the year in a calendar title, IAU and championship tags. Never red backgrounds for sections.
- Links are `link`. The highlighted row (the runner or edition you came from) is `highlight`; row hover `surface-muted`.
- Status (`success`, `warning`) always pairs a 6px dot with its word. Records use `brand` (WR/AR/NR), `cr` with `cr-fg` (course record) and `pb` outline (personal best). Medals are marks in `medal-gold`, `medal-silver`, `medal-bronze`, never text.
- **Dark theme:** the same roles, inverted: `bg` is a navy night, `fg` a chalk ink, rules stay ink-coloured (so they turn light), the header goes near-black, and red splits into `brand` (fills, slightly lifted) and a brighter `brand-ink` for red text. Every text pair holds 4.5:1 in both themes; marks and control borders 3:1.

### Type
- **Barlow Condensed** (`display`, Google Fonts, 500–800) for everything that is read as a headline or a number: `display-xl`, `page-title`, `section-title`, `figure-xl`, `figure-lg`, `rank`, `nav`, `kicker`, `label`. Headings, nav, kickers and labels are UPPERCASE.
- **Archivo** (`body`, Google Fonts, 400–700) for running text and table cells: `body-lg`, `body`, `body-sm`, `body-strong` (performances), `caption`, `micro`.
- All figures use tabular digits (`font-variant-numeric: tabular-nums`) so columns line up.
- Load both from Google Fonts: `https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Archivo:wght@400;500;600;700&display=swap` (the component stylesheet imports it).

### Rules, grid and space
- Hierarchy comes from rules, not boxes or shadows: `rule-heavy` (6px, `fg`) above the main block of a page (podium, calendar list) and under a board header; `rule-mid` (3px, `fg`) under table heads and section headings; `rule-hair` (1px, `border`) between rows and around panels.
- 12-column grid, `grid-gutter` 24px, content capped at `container-max`. Page headers split 8 + 4: title left, meta right-aligned.
- Spacing steps: `space-2` cell padding, `space-6` gutter, `space-7` panel padding, `space-12` between sections, `space-14` page padding on desktop.
- Corners are `radius-none` everywhere; `radius-dot` only for status dots. No shadows, no gradients.

### Interaction
- Focus: a 2px solid `focus` outline, offset 2px, on every focusable element (red in light, the brighter red in dark).
- Touch targets at least 44px (`Button` md); chips 32px inside a 44px row.
- Respect reduced motion; nothing animates beyond colour changes on hover.
- On phones: page titles drop to 40px, the 8 + 4 header stacks, stat strips become one column, calendar rows put distance and type under the race, wide tables scroll inside their own box.

## Iconography

Swiss Grid leans on type, not icons. Where an icon is needed (search, menu, close, external link) use stroke icons from lucide-react, as duv-next already does: 20px, 2px stroke, `fg` (or `header-fg` on the header), always with a text label or an `aria-label`. No filled icons, no emoji, no flags as decoration (countries are IOC codes).

## Logos

Use the drawn DUV logo from Logos: `duv_logo_with_name.png` on light grounds, `duv_logo_with_name_white.png` on dark grounds and always on the `header` band. Its red and yellow runner strokes are fixed; never recolour or redraw the mark.

## Components

The `DUV` bundle holds the building blocks of the site: `SiteHeader`, `SearchField`, `Button`, `FilterChips`, `Tag`, `RecordMarker`, `PageHeader`, `SectionHeading`, `StatStrip`, `ResultsTable`, `CalendarList` and `Panel`. A race page is `SiteHeader` → `PageHeader` → `StatStrip` (podium) → `SectionHeading` → `ResultsTable` inside a `Panel`; the calendar is `SiteHeader` → `PageHeader` ("October 2024") → `FilterChips` → `CalendarList`.
