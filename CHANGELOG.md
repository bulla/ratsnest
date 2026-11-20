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
  test it, in English or French. Only the engine's own tests make one yet.
