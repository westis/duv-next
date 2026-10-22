# ResultsTable

The event results table: two-digit condensed ranks (the winner in `brand-ink`), tabular performances, links to runners and a 3px ink rule under the head.

## When to use
Event results, runner result lists and rankings. Wrap wide tables in their own scroll box (the component does).

## What you provide
- `rows` — `{rank, perf, name, href?, club?, nat, yob?, cat?, catRank?, speed?, marker?}`; `perf` as DUV writes it ("187.207").
- `unit` — "km" by default; "" for times ("7:51:23 h" in `perf`).
- `highlight` — the row id or rank to paint in `highlight` (the runner you came from).
- `caption` — read by screen readers.

## Rules
Missing clubs show "—". Row hover is `surface-muted`. Never zebra-stripe; hairlines in `border` separate rows.
