# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ratsnest

_Graphical wiring for breadboards._ ratsnest is a builder of wiring guides: from a circuit described
in one declarative file, it makes one self-contained page showing how to build it on a breadboard
with a Pico 2 W, step by step. Circuits live in projects of their own, made by `ratsnest init`, and
ratsnest itself holds only its examples (ADR 0014). It started on 2026-11-20 from a copy of
scratchpi's circuit pages (`bulla/scratchpi`), and evolves on its own from there. It is open source,
under MIT (ADR 0018), and its repository has been public since 2026-11-20.

## Status

The design is settled, in records argued by interview on 2026-11-20 (M0), the frame is built (M1),
scratchpi's drawing, wiring check and page generator are copied in (M2), and circuits are data
(M3): format 1, read and never run, checked by `bun run ratsnest check` and drawn by
`bun run ratsnest generate`, with scratchpi's seven circuits as the examples. Every page carries
Nunito and the drawing is measured in it (M4), and is drawn at any quarter turn, every word
upright and nothing crowding at any (M5), in either theme, and in English, French or Russian, every
language held to ADR 0011's rules (M6). It builds into one executable per platform, and
`ratsnest init` makes circuits projects (M7), every release's version is computed and checked, and
the first release, 0.1.1, is published (M9), and `ratsnest update` moves a project and its executable
to a newer ratsnest (M10), and the `circuit` skill publishes a project's pages as Artifacts (M8). A
circuit can do without a Pico, on a supply, and every circuit is in format 2, since 0.2.0 (M12). New
parts come one at a time, each with the circuit that teaches it, in the roadmap's Backlog: the
electrolytic capacitor, keeping a light lit on a supply, is the first (M13).
M6 waits on the owner, for a reader of Russian; the roadmap's Open points say what it needs, in
[`doc/ROADMAP.md`](doc/ROADMAP.md).

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
are scratchpi's, ported, in `examples/`, with one of its own on a supply.

**ratsnest reaches its users as one executable per platform, built by Bun** (ADR 0016): Linux,
macOS and Windows, each carrying Bun and Nunito inside, attached to a GitHub Release with an install
script, and no npm package. It reads a circuit file as data and never runs it, and checks every field
itself. A project names the version it expects in `ratsnest.json`, gets the `Circuit` type in
`.ratsnest/` for editors, and `ratsnest update` replaces the executable before it migrates. The
install puts `rnest` beside it, a link to the same executable, and the docs' examples type that
shorter name (ADR 0029). Its one need from outside is a browser, for a drawing as a PNG or a WebP:
macOS's own WebKit, or on Linux and Windows a Chrome, Chromium, Edge or Brave (ADR 0042).

**Every release is numbered by strict SemVer, computed and never chosen** (ADR 0017). The public
surface (the circuit format and its type, the commands and their options, `ratsnest.json`) is
snapshotted in `api/` at each release: a format that rose or anything removed or changed is major,
anything only added is minor, the rest is patch, and nothing may be lower or skipped. The version
lives in `package.json` alone, versions are 0.y.z until ratsnest is done and 1.0.0 is the release
that says it is (ADR 0021), `bun run release` is the only way to make one, and continuous
integration refuses a tag that breaks the rule.

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
own, written when a circuit needs it. **A circuit may have a supply on one pair of rails in the Pico's
place** (ADR 0032): `setup: { kind: "supply", volts, rails }`, at 3, 3.7, 4.5 or 5 V, placed by the
engine, with plain lights and buttons that name no pin and no script. Its wiring is checked
against its + and − rails (ADR 0033), and `Circuit` is one type with two shapes (ADR 0034), which
extend one base: every circuit's setup, name, description, credit, steps and `test` (ADR 0036). The
`setup` is required, and its `kind` says what the breadboard is set up with, `"pico"` or
`"supply"`, as a part's and a pin's `kind` says what they are, a new start being a new `kind`
(ADR 0037).

**A new part comes with a circuit that needs it, and the wiring check learns that one use**
(ADR 0038), so that every page still shows a circuit that works. A part bought by its model is one
of a closed list the engine holds, with its pinout, its print and its parts list's line, 2N3904 and
2N3906 first (ADR 0039); one bought by its value keeps it free, as a resistor's `ohms`. What tells a
part apart is printed on its body, upright at every turn and the same in every language, `NPN` and
`470 µF`, and on a tag only where it cannot fit (ADR 0040). A new part is placed in its step as a
resistor is, its legs named by role, with no name or callout of its own (ADR 0041). The parts to
come, in order, are in the roadmap's Backlog.

**One asset is one self-contained HTML page per circuit** (ADR 0004): the drawing, the steps that
pick out their parts, the parts list with its colour bands, a MicroPython test script and the
drawing's attribution, with nothing else to load. **A page is a pure function of four inputs**: the
circuit, an orientation of 0°, 90°, 180° or 270° clockwise (ADR 0003), a theme and a language
(ADR 0005). Nothing on the page switches any of them, and the same inputs make the same file.
When asked, a circuit's output is its drawing alone instead, from the same inputs: an SVG to embed
(ADR 0031), or a PNG or a WebP drawn from that SVG by a browser, the same file only from the same
browser (ADR 0042).

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
was the latest release when it was added (ADR 0009): `package.json` holds them, and a test fails
on a range or on a running Bun other than the one pinned.

| Layer                  | Choice                                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime                | Bun `1.4.5`, and nothing else: it installs, runs the scripts and the generator, and tests with `bun test` (ADR 0009)                     |
| Language               | TypeScript `7.0.2`, checked with `tsc --noEmit`, run by Bun                                                                              |
| Framework              | None, and no bundler: the engine writes each page as a string (ADR 0008)                                                                 |
| Tests                  | `bun test`, and jsdom `31.0.1` for the page's one script                                                                                 |
| Types                  | `@types/bun` `1.4.5`, `@types/jsdom` `30.0.0`                                                                                            |
| Lint and format        | Biome `2.6.8`                                                                                                                            |
| Declarative check      | `@babel/parser` `8.1.3` (ADR 0007, ADR 0009)                                                                                             |
| Font                   | Nunito `3.602`, cut by Google Fonts' subsetter into two variable WOFF2 files, committed in `fonts/` and carried by every page (ADR 0012) |
| Measuring words        | `fontkit` `3.0.0`, reading those same files (ADR 0012)                                                                                   |
| Shipping               | One executable per platform from `bun build --compile --conditions=browser`, on GitHub Releases (ADR 0016)                               |
| Versions               | Strict SemVer, computed by `bun run release` and compared with `Bun.semver` (ADR 0017)                                                   |
| Continuous integration | GitHub Actions on Bun alone: one workflow for every pull request and push to `develop`, one for every `v*` tag (ADR 0020)                |
| Looking at a page      | The Playwright and Chromium installed where the work is done, never a dependency                                                         |
| Drawing a picture      | Bun's own `WebView`, driving the browser on the machine, and `Bun.Image`, encoding PNG and WebP (ADR 0042)                               |

Two standing constraints:

- **Bun entirely: there is no Node.** Run every command as `bun run <script>`. A tool's launcher
  asks for `node` by name and `bun run` stands in for it, so `./node_modules/.bin/biome` called
  directly fails where Node is missing, and works where it is installed, which makes the mistake
  easy to miss.
- **No framework until something on a page has to change after it is made** (ADR 0008). Solid 2 is
  the one in mind, and ADR 0008 says what adding it was found to need.

## Commands

Every command is `bun run <script>` (ADR 0009). `CONTRIBUTING.md` walks through them in order, and
`/setup` runs them with you.

| Task                                            | Command                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| Install                                         | `bun install`                                                     |
| Lint                                            | `bun run lint`, and `bun run format` writes its fixes             |
| Typecheck                                       | `bun run typecheck`                                               |
| Test                                            | `bun run test`                                                    |
| One test file                                   | `bun run test scripts/changelog.test.ts`                          |
| The tests whose name holds some words           | `bun run test -t "pinned exactly"`                                |
| The changelog check, as a pull request meets it | `bun scripts/changelog.ts origin/develop`                         |
| Check the examples                              | `bun run ratsnest check examples`                                 |
| Make an example's page                          | `bun run ratsnest generate examples/push-button.ts --language en` |
| Fetch Nunito again, after adding a character    | `bun run fonts`                                                   |
| Build the executables, and `dist/NOTICES`       | `bun run build`, or `bun run build linux-x64` for one             |
| Run the examples with a compiled executable     | `bun scripts/compiled.ts dist/ratsnest-linux-x64`                 |

Say `bun run test`, never `bun test` alone: both work today, but a script changed in `package.json`
changes only for the first.

## Layout

Entries marked `·` do not exist yet: they are the intended shape, not a description of what is
there.

```
.
├── .github/
│   └── workflows/
│       ├── check.yml    Every pull request and push to `develop`: lint, typecheck, the changelog,
│       │                the tests and the examples compiled on three systems, and the one gate to
│       │                require, `ci` (ADR 0020)
│       └── release.yml  Every `v*` tag: the version rule, the executables built and run on three
│                        systems, then the GitHub Release (ADR 0017, ADR 0020)
├── .claude/
│   └── skills/
│       ├── setup/       Walks a newcomer through `CONTRIBUTING.md`, checking each step
│       ├── circuit/     Adds or changes a circuit, and makes and publishes its page (ADR 0007,
│       │                ADR 0014). The one copy that `ratsnest init` puts in every circuits project
│       └── interview/   Pressure-tests a plan one question at a time
├── examples/            scratchpi's seven circuits, ported, `battery-button.ts`, the first on a
│                        supply (ADR 0032), and `fading-light.ts`, the first with a capacitor
│                        (ADR 0043): ratsnest's own, checked like anyone's, and in `format-1/` the
│                        files the migration to format 2 is tested on, one for each example older
│                        than format 2, left out of the type check (ADR 0014, ADR 0015, ADR 0036)
├── fonts/               Nunito's two files, its licence, and the address that made each (ADR 0012)
├── doc/
│   ├── ROADMAP.md       What is next and everything still open, and one line per milestone done
│   ├── HISTORY.md       Every milestone's checklist, and the Log
│   └── adr/             One record per decision, and why
│       └── README.md      How records are written, and the index
├── src/               The engine and the command-line tool. Nothing in it names a circuit (ADR 0007)
│   ├── cli.ts           `ratsnest init`, `check`, `generate` and `update` (ADR 0014)
│   ├── update.ts        A project moved on, and the executable fetched, staged and put in place
│   │                    of the running one (ADR 0015, ADR 0016)
│   ├── init.ts          A circuits project made, the type and the skill carried as text (ADR 0016)
│   ├── project.ts       The project a folder is in, and the version it expects (ADR 0016)
│   ├── format.ts        The circuit format: the type a circuit file satisfies, and only that. It
│   │                    imports nothing, because `init` copies it alone (ADR 0022)
│   ├── read.ts          A circuit file read as data, never run, held to the declarative check
│   ├── fields.ts        Every field checked, the format first, then the languages and the words
│   ├── check.ts         Every check in order, the wiring last: what `check` and `generate` run
│   ├── shown.ts         A checked circuit taken into one language, as the engine's model
│   ├── print.ts         A circuit's data written back as a file, its comments kept (ADR 0015)
│   ├── migrate.ts       The migrations, one format to the next, and their runner (ADR 0015)
│   ├── fonts.ts         Nunito's files, and every drawn word's width measured in them (ADR 0012)
│   ├── orientation.ts   The four quarter turns, and where a point lands at each (ADR 0003)
│   ├── theme.ts         The two themes a page is drawn in (ADR 0005)
│   ├── circuit.ts       The engine's model: a circuit shown in one language, and its layout
│   ├── netlist.ts       The wiring check: what a layout joins, against what its circuit says
│   ├── language.ts      The languages a page is written in
│   ├── pins.ts, rgb.ts  The GPIO a Pico 2 W breaks out, and an RGB LED's colours
│   ├── __fixtures__/    The tests' circuits: scratchpi's seven, renamed by what they hold, and one
│   │                    on a supply, and the `circuit` skill's default credits, read from the skill
│   ├── drawing/         The Pico, the breadboard and a supply's cell, drawn: CC BY-SA 4.0, unlike
│   │                    the rest (ADR 0018)
│   └── page/            The page and the drawing alone: their generator, their words, the page's
│                        stylesheet and its one script, `drawing.css`, which both carry (ADR 0031),
│                        `tokens.css`, the only file that writes a colour (ADR 0004), and
│                        `picture.ts`, which has a browser draw the SVG as a PNG or a WebP (ADR 0042)
├── pages/               What `bun run ratsnest generate` writes (ADR 0023), ignored by git
├── LICENSE              MIT, held by bulla, for everything but `src/drawing/` and `fonts/` (ADR 0018)
├── ATTRIBUTION.md       The drawing's source and licence, and which folder it covers (ADR 0018)
├── api/               · The public surface as it was at the last release, written only by
│                        `bun run release` (ADR 0017), from `scripts/surface.ts`
├── scripts/             The repository's own tools and their tests: the changelog check, the
│                        repository's rules (exact pins, the pinned Bun, no Node), the examples'
│                        checks, `fonts.ts`, which fetches Nunito's files, `build.ts`, which makes
│                        the executables and `NOTICES`, `compiled.ts`, which runs one, `surface.ts`,
│                        the public surface as data, and `release.ts`, the release and a tag's check
├── package.json         The dependencies, the scripts, and the one place the version lives (ADR 0017)
├── bun.lock             What `bun install` installs, exactly
├── tsconfig.json, biome.json  Strict TypeScript; Biome for the code and the Markdown alike
├── CHANGELOG.md         Every release, and *Unreleased* (ADR 0017)
├── CONTRIBUTING.md      The walkthrough for working on ratsnest, which `/setup` follows
├── README.md            What ratsnest is, and how to start using it
├── install.sh           Puts the right executable on the `PATH`, and `rnest` beside it (ADR 0016,
│                        ADR 0029)
├── .gitattributes       LF on every system, so Biome reads the same bytes on Windows
├── .gitignore           `node_modules/`, and the executables `bun run build` writes to `dist/`
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
  _Unreleased_** (ADR 0017): anything in `src/` outside its tests, `fonts/`, the `circuit` skill or
  `install.sh`. Continuous integration refuses one that does not, unless it is labelled
  `no changelog` (ADR 0020). A release is made by `bun run release` and nothing else: never set the
  version, edit `api/` or make a tag by hand. Its commit reaches `develop` by pull request, merged
  with a merge commit, and its tag is pushed after the merge (ADR 0030).

## Decisions

**Every architectural decision is a record in [`doc/adr/`](doc/adr/), one per decision.** Read the
relevant record before questioning a design choice; each record's **Considered options** says what
was rejected and why. [`doc/adr/README.md`](doc/adr/README.md) has the full practice and the index.
The rules that matter day to day:

- **Write the record when the decision is made**, not when the code lands. A record that waits for
  the implementation turns into a description of the implementation.
- **One decision per record.** If it needs the word "also", it is two records.
- **Never rewrite a record in place.** A decision that reverses an earlier one gets a _new_ record,
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

- **Biome 2.6 formats Markdown, and formats all of it here, the records included**, at the owner's
  choice. It writes emphasis with underscores, `_like this_`, and pads every table to its widest
  cell, so `bun run lint` fails on a hand-written `*emphasis*` or a ragged table until
  `bun run format` has run. Formatting a record is not rewriting it: nothing it decided changes.
- **Biome would reformat the release's snapshot, and `bun run lint` failed on the first release.**
  `bun run release` writes `api/surface.json` with `JSON.stringify`, one value to a line, and Biome
  puts a short array on one line, so the release commit failed the check every pull request runs,
  while the scratch-clone trial, which ran no lint, had passed. `biome.json` leaves `api/` out: only
  the release writes it, and formatting it by hand would be editing it.
- **Biome 2.6.8 does not know frontmatter, and breaks every skill it formats.** It puts a blank line
  after a `SKILL.md`'s opening `---` and turns the YAML's lists into Markdown's, so Claude Code reads
  neither a name nor a description. `biome.json` leaves `.claude/skills/**/SKILL.md` out, the only
  Markdown here with frontmatter, and `scripts/repository.test.ts` fails on a skill whose
  frontmatter does not open on its first line with its own name.
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
- **`tokens.css` holds every colour a page can draw, not only what the test circuits draw.** Pruned
  to the tokens their pages used, it lost the colour of a control pin's chip, which none of them
  wires, so the first circuit to wire RUN would have drawn a chip with no fill and said nothing. The
  token tests read the drawing's own lists, `CHIP_STYLES`, `BREADBOARD_TOKENS` and `LED_COLOURS`: a
  new colour goes in one of them and in `tokens.css` together.
- **scratchpi's page generator does not run under Bun alone**: it imports `./ring` beside a
  `Ring.tsx`, and Bun stops on a `ring.tsx` that does not exist. To set a page beside scratchpi's,
  fetch scratchpi's from `https://scratchpi.bulla.io/circuits/<slug>/`, which redirects to the
  trailing slash, so `curl` needs `-L`.
- **The page's stylesheets and script are imported as text, never read from disk**
  (`src/page/files.ts`). Read from disk, they work under `bun run` and are missing from a compiled
  ratsnest, which carries only what is imported. TypeScript is told what such an import is by
  `text.d.ts` for `*.css`, and by `steps.d.ts` beside `steps.js`, which it takes for the script.
- **A circuit's name can also be one of its parts' names**, as the RGB LED example's is. The test that
  nothing in `src/` names an example leaves such a name out, since `"RGB LED"` in the engine names the
  part. Every other name, in every language, and every `examples/<file>`, it still catches.
- **Google's subsetter answers 400 to a character not percent-encoded, and CSS without WOFF2 to a
  client it does not know.** `scripts/fonts.ts` builds the address with `URLSearchParams` and says it
  is a browser. Run it only to add a character: a page is made from the committed files.
- **fontkit ships no types.** `src/fontkit.d.ts` declares the members the engine uses and nothing
  else, so a new one is declared there first, or `tsc` says it does not exist.
- **A word on the drawing is written through `word()`, never `text()`, unless it is in a chip or a
  tag that is set upright whole.** The board is drawn as at 0° inside one turned group, and `word()`
  turns each word back about its own point. A word written with `text()` turns with the board, and
  `src/page/orientation.test.ts`, which composes every transform down to each word, fails on it at
  90°, 180° and 270°.
- **A layout tidy at 0° can crowd on a standing board**, as ADR 0003 foresaw: an upright value tag is
  deep across the rows. `crowdingProblems` in `breadboard-svg.ts` asks at all four orientations, and
  `ratsnest check` runs it. A tag goes onto two lines before it is refused; when it is refused, move the
  part, as the examples' pull-downs moved to the rail in M5. Searching further for a place only finds
  one too far from its resistor to read as its own.
- **A value is as wide as its language writes it**, `4,7 кОм` wider than `4.7 kΩ`, so the crowding
  check runs in every language a circuit has, and a problem met in some only names them. The test
  circuit in three languages is refused in Russian at all four orientations, on purpose (ADR 0011,
  rule 10): if a change to placing makes it pass, the test says so, and the Backlog's line on a
  Russian Four buttons changes with it.
- **`\s` matches the narrow no-break space**, so a typography check for English or Russian sees
  U+202F before a colon as a space, which is right: only French writes one there.
- **A `.ts` file imported as text is invisible to TypeScript**, which sees the module's types and
  no default export. `src/init.ts` imports `format.ts` that way, so that the executable carries it, under
  one `@ts-expect-error` that says why; it fails the type check if TypeScript ever stops minding.
- **Cross-compiling fetches Bun for each target**, from Bun's own servers, the first time. A build
  with no network makes the running system's executable alone.
- **The printer keeps every comment, but not always on its line.** The reader keeps a comment under
  the path of the value it stands before, so one written after a value, on the same line, comes back
  on its own line before the next value. A migration's file is the same data, and the same comments,
  in the printer's one style.
- **Run from its source, ratsnest's `process.execPath` is Bun itself**, so an `update` that put a
  release in place of it would replace the developer's Bun. `isCompiled` in `src/update.ts` reads
  `Bun.main` instead, which a compiled ratsnest has under `/$bunfs/`, `B:/~BUN/` on Windows, and a
  source run never does. A source run only moves the project, to its own version.
- **`Bun.spawnSync` throws on a file the system cannot run**, `ENOEXEC`, rather than giving an exit
  status. `update` runs the executable it fetched, staged beside the running one, before it takes
  that one's place, and catches both, so that a download that is not a ratsnest replaces nothing.
- **Only a compiled ratsnest can put an executable in place of itself**, so the tests cannot. The
  compiled check, `scripts/compiled.ts`, has a copy of the executable update a project `--from` the
  executable itself, on all three systems in every pull request. It ran on Windows only in the
  release workflow until the first release failed there: the new executable, started by the old one
  to move the project on, removed the old one's renamed file while the old one still ran and waited
  for it, and Windows refuses that with `EFAULT`. `clearOld` in `src/update.ts` now leaves such a file
  for the next update, and the pull request check runs the compiled examples on Windows and macOS too.
- **Outside `drawBreadboard` and `crowdingProblems`, the drawing assumes a Pico.** `turn`, `sayOhms`
  and `pico` in `breadboard-svg.ts` are set for the length of those two calls and put back after.
  `tagOf` asked on its own, as a test does, keeps a value tag off a Pico that a circuit with a supply
  does not have (ADR 0032), so the tag it gives can differ from the one drawn. The test of where a
  tag always was leaves the supply's test circuit out for that reason.
- **GitHub Actions runs Node for ratsnest, though ratsnest runs none.** A `uses:` step is a
  JavaScript action, run on the runner's own Node.js at the version its `action.yml` names, so the
  0.2.0 release warned about `upload-artifact@v4` and `download-artifact@v4`, which named Node.js 20
  after GitHub deprecated it. A warning that names an action is the action's: raise it to a major
  whose `action.yml` names a current Node. `release.yml` runs only on a tag, so a change to it is
  first run by the next release.
- **A browser draws the SVG it is given as the document it is given.** Put inside an HTML page, the
  SVG's `:root` became the page's, its `data-theme` set nothing, and a dark drawing came out in light
  colours; and a `data:` address with no `charset=utf-8` turned every `Ω` into two other letters.
  `pictureOf` in `src/page/picture.ts` loads the SVG alone, as UTF-8, and its test reads the corner
  pixels against the theme's surface. Chrome's viewport also came out about 90 px shorter than the
  `WebView` asked for, so the picture was cut and had scrollbars: it is sized with `view.resize`
  after the SVG loads, and a picture of any other size is refused. Bun's Chrome would also connect to
  a person's own browser if it found one with remote debugging on, which `url: false` rules out.
  macOS's WebKit once hung in continuous integration, on the CLI test that draws a PNG then a WebP,
  while the same pictures passed in their own file and the compiled check: the job ran until the
  test's timeout said nothing of where. Every browser step is now wrapped in `within`, which gives
  it 15 seconds and fails naming the step, and the next hangs said which: "load the drawing", now
  and then, on macOS's WebKit and on Linux's Chrome alike, on `develop` as on pull requests, and
  never on a machine of ours. `navigate` resolves on the page's `load` event alone, and a view
  sometimes never has one, while the next view in the same browser draws at once, as the jobs'
  times showed: one 15 s wait, then every other picture. So `pictureOf` begins a stuck picture again
  on a fresh view, `TRIES` times in all, through `tried` (ADR 0048); the tests' timeouts leave room
  for it.
- **The check on values in a circuit's words knows its units by name.** `VALUE` in `src/fields.ts`
  is a list of units, and it knew no capacitance until the first capacitor's example wrote `470 µF`
  in its description and passed. A part whose value the engine writes brings its unit to that list,
  in every language, with a test in `src/fields.test.ts`.
- **A standing part stands over the rows above its legs**, on the drawing, as a light's lens does,
  and wires are drawn over everything. So a hole a reader needs to see, a wire's end above all, goes
  below a standing part, never above it: the fading light's capacitor has its − leg wired from row j,
  under its legs in row i.
- **Solid's package hands Bun and Deno its server build** (ADR 0008). If Solid ever comes in, its
  tests run as `bun test --conditions browser`, or a component's first call says a client-only API
  was called on the server.
