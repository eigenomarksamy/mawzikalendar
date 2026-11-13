@../meta-eigenomar/standards/claude-ecosystem.md

# mawzikalendar: Claude instructions

mawzikalendar is a browser app that turns a music event into a calendar entry.
The event is typed into a form or pasted from an ra.co event page, checked on a
review screen, and comes out as a prefilled Google Calendar link, an `.ics`
file or a summary to copy. Nothing is built yet. It is planned for
mawzikalendar.eigenomar.com and isn't deployed.

## commands

There is no code yet, so there is nothing to build or test. X5, the first
ticket, chooses the stack. When it lands, list its setup, build, test and run
commands here, each working on Windows and Linux, along with what to run
before pushing.

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
