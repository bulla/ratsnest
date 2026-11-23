# Roadmap

What is left to do, and what comes next. What was built, and how it went, is in
[`HISTORY.md`](HISTORY.md); why each thing is the way it is, in [`adr/`](adr/).

**How to keep it.** Work in flight goes under **Next** as a checklist. When it lands, the checklist
moves to `HISTORY.md` under a heading of its own, a line goes into **Done** below, the Log in
`HISTORY.md` gets an entry, and whatever it leaves open is sorted into the sections here. A
judgement the owner has to make goes in **Open points**, and comes out once they sign it off. A
small piece of work suggested along the way, and not yet taken up, goes in **Suggestions** as an
unticked item, and is ticked when it is done or taken out when the owner turns it down.

## Where it stands

The design is settled, in ADR 0001 to ADR 0023, the frame is built (M1), scratchpi's drawing,
wiring check and page generator are copied in (M2), circuits are data (M3): `ratsnest check` and
`ratsnest generate` run from source, on format 1, with scratchpi's seven circuits as the examples,
every page carries Nunito, the drawing measured in it (M4), and the drawing turns by any quarter
turn, every word upright and nothing crowding at any of them (M5). `ratsnest update` moves a project
and its executable to a newer ratsnest (M10), the first release, 0.1.1, is published (M9), and the
executable makes circuits projects, the owner's first among them (M7), and the `circuit` skill
publishes their pages as Artifacts (M8). M6 waits on the owner, below. Circuits without a Pico,
powered by a supply on the rails (ADR 0032 to ADR 0034), are M12, released in 0.2.0 with format 2:
every circuit's `setup`, one `test` and a credit of its own (ADR 0035 to ADR 0037). New parts,
capacitors, transistors and diodes, each with the circuit that teaches it, are planned in the
Backlog (ADR 0038 to ADR 0041). The electrolytic capacitor is M13 (ADR 0043), the NPN and PNP
transistors M14 and M15 (ADR 0044, ADR 0045), and the owner's capacitor tester and flasher M16
(ADR 0046, ADR 0047).
ratsnest is to be a builder of wiring guides: a command-line tool that reads a circuit, written as data in a project of its own,
and makes one self-contained page showing how to build it on a breadboard with a Pico 2 W
(ADR 0004, ADR 0014). It ships as one executable per platform (ADR 0016), versioned by strict
SemVer (ADR 0017), and is open source under MIT: its repository has been public since 2026-11-20
(ADR 0018, ADR 0021).

## Next

The milestones, in order. Each needs the ones before it, and only the first is in flight. Its
checklist moves to `HISTORY.md` when it lands. M6 waits on the owner.

### M6: themes and languages

- [x] The theme as an input, dark or light, the board alike in both (ADR 0005)
- [x] The engine's sentences in English, French and Russian, in typed tables (ADR 0010)
- [x] A circuit's languages read from its name, every text checked against them, and a language it
      lacks refused before anything is drawn (ADR 0010), since M3
- [x] ADR 0011's rules: NFC, one script to a word, look-alikes folded, plural forms, values written
      by the engine, each language's typography, the page's `lang`, and the Russian test circuit
- [x] Every page's `<meta name="ratsnest">` naming its four inputs (ADR 0013), and its title the
      circuit's name alone, as ADR 0013 says
- [ ] The engine's Russian table read by the owner's friend, who reads Russian, before it ships
      (ADR 0010, ADR 0011)

### M11: done, and 1.0.0

- [ ] Every milestone before it landed, and nothing in Open points that blocks a stable release
- [ ] The README finished, for people who use ratsnest and people who work on it
- [ ] `1.0.0`, the release that says ratsnest is done, after which ADR 0017's full rule holds
      (ADR 0021)

## Open points

- **Reading the engine's Russian** (ADR 0010, ADR 0011): the owner's friend, who reads Russian, reads
  the Russian table in `src/page/words.ts`, `RUSSIAN_PAGE`, before it ships, which is M6's last item,
  and ratsnest's Russian credits (ADR 0035), which the `circuit` skill writes into new circuits, in
  `.claude/skills/circuit/SKILL.md`, and the migration to format 2 into old ones, in
  `FORMAT_2_CREDIT` in `src/migrate.ts` (ADR 0036). A test cannot check its grammar. The parts list is written as a bill of materials, and every part's
  name stands where it is written as it is, so that none is inflected.

- **The new parts' drawings** (ADR 0043 to ADR 0047): the electrolytic capacitor's, the
  transistors' and the flasher's lifted leader, mocked up and chosen while the owner had the work go on alone, so the owner signs
  each off on its pull request, the colourings and the looks turned down in their records. The
  Russian they added, their sentences, parts list lines and notes, joins the table above for its
  reader.

## Suggestions

- [ ] **Republish `bulla/rnest-circuits`' three Artifacts with 0.1.1.** They were made by a local
      0.0.0 build on 2026-11-21. Through the `circuit` skill, each page is made again and published
      to the link `ARTIFACTS.md` already has.
- [ ] **Find a published page again from a fresh cloud session**, without `ARTIFACTS.md`. M8's last
      item was signed off with no trial of it: a session in `bulla/rnest-circuits`, with the file
      moved away, asks for a page already published, and the `circuit` skill should find its
      Artifact by `<meta name="ratsnest">` (ADR 0013).
- [ ] **A release tagged from GitHub's web form.** The form makes the GitHub Release with the tag, so
      the workflow's last step, which makes it, fails. That step could fill a release that exists
      instead, which changes ADR 0020's "only then the GitHub Release" and is a record of its own.
- [ ] **A PNG or a WebP made on a Mac with a high-density screen** (ADR 0042). A browser there may
      take the picture at twice the size asked for, which `sized` in `src/page/picture.ts` brings
      back to it, as its test does to a picture made so, but no such Mac has run
      `rnest generate --format png`: the continuous integration's Mac has no screen of its own.
- [ ] **The files GitHub's community profile asks for**: a code of conduct, a security policy, and
      templates for issues and pull requests. None of them blocks a contributor.

## Backlog

- **New parts, each with the circuit that teaches it** (ADR 0038 to ADR 0041), in this order, after
  the first four, the electrolytic capacitor's fading light, the NPN and PNP transistors' switches,
  and the capacitor tester and flasher, which are M13 to M16 (ADR 0043 to ADR 0047). Each brings its
  part's drawing, its kind in the format and the field checks, one rule in the wiring check, the
  step's sentence and the parts list's line in English, French and Russian, an example and a test
  circuit, and the `circuit` skill's knowledge of it. Each part's drawing is mocked up on the board
  first, in both themes, at all four quarter turns, beside Fritzing's drawing of the same part, and
  the owner picks one; the looks turned down go in the record that settles that part. Each is an
  addition to format 2, and a minor release.
  1. **The diode: two buttons, three lights.** On a supply, each button lights a light of its own
     and a shared one, and two diodes keep one button from lighting the other's light. Drawn lying,
     as a resistor is, with its band at the cathode and its model on a tag (ADR 0040); its rule is a
     one-way part on a light's way. Left to its own record: which models, several of them.
  2. **The ceramic capacitor: the Pico times a capacitor.** On a Pico, a 100 nF capacitor charges
     through a resistor while the Pico counts how long it takes, and the script prints it. Drawn
     standing, a small disc; its rule is a resistor and a capacitor on a pair of pins. Left to its
     own record: what the disc prints, `104` as the real one does or `100 nF`.

- **Standard steps the engine knows by name**, if writing out common steps in every circuit file
  starts to hurt (ADR 0007)
- **A check that a circuit's test script drives the pins it declares** (ADR 0006)
- **Each page's font cut to the letters it uses**, which needs a subsetting library (ADR 0012)
- **Pre-release versions**, such as `1.2.0-rc.1`, when a release needs testing by others first
  (ADR 0017)
- **An npm package**, beside the executables, if people ask for one (ADR 0016)
- **The `circuit` skill as a Claude Code plugin**, if one can be versioned with the builder
  (ADR 0014)
- **A Russian Four buttons and RGB LED**: the two examples place their pull-downs alike, and in
  Russian the ones from i18 and j21 have no room for their value tags, because `4,7 кОм` is wider
  than `4.7 kΩ`. Translated, each example would be refused until those two pull-downs move. The
  engine's test circuit in three languages is refused for the same reason, on purpose (ADR 0011).

## Later

- **ratsnest's own site**: its examples and its documentation, on GitHub Pages once the repository is
  public, built by GitHub Actions. Which variants it serves and whether it has an index that links
  them, which ADR 0004 would have to allow, is a record of its own.
- **More parts, each when a circuit needs it** (ADR 0038): potentiometers, SPDT switches, slide and
  DIP switches, relays, light-dependent resistors, MOSFETs, Zener and Schottky diodes, and film
  capacitors
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

| Milestone | What it gave the project                                                                | Records                                 |
| --------- | --------------------------------------------------------------------------------------- | --------------------------------------- |
| M0        | The design, by interview: what ratsnest is, how it is built, shipped and kept           | 0001–0020                               |
| M1        | The frame: the package, the checks, CI on three systems, the changelog, the onboarding  | 0009, 0017, 0018, 0020, 0021            |
| M2        | The copy: scratchpi's drawing, wiring check and page, with none of its app              | 0001, 0004, 0007, 0018                  |
| M3        | Circuits as data: format 1, read and never run, `check` and `generate`, the examples    | 0006, 0007, 0010, 0014–0016, 0022, 0023 |
| M4        | The font: Nunito carried by every page, every drawn word measured in it                 | 0011, 0012                              |
| M5        | Four orientations: the drawing turned, every word upright, nothing crowding at any      | 0003, 0007, 0024                        |
| M10       | Updating: `ratsnest update`, the executable put in place, the circuits migrated         | 0015, 0016                              |
| M9        | Releases: the version computed, the first release, 0.1.1, published on GitHub           | 0017, 0020, 0021, 0030                  |
| M7        | The executable and circuits projects: five executables, `init`, `install.sh`, a project | 0014, 0016, 0018, 0019, 0025            |
| M8        | Publishing: a project's pages as Artifacts, kept in `ARTIFACTS.md` and found again      | 0013, 0014, 0019                        |
| M12       | Circuits without a Pico: a supply on the rails, its wiring check, format 2, and 0.2.0   | 0032–0037                               |
| M13       | The electrolytic capacitor: a light that fades out, the first new part with its circuit | 0038–0041, 0043                         |
| M14       | The NPN transistor: a pin switches a light through a 2N3904                             | 0044                                    |
| M15       | The PNP transistor: a pin switches a light on the high side, through a 2N3906           | 0045                                    |
| M16       | The capacitor tester and flasher: two transistors crosswise, on two AA batteries        | 0046, 0047                              |
