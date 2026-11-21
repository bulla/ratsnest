# History

What ratsnest has become, milestone by milestone, and the log of how it got there. Each milestone
below carries the paragraph that summed it up and the items it finished; the items it left open go
to [`ROADMAP.md`](ROADMAP.md), gathered by kind. Why each thing is the way it is lives in
[`adr/`](adr/).

When a piece of work lands, its checklist moves here under a heading of its own, its open items go
to the roadmap's Open points or Backlog, and the Log below gets an entry.

## Milestones

### M0: the design

M0 is done: twenty records, argued one question at a time by `/interview` on 2026-11-20, and no
code. ratsnest started as a stand-alone copy of scratchpi's wiring pages and became a builder: a
command-line tool, shipped as one executable per platform, that reads a circuit written as data in a
project of its own and makes a self-contained page in a chosen orientation, theme and language.
Several choices were tried before they were made, on this container with Node taken off the `PATH`:
Bun, Vitest on Bun and Deno for the runtime; Solid 2 on Bun, for later; Nunito's coverage and
metrics against five other fonts; and a compiled executable on five systems. What they found is in
each record, and the traps they turned up are in `CLAUDE.md`'s Notes.

- [x] What ratsnest starts from, and what it draws: ADR 0001, ADR 0002
- [x] What an asset is, and the inputs that make it: ADR 0003 to ADR 0005
- [x] What a circuit is, written as data with everything that computes outside it: ADR 0006,
      ADR 0007
- [x] The stack: no framework, Bun entirely: ADR 0008, ADR 0009
- [x] Languages, Cyrillic included, and the font: ADR 0010 to ADR 0012
- [x] Publishing as Artifacts, and from where: ADR 0013, ADR 0019
- [x] A builder, circuits in projects of their own, and their migrations: ADR 0014, ADR 0015
- [x] Shipping, versions, licences and continuous integration: ADR 0016 to ADR 0018, ADR 0020
- [x] The `circuit` skill, which keeps every circuit declarative and every page alike
- [x] `CLAUDE.md`'s Status, Design and Stack from the records, and the roadmap

### M1: the frame

M1 is done: everything the code will stand on, and no engine yet. Every dependency is pinned at
the Stack's versions, two patches that came out after the owner confirmed them taken as ADR 0009
asks, and the first tests hold the repository's own rules. The workflow passed on its first run, on
Linux, Windows and macOS, and its gate, `ci`, is the one check to require. Biome 2.6 turned out to
format Markdown as well, and at the owner's choice it formats every file, the records included.

- [x] `package.json` with every dependency pinned exactly at the versions in `CLAUDE.md`'s Stack
      (ADR 0009), `packageManager` naming Bun `1.4.5`, and `version` `0.0.0` (ADR 0017)
- [x] `tsconfig.json`, `biome.json`, and the scripts: `lint`, `format`, `typecheck`, `test`
- [x] A first test that runs, so `bun run test` has something to pass
- [x] `.github/workflows/`, the workflow for every pull request: lint, typecheck and test, on Bun
      alone, on Linux, Windows and macOS, which a public repository runs for free (ADR 0020)
- [x] `CHANGELOG.md`, with an empty _Unreleased_, and the pull request check that a change users get
      has its line there, unless labelled `no changelog` (ADR 0017, ADR 0020)
- [x] `LICENSE`: MIT, held by bulla (ADR 0018), added as soon as the repository was public, since a
      public repository with no licence reserves every right
- [x] `CLAUDE.md`'s Commands table, with how to run a single test
- [x] `CONTRIBUTING.md`, the walkthrough for working on ratsnest: what to install, each command with
      what it should print, how work is done here (`develop`, records, the roadmap, the changelog,
      the skills) and where to read next, every step run as it is written
- [x] The `/setup` skill, which follows `CONTRIBUTING.md` step by step, runs each, checks what it
      printed and explains what did not, and holds no steps of its own

### M2: the copy

M2 is done: scratchpi's drawing, wiring check and page generator are in `src/`, and a page is made
from a circuit and a layout handed in, in English or French, the same file every time. Nothing in
`src/` names a circuit: the tests build on seven test circuits, scratchpi's renamed by what they
hold. The drawing came over unchanged, and is the same, byte for byte, as on scratchpi's own pages.
What tied the page to the app went, and with it the French of scratchpi's layouts, which belongs to a
circuit now (M3).

- [x] scratchpi's breadboard model, drawing, wiring check and page generator in `src/`, the drawing
      in `src/drawing/` (ADR 0001, ADR 0018)
- [x] `ATTRIBUTION.md`, as the drawing arrives: its source, its licence, what was changed, and the
      folder it covers (ADR 0018)
- [x] Its tests ported to `bun:test` and passing, jsdom running the page's script (ADR 0009)
- [x] What tied it to scratchpi's app gone: the back link, the theme handed over, the language twin,
      the app's words and records (ADR 0004)
- [x] One page made from a circuit built in a test, in English, dark, at 0°, and looked at in
      Chromium beside scratchpi's

### M3: circuits as data

M3 is done: a circuit is one declarative file in format 1, every text keyed by language, read as
data with Babel and never run, and checked field by field, its format first and its wiring last.
`bun run ratsnest check` and `bun run ratsnest generate` run from source, and scratchpi's seven
circuits are the examples, in English and French. Two records came out of it: the format is one file
of types of its own, apart from the engine's model, which `init` will copy alone (ADR 0022), and a
page is written into `pages/`, named by its four inputs (ADR 0023).

- [x] The `Circuit` type, format 1: what a circuit is, where its parts go and its test script, every
      text keyed by language (ADR 0006, ADR 0010, ADR 0015)
- [x] A circuit file read as data, parsed and never run, with its fields checked and its format
      refused when it is not the current one (ADR 0007, ADR 0015, ADR 0016)
- [x] The declarative check, and the check that nothing in `src/` names a circuit (ADR 0007)
- [x] scratchpi's seven circuits ported to `examples/` as declarative files, each passing the wiring
      check (ADR 0014)
- [x] `bun run ratsnest check` and `bun run ratsnest generate`, from source (ADR 0014)

## Log

- 2026-11-20: Repo created, empty. `CLAUDE.md`, the roadmap, this file, the records' practice and
  the `interview` skill carried over from scratchpi, with nothing yet for them to describe.
- 2026-11-20: Renamed from ratnest to ratsnest on GitHub, because it reads better and is the more
  accurate name.
- 2026-11-20: M0. The design, by interview, in twenty records. It began as a copy of scratchpi's
  circuit pages, the visuals above all (ADR 0001), and turned on one rule the owner asked for: a
  circuit file only declares, and the engine alone computes, which is what keeps every page alike
  (ADR 0007). Two questions reshaped it halfway. Asked whether circuits had to live in ratsnest's
  repository, the answer made ratsnest a builder with projects of its own and migrations in the
  manner of Angular's (ADR 0014, ADR 0015); asked whether Bun could make a standalone tool, a trial
  compile made it the way ratsnest ships (ADR 0016). Strict SemVer, computed from a snapshot of the
  public surface, came out of wanting to publish safely (ADR 0017). The owner merged each batch of
  records as it was decided, from pull request 3 on.
- 2026-11-20: The repository made public by the owner, before any code, and licensed MIT to bulla
  at once, since a public repository with no licence reserves every right. Versions stay at 0.y.z
  until ratsnest is done, rather than until the repository is public (ADR 0021). The owner's friend,
  who reads Russian, is to read the engine's Russian table in M6, and signing the macOS executables
  is deferred. The onboarding, `CONTRIBUTING.md` and a `/setup` skill that follows it, is planned
  into M1, with the README's _Get started_ in M7.
- 2026-11-20: M1. The frame. Every dependency pinned exactly; `@types/bun` 1.4.5 and `@babel/parser`
  8.1.3 came out after the versions were confirmed, and were taken. Biome 2.6 formats Markdown, which
  scratchpi's 2.5 did not. It was first kept to the code, to leave the records as they were written;
  the owner chose instead to let it format everything, the records included, which it did in a
  commit of its own. The workflow passed first time on all three systems, its test of the running Bun
  showing that `setup-bun` reads the version from `package.json`. Every step of `CONTRIBUTING.md` was
  run as written, in a fresh clone, and printed what the file says.
- 2026-11-20: M2. The copy. The drawing, the breadboard model and the wiring check came over as they
  were, their comments citing scratchpi's records by name, since ratsnest's numbers mean other
  things. Their tests were moved onto seven test circuits, scratchpi's renamed, so that no test in
  `src/` names one that ships. The page lost the back link, the theme read from its address, its twin
  in the other language and the aside about scratchpi's code view, and its two warnings about
  addressable LEDs now name the pin the circuit puts their data on, where they had named scratchpi's.
  The palette is plain custom properties, pruned to what a page draws; pruned by what the test
  circuits drew, it lost the colour of a control pin's chip, which none of them wires, and the token
  tests now read the drawing's own lists instead. Made from the test circuit copied from Red/Green
  LEDs, the page matched scratchpi's live one but for what was taken out, and its drawing, and the
  RGB LED's on two breadboards, were the same byte for byte. scratchpi's own generator does not run
  under Bun alone, so the comparison was with its live pages.
- 2026-11-20: M3. Circuits as data, worked on autonomously at the owner's request, each milestone a
  pull request stacked on the one before. Where the format's type lives was the one question left
  open, and became ADR 0022: written anew, by ratsnest, apart from the engine's model, which kept
  its shape under a new name, `ShownCircuit`. Where a page is written became ADR 0023. The reader
  takes its node types from the parser's own signature, so `@babel/types`, the parser's dependency,
  did not become ratsnest's. The command's tests found that it read files from the process's own
  folder rather than the one it ran for, which running it by hand from the repository's root could
  not show. The examples kept scratchpi's steps and scripts, French included, but not its
  descriptions, which spoke of its app and its games, addressed a child as _tu_, and gave values
  such as 5 V in words a circuit should leave to the engine.
