# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ratsnest

*Graphical wiring for breadboards.* ratsnest is a builder of wiring guides: from a circuit described
in one declarative file, it makes one self-contained page showing how to build it on a breadboard
with a Pico 2 W, step by step. Circuits live in projects of their own, made by `ratsnest init`, and
ratsnest itself holds only its examples (ADR 0014). It started on 2026-11-20 from a copy of
scratchpi's circuit pages (`bulla/scratchpi`), evolves on its own from there, and is to be
open-sourced once done.

## Status

The design is settled, in twenty records argued by interview on 2026-11-20 (M0), and there is no code
yet. M1, the frame, is next, and the milestones after it are in [`doc/ROADMAP.md`](doc/ROADMAP.md).

This section is a summary and stays one. A piece of work's story goes in the Log in
[`doc/HISTORY.md`](doc/HISTORY.md), its open items in the roadmap, and its reasons in a record. None
of them belongs here.

## Design

Design is settled before code, one decision at a time (`/interview` walks the tree), and each
decision becomes a record in [`doc/adr/`](doc/adr/). This section states the root decisions, a
paragraph each with the records that argue them, so that nobody proposes an architecture that has
already been argued.

**ratsnest is a builder, and circuits live in projects of their own** (ADR 0014). The builder is the
engine, a command-line tool, the `Circuit` type and the `circuit` skill. A circuits project is any
folder with a `ratsnest.json`: `ratsnest init` makes one, `ratsnest check` and `ratsnest generate`
are what the skill calls, and `ratsnest update` moves a project to a newer ratsnest. The skill has
one copy, ratsnest's: `init` puts it in a project and `update` replaces it. ratsnest's own circuits
are scratchpi's, ported, in `examples/`.

**ratsnest reaches its users as one executable per platform, built by Bun** (ADR 0016): Linux,
macOS and Windows, each carrying Bun and Nunito inside, attached to a GitHub Release with an install
script, and no npm package. It reads a circuit file as data and never runs it, and checks every field
itself. A project names the version it expects in `ratsnest.json`, gets the `Circuit` type in
`.ratsnest/` for editors, and `ratsnest update` replaces the executable before it migrates.

**Every release is numbered by strict SemVer, computed and never chosen** (ADR 0017). The public
surface (the circuit format and its type, the commands and their options, `ratsnest.json`) is
snapshotted in `api/` at each release: a format that rose or anything removed or changed is major,
anything only added is minor, the rest is patch, and nothing may be lower or skipped. The version
lives in `package.json` alone, versions are 0.y.z until the repository is public and 1.0.0 is its
first public release, `bun run release` is the only way to make one, and continuous integration
refuses a tag that breaks the rule.

**ratsnest's code is MIT, and it carries what it inherits** (ADR 0018). The drawing's code, in
`src/drawing/`, is CC BY-SA 4.0 as an adaptation of Raspberry Pi's datasheet figure, credited in
`ATTRIBUTION.md` and in every page's footer; Nunito's licence sits in `fonts/`; every release
carries a `NOTICES` file for what the executable contains, Bun and its LGPL JavaScriptCore among it.
The circuits people write, and their pages' words, are theirs.

**Every circuit file says its format, and `ratsnest update` migrates it** (ADR 0015). `format: <n>`
rises only when the circuit format breaks; the engine reads the current one alone, and refuses any
other with what to do. A migration turns one format's object into the next's and nothing else, with a
test on files of the format before; a change that breaks the format ships its migration with it.

**One Pico 2 W, one half-size breadboard** (ADR 0002). Another board or breadboard is a record of its
own, written when a circuit needs it.

**One asset is one self-contained HTML page per circuit** (ADR 0004): the drawing, the steps that
pick out their parts, the parts list with its colour bands, a MicroPython test script and the
drawing's attribution, with nothing else to load. **A page is a pure function of four inputs**: the
circuit, an orientation of 0°, 90°, 180° or 270° clockwise (ADR 0003), a theme and a language
(ADR 0005). Nothing on the page switches any of them, and the same inputs make the same file.

**A circuit is written in English, French or Russian, one language at least, and a page is made only
in a language its circuit has** (ADR 0010). Every text a reader sees is keyed by language, a circuit's
languages are those of its name, and the generator refuses any other before it draws anything. Every
language's text is held to rules a test checks, Cyrillic included: NFC, one script to a word,
look-alikes folded before a hole is looked for, drawn words measured rather than counted, and plural
forms (ADR 0011).

**Every page is set in Nunito, and carries it** (ADR 0012): two variable WOFF2 files in `fonts/`,
Latin on every page and Cyrillic on a Russian one, inlined under a family name of ratsnest's own.
The engine measures every drawn word with the same files, and a test fails on a character a page
writes that they lack.

**A page becomes an Artifact only when asked, one per set of four inputs** (ADR 0013), through the
`circuit` skill. The links are kept in `ARTIFACTS.md` at the root of the circuits project, committed
or not as its owner chooses (ADR 0014), and tracked by default; ratsnest's own repository publishes
nothing and keeps no `ARTIFACTS.md` (ADR 0019). Every page names its inputs in a
`<meta name="ratsnest">` tag, so the skill finds an existing Artifact even where the file is gone,
as it can be at the start of a cloud session.

**A circuit is one TypeScript file that only declares, and everything that computes is outside it**
(ADR 0006, ADR 0007). This is the rule every other part of ratsnest leans on:

- A circuit file, `circuits/<name>.ts` in its project or `examples/<name>.ts` here, says what the
  circuit is and where its parts go, in pins, holes, parts, values and words: `import type` lines
  and one `export default { … } satisfies Circuit`, whose values are strings, numbers, booleans, and
  arrays and objects of those. No function, call, variable, spread, condition or value import, and
  nothing about how anything looks.
- The validator, the renderer and the post-processor are the engine, in `src/`, and nothing in
  `src/` names a circuit, tests included. The examples are checked by the same `ratsnest check` as
  anyone's circuits.
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
| Font | Nunito `3.602`, cut by Google Fonts' subsetter into two variable WOFF2 files, committed in `fonts/` and carried by every page (ADR 0012) |
| Measuring words | `fontkit` `3.0.0`, reading those same files (ADR 0012) |
| Shipping | One executable per platform from `bun build --compile --conditions=browser`, on GitHub Releases (ADR 0016) |
| Versions | Strict SemVer, computed by `bun run release` and compared with `Bun.semver` (ADR 0017) |
| Continuous integration | GitHub Actions on Bun alone: one workflow for every pull request and push to `develop`, one for every `v*` tag (ADR 0020) |
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
├── .github/
│   └── workflows/     · One for every pull request and push to `develop`, one for every release
│                        tag (ADR 0020)
├── .claude/
│   └── skills/
│       ├── circuit/     Adds or changes a circuit, and makes and publishes its page (ADR 0007,
│       │                ADR 0014). The one copy that `ratsnest init` puts in every circuits project
│       └── interview/   Pressure-tests a plan one question at a time
├── examples/          · scratchpi's circuits, ported: ratsnest's own, checked like anyone's, and
│                        the old files its migrations are tested on (ADR 0014, ADR 0015)
├── fonts/             · Nunito's two files, its licence, and the address that made each (ADR 0012)
├── doc/
│   ├── ROADMAP.md       What is next and everything still open, and one line per milestone done
│   ├── HISTORY.md       Every milestone's checklist, and the Log
│   └── adr/             One record per decision, and why
│       └── README.md      How records are written, and the index
├── src/               · The engine (the validator, the renderer and the post-processor) and the
│   │                    command-line tool: `init`, `check`, `generate`, `update` (ADR 0014)
│   └── drawing/       · The Pico and the breadboard, drawn: CC BY-SA 4.0, unlike the rest (ADR 0018)
├── LICENSE            · MIT, for everything but `src/drawing/` and `fonts/` (ADR 0018)
├── ATTRIBUTION.md     · The drawing's source and licence, and which folder it covers (ADR 0018)
├── api/               · The public surface as it was at the last release, written only by
│                        `bun run release` (ADR 0017)
├── package.json       · The one place the version lives (ADR 0017)
├── CHANGELOG.md       · Every release, and *Unreleased* (ADR 0017)
├── install.sh         · Puts the right executable on the `PATH` (ADR 0016)
├── .gitignore           The executables `bun run build` writes to `dist/` (ADR 0016)
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
- **A pull request that changes what users get adds its line to `CHANGELOG.md`, under
  *Unreleased*** (ADR 0017): anything in `src/` outside its tests, `fonts/`, the `circuit` skill or
  `install.sh`. Continuous integration refuses one that does not, unless it is labelled
  `no changelog` (ADR 0020). A release is made by `bun run release` and nothing else: never set the
  version, edit `api/` or push a tag by hand.

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
- **Nunito has no narrow no-break space**, U+202F, which every French `:`, `;`, `?` and `!` is
  preceded by. A browser draws a character its font lacks from another font, at another width, and
  nothing says so. The engine writes it as Nunito's thin space, U+2009, held to its neighbours by
  `white-space: nowrap` (ADR 0012). Nunito has no `←` or `→` either.
- **Google's ready-made Latin file of Nunito has no `Ω`**, though the font does. The files in
  `fonts/` come from Google's subsetter, asked for ratsnest's characters by name; fetching the usual
  `latin` file instead drops every resistor's unit.
- **The drawing's licence follows its folder, not its file** (ADR 0018). Everything in
  `src/drawing/` is CC BY-SA 4.0 and everything else MIT, so a helper moved out of the folder for
  convenience takes the adaptation into MIT code, and a file moved in takes MIT code under
  ShareAlike. Move drawing code in or out only with `ATTRIBUTION.md` in mind.
- **A compiled ratsnest without `--conditions=browser` dies on its first word.** `fontkit` uses
  `unicode-properties`, whose `node` loader reads `data.trie` from its own folder, and an executable
  has no such folder: `ENOENT … /$bunfs/root/data.trie` (ADR 0016). The `browser` condition takes
  the loader that carries the data in its code. Bun's compiler packs only what is imported, so any
  dependency that reads a file beside itself fails the same way: run the examples with the compiled
  executable, never only from source.
- **Solid's package hands Bun and Deno its server build** (ADR 0008). If Solid ever comes in, its
  tests run as `bun test --conditions browser`, or a component's first call says a client-only API
  was called on the server.
