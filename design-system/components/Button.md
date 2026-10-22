# Button

A square button in uppercase condensed type: `primary` (DUV red), `ink`, `secondary` (outline) and `ghost`.

## When to use
- `primary` — the one main action on a view (submit results, search). At most one per view.
- `ink` — strong secondary actions that should not compete with red.
- `secondary` — exports, "all editions", pagination.
- `ghost` — clear filters, close.

## What you provide
`children` (the label, a verb), `variant`, `size` (`md` 44px default, `sm` 36px), and any button attribute (`onClick`, `disabled`, `type`).

## Rules
No rounded corners, no icons without a label. Text on `brand` is `brand-fg` (white) in both themes.
