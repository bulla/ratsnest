# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ratsnest

*Graphical wiring for breadboards.* ratsnest makes a wiring guide for each circuit: one
self-contained page showing how to build it on a breadboard with a Pico 2 W, step by step. It
started on 2026-11-20 from a copy of scratchpi's circuit pages (`bulla/scratchpi`), and evolves on
its own from there.

## Status

Started 2026-11-20, and no code yet. The design is being settled by interview, a record per
decision; what is settled so far is under Design below, and what is next is in
[`doc/ROADMAP.md`](doc/ROADMAP.md).

This section is a summary and stays one. A piece of work's story goes in the Log in
[`doc/HISTORY.md`](doc/HISTORY.md), its open items in the roadmap, and its reasons in a record. None
of them belongs here.

## Design

Design is settled before code, one decision at a time (`/interview` walks the tree), and each
decision becomes a record in [`doc/adr/`](doc/adr/). This section states the root decisions, a
paragraph each with the records that argue them, so that nobody proposes an architecture that has
already been argued.

**One Pico 2 W, one half-size breadboard** (ADR 0002). Another board or breadboard is a record of its
own, written when a circuit needs it.

**One asset is one self-contained HTML page per circuit** (ADR 0004): the drawing, the steps that
pick out their parts, the parts list with its colour bands, a MicroPython test script and the
drawing's attribution, with nothing else to load. **A page is a pure function of four inputs**: the
circuit, an orientation of 0°, 90°, 180° or 270° clockwise (ADR 0003), a theme and a language
(ADR 0005). Nothing on the page switches any of them, and the same inputs make the same file.

**A circuit is one TypeScript file that only declares, and everything that computes is outside it**
(ADR 0006, ADR 0007). This is the rule every other part of ratsnest leans on:

- `circuits/<name>.ts` says what the circuit is and where its parts go, in pins, holes, parts,
  values and words: `import type` lines and one `export default { … } satisfies Circuit`, whose
  values are strings, numbers, booleans, and arrays and objects of those. No function, call,
  variable, spread, condition or value import, and nothing about how anything looks.
- The validator, the renderer and the post-processor are the engine, in `src/`, and nothing in
  `src/` names a circuit, tests included.
- A test holds both directions. When the validator refuses a circuit, move the part, never the
  rule. A circuit is added or changed through the `circuit` skill (`.claude/skills/circuit/`).

**Start here:**

- [`doc/ROADMAP.md`](doc/ROADMAP.md): what is next, the work in flight, and everything still open.
  Read this first when picking work back up.
- [`doc/HISTORY.md`](doc/HISTORY.md): every milestone's checklist and the Log of how each went.
  Read it for how something came to be; the record says why.
- [`doc/adr/`](doc/adr/): why the architecture is what it is, one decision per record. Read before
  questioning a design choice.

## Stack

Ask before adding anything not in this table. Every version is pinned exactly, with no caret, and
was the latest release when it was added (ADR 0009). None is installed yet: they go into
`package.json` with the first code.

| Layer | Choice |
| --- | --- |
| Runtime | Bun `1.4.5`, and nothing else: it installs, runs the scripts and the generator, and tests with `bun test` (ADR 0009) |
| Language | TypeScript `7.0.2`, checked with `tsc --noEmit`, run by Bun |
| Framework | None, and no bundler: the engine writes each page as a string (ADR 0008) |
| Tests | `bun test`, and jsdom `31.0.1` for the page's one script |
| Types | `@types/bun` `1.4.4`, `@types/jsdom` `30.0.0` |
| Lint and format | Biome `2.6.8` |
| Declarative check | `@babel/parser` `8.1.2` (ADR 0007, ADR 0009) |
| Looking at a page | The Playwright and Chromium installed where the work is done, never a dependency |

Two standing constraints:

- **Bun entirely: there is no Node.** Run every command as `bun run <script>`. A tool's launcher
  asks for `node` by name and `bun run` stands in for it, so `./node_modules/.bin/biome` called
  directly fails where Node is missing, and works where it is installed, which makes the mistake
  easy to miss.
- **No framework until something on a page has to change after it is made** (ADR 0008). Solid 2 is
  the one in mind, and ADR 0008 says what adding it was found to need.

## Commands

None yet: there is nothing to install, build, test or lint. When there is, the commands go in a
table here, including how to run a single test, and every one of them is `bun run <script>`
(ADR 0009).

## Layout

Entries marked `·` do not exist yet: they are the intended shape, not a description of what is
there.

```
.
├── .claude/
│   └── skills/
│       ├── circuit/     Adds or changes a circuit, and makes its page (ADR 0007)
│       └── interview/   Pressure-tests a plan one question at a time
├── circuits/          · One declarative file per circuit, and nothing else (ADR 0006, ADR 0007)
├── doc/
│   ├── ROADMAP.md       What is next and everything still open, and one line per milestone done
│   ├── HISTORY.md       Every milestone's checklist, and the Log
│   └── adr/             One record per decision, and why
│       └── README.md      How records are written, and the index
├── src/               · The engine: the validator, the renderer and the post-processor
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

A trap goes here once someone has fallen into it: a library that behaves against its own
documentation, a test that passes while measuring the wrong thing, a failure that does not fail
loudly. Say what happened, why, and where the code now guards against it, so that the next session
does not pay for it again.

- **TypeScript 7 has no stable parser API.** `require("typescript").createSourceFile`, which 6.x
  had, is gone, and what is left sits under `typescript/unstable/*`, through the native compiler
  running as another process. That is why the declarative check parses with `@babel/parser`
  (ADR 0009). Taking Babel out to "use TypeScript's own parser" puts that back.
- **A test copied from scratchpi passes `bun test` and fails the type check.** It imports from
  `vitest`, and Bun redirects the import to its own runner while it runs, but the types for
  `vitest` are not there. Change the import to `bun:test`.
- **Solid's package hands Bun and Deno its server build** (ADR 0008). If Solid ever comes in, its
  tests run as `bun test --conditions browser`, or a component's first call says a client-only API
  was called on the server.
