# DUV data the site has but does not show yet

Fields DUV's JSON API already sends that no page shows today. Kept here so they are not
forgotten if a page wants them later.

## Race results (`mgetresultevent`, `EventResultRow` in `lib/duv/types.ts`)

- `Speed`: average speed of each finisher (km/h, or min/km with the API's speed type
  filter, `FltSpeedTypeValue`).
- `AgeGradePerf`: age-graded performance (the result adjusted by the runner's age and
  gender).
- `Club`, `YOB` / `DOB`: club and birth year. The name search on the Results tab already
  searches clubs.

Daniel (2026-10-20): no need to show average speed or age-graded results for now.
