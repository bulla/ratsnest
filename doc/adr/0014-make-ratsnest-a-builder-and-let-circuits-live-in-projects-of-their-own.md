# ADR 0014: Make ratsnest a builder, and let circuits live in projects of their own

**Status:** Accepted · 2026-11-20 · Amends ADR-0006, ADR-0007 and ADR-0013 · Amended by ADR-0016 (a project's ratsnest is the executable and `ratsnest.json`, its type in `.ratsnest/`)

## Context

ADR 0006 put every circuit in ratsnest's own `circuits/`, so anyone wanting circuits of their own
would fork ratsnest and carry its engine with them. The owner wants the builder checked out on its
own, and circuits, with the Artifacts made from them, kept wherever their owner likes: in a
repository of their own, in a fork, or anywhere else. ADR 0007 already keeps the engine from naming a
circuit, so nothing in the engine depends on where circuits are kept. The owner will open-source
ratsnest once it is done.

## Decision

**ratsnest is a builder**: the engine, a command-line tool, the `Circuit` type and the `circuit`
skill. It holds nobody's circuits but its own examples.

**A circuits project is any folder with ratsnest installed in it**, pinned exactly (ADR 0009), so
that a circuit file's `import type { Circuit } from "ratsnest"` resolves and the tool runs. Its owner
keeps it however they like.

**The command-line tool is how a project uses the builder**, in the manner of Angular's:

- `ratsnest init` makes a circuits project: a `package.json` with ratsnest pinned, a
  `tsconfig.json`, a `circuits/` folder, and the `circuit` skill in `.claude/skills/`, so that Claude
  works there as it does in ratsnest;
- `ratsnest check` runs the declarative check, the validator and the language checks over the
  project's circuits;
- `ratsnest generate <file>` makes a page from a circuit and the other three inputs (ADR 0005);
- `ratsnest update` moves the project to a newer ratsnest (ADR 0015).

**The skill has one copy, ratsnest's.** It ships with the builder, `init` puts it in a project and
`update` replaces it there, so a project's copy is never edited by hand: a project that wants
something else adds a skill of its own beside it. It names ratsnest's records by number and by
link, because a circuits project has no `doc/adr/`.

**ratsnest keeps scratchpi's ported circuits as its examples, in `examples/`**: the engine's first
real users, the circuits its own tests check, and the old files its migrations are tested on
(ADR 0015).

**`ARTIFACTS.md` sits at the root of a circuits project** (ADR 0013), and whether it is committed is
the project owner's choice. Committing it carries the links from one cloud session to the next, and
the pages' tags still rebuild it for a project that does not. ratsnest's own, for its examples, stays
gitignored, because ratsnest's repository is shared.

This amends ADR 0006, where a circuit file now lives in a circuits project rather than in ratsnest's
`circuits/`; ADR 0007, where the circuits checked are now a project's, through `ratsnest check`, and
ratsnest's own are its examples; and ADR 0013, where the links file now sits at the project's root,
committed or not as its owner chooses. Everything else in them stands.

## Considered options

- **A builder, and circuits in projects of their own**: chosen. The builder is checked out,
  installed and upgraded on its own, and circuits go wherever their owner keeps things.
- **Circuits in ratsnest's repository, and everyone in a fork**: rejected. Every fork carries the
  engine, and every upgrade is a merge of the engine's history into theirs.
- **A library only, with no command-line tool**: rejected. Every project would write its own scripts
  to check and generate, and they would drift apart, when the skill needs one fixed way in.
- **A Claude Code plugin carrying the skill, instead of a copy in each project**: not now. A plugin is
  versioned apart from the builder, so a project's skill could describe a ratsnest the project does
  not have.

## Consequences

- **ratsnest becomes something others install.** It needs versions, a changelog and a way to be
  installed, which is a record of its own.
- **A circuit file imports its type from the `ratsnest` package**, so it typechecks only in a project
  where ratsnest is installed.
- **The skill lives in ratsnest and in every circuits project**, as the same text, and `update` is
  what keeps it so.
- **ratsnest's examples are checked by the same `ratsnest check` as anyone's circuits**, so the tool
  that ships is the tool ratsnest's own tests run.
