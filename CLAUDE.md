@../meta-eigenomar/standards/claude-ecosystem.md

# mawzikalendar: Claude instructions

mawzikalendar is a browser app that turns a music event into a calendar entry.
The event is typed into a form or pasted from an ra.co event page, checked on a
review screen, and comes out as a prefilled Google Calendar link, an `.ics`
file or a summary to copy. The form, the review screen and the three
outputs work (X5, X6). Pasting ra.co text is next (X7). It is planned for
mawzikalendar.eigenomar.com and isn't deployed.

## commands

TypeScript, built with Vite, tested with Vitest and Playwright, on Node 22.12
or later. Each command runs from the repository's root, on Windows and Linux.

- `npm ci` installs the pinned dev dependencies. The app itself has no runtime
  dependencies: timezones go through `Intl`.
- `npm run dev` serves the app with Vite, and `npm run build` typechecks and
  builds it into `dist/`. `npm run preview` serves that build.
- `npm test` runs the unit tests. They run in `Pacific/Kiritimati` (UTC+14,
  set in `vitest.config.ts`), so code that reads the machine's own zone fails
  them.
- `npm run test:e2e` builds the app and runs `e2e/` with Playwright in
  Chromium, Firefox and WebKit, as a viewer in New York. It needs the browsers
  once per machine: `npx playwright install chromium firefox webkit`, and on
  Linux `--with-deps`. Google Calendar and eigenomar.com are stubbed, so the
  tests send nothing to either.
- `npm run check` typechecks with `tsc`, runs the unit tests and builds. Run
  it before pushing, and run `npm run test:e2e` too after changing the page.

`vitest.config.ts` points `vitest` at the working directory's copy on Windows,
so the tests also pass when started from a lowercase `c:\`.

## code

- `src/event.ts` and `src/zoned-time.ts`: the event model and its
  normalization (X5).
- `src/format.ts`: the event as text, `src/google-calendar.ts`: the prefilled
  link, `src/ics.ts`: the `.ics` file (RFC 5545, times in UTC).
- `src/form.ts`: the form's fields and messages, `src/app.ts`: the page,
  `src/main.ts`: its entry, given the browser's clipboard, clock and blob URLs.
- `index.html` holds the page's markup, including the footer's plain link.

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
