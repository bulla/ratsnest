# ADR 0017: Number every release by strict SemVer, computed from what changed, and refused otherwise

**Status:** Accepted · 2026-11-20 · Amended by ADR-0021 (0.y.z until ratsnest is done, not until its repository is public)

## Context

`ratsnest update` and every project's `ratsnest.json` (ADR 0016) trust a version to say whether a
project will keep working. The owner wants strict semantic versioning enforced, so that publishing a
release is safe. SemVer 2.0.0 numbers a version `MAJOR.MINOR.PATCH` by what it does to a public
interface, and leaves 0.y.z to initial development, in which anything may change.

## Decision

**ratsnest's public surface is four things**: the circuit format, its number and the `Circuit` type
that describes it (ADR 0015); the commands, with their options; and `ratsnest.json`. At every release
it is written to `api/` as a snapshot, and the next release is compared with it.

**The version is computed, not chosen.** Against the last release's snapshot, the next one is:

- **major** when the format number rose, or a command, an option or a field of `ratsnest.json` was
  removed or changed;
- **minor** when the surface only gained something, such as a command, an option, a kind of part or a
  language;
- **patch** otherwise.

The owner may ask for a higher bump than the computed one, never a lower one, and the version is
always the one right after the last of its kind: no number is skipped.

**Until the repository is public, versions are 0.y.z**: a change that would be major raises y, and
any other raises z. **1.0.0 is the first public release**, and the rule above holds from it on.

**The version lives in one place**, the `version` of ratsnest's `package.json`, in SemVer 2.0.0's own
form, which a test checks against the regular expression semver.org gives. The executable reports
it, its tag is `v` followed by it, and `CHANGELOG.md`, in the form of Keep a Changelog, heads its
section with it. `Bun.semver` compares versions, so no package is added for it.

**`bun run release` is the only way to make one.** It computes the version, moves the changelog's
_Unreleased_ section under it with the date, sets the version, writes the snapshot, commits and
tags. It refuses with uncommitted changes, anywhere but on `develop`, or with nothing under
_Unreleased_.

**Continuous integration refuses a tag that breaks the rule.** For a pushed tag, it checks that the
tag is the version, recomputes the least bump against the previous release's snapshot, and only then
builds the executables and publishes them (ADR 0016). A tag pushed by hand meets the same check.

## Considered options

- **A version computed from the surface, and refused otherwise**: chosen. The rule cannot be broken in
  a hurry, because nobody has to remember it.
- **A version chosen by hand, with a checklist**: rejected. The rule would break in the first hurried
  release, and nothing would say so.
- **A version decided by commit messages**, as conventional commits and semantic-release do:
  rejected. ratsnest's commit messages are plain imperative sentences, and a message can say
  anything; a snapshot of the surface is a fact.
- **A file per change, as changesets does**: rejected. It is a process for many contributors, where
  ratsnest has one owner and a changelog.

## Consequences

- **The surface has to be data**, so that a snapshot can be written and compared: the commands and
  their options in one table in `src/`, the `Circuit` type in one file, `ratsnest.json` described by
  one schema.
- **A version promises that projects keep working, not that pages look the same.** A change to how
  pages are drawn leaves the surface as it was, and is a patch unless the owner asks for more.
- **Every pull request that changes what users get adds its line under _Unreleased_**, or the next
  release has nothing to say about it.
- **`api/` is one more thing in the repository**, and only `bun run release` writes it.
- **No pre-release versions yet**, such as `1.2.0-rc.1`. SemVer allows them; ratsnest adds them when a
  release needs testing by others first, with a record.
