# ADR 0020: Check every change and every release with GitHub Actions, on Bun alone

**Status:** Accepted · 2026-11-20

## Context

Several records already lean on continuous integration. ADR 0016 has it check the examples with the
compiled executable, because a dependency that reads a file beside itself works from source and
fails once compiled, and leaves open whether an unsigned macOS executable runs on Apple silicon.
ADR 0017 has it refuse a tag that breaks the version rule before anything is built or published.
The repository is on GitHub, private until ratsnest is done (ADR 0018).

## Decision

**GitHub Actions, with two workflows, and Bun as the only runtime in either** (ADR 0009): Bun is
installed at the version `package.json` names, and no Node is set up.

**On every pull request into `develop`, and every push to it:**

- `bun install`, then `bun run lint`, `bun run typecheck` and `bun run test`;
- the Linux executable built with `bun run build`, and `ratsnest check` run with it on the examples;
- a refusal when a pull request changes what users get, `src/` outside its tests, `fonts/`, the
  `circuit` skill or `install.sh`, with no line under _Unreleased_ in `CHANGELOG.md`. A pull request
  labelled `no changelog` is let through, for a change no user can see.

**On a pushed tag `v*`:**

1. the tag checked against the version rule (ADR 0017), before anything else;
2. the five executables and `NOTICES` built (ADR 0016, ADR 0018);
3. each executable run on its own system, Linux, Windows, and macOS on Apple silicon, checking the
   examples;
4. only then, a GitHub Release with the executables, `NOTICES` and the version's section of
   `CHANGELOG.md`.

**`develop` is protected in GitHub's settings**, so that nothing merges until the first workflow
passes. A file cannot set that; the owner sets it once, and the roadmap says how.

## Considered options

- **GitHub Actions, one workflow for changes and one for releases**: chosen. The repository is
  already on GitHub, and a release is built where its tag is.
- **One workflow doing both**: rejected. A pull request would carry the release's conditions in
  every run, and a mistake in one would block the other.
- **Every system on every pull request**: rejected while the repository is private. A macOS runner
  counts ten times against the free minutes. Once it is public they are free, and the first workflow
  can run on all three.
- **Releases built on the owner's machine**: rejected. What is published would depend on that
  machine, and no check would stand between a tag and a release.

## Consequences

- **What is checked before a merge is what a user runs**: the same Bun, and the compiled executable,
  not only the source.
- **No release goes out with an executable that has not run on its own system**, which answers
  ADR 0016's question about macOS once per release, and fails loudly if the answer changes.
- **Publishing a release needs a token with permission to write releases**, which GitHub gives a
  workflow of the repository's own; nothing else is stored.
- **Branch protection lives outside the repository**, so it can be switched off without a trace in
  the history.
