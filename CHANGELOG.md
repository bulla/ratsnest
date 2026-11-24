# Changelog

Every release of ratsnest, newest first, in the form of
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) as ADR 0017 and ADR 0021 apply it: each is
computed from what changed, and only `bun run release` moves _Unreleased_ under one.

A pull request that changes what users get adds its line under _Unreleased_, in the section it
belongs to: Added, Changed, Deprecated, Removed, Fixed or Security.

## [Unreleased]

### Added

- `rnest generate --format png` and `--format webp` write a circuit's drawing as a picture, for
  places that take no SVG, into `pages/<circuit>.<orientation>.<theme>.<language>.png` or `.webp`:
  the SVG of `--format svg`, its credit and background with it, drawn at 12 px to the millimetre,
  twice the SVG's size, and a WebP lossless. A browser draws it: macOS's own, and on Linux and
  Windows a Chrome, Chromium, Edge or Brave, which must be installed, or named by `BUN_CHROME_PATH`.
  A picture the browser does not finish a step of in 15 seconds is begun again, on a fresh page,
  three times in all. With no browser, or one stuck all three times, `generate` says so and makes
  nothing. The `circuit` skill makes one when asked, and never publishes it.
- An electrolytic capacitor, `{ kind: "electrolytic", microfarads, plus, minus }`, in a circuit with a
  supply: it keeps a light lit once its button is let go, and the light fades out. `rnest check`
  holds it the right way round, its − leg on −, its + leg between a button and a light's resistor,
  and slow enough to see the fade, its microfarads times that resistor's ohms 0.2 s at least. The
  page draws it standing, a navy can with its value printed on it and a stripe down its − side,
  says where its legs go, lists it rated 16 V or more, and notes that it goes in one way round.
  On a Pico it is refused, with no use there yet.
- A transistor, `{ kind: "transistor", model: "2N3904", emitter, base, collector }`, in a circuit on
  a Pico: a pin switches a light through it. `rnest check` holds its legs in its model's order, left
  to right, its flat face towards row j; its emitter on ground; its base on the light's pin through
  one resistor of 1 kΩ to 10 kΩ; and the light between 3V3(OUT) and its collector through one
  resistor of 220 Ω to 1 kΩ. The page draws it as a black TO-92 case with `NPN` and `2N3904` printed
  on its flat face and its legs' letters above them, lists it, and notes its legs' order and that
  another model, such as a BC547, may differ. On a supply it is refused, with no use there yet.
- `rnest check` refuses a capacitance, such as `470 µF`, written in a circuit's own words, as it
  refuses a resistance: the engine writes every value.

## [0.2.0] - 2026-11-23

### Added

- `rnest generate --format svg` writes a circuit's drawing alone, as an SVG file to embed in other
  pages with `<img>` or a Markdown image, from the same four inputs as its page, into
  `pages/<circuit>.<orientation>.<theme>.<language>.svg`. It carries Nunito, its colours and its
  styles, paints its own background in its theme, writes its circuit's credit, if it has one, along
  its bottom edge, and is 6 px to the millimetre. `--format html`, the default, makes the page as before. The
  `circuit` skill makes one when asked, and never publishes it.
- A circuit can do without a Pico, powered by a supply on the top or the bottom rails:
  `setup: { kind: "supply", volts, rails }`, at 3 or 4.5 V from AA batteries, 3.7 V from a protected
  Li-Po cell or 5 V from a USB charger. It holds plain LEDs and buttons, which name no pin, and a `test` in place
  of the script. Its page draws the supply as a small cell beside the board, its leads in column 1,
  ends by connecting it, lists what gives its voltage, and has no Thonny section.
- `rnest check` holds a circuit with a supply to its + and − rails: every LED through one resistor
  of 220 Ω to 1 kΩ, every button on an LED's way, no short with every button held, and no LED that
  needs about 3 V on the 3 V supply.
- The `circuit` skill asks whether a new circuit is on a Pico or powered by a supply, and which
  voltage and rails.

### Changed

- A circuit file may have a `credit`, a text in each of its languages, after its description,
  saying where the drawing and the font come from and under which licences. A page writes it as its
  footer, in place of the engine's own credit, as plain text, and the drawing alone along its bottom
  edge; without one, a page has no footer and a drawing no credit line. It is the circuit's to
  reword, translate or take out, and nothing checks what it says. The `circuit` skill writes
  ratsnest's credit, in English, French or Russian, into every circuit it makes, on a Pico or with a
  supply.
- A circuit file is written in format 2. What every circuit has is one `CircuitBase`: its format,
  setup, name, description, credit, steps and `test`, what the reader does in the last step and what
  a working circuit then does. A circuit on a Pico calls that `test` too, where it said `scriptDoes`,
  and keeps its `script`. The `Circuit` type is `PicoCircuit | SupplyCircuit`, both extending it,
  still ending `satisfies Circuit`.
- Every circuit says what its breadboard is set up with, in a required `setup` after its format:
  `{ kind: "pico" }` for a Pico 2 W across the middle, or `{ kind: "supply", volts, rails }`.
  `rnest check` refuses a circuit without one, or with a `kind` it does not know, before it checks
  anything else in it.
- `rnest update` moves a format 1 circuit on to format 2: it writes its `setup`, renames `scriptDoes`
  to `test`, with its comments, and gives a circuit with no `credit` ratsnest's, for its kind and in
  each of its languages, so that its pages keep their footer. It puts the new type in `.ratsnest/`.

### Removed

- The parts list no longer suggests where to buy an RGB LED or a ring of them, in any language.

## [0.1.1] - 2026-11-22

### Added

- `rnest`, a shorter name for `ratsnest`: `install.sh` puts it beside the executable, as a link to
  it, so `rnest check` is `ratsnest check`, and `rnest update` updates the one executable both run.
  The install leaves a file already called `rnest` alone. The README and the `circuit` skill use
  `rnest` in their examples.
- `ratsnest update`, which moves a circuits project to a newer ratsnest, the latest release by
  default or the one `--version` names: it puts that version's executable in place of the running
  one, run first to be sure it is that version and runs on the system, then migrates every circuit to
  its format, replaces the `Circuit` type and the `circuit` skill, sets `ratsnest.json` and checks
  every circuit. `--from` takes an executable already fetched. A project is never moved back.
- A circuit file can be taken from one format to the next with its comments kept, written back in one
  style, which `ratsnest update` will run when the format first changes.
- Every release's version is computed from what changed on ratsnest's public surface since the last
  release, the circuit format, the commands and `ratsnest.json`, and checked again when it is tagged,
  before its executables are built and released on GitHub.
- ratsnest as one executable per platform, Linux, macOS and Windows, with a `NOTICES` file for what
  it carries, and `install.sh` to put it on the `PATH`.
- `ratsnest init`, which makes a circuits project: `ratsnest.json`, the `Circuit` type for editors in
  `.ratsnest/`, a `tsconfig.json`, `circuits/`, the `circuit` skill and `ARTIFACTS.md`. `check` and
  `generate` refuse a project that expects another version of ratsnest.
- The wiring page, copied from scratchpi's circuit pages: a Pico 2 W on a half-size breadboard,
  drawn from its datasheet, with the steps that build a circuit, the parts it needs and a script to
  test it, in English or French.
- The circuit format, format 1: one TypeScript file per circuit that only declares, every text
  keyed by language, read as data and never run.
- `ratsnest check`, which holds every circuit in `circuits/`, or the files and folders named, to
  the declarative check, its format, its fields, its languages and its wiring, and says each problem
  on its line.
- `ratsnest generate <file>`, which checks a circuit and writes its page into `pages/`, named by its
  orientation, theme and language.
- `ratsnest generate --orientation 90`, `180` and `270` draw the board turned, its USB at the top,
  on the right or at the bottom, every word on it upright and its labels past its far end. A standing
  board stands in a column beside the steps on a wide screen.
- `ratsnest generate --theme light` draws the page light around a board that looks the same in
  both themes. Every page names its four inputs in a `<meta name="ratsnest">` tag, and its title is
  the circuit's name alone.
- Pages in Russian, as `--language ru`, for a circuit written in it, every count in every language
  through its own plural rules, and every value written in the page's language, on the drawing too.
- `ratsnest check` holds every language to its rules: Unicode's NFC, one script to a word, no hole
  named with Cyrillic look-alikes, no value written out in a circuit's own words, and each
  language's typography.
- `ratsnest check` refuses a circuit whose value tags or pin names crowd each other, or have nowhere
  clear, at any of the four orientations. On a standing board a value may go onto two lines.
- Four buttons, RGB LED and Two buttons each have a pull-down that runs straight to the − rail, which
  leaves room for every value at every orientation.
- Every page is set in Nunito and carries it, so it looks the same on every device, and every word
  the drawing writes is measured in it. `ratsnest check` refuses a circuit whose words hold a
  character Nunito lacks, such as `→`.
- Three or more buttons in a line on the channel each have a leader of their own to their label,
  on alternating sides of the channel, so no two share a line. A part on the second board's near
  half, such as the RGB LED by the USB, has its label past that end of the board, not the far one.
- A button can sit on the second breadboard: `board: 2` on its part puts its legs there, and its
  step says so once. Left out, it is on the first board, as before.

### Fixed

- `ratsnest update` on Windows no longer fails once it has put the new executable in place: the new
  one tried to remove the old one, renamed out of the way, while the old one still ran, and now
  leaves it for the next update.

## [0.1.0] - 2026-11-22 [YANKED]

Tagged, but never published: its Windows executable failed the release's checks. Everything it
held is in 0.1.1, the first release published.
