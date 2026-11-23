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

### M4: the font

M4 is done: every page carries Nunito, cut by Google's subsetter to ratsnest's characters, under a
family name of ratsnest's own, and the drawing measures every word it writes in the same files with
fontkit. The narrow no-break space is drawn as Nunito's thin space, and a character Nunito lacks is
refused in a circuit's words and fails a test in the engine's.

- [x] `fonts/`: Nunito's Latin and Cyrillic files from Google's subsetter, the address that made each,
      and the font's licence (ADR 0012)
- [x] Every drawn word measured with `fontkit`, replacing the count of characters (ADR 0011, ADR 0012)
- [x] The test that fails on a character a page writes and the files lack, and the narrow no-break
      space written as Nunito's thin space (ADR 0012)

### M5: four orientations

M5 is done: the drawing turns by any quarter turn, never mirrored, every word upright, the labels past
the board's far end (ADR 0024), and a standing board stands beside the steps. `ratsnest check` refuses
a word that crowds at any of the four, and the examples moved two pull-downs so that none does.

- [x] The drawing turned by 0°, 90°, 180° or 270°, never mirrored, every word upright (ADR 0003),
      its labels past the board's far end (ADR 0024)
- [x] The page arranged around a vertical drawing
- [x] The overlap checks run at all four orientations (ADR 0003, ADR 0007)

### M10: updating

M10 is done: `ratsnest update` moves a circuits project to a newer ratsnest, the latest release by
default. A compiled ratsnest fetches that version's executable, runs it beside itself to be sure of
its version, puts it in its own place, renamed first on Windows, and runs it to move the project on:
every circuit migrated, the type and the skill replaced, `ratsnest.json` set, and the checks run. Run
from its source, ratsnest moves the project to its own version alone. A project is never moved back.

- [x] `ratsnest update`: the newer executable fetched and put in place, renamed first on Windows,
      then the migrations, the skill and the type replaced, and the checks (ADR 0015, ADR 0016)
- [x] The migrations' runner and their test harness, proven on a migration made for the purpose
      (ADR 0015)
- [x] A printer for writing a circuit file back with its comments (ADR 0015)

### M9: releases

M9 is done: every release's version is computed from what changed on the public surface, checked
again when it is tagged, and published by the release workflow only once its executables have run
on Linux, Windows and macOS. A release reaches the protected `develop` by pull request, and its tag
is pushed after the merge. The first release published is 0.1.1: 0.1.0 was tagged, and its run
failed on Windows.

- [x] The public surface as data, and its snapshot in `api/` (ADR 0017)
- [x] `bun run release`: the version computed, the changelog moved, the snapshot written, the
      commit and the tag (ADR 0017), brought to `develop` by pull request (ADR 0030)
- [x] The workflow for every `v*` tag: the rule checked, five executables built, each run on its own
      system, and only then the GitHub Release (ADR 0020)
- [x] The first release, which says by its number that anything may still change (ADR 0021):
      0.1.0 tagged and never published, 0.1.1 published on 2026-11-22

### M7: the executable, and circuits projects

M7 is done: ratsnest builds into five executables, one per platform, each carrying Bun and Nunito,
and `install.sh` puts the right one on the `PATH`. `ratsnest init` makes a circuits project, and the
owner's first, `bulla/rnest-circuits`, made from a local build, holds two circuits whose pages are
published. The compiled examples, which ran on Linux alone in pull requests, run on all three
systems since 0.1.1.

- [x] `bun run build`: the five executables with `--conditions=browser`, and `NOTICES` (ADR 0016,
      ADR 0018)
- [x] The pull request workflow checking the examples with the compiled Linux executable (ADR 0020),
      every page compared byte for byte with the source's, and on Windows and macOS since 0.1.1
- [x] `ratsnest init`: `ratsnest.json`, the `Circuit` type in `.ratsnest/`, `tsconfig.json`,
      `circuits/`, the `circuit` skill, and a tracked `ARTIFACTS.md` (ADR 0014, ADR 0016, ADR 0019),
      and `pages/` ignored (ADR 0025)
- [x] An executable older or newer than its project's `ratsnest.json` saying so (ADR 0016)
- [x] `install.sh` (ADR 0016), and `rnest` beside it (ADR 0029)
- [x] The owner's first circuits project, made by `init` from a local build: `bulla/rnest-circuits`,
      then `ernest-circuits`, on 2026-11-21
- [x] The README's _Get started_, for people using ratsnest: install it, `ratsnest init`, `/circuit`

### M8: publishing

M8 is done: the `circuit` skill publishes a circuits project's pages as Artifacts, one per set of
four inputs, keeps their links in `ARTIFACTS.md`, and looks for a page by its
`<meta name="ratsnest">` where the file has no row. `bulla/rnest-circuits` published three pages
this way. The owner signed off the second item; no fresh-session trial of it is recorded.

- [x] The `circuit` skill's publishing steps, end to end, from a circuits project: `ARTIFACTS.md`, the
      search by `<meta name="ratsnest">`, and the Artifact tool (ADR 0013, ADR 0019): three pages of
      `bulla/rnest-circuits` published and recorded on 2026-11-21
- [x] A page published, then found again from a fresh cloud session without `ARTIFACTS.md`, signed
      off by the owner on 2026-11-22

### M12: circuits without a Pico

M12 is done: a circuit can do without a Pico, powered by a supply on one pair of rails in its place,
at 3, 3.7, 4.5 or 5 V, with plain lights and buttons that name no pin, held by the wiring check to
its + and − rails, and drawn with a small cell beside the board. On the way the format rose to 2:
every circuit says what its breadboard is set up with, has one `test`, and may carry its own credit
(ADR 0035 to ADR 0037), and `rnest update` moves a format 1 circuit on. 0.2.0 releases it.

- [x] The design, by interview: a supply on one pair of rails in the Pico's place (ADR 0032), the
      wiring check it is held to (ADR 0033), and `Circuit` as one type with two shapes (ADR 0034)
- [x] The format: a supply's `setup`, lights and buttons without `pin`, and `test`, in `Circuit`'s
      second shape, read and checked field by field, and a Pico's part refused in a supply circuit;
      the `credit` any circuit may have (ADR 0035), in both shapes; and the `setup` every circuit
      says it starts from, a Pico or a supply (ADR 0037), in format 2 (ADR 0036)
- [x] The wiring check's rules for a supply circuit (ADR 0033), the short sought with every button
      held, and the lights that need about 3 V refused at 3 V
- [x] The cell drawn beside the board's near end, its leads in column 1 of its rails, outlined for
      both themes, and its colours in `tokens.css`
- [x] The page's words in English, French and Russian: the last step, the four supplies in the parts
      list, the rails' legend, the notes, the drawing's introduction and the footer. The footer is
      the circuit's credit since ADR 0035, and the `circuit` skill's default for a supply circuit
      does not begin with the Pico
- [x] The `circuit` skill asks: a Pico or a supply, and then which voltage and which rails
- [x] `examples/battery-button.ts`, in English and French, and a supply circuit among the tests'
      fixtures, with a variant for every rule it is refused by
- [x] 0.2.0, made by `bun run release` and brought to `develop` by pull request (ADR 0030)

### M13: the electrolytic capacitor

M13 is done: the first new part, with the circuit that teaches it (ADR 0038). On a supply, a button
charges an electrolytic capacitor across a light and its resistor, and once it is let go the light
fades out. The wiring check holds the capacitor to that one use (ADR 0043), and the drawing stands it
on its legs, a navy can with its value printed on it and a stripe down its − side.

- [x] The design, by interview: new parts each with the circuit that needs it (ADR 0038), real
      models from a closed list (ADR 0039), print on the body (ADR 0040), and no name of their own
      (ADR 0041); and this part's details, worked out alone at the owner's asking (ADR 0043)
- [x] The format: `{ kind: "electrolytic", microfarads, plus, minus }`, read and checked field by
      field, and allowed in a circuit with a supply
- [x] The wiring check's rule: the right way round, its − leg on −, its + leg between a button and a
      light's resistor, and the two slow enough to see the light fade, 0.2 s at least; and on a Pico,
      refused, with no use there yet
- [x] The drawing: a navy can, a pale stripe with minus signs, an aluminium top, a kinked + leg and
      its value printed upright at every quarter turn, its colours in `tokens.css` and its prints held
      to 4.5:1; a value tag keeps off it
- [x] The page's words in English, French and Russian: the step's sentence, the parts list's line,
      rated 16 V or more, and the note that it goes in one way round
- [x] A capacitance written in a circuit's own words refused, as a resistance is (ADR 0011)
- [x] `examples/fading-light.ts`, in English and French, and a test circuit with a variant for every
      rule it is refused by

### M14: the NPN transistor

M14 is done: a pin switches a light through a 2N3904, the second new part with the circuit that
teaches it (ADR 0038, ADR 0044). The pin feeds only the transistor's base through a resistor, and the
light's current comes from 3V3. The drawing stands a black TO-92 on its legs, `NPN` and its model
on its flat face and each leg's letter above it.

- [x] The design, worked out alone at the owner's asking (ADR 0044)
- [x] The models ratsnest knows, in `src/transistors.ts`, the 2N3904 first (ADR 0039)
- [x] The format: `{ kind: "transistor", model, emitter, base, collector }`, read and checked field
      by field, and refused in a circuit with a supply
- [x] The wiring check's rule: its legs in its model's order, its flat face towards row j; the
      light the right way round; the emitter on ground; the base on the light's pin through one
      resistor of 1 kΩ to 10 kΩ; the light between 3V3(OUT) and the collector through one of its
      own; and every transistor switching a light
- [x] The drawing: a black TO-92 case with its formed legs, its type, model and legs printed upright
      at every quarter turn, its colours in `tokens.css`, its print held to 4.5:1; a value tag keeps
      off it
- [x] The page's words in English, French and Russian: the step's sentence, the parts list's line,
      the legs' order and the BC547 that differs, the base resistor's range, and the long leg's note
- [x] `examples/transistor-switch.ts`, in English and French, and a test circuit with a variant for
      every rule it is refused by

### M15: the PNP transistor

M15 is done: a pin switches a light on the high side through a 2N3906, lit while the pin is low, the
third new part with the circuit that teaches it (ADR 0038, ADR 0045). The NPN's rule became one rule
read by the model's type, and the drawing, printed `PNP`, is the NPN's.

- [x] The design, worked out alone at the owner's asking (ADR 0045)
- [x] The 2N3906 among the models ratsnest knows, and each model's look-alike whose legs differ
- [x] The wiring check's rule, the NPN's read by type: the emitter on 3V3(OUT), and the light
      between the collector and ground
- [x] The page's note on a light's long leg, for a light either kind of transistor switches, and the
      note on a transistor's legs naming its own look-alike, the BC547 or the BC557
- [x] `examples/high-side-switch.ts`, in English and French, and a test circuit with a variant for
      every rule it is refused by

### M16: the capacitor tester and flasher

M16 is done: the owner's circuit, two 2N3904s crosswise on two AA batteries, flashing a red light and
a yellow one in turn, with the capacitor in one of its two places the one to test (ADR 0046). It
needed no new part, but a transistor's first use on a supply and a capacitor's second, and a light's
leader that rises over the parts in its way (ADR 0047).

- [x] The design, worked out alone at the owner's asking (ADR 0046, ADR 0047)
- [x] A transistor allowed in a circuit with a supply, and its rule there: half of a flasher, its
      emitter on −, its light on its collector, its base fed from + through 10 kΩ to 100 kΩ, and a
      capacitor from the other's collector to its base, the two holding it off for 0.1 s to 5 s
- [x] A capacitor on a supply either between a collector and a base, or keeping a light lit
- [x] A light's leader lifted over the transistors' cases and the capacitors' cans in its way
- [x] The flasher's base resistor's range in the page's note
- [x] `examples/capacitor-tester.ts`, in English and French, and a test circuit with a variant for
      every rule it is refused by

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
- 2026-11-21: M3's pull request failed on Windows, and so had M2's: a file URL's `pathname` is
  `/D:/…` there, which nothing can open, and the command joined paths with backslashes where its
  tests expected forward slashes. The test walks paths now, and the command says every path with
  forward slashes, which Windows reads too. Biome, linting a generated page, found `aria-labelledby`
  on the script's `<pre>`, whose role may not be named, which scratchpi's page had always had.
- 2026-11-21: M4. The font. Google's subsetter gave the cuts ADR 0012 measured, within a kilobyte,
  and both are Nunito 3.602 with the weight axis whole. Measured rather than counted, the chips and
  the resistor tags are a little narrower and every tag kept its place, so no test of where they go
  moved; the margin widens only for a label wider than it, which none is yet. fontkit has no types,
  and five declared members cost less than a dependency. A check now refuses a circuit's words
  holding a character Nunito lacks, which the `circuit` skill already promised.
- 2026-11-21: M5, its first two items. Where the labels go once the board is turned became ADR 0024:
  past the board's far end, so that every leader is the 0° one turned. The board turns as one group
  and every word is turned back, which kept 0° byte for byte as it was. A pin chip, upright on a
  standing board, reaches further in and no longer meets its neighbour, so every chip fits in the
  first row. A value tag, upright, is deep across the rows: beside the Pico, Four buttons' and RGB
  LED's pull-downs have nowhere clear within three holes and fall back where they overlap, which a
  search of five holes only moved off the board. That is what M5's overlap check is for, and the
  layouts move then, as ADR 0007 says.
- 2026-11-21: M5's overlap check. Run over the examples at all four orientations, it found fourteen
  value tags with nowhere clear on a standing board, all of them pull-downs, and none at 0° or 180°.
  Searching further only moved the problem, since nothing on the plastic was clear within five holes.
  Two lines, the number over its unit, took a tag from 6.8 mm deep to 4.4 and cleared eight; no shape
  could clear the other six, two resistors in three examples, so those moved, as ADR 0007 says:
  straight from the pin to the − rail. The examples are no longer scratchpi's layouts exactly, and the
  test circuits copied from them moved with them.
- 2026-11-21: M6, the theme and the page's tag. A page takes its four inputs as one object now, and
  the light theme needed only the attribute: the token layer had carried both scales since the copy,
  and the board was already the same in both, which a test now holds byte for byte. ADR 0013 left the
  tag's format open; it is `circuit=…;orientation=…;theme=…;language=…`, the circuit by its file's
  name, as `pages/` names it. The same record says a page is titled by its circuit's name alone, which
  the copy's `· ratsnest` was not, and that changed with it.
- 2026-11-21: M6, Russian and ADR 0011's rules. The engine's Russian is written for a reader, names
  never inflected, the parts list as a bill of materials; it waits for the owner's friend to read it.
  The rules found two kinds of value in the examples' own words, `5 V` and `880 Hz`, which now say VBUS
  and a high A. Values on the drawing had been English on every page, `4.7 kΩ` on a French one; they
  follow the page's language now, and that made rule 10 bite at once: the test circuit in three
  languages, drawn in Russian, has no room for two pull-downs' values at any orientation. A flat
  board's tag may now take two lines after one, which keeps English and French as they were, but
  does not clear Russian there; the test holds that result rather than the circuit being tuned until
  it passes.
- 2026-11-21: M7, all but the owner's own project. Bun cross-compiled all five executables here, about
  100 MB each, and the Linux one made the examples' pages byte for byte as the source does, all 112 of
  them, which the pull request workflow now checks every time. `NOTICES` is written from the licence of
  everything an executable carries, Bun's fetched at its pinned version. `init` copies the format's
  own file, which imports nothing, as ADR 0022 meant it to be, and tsc in a new project resolved
  `ratsnest` to it and refused a wrong colour. Whether `init` ignores `pages/` became ADR 0025. With no
  release until M9, `install.sh` also takes a local build, which is how the owner's first project is
  to be made.
- 2026-11-21: M9, all but the first release. The public surface is a flat record of named sets, read
  from the format's own file and from the table the command itself reads, so that a part, a language or
  an option added is a gain and one removed a change, and a required field added to a type a file
  already declares counts as major. In a scratch clone, `bun run release` made `0.1.0` and then `0.1.1`,
  each tag meeting the workflow's check against the previous, and refused an empty _Unreleased_ and a
  branch other than `develop`. That last rule meets ADR 0020's protected `develop`, which takes changes
  only by pull request: an open point for the owner, before the first release.
- 2026-11-21: M10, the printer and the migrations' runner. Format 1 is the only format, so the runner
  ships empty, and its harness proves it on migrations made for the purpose, over every example: a
  field renamed, its comment following it, the header kept, and a migration that cannot decide leaving
  the file as it was. Every example prints back as the same data with the same comments, and printing
  it again changes nothing. `ratsnest update` itself, which fetches the newer executable from a
  release, is M10's last item, and the first release is what it will fetch.
- 2026-11-21: M10, `ratsnest update`, after M6 to M10's pull requests were merged. It is two steps in
  two processes: the running ratsnest puts the version asked for in its own place and runs it as
  `update --version <it>`, and the version asked moves the project, so the migrations that run are
  always the new version's. Staging the new executable beside the old one and running its `--version`
  before it takes the old one's place found the one way this went wrong by hand: a file that is not a
  program made `Bun.spawnSync` throw, which the first version did not catch. Two compiled executables,
  0.0.0 and a 0.0.1 built for the purpose, moved a project from one to the other here; the first
  fetch from GitHub has to wait for two releases, and until then `update` says ratsnest has none.
- 2026-11-21: Between milestones, from the owner's first circuits project, `bulla/rnest-circuits`,
  then `ernest-circuits`, made by `init` from a local build: three buttons in a line, with an RGB
  LED on a second board. Its buttons' leaders shared one line, so each button blocked on the channel
  now has a lane of its own, on alternating sides (ADR 0026), and a part on the second board's near
  half has its label past that end (ADR 0027, amending ADR 0024). A line of buttons on the second
  board needed a button that could sit there, `board: 2` (ADR 0028).
- 2026-11-22: Between milestones. `install.sh` puts `rnest` beside `ratsnest`, a link to it, and the
  docs type the shorter name (ADR 0029). An update run through the link was found to replace the
  file, not the link, since Bun gives the real file as `process.execPath`; the compiled check holds
  that.
- 2026-11-22: M9, the first release. `bun run release` commits and tags on `develop`, which is
  protected, so a release now comes in by pull request, merged with a merge commit, and its tag is
  pushed after the merge (ADR 0030). The first run made a commit that failed lint, since Biome would
  reformat the snapshot the script writes, and `api/` was left out of Biome before it ran again. A
  session working for the owner cannot push tags, so the owner pushed them, from a Codespace. A
  `master` branch was tried for releases and taken out again the same day. `v0.1.0`'s run failed on
  Windows: the new executable, started by the old one, removed the old one's file while it still
  ran. The pull request check had run the compiled examples on Linux alone, so it now runs them on
  all three systems, and showed the fix working on Windows before any new tag. The release script
  then made 0.1.1, a patch, with 0.1.0's entries carried into it and 0.1.0 marked yanked, and its run
  passed on every system and published five executables.
- 2026-11-22: The owner's circuits project renamed from `ernest-circuits` to `rnest-circuits`. Its
  `rnest update`, run from a local 0.0.0 build, was the first update fetched from a GitHub release:
  0.1.1 put in place, the `rnest` link kept, and the project moved on with both circuits passing.
- 2026-11-22: `develop` protected by the owner, with `ci` the check it requires, and the
  `no changelog` label made, which closes ADR 0020's two open points. `CONTRIBUTING.md` gains
  _From a fork_, for contributors without write access: fork, clone, `upstream`, a branch from its
  `develop`, and what to expect of the first pull request.
- 2026-11-22: M7, signed off by the owner: `bulla/rnest-circuits`, made by `init` from a local build,
  counts as the first circuits project. M8's first item too: the `circuit` skill published three of
  its pages and recorded them in `ARTIFACTS.md`. What is left of M8 is finding a page again from a
  fresh cloud session without that file.
- 2026-11-22: M8, signed off by the owner, with no fresh-session trial of its second item recorded.
  Only M6 is left before M11, waiting on the Russian table's reading.
- 2026-11-22: Between milestones. The parts list's lines for an RGB LED and a ring, in every
  language, no longer suggest where to buy one, as scratchpi's had: a page names what a part is, never
  a shop. The line in the roadmap's Backlog that asked for this came out with it.
- 2026-11-22: Between milestones, ADR 0031 by interview, then built: `generate --format svg` makes
  the drawing alone, to embed in other pages by `<img>`. The drawing's styles moved out of
  `page.css` into `drawing.css`, which the page and the SVG both carry, and the page's call to the
  drawing became one the SVG makes too, so a test finds the page's own drawing inside the SVG. The
  drawing is nested in an `<svg>` of its own, which carries Nunito, the tokens and those styles in
  CDATA, its theme's surface as its background, and the credit, wrapped by measured width. Push
  button's file is 145 KB, more than the record's estimate of 120 KB, since its tokens and styles
  come with it. Through `<img>` in Chromium it drew in Nunito, Cyrillic included, on light and dark
  hosts, and the compiled check makes every example's SVG beside its page.
- 2026-11-22: Between milestones, ADR 0035 at the owner's asking, on the same pull request as the SVG:
  a circuit may carry its credit, in its own words and languages, which the page writes as its footer
  and the SVG along its edge, and without which it has neither. The owner chose one credit for both,
  and no check of what it says. It was built first as a required field, which made format 2 and
  ratsnest's first migration, with the examples in format 1 kept for its test; the owner then made it
  optional, since a tutorial of several drawings would credit them once, and all of that came out
  again before it landed, the format still 1. The skill holds the default alone, and the tests read
  it from the skill. Meanwhile `develop` gained ADR 0032 to ADR 0034 for supply circuits, so the
  record became 0035, and says how a supply circuit's credit fits them. When M12 itself landed, its
  engine-written footer for a supply circuit became the `circuit` skill's second default credit, and
  its example and test circuit carry it.
- 2026-11-23: Between milestones, ADR 0036 at the owner's asking, on the same pull request: having
  changed a good deal of the format, the owner wanted it to say each thing once. What every circuit
  has is one `CircuitBase`, which both shapes extend, and a Pico circuit's `scriptDoes` is its `test`,
  as a supply circuit's is. The format rose to 2, with ratsnest's first migration, which also gives
  a circuit with no credit ratsnest's, so that an update keeps the footer its pages had. The examples
  in format 1, as `develop` had them, are kept for its test, which finds each migrated to the
  example as it is now, and the compiled check migrates one through a real update. The public surface
  now records what an interface extends, since a shape that stopped sharing the base would otherwise
  lose its members unseen.
- 2026-11-23: Between milestones, ADR 0037 at the owner's asking: every circuit says what its
  breadboard is set up with, in a required `setup` after its format, `{ kind: "pico" }` or
  `{ kind: "supply", volts, rails }`, the supply's own field folded into it, since other boards will
  follow. The owner first chose `type` for the word that names the start, where parts and pins say
  `kind`, and then, shown the two side by side, `type` for all of them. Asked why the format said
  `kind`, which scratchpi's drawing had brought in and no record had chosen, the owner went back to
  `kind` for all of them: `type` is no reserved word, but in a TypeScript file it already names the
  language's types. The rename of every part and pin was stopped before it was tested, and only
  the setup's word changed. Format 2 was in no release, so it stays 2 and its migration from format 1
  writes the setup, moving a supply and its comments into it. `rnest check` reads the setup right
  after the format, and checks nothing more in a file without one. The engine's own model still has a
  supply or none.
- 2026-11-23: M12, with 0.2.0. `bun run release` computed it from the surface: format 2, and
  `Circuit`'s new shapes, break it, which before 1.0.0 raises the middle number (ADR 0017,
  ADR 0021). Its commit reaches `develop` by pull request, merged with a merge commit, and its tag is
  pushed after the merge (ADR 0030).
- 2026-11-23: New parts, by interview: capacitors, transistors and diodes, each with the circuit
  that teaches it (ADR 0038). Asked whether a new part could go anywhere, held to generic rules, the
  owner kept the wiring check's promise instead, so each part comes with one use. The order changed
  twice: the owner first set aside the capacitor's fading light for something more ambitious, the
  two-transistor flasher that tests a capacitor, from a schematic of their own, and then brought the
  fading light back as the easier start, with the flasher after both transistors. TO-92 pinouts that
  differ between models made parts a closed list of real ones (ADR 0039). The interview's own
  ADR 0041 first had the flasher's words name a capacitor by its value, which ADR 0011 forbids; it
  points at the step that places it instead. The owner then asked for the work to go on alone, in
  pull requests stacked one on the next.
- 2026-11-23: M13, the electrolytic capacitor, worked out alone (ADR 0043). The can was first drawn
  tall, as real ones are, and stood over the button and over the hole its − leg's wire needed, so it
  became short, standing over three rows. Laying the example out showed why the drawing's every
  standing part rises over the rows above it: the − leg's wire comes from the row below, and the
  button sits to the left. Three colourings were mocked up, and navy kept clear of the black wires
  and of the − rail's blue. Fritzing's drawing was not set beside it, since this session could not
  fetch Fritzing's parts. Writing the example's description with its value in it showed that the
  check on values in a circuit's words knew no unit of capacitance; it knows µF, nF and pF now, and
  мкФ, нФ and пФ.
- 2026-11-23: M14, the NPN transistor, worked out alone (ADR 0044). Laying its example out took the
  longest: a standing part hides the rows above its legs, so each of its three legs can be reached
  only from the row below, or from the row above its case. In the bottom half every arrangement
  crossed a wire or a tag, or put a value tag on GP15's chip; the top half, between the top rails,
  has a row above the case and the rails above that, and needed no wire across the channel. A short
  resistor's tag landed on the printed column number 30, which the crowding check measures only by
  its middle point, so the transistor moved a column left and its light's resistor grew a hole. The
  light runs from 3V3: VBUS's 5 V, which shows best what a transistor is for, would have changed the
  - rail's legend and the wire colours' rule, and waits for a circuit that needs it.
- 2026-11-23: M15, the PNP transistor, worked out alone (ADR 0045), on the NPN's case, words and
  example layout. The NPN's rule was written for the low side, and became one rule read by the
  model's type rather than a second copy. The PNP's emitter is held to 3V3(OUT) alone, since on VBUS
  a 3.3 V pin never turns it off. Its example's notes first wrote `3.3 V` and `5 V`, which the check
  on values refused, as it should.
- 2026-11-23: M16, the capacitor tester and flasher, worked out alone (ADR 0046, ADR 0047). Its page
  could not be fetched, so its values were worked out for two AA batteries. Its layout came quickly
  once every part stood in row f, over the channel and the empty top half, with all the wiring in
  the rows below: a left base resistor's tag had nowhere to go between its emitter's wire and the
  printed column number 10, and the left half moved two columns right. The left light's leader ran
  behind all four standing parts, and now rises over them. The test that asks for every tag on its
  own assumed a Pico on the supply's layout, as CLAUDE.md warns, and asks a supply's layout through
  the crowding check now.
