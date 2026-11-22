# Changelog

Every release of ratsnest, newest first, in the form of
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) as ADR 0017 and ADR 0021 apply it: each is
computed from what changed, and only `bun run release` moves _Unreleased_ under one.

A pull request that changes what users get adds its line under _Unreleased_, in the section it
belongs to: Added, Changed, Deprecated, Removed, Fixed or Security.

## [Unreleased]

### Fixed

- `ratsnest update` on Windows no longer fails once it has put the new executable in place: the new
  one tried to remove the old one, renamed out of the way, while the old one still ran, and now
  leaves it for the next update.

## [0.1.0] - 2026-11-22

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
