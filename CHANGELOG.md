# Changelog

Every release of ratsnest, newest first, in the form of
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) as ADR 0017 and ADR 0021 apply it: each is
computed from what changed, and only `bun run release` moves _Unreleased_ under one.

A pull request that changes what users get adds its line under _Unreleased_, in the section it
belongs to: Added, Changed, Deprecated, Removed, Fixed or Security.

## [Unreleased]

### Added

- The wiring page, copied from scratchpi's circuit pages: a Pico 2 W on a half-size breadboard,
  drawn from its datasheet, with the steps that build a circuit, the parts it needs and a script to
  test it, in English or French.
- The circuit format, format 1: one TypeScript file per circuit that only declares, every text
  keyed by language, read as data and never run.
- `ratsnest check`, which holds every circuit in `circuits/`, or the files and folders named, to
  the declarative check, its format, its fields, its languages and its wiring, and says each problem
  on its line.
- `ratsnest generate <file>`, which checks a circuit and writes its page into `pages/`, named by its
  orientation, theme and language. So far it draws in the dark theme only.
- `ratsnest generate --orientation 90`, `180` and `270` draw the board turned, its USB at the top,
  on the right or at the bottom, every word on it upright and its labels past its far end. A standing
  board stands in a column beside the steps on a wide screen.
- Every page is set in Nunito and carries it, so it looks the same on every device, and every word
  the drawing writes is measured in it. `ratsnest check` refuses a circuit whose words hold a
  character Nunito lacks, such as `→`.
