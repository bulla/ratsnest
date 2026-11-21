# Roadmap

What is left to do, and what comes next. What was built, and how it went, is in
[`HISTORY.md`](HISTORY.md); why each thing is the way it is, in [`adr/`](adr/).

**How to keep it.** Work in flight goes under **Next** as a checklist. When it lands, the checklist
moves to `HISTORY.md` under a heading of its own, a line goes into **Done** below, the Log in
`HISTORY.md` gets an entry, and whatever it leaves open is sorted into the sections here. A
judgement the owner has to make goes in **Open points**, and comes out once they sign it off.

## Where it stands

The design is settled, in ADR 0001 to ADR 0021, the frame is built (M1), and scratchpi's drawing,
wiring check and page generator are copied in (M2): the engine makes a page from a circuit a test
hands it, and nothing else can yet. ratsnest is to be a builder of wiring guides: a command-line tool that reads a circuit, written as data in a project of its own,
and makes one self-contained page showing how to build it on a breadboard with a Pico 2 W
(ADR 0004, ADR 0014). It ships as one executable per platform (ADR 0016), versioned by strict
SemVer (ADR 0017), and is open source under MIT: its repository has been public since 2026-11-20
(ADR 0018, ADR 0021).

## Next

The milestones, in order. Each needs the ones before it, and only the first is in flight. Its
checklist moves to `HISTORY.md` when it lands. M3 is next.

### M3: circuits as data

- [ ] The `Circuit` type, format 1: what a circuit is, where its parts go and its test script, every
      text keyed by language (ADR 0006, ADR 0010, ADR 0015)
- [ ] A circuit file read as data, parsed and never run, with its fields checked and its format
      refused when it is not the current one (ADR 0007, ADR 0015, ADR 0016)
- [ ] The declarative check, and the check that nothing in `src/` names a circuit (ADR 0007)
- [ ] scratchpi's seven circuits ported to `examples/` as declarative files, each passing the wiring
      check (ADR 0014)
- [ ] `bun run ratsnest check` and `bun run ratsnest generate`, from source (ADR 0014)

### M4: the font

- [ ] `fonts/`: Nunito's Latin and Cyrillic files from Google's subsetter, the address that made each,
      and the font's licence (ADR 0012)
- [ ] Every drawn word measured with `fontkit`, replacing the count of characters (ADR 0011, ADR 0012)
- [ ] The test that fails on a character a page writes and the files lack, and the narrow no-break
      space written as Nunito's thin space (ADR 0012)

### M5: four orientations

- [ ] The drawing turned by 0°, 90°, 180° or 270°, never mirrored, every word upright (ADR 0003)
- [ ] The page arranged around a vertical drawing
- [ ] The overlap checks run at all four orientations (ADR 0003, ADR 0007)

### M6: themes and languages

- [ ] The theme as an input, dark or light, the board alike in both (ADR 0005)
- [ ] The engine's sentences in English, French and Russian, in typed tables (ADR 0010)
- [ ] A circuit's languages read from its name, every text checked against them, and a language it
      lacks refused before anything is drawn (ADR 0010)
- [ ] ADR 0011's rules: NFC, one script to a word, look-alikes folded, plural forms, values written
      by the engine, each language's typography, the page's `lang`, and the Russian test circuit
- [ ] Every page's `<meta name="ratsnest">` naming its four inputs (ADR 0013)
- [ ] The engine's Russian table read by the owner's friend, who reads Russian, before it ships
      (ADR 0010, ADR 0011)

### M7: the executable, and circuits projects

- [ ] `bun run build`: the five executables with `--conditions=browser`, and `NOTICES` (ADR 0016,
      ADR 0018)
- [ ] The pull request workflow checking the examples with the compiled Linux executable (ADR 0020)
- [ ] `ratsnest init`: `ratsnest.json`, the `Circuit` type in `.ratsnest/`, `tsconfig.json`,
      `circuits/`, the `circuit` skill, and a tracked `ARTIFACTS.md` (ADR 0014, ADR 0016, ADR 0019)
- [ ] An executable older or newer than its project's `ratsnest.json` saying so (ADR 0016)
- [ ] `install.sh` (ADR 0016)
- [ ] The owner's first circuits project, made by `init` from a local build
- [ ] The README's _Get started_, for people using ratsnest: install it, `ratsnest init`, `/circuit`

### M8: publishing

- [ ] The `circuit` skill's publishing steps, end to end, from a circuits project: `ARTIFACTS.md`, the
      search by `<meta name="ratsnest">`, and the Artifact tool (ADR 0013, ADR 0019)
- [ ] A page published, then found again from a fresh cloud session without `ARTIFACTS.md`

### M9: releases

- [ ] The public surface as data, and its snapshot in `api/` (ADR 0017)
- [ ] `bun run release`: the version computed, the changelog moved, the snapshot written, the
      commit and the tag (ADR 0017)
- [ ] The workflow for every `v*` tag: the rule checked, five executables built, each run on its own
      system, and only then the GitHub Release (ADR 0020)
- [ ] The first release, `0.1.0`, which says by its number that anything may still change (ADR 0021)

### M10: updating

- [ ] `ratsnest update`: the newer executable fetched and put in place, renamed first on Windows,
      then the migrations, the skill and the type replaced, and the checks (ADR 0015, ADR 0016)
- [ ] The migrations' runner and their test harness, proven on a migration made for the purpose
      (ADR 0015)
- [ ] A printer for writing a circuit file back with its comments (ADR 0015)

### M11: done, and 1.0.0

- [ ] Every milestone before it landed, and nothing in Open points that blocks a stable release
- [ ] The README finished, for people who use ratsnest and people who work on it
- [ ] `1.0.0`, the release that says ratsnest is done, after which ADR 0017's full rule holds
      (ADR 0021)

## Open points

- **Protecting `develop`** (ADR 0020), which only the owner can do, in the repository's settings:
  1. _Settings_, then _Rules_, then _Rulesets_, then _New ruleset_, then _New branch ruleset_.
  2. Name it `develop`, set _Enforcement status_ to _Active_, and under _Target branches_ add the
     default branch.
  3. Tick _Restrict deletions_, _Block force pushes_, and _Require a pull request before merging_
     with **0** required approvals: GitHub never lets an account approve its own pull request, so
     one required approval would leave the owner unable to merge.
  4. Tick _Require status checks to pass_, and add the check `ci` from GitHub Actions, the job that
     passes only when every other has. It is listed since M1's pull request ran it.
  5. _Create_.
- **The `no changelog` label** (ADR 0020): made once, under _Issues_, then _Labels_, then _New label_,
  before a pull request can wear it.

## Backlog

- **Standard steps the engine knows by name**, if writing out common steps in every circuit file
  starts to hurt (ADR 0007)
- **A check that a circuit's test script drives the pins it declares** (ADR 0006)
- **Each page's font cut to the letters it uses**, which needs a subsetting library (ADR 0012)
- **The drawing alone, as an SVG file**, beside the page (ADR 0004)
- **Pre-release versions**, such as `1.2.0-rc.1`, when a release needs testing by others first
  (ADR 0017)
- **An npm package**, beside the executables, if people ask for one (ADR 0016)
- **The `circuit` skill as a Claude Code plugin**, if one can be versioned with the builder
  (ADR 0014)
- **Where a part can be bought, said by its circuit**: the parts list's lines for an RGB LED and a
  ring still name The Pi Hut's Let it Glow calendar, as scratchpi's did, which is the engine
  recommending a shop

## Later

- **ratsnest's own site**: its examples and its documentation, on GitHub Pages once the repository is
  public, built by GitHub Actions. Which variants it serves and whether it has an index that links
  them, which ADR 0004 would have to allow, is a record of its own.
- **A full-size breadboard**, probably drawn standing up, and **other boards**: the rest of the Pico
  family first (ADR 0002, ADR 0003)
- **Solid 2**, when something on a page has to change after it is made, such as a page that picks the
  four inputs and shows the result (ADR 0008)
- **More languages**, each a table of the engine's sentences and its typography's rules (ADR 0010,
  ADR 0011)
- **Signing and notarizing the macOS executables**, deferred by the owner (ADR 0016). Until then the
  macOS executables are for `install.sh`: a file downloaded in a browser is quarantined, and
  Gatekeeper refuses an unsigned one, where one fetched by `curl` is not. If the release workflow
  finds they do not run at all, releases stop until this is decided.

## Done

One line per milestone. Its checklist and the paragraph that summed it up are in
[`HISTORY.md`](HISTORY.md), under the same name. Work that landed between milestones is only in that
file's Log.

| Milestone | What it gave the project                                                               | Records                      |
| --------- | -------------------------------------------------------------------------------------- | ---------------------------- |
| M0        | The design, by interview: what ratsnest is, how it is built, shipped and kept          | 0001–0020                    |
| M1        | The frame: the package, the checks, CI on three systems, the changelog, the onboarding | 0009, 0017, 0018, 0020, 0021 |
| M2        | The copy: scratchpi's drawing, wiring check and page, with none of its app             | 0001, 0004, 0007, 0018       |
