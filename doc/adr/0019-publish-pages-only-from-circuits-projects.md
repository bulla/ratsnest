# ADR 0019: Publish pages only from circuits projects

**Status:** Accepted · 2026-11-20 · Amends ADR-0014

## Context

ADR 0014 put `ARTIFACTS.md` at the root of a circuits project, committed or not as its owner
chooses, and kept one more in ratsnest's own repository, gitignored, for Artifacts published from
ratsnest's examples. That second file is the only reason ratsnest's repository needs a rule about it.
The repository is to be public (ADR 0018), and a file there would hold one person's private links,
and two contributors publishing the same example would overwrite each other's rows.

## Decision

**A page becomes an Artifact only from a circuits project.** There, `ARTIFACTS.md` sits at the
project's root, and `ratsnest init` leaves it tracked, because committing it is what carries the
links from one cloud session to the next. Its owner may still ignore it.

**ratsnest's own repository publishes nothing**, and keeps no `ARTIFACTS.md`. Its examples are for
its tests, its documentation and, later, its static site. A showcase of them as Artifacts is a
circuits project like any other, with the examples copied into it.

This amends ADR 0014, where ratsnest kept its own gitignored `ARTIFACTS.md` for its examples. The
rest of it stands.

## Considered options

- **Publish only from circuits projects**: chosen. The publishing rule is the same everywhere it
  applies, and ratsnest's repository needs no exception for it.
- **ratsnest's own file, gitignored**, as ADR 0014 had it: rejected. A special case in the skill, the
  `.gitignore` and `CLAUDE.md`, for one person's convenience.
- **ratsnest's own file, committed**: rejected. One person's private links in a public repository,
  useless to everyone else and fought over by every contributor.

## Consequences

- **Publishing an example page takes a circuits project first**, which `ratsnest init` makes in one
  command.
- **The `circuit` skill refuses to publish in ratsnest itself**, and says where to publish instead.
- **A project made by `init` commits its links by default**, and a project whose owner does not want
  them in its history has to ignore the file itself.
