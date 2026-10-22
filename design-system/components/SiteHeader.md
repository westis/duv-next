# SiteHeader

The site's header band: the white DUV logo, the five sections in uppercase condensed type and the search field, on `header`.

## When to use
Once per page, at the top, full width. The band is `header` in both themes (navy in light, near-black in dark) so it always carries the **white** logo (`assets/Logos/duv_logo_with_name_white.png`).

## What you provide
- `logoSrc` — the uploaded white logo's url. Without it, "DUV" is set in `display` type.
- `active` — the label of the current section; it gets `aria-current="page"` and a `rule-mid` underline in `brand`.
- `items` — optional `{label, href}` list; defaults to Calendar, Results, Rankings, Records, Countries.
- `search={false}` hides the search field.

## Rules
- Inactive items are `header-muted`, the active one `header-fg`. Never colour the band red.
- On phones the nav wraps under the logo; keep labels to one word.
