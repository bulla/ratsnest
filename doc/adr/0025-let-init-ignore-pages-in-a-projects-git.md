# ADR 0025: Let `init` ignore `pages/` in a project's git

**Status:** Accepted · 2026-11-21

## Context

`ratsnest generate` writes a page into `pages/` (ADR 0023), and the same four inputs always make the
same file (ADR 0004), so a page is always made again from its circuit. ADR 0023 left to M7 whether
`ratsnest init` writes `pages/` into a new project's `.gitignore`. A page is about 230 KB, most of it
the font it carries (ADR 0012), and its Artifact holds it once published (ADR 0013).

## Decision

**`ratsnest init` writes a `.gitignore` holding `pages/`**, or adds the line to one that is there.
The owner removes it to keep the pages.

## Considered options

- **Ignored by default**: chosen. A page is the engine's output from a tracked circuit, and every
  change to the engine would otherwise change every page in a project's history.
- **Tracked by default**: rejected. A project would grow by a page's weight at every generation, for
  files any checkout makes again.
- **No `.gitignore` at all, the owner's to write**: rejected. Almost everyone would want the line,
  and the first commit would carry the pages before they knew it.

## Consequences

- **A project's pages are not in its history**, so a page from an older ratsnest is made again by
  checking out that ratsnest and its circuit, or found as an Artifact.
- **`ARTIFACTS.md` stays tracked** (ADR 0019): the links are not the pages.
