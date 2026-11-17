@../meta-eigenomar/standards/claude-ecosystem.md

# mawzikalendar: Claude instructions

mawzikalendar is a browser app that turns a music event into a calendar entry.
The event is typed into a form or pasted from an ra.co event page, checked on a
review screen, and comes out as a prefilled Google Calendar link, an `.ics`
file or a summary to copy. So far only the event model and its
normalization exist (X5). It is planned for mawzikalendar.eigenomar.com and
isn't deployed.

## commands

TypeScript, tested with Vitest, on Node 22.12 or later. Each command runs from
the repository's root, on Windows and Linux.

- `npm ci` installs the pinned dev dependencies. The app itself has no runtime
  dependencies: timezones go through `Intl`.
- `npm test` runs the tests. They run in `Pacific/Kiritimati` (UTC+14, set in
  `vitest.config.ts`), so code that reads the machine's own zone fails them.
- `npm run check` typechecks with `tsc` and runs the tests. Run it before
  pushing.

There is no build or app to run yet: X6 adds the UI and Vite's build.
`vitest.config.ts` points `vitest` at the working directory's copy on Windows,
so the tests also pass when started from a lowercase `c:\`.

## plan

[docs/plan.md](docs/plan.md) is the plan. Ticket ids are a lane prefix and a
number (X5, EO1) and are never reused or renumbered. Each ticket has a stable
anchor, its id in lowercase, above its heading. When work ships, update the
ticket's status in the index, add a result with the commit, and add a line to
the log. This repository is public, so confidential work never goes in the
plan or anywhere else here.

## design

Every change keeps to the tickets' constraints: no account, no OAuth and no
backend. The app reads ra.co only from text the user pastes and never fetches
it, and it requests no permissions. The plan's release gate says what the
first release needs.

## delivery

There is no CI, no release process and no deployment yet. Once one exists,
record it here and in `project.yaml` in the same change.
