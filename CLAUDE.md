# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ratsnest

*Graphical wiring for breadboards*, says the repository's description on GitHub, and that line is
all that is settled: what exactly it is, who it is for and what it is built with are still open.
The repository holds its working practice and nothing else, carried over from scratchpi
(`bulla/scratchpi`) on 2026-11-20.

## Status

Started 2026-11-20, with no code. The first piece of work is to settle what ratsnest is: see
**Next** in [`doc/ROADMAP.md`](doc/ROADMAP.md).

This section is a summary and stays one. A piece of work's story goes in the Log in
[`doc/HISTORY.md`](doc/HISTORY.md), its open items in the roadmap, and its reasons in a record. None
of them belongs here.

## Design

None yet. Design is settled before code, one decision at a time (`/interview` walks the tree), and
each decision becomes a record in [`doc/adr/`](doc/adr/). Once there are some, this section states
the root decisions, a paragraph each with the record that argues it, so that nobody proposes an
architecture that has already been argued.

**Start here:**

- [`doc/ROADMAP.md`](doc/ROADMAP.md): what is next, the work in flight, and everything still open.
  Read this first when picking work back up.
- [`doc/HISTORY.md`](doc/HISTORY.md): every milestone's checklist and the Log of how each went.
  Read it for how something came to be; the record says why.
- [`doc/adr/`](doc/adr/): why the architecture is what it is, one decision per record. Read before
  questioning a design choice.

## Stack

Undecided. Ask before adding anything. Each layer, once chosen, goes in a table here with the record
that chose it, and the table is then the list to ask before going beyond.

## Commands

None yet: there is nothing to install, build, test or lint. When there is, the commands go in a
table here, including how to run a single test.

## Layout

```
.
├── .claude/
│   └── skills/
│       └── interview/   Pressure-tests a plan one question at a time
├── doc/
│   ├── ROADMAP.md       What is next and everything still open, and one line per milestone done
│   ├── HISTORY.md       Every milestone's checklist, and the Log
│   └── adr/             One record per decision, and why
│       └── README.md      How records are written, and the index
└── CLAUDE.md            This file
```

## Conventions

- `develop` is the default and only long-lived branch. Branch all work off `develop`, and open pull
  requests against `develop`. Never commit directly to it.
- Keep commits scoped to one logical change with an imperative subject line ("Add the tick loop",
  not "added tick loop").
- Any PR that completes roadmap work updates `doc/ROADMAP.md` in the same PR. Status tracked
  separately from the work goes stale immediately. Work that lands moves its checklist to
  `doc/HISTORY.md`, with a line in the roadmap's **Done** and an entry in the Log, and sorts what it
  leaves open into the roadmap's Open points or Backlog. The Status section of this file stays a
  short summary: no paragraph per milestone.

## Decisions

**Every architectural decision is a record in [`doc/adr/`](doc/adr/), one per decision.** Read the
relevant record before questioning a design choice; each record's **Considered options** says what
was rejected and why. [`doc/adr/README.md`](doc/adr/README.md) has the full practice and the index.
The rules that matter day to day:

- **Write the record when the decision is made**, not when the code lands. A record that waits for
  the implementation turns into a description of the implementation.
- **One decision per record.** If it needs the word "also", it is two records.
- **Never rewrite a record in place.** A decision that reverses an earlier one gets a *new* record,
  and the old one is marked `Superseded by ADR-00NN` at the top and otherwise left alone. Editing a
  record to say what you now believe erases the reasoning someone may be relying on. Fixing a typo
  is fine; changing what it decided is not.
- **A record only partly reversed is `Amended by`, not superseded.** Marking it superseded sends the
  next reader away from a decision that still holds; marking it nothing leaves them reading a clause
  that is gone. The amended record says so on its status line.
- **Record the rejected options.** That section is the part that gets read later. A record with only
  a decision is a note, not an argument.
- **Say what it costs.** `Consequences` includes the bad news. A decision with no downside was not a
  decision.
- **Number sequentially and never reuse a number.** `NNNN-a-short-imperative-title.md`.

A change that wants to contradict a record stops and becomes its own record first.

## Notes for Claude

None yet. A trap goes here once someone has fallen into it: a library that behaves against its own
documentation, a test that passes while measuring the wrong thing, a failure that does not fail
loudly. Say what happened, why, and where the code now guards against it, so that the next session
does not pay for it again.
