# mawzikalendar plan

mawzikalendar turns a music event into a calendar entry. You type the event
into a form, or paste the text of its ra.co page, check it on a review screen,
and get a prefilled Google Calendar link, an `.ics` file to download and a
summary to copy. It runs in the browser with no account, no OAuth and no
backend, and it never fetches ra.co. It is planned for
mawzikalendar.eigenomar.com.

Nothing is built yet. This plan holds the first release (X5–X7), its release
gate and its deploy (D1), the ideas parked for later, and this repository's
ecosystem onboarding (EO1–EO7).

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
  | EO | Ecosystem onboarding |

- **Each ticket** says what to do, what it needs, and when it is done. Its
  "done when" is its acceptance criteria. Size is a rough guess: S is small,
  M is medium.
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
| [X5](#x5) | Event model and normalization | M | none | todo |
| [X6](#x6) | Form, review, Google link and `.ics` | M | X5 | todo |
| [X7](#x7) | Extract from pasted RA text | M | X6 | todo |
| [D1](#d1) | Deploy to mawzikalendar.eigenomar.com | S | X6, the release gate | todo |
| [EO1](#eo1) | `project.yaml` | S | none | done |
| [EO2](#eo2) | `CLAUDE.md` with the shared rules | S | none | done |
| [EO3](#eo3) | The plan in this repository | S | none | done |
| [EO4](#eo4) | Confidential work stays out | S | none | done |
| [EO5](#eo5) | `.gitattributes` with LF line endings | S | none | done |
| [EO6](#eo6) | Linux and the lowercase drive letter | S | X5 | todo |
| [EO7](#eo7) | An issue for every open ticket | S | the owner's approval | todo |

## First release

X5–X7 build the app. The release gate below says when it can ship.

<a id="x5"></a>

### X5 · Event model and normalization · M

- **Do:** an event model with a title, a start and an end, a timezone, a
  venue, a lineup, a source URL and notes. Normalization handles overnight
  events, DST, event-local timezones and a missing end time, which gets a
  default and is flagged. All of it is unit-tested.
- **Needs:** nothing.
- **Done when:** unit tests pass for an overnight event, an event across a DST
  change, an event in a timezone other than the user's, and an event with no
  end time, which gets the default end and a flag.

<a id="x6"></a>

### X6 · Form, review, Google link and `.ics` · M

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

<a id="x7"></a>

### X7 · Extract from pasted RA text · M

- **Do:** extract the event's fields from text the user pastes from an ra.co
  page, keep the source URL, and flag missing or ambiguous fields for review.
  It never fetches ra.co: there is no scraping without a permitted API.
- **Needs:** X6.
- **Done when:** text pasted from an ra.co event page fills the form's fields
  and keeps the source URL, fields that are missing or ambiguous are flagged
  on the review screen, tests cover both, and the app sends no request to
  ra.co.

### Release gate

The app ships only when:

- the timezone tests pass ([X5](#x5))
- `.ics` files import cleanly into Google Calendar and Apple Calendar
  ([X6](#x6))
- no permissions are requested

[D1](#d1) deploys the app once X6 and this gate are met. Once it is deployed,
eigenomar.com adds a software entry for it, which is the site's own work.

<a id="d1"></a>

### D1 · Deploy to mawzikalendar.eigenomar.com · S

- **Do:** deploy the app to mawzikalendar.eigenomar.com, on hosting that fits
  the stack X5 chooses. In the same change, record how it deploys in
  `project.yaml` (`links.deployment` and `delivery`) and in `CLAUDE.md`'s
  delivery section.
- **Needs:** X6, and the release gate above.
- **Done when:** the app answers at mawzikalendar.eigenomar.com with the
  release gate met, `project.yaml` and `CLAUDE.md` say what deploys it, and
  the ecosystem's validator passes.

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
  each ticket's own text with no work added, and wait for the owner's review
  ([open question 1](#open-questions)). `9bb6f9a`.

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

#### EO6 · Linux and the lowercase drive letter · todo

- **Do:** there is nothing to run yet. Once X5 adds code and tests, record here
  what covers Linux: a CI job on `ubuntu-latest`, a Linux deployment build, or
  an accepted gap. Also check that the tests pass when started from a
  lowercase drive letter (`c:\`), as VS Code opens folders, since some tools
  break on the difference. If the tests use Vitest, the ecosystem's
  conventions give the fix for its known failure there.
- **Needs:** X5.
- **Done when:** this section says what runs the tests on Linux, and the
  tests pass when started from `c:\` as well as from `C:\`.

<a id="eo7"></a>

#### EO7 · An issue for every open ticket · todo

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

### Open questions

1. **The done-whens** of X5–X7 are new (EO3). Review them before EO7 opens
   their issues. Open: reviewed with EO7's issue texts.
2. **Priorities for EO7:** P1 for X5, the next ticket, and P2 for X6, X7, D1
   and EO6? Open: confirmed with EO7's issue texts.
3. **The deploy:** answered on 2026-11-14. It is [D1](#d1), in its own lane,
   written now. It needs X6 and the release gate, and the hosting follows X5's
   stack.
4. **GitHub's description:** answered on 2026-11-14. It is `project.yaml`'s.

## Log

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
