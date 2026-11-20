# ADR 0021: Keep versions at 0.y.z until ratsnest is done, though its repository is public

**Status:** Accepted · 2026-11-20 · Amends ADR-0017

## Context

ADR 0017 kept versions at 0.y.z until the repository was public, and made 1.0.0 its first public
release, on the assumption that the repository would go public once ratsnest was done. The owner
made it public on 2026-11-20, before any code. SemVer's 0.y.z is for initial development, in which
anything may change, and that is what ratsnest is still in: nothing about it is stable yet.

## Decision

**Versions stay at 0.y.z until ratsnest is done**, which is M11 in the roadmap, whatever the
repository's visibility: a change that would be major raises y, and any other raises z, as
ADR 0017 has it. **1.0.0 is the release that says ratsnest is done.** From it on, ADR 0017's full
rule holds.

This amends ADR 0017, where the repository's going public was what ended 0.y.z. The rest of it
stands.

## Considered options

- **0.y.z until done**: chosen. A version number says how stable a thing is, and a repository
  being public says nothing about that.
- **1.0.0 now, because the repository is public**, as ADR 0017 read literally: rejected. Every
  change to the circuit format during M2 to M10 would be a major version, and 1.0.0 would promise a
  stability nothing has yet.

## Consequences

- **Releases from M9 on are public, and say by their number that anything may still change.**
- **What "done" means is M11's checklist**, so 1.0.0 comes when that milestone lands, not on a date.
