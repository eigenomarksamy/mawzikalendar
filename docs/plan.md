# mawzikalendar plan

mawzikalendar turns a music event into a calendar entry. You type the event
into a form, or paste the text of its ra.co page, check it on a review screen,
and get a prefilled Google Calendar link, an `.ics` file to download and a
summary to copy. It runs in the browser with no account, no OAuth and no
backend, and it never fetches ra.co. It is live at
mawzikalendar.eigenomar.com.

The event model (X5) and the form-to-calendar flow (X6) are built, and the
app has been deployed since 2026-11-28 (D16). This plan holds the
first release (X5–X7), its release gate and its deploy (D16), a guide to
subscribing to a public calendar on the site's front page (D17), a view of a
public Google calendar (V10), which takes the front page back, the ideas
parked for later, this repository's
ecosystem onboarding (EO1–EO7), and its adoption of the ecosystem's
standards (DOC4, SCM4), with its backlog's move into GitHub issues (MIG4).

## How this plan works

- **Tickets.** Every ticket has an id, a lane prefix and a number, which is
  never reused or renumbered. A split ticket keeps its number and adds a
  letter (X6a, X6b). Each ticket has a stable anchor, its id in lowercase
  (`#x5`), above its heading, which doesn't change when the heading does.
- **Lanes.**

  | Prefix | Lane |
  | --- | --- |
  | X | The first release. It starts at X5 because its tickets keep the ids they were first planned under. |
  | D | Deploying the app |
  | V | The calendar view: showing a public calendar in the app |
  | EO | Ecosystem onboarding |
  | DOC | The product's documents: vision, architecture, design, testing strategy, and verification and validation |
  | SCM | Source control and delivery: CI, branching, protection, releases and versioning |
  | MIG | The backlog moves into GitHub issues: the cutover to GitHub as its home |

- **Each ticket** says what to do, what it needs, and when it is done. Its
  "done when" is its acceptance criteria. Its size is on the ecosystem's
  scale, the same value as its issue's `Size` in the ecosystem's GitHub
  Project: xxs takes minutes, xs under an hour, s an hour or two, m about a
  session, l two or three, xl four to six and xxl more. tbd means an open
  decision or work not yet planned decides it. A change to one is made to the
  other in the same session.
- **Issues.** Every open ticket gets one GitHub issue in this repository. The
  issue's title starts with the ticket's id, and its body links the ticket's
  anchor here without copying it. The ticket holds the scope and history, and
  the issue holds status, priority and blockers ([EO7](#eo7)).
- **Adding work.** New work goes here as a ticket in a lane, or as a row under
  [Parked](#parked) until it is ready to plan. This repository is public, so
  confidential work never goes in this file. The ecosystem's shared rules,
  which `CLAUDE.md` imports, say where it goes.
- **When work ships,** update the ticket's status in the index, add a result
  with the commit to the ticket, and add a line to the [log](#log).

## Index

| Ticket | Title | Size | Needs | Status |
| --- | --- | --- | --- | --- |
| [X5](#x5) | Event model and normalization | m | none | done |
| [X6](#x6) | Form, review, Google link and `.ics` | m | X5 | done |
| [X7](#x7) | Extract from pasted RA text | s | X6 | todo |
| [X13](#x13) | The ecosystem's tab icon | xs | none | done |
| [X14](#x14) | The page in lowercase | xs | none | done |
| [D16](#d16) | Deploy to mawzikalendar.eigenomar.com | s | X6, the release gate | done |
| [D17](#d17) | The subscribe guide as the front page | m | D16 | done |
| [V10](#v10) | Show a public Google calendar | s | none | todo |
| [EO1](#eo1) | `project.yaml` | s | none | done |
| [EO2](#eo2) | `CLAUDE.md` with the shared rules | s | none | done |
| [EO3](#eo3) | The plan in this repository | s | none | done |
| [EO4](#eo4) | Confidential work stays out | s | none | done |
| [EO5](#eo5) | `.gitattributes` with LF line endings | s | none | done |
| [EO6](#eo6) | Linux and the lowercase drive letter | s | X5 | done |
| [EO7](#eo7) | An issue for every open ticket | s | the owner's approval | done |
| [DOC4](#doc4) | The product's documents | tbd | `meta-eigenomar` ST1 | todo |
| [SCM4](#scm4) | The ecosystem's SCM strategy | tbd | `meta-eigenomar` ST2 | todo |
| [MIG4](#mig4) | The backlog moves into GitHub issues | s | `meta-eigenomar` ST3 | todo |

## First release

X5–X7 build the app. The release gate below says when it can ship.

<a id="x5"></a>

### X5 · Event model and normalization · m

- **Do:** an event model with a title, a start and an end, a timezone, a
  venue, a lineup, a source URL and notes. Normalization handles overnight
  events, DST, event-local timezones and a missing end time, which gets a
  default and is flagged. All of it is unit-tested.
- **Needs:** nothing.
- **Done when:** unit tests pass for an overnight event, an event across a DST
  change, an event in a timezone other than the user's, and an event with no
  end time, which gets the default end and a flag.
- **Result:** done 2026-11-18. The stack is TypeScript, tested with Vitest,
  with no runtime dependencies: timezones go through `Intl`. X6 adds Vite's
  build. `src/event.ts` holds the model and `normalizeEvent`, which takes the
  form's strings (a start as `YYYY-MM-DDTHH:mm`, an end as that or as `HH:mm`,
  and an IANA timezone) and returns the event, with its start and end as
  instants and as the event's wall times, or every error it found.
  `src/zoned-time.ts` converts between wall times and instants.
  - **Overnight:** an end time that isn't after the start is the next day,
    and the event says it is `overnight`.
  - **DST:** a time the clocks skip moves forward by the change, and a time
    they repeat takes the earlier instant, as Temporal's `compatible` does.
    Either is flagged for the review screen.
  - **Timezones:** times are read in the event's own zone and never the
    machine's. The tests run in UTC+14 to prove it.
  - **No end:** the end is the start plus four hours of elapsed time,
    `DEFAULT_DURATION_MINUTES`, and is flagged `end-defaulted`.
  - **Tests:** 37 unit tests pass, from `C:\` and from `c:\`.

<a id="x6"></a>

### X6 · Form, review, Google link and `.ics` · m

- **Do:** the flow is form → review screen → a prefilled Google Calendar link,
  a downloadable `.ics` and a copyable summary. It needs no OAuth and no
  backend.
- **Footer:** a button to eigenomar.com, labelled `eigenomar.com` and linking
  `https://eigenomar.com`. It is a plain link in the app's own button style,
  so it needs no JavaScript. It opens in a new tab so that a filled-in form
  survives.
- **Needs:** X5.
- **Done when:** an event entered in the form shows on the review screen, and
  from there the Google Calendar link opens a prefilled event, the `.ics`
  downloads and the summary copies, each with the reviewed values. No OAuth
  and no server of the app's own are involved, and the footer's
  `eigenomar.com` link opens in a new tab.
- **Result:** done 2026-11-19. Vite builds the page, and Playwright tests it.
  - **The flow:** `index.html` holds the form and the review screen, and
    `src/app.ts` moves between them. The review shows the event on its own
    clocks and, when the viewer's zone differs, on theirs, with X5's flags
    explained. Edit goes back to the form with its values kept. A mistake
    stays on the form, with a message by its field.
  - **The outputs:** the Google link is Google's `render?action=TEMPLATE`
    page with the times in UTC and `ctz` set to the event's zone. The `.ics`
    is one VEVENT in UTC, with CRLF lines folded at 75 octets of UTF-8, made
    as a local blob and named `<date>-<title>.ics`. The summary is plain text,
    copied with the Clipboard API, and shown in a box to copy by hand if that
    fails. The Google link, the `.ics` and the summary share one description:
    the lineup, the notes, a note when the end was assumed, and the source.
  - **The footer:** a plain link to `https://eigenomar.com`, labelled
    `eigenomar.com`, in the app's quiet button style, with `target="_blank"`.
  - **Tests:** 76 unit tests pass, X5's 37 among them. 15 end-to-end tests
    pass, five in each of Chromium, Firefox and WebKit, against the built
    app: the flow from the form to each output with the reviewed values, the
    mistakes, the assumed end, and the footer, with and without JavaScript.
    They stub Google Calendar and eigenomar.com, and the app's page sends no
    request to any host but its own. All of it passes from `C:\` and from
    `c:\`.
  - **Left for the release gate:** importing the `.ics` into Google Calendar
    and Apple Calendar is checked by hand, before [D16](#d16).

<a id="x7"></a>

### X7 · Extract from pasted RA text · s

- **Do:** extract the event's fields from text the user pastes from an ra.co
  page, keep the source URL, and flag missing or ambiguous fields for review.
  It never fetches ra.co: there is no scraping without a permitted API.
- **Needs:** X6.
- **Done when:** text pasted from an ra.co event page fills the form's fields
  and keeps the source URL, fields that are missing or ambiguous are flagged
  on the review screen, tests cover both, and the app sends no request to
  ra.co.
- **Progress:** built 2026-11-19, and not done until it is checked against
  real pastes.
  - **What it reads:** `src/ra-text.ts` keys on an ra.co page's labels
    (`Venue`, `Date`, `Lineup` and the rest), takes the title from the line
    above the first label, and reads dates in either order, with or without a
    weekday or year, and 24- or 12-hour times. A date with no year takes the
    year its weekday matches, or the next to come. The source is the
    `ra.co/events/<id>` link in the text, or one on `residentadvisor.net`.
    The timezone comes from the venue's city or country, through
    `src/time-zones.ts`. If the place has several zones or isn't known, the
    viewer's zone is filled in and flagged.
  - **The page:** a paste box at the top of the form. "Fill the form"
    replaces every field the text gives, keeping the user's own notes. What
    is missing or in doubt is listed by the box, the field is marked, and the
    list shows again on the review screen until the field is edited.
  - **Tests:** 27 unit tests of the extractor, and 9 end-to-end tests, three
    in each of Chromium, Firefox and WebKit. They show that the paste fills
    the form and that the doubts are flagged, and they refuse and record any
    request to ra.co. None is sent. The pasted text is from fixtures laid out
    like ra.co's pages, with made-up events.
  - **Left:** check it against text copied from two or three real ra.co
    event pages, add those pastes as fixtures with their names changed, and
    fix what they show.

<a id="x13"></a>

### X13 · The ecosystem's tab icon · xs

- **Do:** every app under eigenomar.com shows the same tab icon:
  eigenomar.com's lambda with its two colors swapped, a light-blue tile and a
  near-black lambda (shared decision SD5). Replace `public/favicon.svg`, the
  calendar, with it. `index.html` already links that file, so nothing else
  changes. It is best done before [D16](#d16), so the app is never deployed
  with the old icon, but D16 doesn't wait for it.
- **Needs:** nothing.
- **Done when:** the built app's tab shows the icon in a light and a dark
  browser theme, `npm run check` passes, and the end-to-end tests still see
  no request to any host but the app's own.
- **Result (2026-11-27):** `public/favicon.svg` is shared decision SD5's icon,
  byte for byte, and nothing else changed. `npm run check` passes with 103 unit
  tests, and `npm run test:e2e` passes all 24 tests in Chromium, Firefox and
  WebKit, so the page still sends nothing to another host. In headless Chrome,
  the built app served by `vite preview` links one `image/svg+xml` icon, which
  loads with the file's bytes. The icon is a filled tile with no
  `prefers-color-scheme` rule, so it is the same in a light and a dark theme.
  D16's first deploy will show it.

<a id="x14"></a>

### X14 · The page in lowercase · xs

- **Do:** show the page's text in lowercase, as eigenomar.com and the
  ecosystem's other apps do: the heading, labels, hints, buttons, messages
  and the review's flags. The user's own event keeps its case, since the
  review shows it as it goes to Google and the `.ics`: what is typed in the
  fields, and the review's title, venue, lineup, source and notes. The
  outputs, the Google link, the `.ics` and the summary, don't change.
- **Needs:** nothing.
- **Done when:** in Chromium, Firefox and WebKit, in a light and a dark
  theme, every text on the form and the review shows in lowercase but the
  user's event, the tab's title is lowercase, and `npm run check` and
  `npm run test:e2e` pass.
- **Result:** done 2026-11-28, at the owner's request. As on eigenomar.com
  and mortgager (its UI4), a rule does it rather than lowercased strings:
  `src/style.css` gives `body` and `button`, which the browser's own
  stylesheet resets, `text-transform: lowercase`, and the review's five
  values of the user's event `none`. Inputs and textareas keep their case
  by the browser's own stylesheet, the summary included. `index.html`
  writes the placeholder and the meta description lowercase, which CSS
  doesn't reach, and the `<title>` already was. `CLAUDE.md`'s design
  section holds the rule.
  - **Checked:** against `vite preview`, in Chromium, Firefox and WebKit, in
    light and dark, the form and the review of a mixed-case event: of 50
    texts, only the event's title, venue, lineup and notes show capitals,
    the inputs are `text-transform: none`, and no console errors. The review's
    times are the app's, so their month, weekday and timezone show
    lowercase, while the summary keeps `Europe/Berlin`.
  - **Tests:** `npm run check` passes with 103 unit tests, and
    `npm run test:e2e` all 24, which read the DOM's text, so the rule
    changes none of them.

### Release gate

The app ships only when:

- the timezone tests pass ([X5](#x5))
- `.ics` files import cleanly into Google Calendar and Apple Calendar
  ([X6](#x6))
- no permissions are requested

**Checked so far:** the timezone tests pass (X5). X6's two sample `.ics`
files, a night in Berlin and a nine-hour night across the clocks going back,
with Unicode text and folded lines, import correctly into Google Calendar
(the owner, 2026-11-19). Apple Calendar isn't checked yet. The app asks for
no permissions: in X6's end-to-end tests, Firefox and WebKit, which are
granted none, copy the summary without a prompt.

**For the first deploy,** the Google Calendar import is enough, and Apple
Calendar's waits (the owner, 2026-11-19). The gate counts as met for
[D16](#d16). Apple Calendar is still checked by hand once someone can, and a
failure there is fixed as a bug in the deployed app.

[D16](#d16) deploys the app once X6 and this gate are met. Once it is deployed,
eigenomar.com adds a software entry for it, which is the site's own work.

<a id="d16"></a>

### D16 · Deploy to mawzikalendar.eigenomar.com · s

- **Do:** deploy the app to mawzikalendar.eigenomar.com, on hosting that fits
  the stack X5 chooses. In the same change, record how it deploys in
  `project.yaml` (`links.deployment` and `delivery`) and in `CLAUDE.md`'s
  delivery section.
- **Needs:** X6, and the release gate above.
- **Done when:** the app answers at mawzikalendar.eigenomar.com with the
  release gate met, `project.yaml` and `CLAUDE.md` say what deploys it, and
  the ecosystem's validator passes.
- **Result:** done 2026-11-28, `8a013f2`. Cloudflare Workers serves `dist/`
  as static assets with no Worker script, as the ecosystem's other apps do.
  `wrangler.jsonc` attaches mawzikalendar.eigenomar.com as a custom domain,
  with the `workers.dev` address and preview URLs off. Cloudflare's build is
  connected to the repository, running `npm run build` then
  `npx wrangler deploy`, so every push to `main` deploys (`deploys_on:
  merge`). `project.yaml` and `CLAUDE.md`'s delivery section say so.
  - **Live:** the page, its script, its stylesheet and the tab icon
    ([X13](#x13)'s, byte for byte) answer with 200, and any other path with
    404. The assets' hashes are the local build's.
  - **The release gate:** met for the first deploy, as the owner decided on
    2026-11-19. Apple Calendar's import is still checked by hand.
  - **Tests:** `npm run check` passes with 103 unit tests, and
    `npm run test:e2e` all 24 tests in Chromium, Firefox and WebKit.
  - **Linux:** Cloudflare's build runs the typecheck and the build on Linux.
    The tests still wait for [SCM4](#scm4)'s CI ([EO6](#eo6)).

<a id="d17"></a>

### D17 · The subscribe guide as the front page · m

- **Do:** until [V10](#v10) is done, mawzikalendar.eigenomar.com opens on
  the owner's guide, "how to subscribe (not import) in your calendar", and
  the app moves to its own path, `/app/`. The guide lives in the repository
  as Markdown, `docs/subscribe.md`, written from the owner's one-page PDF
  ([on Google Drive](https://drive.google.com/file/d/1eiFOfGK_HAPIEzcnTXoOZngOQ6nUusoS/view)),
  with its text kept as the owner wrote it. Each calendar app (Apple
  Calendar, Outlook, and the others) gets a heading with its steps as a
  list, and the public calendar's iCal address becomes a link. The build
  renders the Markdown to HTML, so the page needs no JavaScript and the app
  gains no runtime dependency. The page keeps the app's tab icon
  ([X13](#x13)) and its footer link to eigenomar.com. In the same change,
  `CLAUDE.md`'s code section says where the guide is and how it is built.
- **Temporary:** the guide holds the front page only until there is a demo
  of the app, [V10](#v10)'s view of the calendar the guide subscribes to.
  V10 gives the front page back to the app. The Markdown stays in the
  repository either way.
- **Needs:** [D16](#d16).
- **Done when:** mawzikalendar.eigenomar.com shows the guide rendered from
  `docs/subscribe.md`, its iCal link opens the calendar's address, and the
  app answers at `/app/` with [X6](#x6)'s flow working. `npm run check` and
  `npm run test:e2e` pass, the end-to-end tests cover the guide and the app
  at its new path, and they still see no request to any host but the app's
  own. The ecosystem's validator passes.
- **Result:** done 2026-11-28, `1308428`, live the same day.
  - **The guide:** `docs/subscribe.md` holds the owner's PDF as written: the
    line asking to read before clicking, the title, a heading per calendar
    app with its steps as a numbered list, and the iCal address as a link.
    outlook.com is a link too, as in the PDF. At the owner's request, a
    section for Google Calendar followed the same day: its "from url"
    steps, which subscribe rather than import, as the guide's title asks,
    and Google's note that it can take up to 12 hours to show changes.
  - **The build:** a plugin in `vite.config.ts` renders the Markdown into
    `index.html` with `marked` 18.3.0, a pinned dev dependency, so the app
    still has no runtime dependency, and `npm run dev` reloads the page when
    the Markdown changes. `vite.config.ts` reads the file through
    `process.getBuiltinModule`, as `vitest.config.ts` avoids `@types/node`,
    and `tsc` now checks it. The app moved, unchanged, to `app/index.html`.
    The guide shares the app's stylesheet, so it is lowercase too
    ([X14](#x14)), with the tab icon and the footer's eigenomar.com link.
  - **Live:** `/` answers with the guide, `/app` redirects to `/app/`, which
    answers with the app, and any other path is a 404. The built guide has
    no script, but Cloudflare adds its bot detection's script,
    `/cdn-cgi/challenge-platform`, to every page under eigenomar.com: a
    setting of the domain, not of this repository. The guide works without
    it.
  - **Tests:** `npm run check` passes with 103 unit tests, and
    `npm run test:e2e` all 30, 6 of them new: the guide with JavaScript off,
    its headings, steps and links, the footer and the icon, no script, no
    form and no request to another host, and the app at `/app/`. The app's
    tests now open `/app/`. `wrangler dev` served the build with the same
    answers as the live site, and at 1280 px in light and dark and at 360 px
    nothing scrolls sideways.
  - **Not linked:** nothing on the guide links the app, so `/app/` is
    reached by its address until V10.

## Calendar view

The app makes calendar entries and, until V10, shows no calendar. V10 isn't part
of the first release: the release gate and [D16](#d16) don't wait for it, and D16
deploys it once it is done.

<a id="v10"></a>

### V10 · Show a public Google calendar · s

- **Do:** the user pastes a link to a public Google calendar, and the app
  shows that calendar in Google's own embed,
  `https://calendar.google.com/calendar/embed?src=<calendar ID>&ctz=<the viewer's timezone>`.
  The app parses the calendar ID out of whichever form is pasted: the ID
  itself, an embed link, the public `.ics` address
  (`/calendar/ical/<ID>/public/basic.ics`), or a share link, whose `cid` is
  the ID in base64. Anything else gets an error, and nothing is embedded.
- **Why the embed:** a public calendar's `.ics` feed can't be read from the
  browser. Google's sends no CORS header, and the app has no backend to fetch
  it. So the view embeds Google's calendar instead of parsing its events, and
  it shows Google calendars only (the owner, 2026-11-19). A calendar that
  isn't public shows Google's own message in the embed.
- **The front page:** V10 is the demo that ends [D17](#d17)'s guide on the
  site's front page. Once D17 is done, V10 gives the front page back to the
  app, and its change decides whether the page links the guide.
- **Needs:** nothing. It builds on [X6](#x6)'s page and Vite's build.
- **Done when:** each of the four forms of a public Google calendar's link
  shows that calendar in the view, in the viewer's timezone, and anything else
  shows an error with no embed. Unit tests cover the parsing of each form and
  of a link that isn't one. The app requests no permissions, uses no OAuth
  and no server of its own, and loads nothing but the embed from
  `calendar.google.com`.

## Ecosystem standards

The ecosystem's contract, in `meta-eigenomar`, is adding two standards that
every repository adopts: the documents each one keeps, and how each one
manages its source and delivers it. DOC4 and SCM4 adopt them here, each once
its standard is designed. Until then, their issues stay in the backlog.

A third standard, `meta-eigenomar` ST3, makes GitHub's issues the home of
every repository's backlog, and its decisions were made on 2026-11-27. MIG4
moves this plan's tickets there, once ST3 is built.

<a id="doc4"></a>

### DOC4 · The product's documents · tbd

- **Do:** write this repository's product vision, architecture, design,
  testing strategy, and verification and validation (V&V) documents, in the
  shape the ecosystem's document standard sets. Where a file or section
  already covers one, name it rather than copy it. Today the vision is this
  plan's opening and the README. There is no architecture document
  (`project.yaml` says `architecture: null`), and the event model,
  `src/event.ts` and `src/zoned-time.ts`, is the only code. `CLAUDE.md`'s
  design section holds the constraints, the tests are Vitest, run in
  `Pacific/Kiritimati`, and the [release gate](#release-gate) is the nearest
  thing to a V&V plan.
- **Needs:** the ecosystem's document standard (`meta-eigenomar` ST1).
- **Done when:** each of the five documents exists, or names the file or
  section that holds it, and follows the standard's outline. `project.yaml`
  names them under the standard's keys, and the ecosystem's validator passes.
  Nothing in them is confidential, since this repository is public.

<a id="scm4"></a>

### SCM4 · The ecosystem's SCM strategy · tbd

- **Do:** adopt the ecosystem's SCM strategy through its adoption checklist:
  CI, branching, protection of `main`, versioning and releases, the health
  report and dependency updates. Today there is no CI, release or deployment,
  and `npm run check` runs only locally. [D16](#d16) sets up the deploy: if the
  strategy is ready first, D16 follows it, and this ticket checks the rest.
  CI runs `npm run check` on `ubuntu-latest`, which closes the Linux gap
  [EO6](#eo6) accepted.
- **Needs:** the ecosystem's SCM strategy (`meta-eigenomar` ST2).
- **Done when:** every item on the checklist is applied here, or recorded here
  as an exception the strategy allows, with its reason. `project.yaml`'s
  `delivery` and `CLAUDE.md`'s delivery section say what runs, any workflow
  passes on `main`, and the ecosystem's validator passes.

<a id="mig4"></a>

### MIG4 · The backlog moves into GitHub issues · tbd

- **Do:** move this plan's planning to GitHub all at once, following the
  cutover steps of the ecosystem's standard `meta-eigenomar` ST3. Each open
  ticket's content moves into its issue's body, keeping its id and its issue's
  `<id>: <title>`. [Parked](#parked)'s ideas become draft items in the Project
  with status `idea`, hard needs are blocked-by links, and size, status and
  priority live only in the Project. Done, dropped and moved tickets stay here
  as a frozen archive, and each open ticket's anchor stays, linking its issue.
- **Needs:** GitHub as the home of the backlog (`meta-eigenomar` ST3), which
  includes the ecosystem's own cutover first and the backlog's backup. DOC4 is
  a planning need: the plan's direction moves into the vision before this plan
  retires.
- **Done when:** every open ticket's content is in its issue, and this file
  holds only the archive and the anchors. `project.yaml`'s `documents.plan` is
  `null` and `planning.source` names GitHub, the ecosystem's validator passes,
  nothing confidential is in any issue, since this repository is public, and
  the owner approved the cutover. Bringing tickets up to the ecosystem's
  ticket standard (`meta-eigenomar` ST4) isn't part of it: each ticket follows
  it when it is picked up.

## Parked

Ideas, not tickets: a row has no id and no issue until it is promoted to a
ticket.

| Item | Gate |
| --- | --- |
| Stage 2: OAuth, creating events directly in the calendar, catching duplicates, and sync | The app is live at mawzikalendar.eigenomar.com, and the manual flow has proven too slow. |

## Ecosystem onboarding

mawzikalendar is one of the eigenomar ecosystem's repositories, which share a
contract: a `project.yaml` manifest, shared Claude rules that `CLAUDE.md`
imports, and one issue per open ticket on the ecosystem's GitHub Project.

**Goal.** Make mawzikalendar discoverable and coordinated in the ecosystem
without changing how it is built or delivered.

**Stays as it is.**

- **Build, tests, CI, releases and deployment:** none yet. X5 chooses the
  stack, and how it builds, tests and releases stays this repository's own
  choice.
- **Branching:** work lands on `main`.
- **Documents:** `README.md`, this plan and `CLAUDE.md`, where they are.

### Steps

Each step is small and independent, and can be done between feature work.

<a id="eo1"></a>

#### EO1 · `project.yaml` · done

- **Done when:** a manifest at the root points at the documents that exist,
  and the ecosystem's validator passes it.
- **Result:** done 2026-11-14. It points at this plan, with no CI, no releases
  and no deployment yet, and `links.deployment` stays `null` until the app is
  live. Update it in the same change that adds a document or a deployment.
  `9bb6f9a`.

<a id="eo2"></a>

#### EO2 · `CLAUDE.md` with the shared rules · done

- **Done when:** the first line of `CLAUDE.md` imports the ecosystem's shared
  rules, and the rest says what the repository is and where the plan is. Once
  there is code, it also says how to build and test without the import.
- **Result:** done 2026-11-14, from the ecosystem's template. Sessions here
  haven't committed, so it grants no standing approval for commits.
  `9bb6f9a`.

<a id="eo3"></a>

#### EO3 · The plan in this repository · done

- **Done when:** X5–X7, their release gate and the parked stage 2 are in this
  file, and each ticket has its needs and a done-when.
- **Result:** done 2026-11-14. The done-whens are new. They were written from
  each ticket's own text with no work added, and the owner approved them on
  2026-11-14 ([open question 1](#open-questions)). `9bb6f9a`.

<a id="eo4"></a>

#### EO4 · Confidential work stays out · done

- **Done when:** [How this plan works](#how-this-plan-works) says that
  confidential work never goes in this file.
- **Result:** done 2026-11-14. Nothing in this plan is marked confidential
  (the owner, 2026-11-14). `9bb6f9a`.

<a id="eo5"></a>

#### EO5 · `.gitattributes` with LF line endings · done

- **Do:** add `.gitattributes` with `* text=auto eol=lf`, then run
  `git add --renormalize .`. The one tracked file, `README.md`, is already LF
  in the index, so this should stage nothing. If it stages anything, commit
  that on its own.
- **Needs:** nothing.
- **Done when:** `.gitattributes` is committed, and `git ls-files --eol` shows
  every text file as `i/lf`.
- **Result:** done 2026-11-14. `.gitattributes` holds `* text=auto eol=lf`,
  and `git ls-files --eol` shows all four tracked files as `i/lf`, so
  `git add --renormalize .` has nothing to stage.

<a id="eo6"></a>

#### EO6 · Linux and the lowercase drive letter · done

- **Do:** there is nothing to run yet. Once X5 adds code and tests, record here
  what covers Linux: a CI job on `ubuntu-latest`, a Linux deployment build, or
  an accepted gap. Also check that the tests pass when started from a
  lowercase drive letter (`c:\`), as VS Code opens folders, since some tools
  break on the difference. If the tests use Vitest, the ecosystem's
  conventions give the fix for its known failure there.
- **Needs:** X5.
- **Done when:** this section says what runs the tests on Linux, and the
  tests pass when started from `c:\` as well as from `C:\`.
- **Result:** done 2026-11-19.
  - **The lowercase drive letter:** `npm run check` passes, with all 37
    tests, when started from `C:\` and from `c:\`. The `c:\` run was started
    from a Python subprocess whose working directory was the clone's root
    with a lowercase drive letter, and Node's working directory was the same.
    X5's `vitest.config.ts` already holds the conventions' fix: on Windows
    only, it points `vitest` at the working directory's copy.
  - **Linux:** an accepted gap until [SCM4](#scm4). Nothing runs the tests on
    Linux yet, since there is no CI, and no deployment build until D16. SCM4's
    CI runs on `ubuntu-latest`, which closes the gap. Until then the risk is
    small: the code uses no paths or OS calls, every import matches its
    file's case, the tests set their timezone in `vitest.config.ts` and not
    in the shell, and the alias leaves Vitest as it is on Linux. Node's
    official Linux builds carry the full ICU data that `Intl`'s timezones
    need.

<a id="eo7"></a>

#### EO7 · An issue for every open ticket · done

- **Do:** open one issue in this repository for every open ticket (X5–X7, D1
  and EO6 on 2026-11-14) and add each to the ecosystem's GitHub Project. The
  title is `<id>: <title>`, as in `X5: Event model and normalization`. The
  body's first line links the ticket's anchor on `main` and copies nothing.
  Each need becomes a blocked-by link: X6 is blocked by X5, X7 by X6, D1 by X6,
  and EO6 by X5. The proposed priorities are P1 for X5 and P2 for the rest
  ([open question 2](#open-questions)).
- **Needs:** the owner's approval. This repository is public, so the owner
  sees each issue's text before it is written.
- **Done when:** every open ticket has exactly one issue in the Project, with
  its status, priority and work type set, and its needs are blocked-by links.
- **Result:** done 2026-11-14, with the owner's approval of each text. X5 is
  #1, X6 #2, X7 #3, D1 #4 and EO6 #5, each in the Project with its status,
  priority and work type: X5 is `ready` at P1, and the rest are `backlog` at
  P2. X6 and EO6 are blocked by X5, and X7 and D1 by X6.

### Open questions

1. **The done-whens** of X5–X7 are new (EO3). Review them before EO7 opens
   their issues. Answered on 2026-11-14: the owner approved them, and D1's,
   with EO7's issue texts.
2. **Priorities for EO7:** P1 for X5, the next ticket, and P2 for X6, X7, D1
   and EO6? Answered on 2026-11-14: yes, with EO7's issue texts.
3. **The deploy:** answered on 2026-11-14. It is [D1](#d16), in its own lane,
   written now. It needs X6 and the release gate, and the hosting follows X5's
   stack.
4. **GitHub's description:** answered on 2026-11-14. It is `project.yaml`'s.

## Log

- 2026-11-28 · D17 · Done: the front page is the owner's guide to
  subscribing to the calendar, rendered from `docs/subscribe.md` at build
  time, now with a Google Calendar section, and the app is at `/app/`.
  `npm run check` and `npm run test:e2e` pass. V10 takes the front page back.
- 2026-11-28 · X14 · Added and done at the owner's request: the page is
  lowercase, by a CSS rule as on eigenomar.com, and the user's event keeps
  its case. `npm run check` and `npm run test:e2e` pass. Its merge to `main`
  deploys it.
- 2026-11-28 · D16 · Done: the app is live at mawzikalendar.eigenomar.com,
  a Cloudflare Worker serving `dist/` as static assets, and every push to
  `main` deploys it. `npm run check` and `npm run test:e2e` pass. D17 can
  start.
- 2026-11-28 · plan · Added D17 at the owner's request: once D16 deploys,
  the site's front page is the owner's guide to subscribing to a public
  calendar, kept as Markdown in `docs/subscribe.md`, and the app moves to
  `/app/`. It lasts until V10's calendar view is there as a demo, and V10
  now says it gives the front page back. D17 is next after D16.
- 2026-11-27 · X13 · Done: the tab icon is the ecosystem's, the lambda on a
  light-blue tile (shared decision SD5), in place of the calendar, before D16's
  first deploy. `npm run check` and `npm run test:e2e` pass.
- 2026-11-27 · plan · Added MIG4, in a new lane, at the owner's request: this
  repository's cutover to GitHub as the home of its backlog, the ecosystem's
  standard `meta-eigenomar` ST3, whose decisions were made that day. It needs
  ST3, so its issue waits as `blocked`.
- 2026-11-26 · plan · Renamed, since the ecosystem's lanes are numbered across its
  repositories: D16 from `D1`, DOC4 from `DOC1`, SCM4 from `SCM1`, V10 from `V1` and
  X13 from `X8`. Their anchors, headings, references and issues changed with them,
  and the log keeps the ids it was written with.
- 2026-11-20 · X8 · Added: the owner asked for every app under
  eigenomar.com to share one tab icon, eigenomar.com's lambda with its colors
  swapped (shared decision SD5). X8 replaces the calendar with it.

- 2026-11-19 · release gate · The owner settles for the Google Calendar
  import for the first deploy, so the gate counts as met for D1. Apple
  Calendar's import is still to be checked, after the deploy if need be.

- 2026-11-19 · X7 · Extract from pasted RA text, built: a paste box fills the
  form from an ra.co page's text and flags what is missing or in doubt, by the
  box and on the review screen, and the app sends nothing to ra.co. Tested
  against fixtures laid out like ra.co's pages. It stays `todo` until it is
  checked against real pastes.
- 2026-11-19 · release gate · X6's sample `.ics` files import correctly into
  Google Calendar (the owner). Apple Calendar isn't checked yet.

- 2026-11-19 · X6 · Form, review, Google link and `.ics`: the page, built
  with Vite, goes from the form to a review screen and out as a prefilled
  Google Calendar link, an `.ics` in UTC and a summary to copy, with the
  footer's `eigenomar.com` link in a new tab. Unit tests and Playwright's
  end-to-end tests, in Chromium, Firefox and WebKit, pass. The release gate's
  `.ics` imports are checked by hand before D1. X7 can start.

- 2026-11-19 · plan · Added V1, in a new lane, at the owner's request: a
  view of a public Google calendar, in Google's own embed, since a public
  calendar's `.ics` feed sends no CORS header and the app has no backend to
  fetch it. It needs nothing and doesn't gate the first release.

- 2026-11-19 · EO6 · Linux and the lowercase drive letter: `npm run check`
  passes from `C:\` and from `c:\`, with X5's Vitest alias. Linux is an
  accepted gap until SCM1's CI runs on `ubuntu-latest`, and SCM1 now says so.
  EO1–EO7 are done, so the ecosystem onboarding is complete.

- 2026-11-18 · plan · Added DOC1 and SCM1, in two new lanes, at the owner's
  request: this repository's adoption of the ecosystem's document standard and
  SCM strategy, which are designed in `meta-eigenomar`. Each needs its
  standard, so its issue waits in the backlog.
- 2026-11-18 · X5 · Event model and normalization: TypeScript and Vitest, with
  timezones through `Intl` and no runtime dependencies. Overnight events, DST
  changes, event-local timezones and a missing end are handled and tested,
  so the release gate's timezone tests pass. `CLAUDE.md` lists the commands.
  X6 and EO6 can start.
- 2026-11-14 · EO7 · An issue for every open ticket: X5–X7, D1 and EO6 are
  #1–#5, in the ecosystem's Project, with X6 and EO6 blocked by X5, and X7 and
  D1 by X6. The owner approved each text, with the done-whens and priorities.
  Only EO6, which waits on X5, is left of the onboarding. `7ed3f43` holds the
  previous change.
- 2026-11-14 · plan · The owner's answers: the deploy is D1, a new lane, needing
  X6 and the release gate, and GitHub's description is the manifest's. EO5 is
  done: `.gitattributes` with LF line endings, which staged nothing. EO1–EO4's
  results name their commit, `9bb6f9a`. EO7 now counts five open tickets: X5–X7,
  D1 and EO6.
- 2026-11-14 · plan · Created by the ecosystem onboarding run. It holds X5–X7
  for the first release, with their release gate and new done-whens, stage 2
  under Parked, and EO1–EO7. EO1–EO4 are done: `project.yaml`, which
  validates, and `CLAUDE.md`, which imports the shared rules. Nothing else in
  the repository changed.
