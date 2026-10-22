# CalendarList

Race calendar rows under a 6px ink rule: a big `figure-lg` day number with the weekday, the race and its place, the distance, and the type (plus cup in red).

## When to use
The calendar page, a country's upcoming races, and "next races" on the home page. Group by month with a `SectionHeading` or `PageHeader` ("October 2024").

## What you provide
`items` of `{day, weekday, name, href?, edition?, place, nat?, distance, type, cup?}`. Join several distances of one race with " · " ("50 · 65 km").

## Rules
On phones the distance and type move under the race name.
