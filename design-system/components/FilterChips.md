# FilterChips

A single-select row of square chips; the chosen one is filled with `fg`.

## When to use
Short, mutually exclusive filters above a list: race type, gender (Overall / Men / Women), surface. For long lists (countries, years) use a select instead.

## What you provide
`options` (strings or `{value, label}`), `value` + `onChange` (controlled) or `defaultValue`, and a `label` naming the group.

## Rules
Inactive chips have a `rule-hair` outline in `control-border`. Labels are one or two words.
