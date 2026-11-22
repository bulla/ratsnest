# ADR 0030: Bring a release to `develop` by pull request, and push its tag after the merge

**Status:** Accepted · 2026-11-22 · Amends ADR-0017

## Context

`bun run release` computes the version, moves the changelog, sets the version, writes the snapshot,
commits and tags, on `develop` and nowhere else (ADR 0017). It then says to push both, `develop` and
the tag. But `develop` is protected (ADR 0020): it takes changes only by pull request, with the `ci`
check passed, so the push it asks for is refused. The roadmap left the way between the two records
open, for the first release, `0.1.0`, to settle.

A tag names one commit. Pushed, it starts the release workflow, which checks the tag against the
version rule, builds the executables, runs them on three systems and makes the GitHub Release.

## Decision

**`bun run release` stays as it is, run on a local `develop` up to date with the remote one**: it
commits and tags there, and refuses anywhere else. **Its commit reaches the remote `develop` by pull
request**, from a branch of its own, `release/<version>`, holding the release commit on top of
`develop`. The pull request is merged with a merge commit, never squashed or rebased, so the commit
the tag names is the one `develop` holds.

**The tag is pushed only after the merge**, `git push origin v<version>`, and the release workflow
does the rest. The release script's last line says these steps.

This amends ADR 0017, whose release still commits and tags on `develop`, but no longer pushes it.

## Considered options

- **A pull request for the release commit, and the tag after the merge**: chosen. The release commit
  meets the same checks as any other change before it is on `develop`, and nothing is published
  until it is there.
- **The owner on the ruleset's bypass list, pushing `develop` and the tag**: rejected. The bypass
  covers every push, not only releases, so the protection would hold for everyone but the account
  that pushes most. A session working for the owner cannot use it either.
- **The tag pushed with the pull request, before the merge**: rejected. The release would be built and
  published from a commit `develop` may never hold, if the pull request fails or changes.
- **A squash or rebase merge**: rejected. Either makes a new commit, so the tag would name a commit
  that `develop` does not hold, and the next release's check would look for its previous tag in a
  history that lacks it.
- **The release made on any branch**: not chosen. The script's refusal anywhere but on `develop` is
  what keeps a release to what has been merged; a branch of its own is made only to carry it.

## Consequences

- **A release takes a pull request and a wait for its checks** before its tag can be pushed, where
  ADR 0017 had one push.
- **The local `develop` is ahead of the remote one until the merge**, by the release commit, and must
  be brought back to the remote `develop` after it. Something merged in the meantime is not in the
  release, which is right: the tag names what was released.
- **A release whose pull request fails is made again**: the local tag deleted, `develop` reset, the
  fix merged first, and `bun run release` run again. The version is the same, since nothing was
  published.
- **The merge commit is not the tagged commit.** The release is the release commit, and the merge
  that brings it in comes after it.
