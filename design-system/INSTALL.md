# Applying DUV Swiss Grid to duv-next

This folder is the DUV Swiss Grid design system (README = brand book, tokens.json = source of truth). Read README.md before changing any UI.

1. **Colours** — `tokens.css` uses the same names as `app/globals.css` (`bg`, `surface`, `surface-muted`, `border`, `fg`, `fg-muted`, `brand`, `brand-ink`, `brand-fg`, `link`, `highlight`, `success`, `warning`, `danger`, `cr`, `pb`, `medal-*`) plus new ones (`header`, `header-fg`, `header-muted`, `control-border`, `focus`, `cr-fg`). Replace the values in the `:root` and `.dark` blocks of `app/globals.css` with these, add the new names to the `@theme inline` block, and set `--radius-*` to 0.
2. **Fonts** — in `app/layout.tsx` swap `Inter` / `Source_Serif_4` for `Barlow_Condensed` (weights 500–800) and `Archivo` from `next/font/google`; point `--font-serif` / `--font-heading` at Barlow Condensed and `--font-sans` / `--font-body` at Archivo. Make `label-caps` Barlow Condensed 14px 700, uppercase, 0.06em.
3. **Components** — `components/*.md` describe each piece (SiteHeader, PageHeader, StatStrip, ResultsTable, CalendarList, FilterChips, Tag, RecordMarker …). `components/bundle.css` and `bundle.js` are a plain-React reference implementation of the look: port the rules into the Tailwind components in `components/design/` and `components/layout/`; do not import the bundle into the app.
4. **Logos** — already in `public/` (`duv_logo_with_name.png`, `duv_logo_with_name_white.png`); the header always uses the white one.
