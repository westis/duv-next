# duv-next

New version of the DUV Ultramarathon Statistics website (Next.js, TypeScript, Tailwind CSS v4, shadcn/ui). Data comes from the DUV JSON API through the typed client in `lib/duv/` (see README.md).

## Design system

The UI follows **DUV Swiss Grid**, kept in `design-system/`:

- Read `design-system/README.md` (the brand book) and `design-system/INSTALL.md` before changing styles or components.
- `design-system/tokens.json` is the source of truth for colours (light and dark), type, spacing, rules and layout; `design-system/tokens.css` is the same as CSS variables with the names `app/globals.css` uses (light on `:root`, dark on `.dark`).
- `design-system/components/*.md` are the component guidelines; `bundle.css` / `bundle.js` are a plain-React reference of the look, not to be imported into the app.
- Logos: `public/duv_logo_with_name.png` (light grounds) and `public/duv_logo_with_name_white.png` (dark grounds and the header band).

## Workflow

Daniel is the sole developer. Work directly on `main`: no branches, no pull requests. Make one commit per finished step, with a clear message, and push to `origin main`.
