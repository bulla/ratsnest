# Architecture decision records

One record per decision. A record says what was decided, what it was decided *against*, and what
the decision costs, so that the next person to question a choice finds the argument already made
rather than having to reconstruct it.

## Why bother

Most of the expensive mistakes in a small project are re-litigated decisions: something was settled
carefully, the reasoning evaporated, and six weeks later the same question gets a different answer
for worse reasons. A record is cheap insurance against that. It is also the honest place to write
down what a decision *costs*, a claim that rarely survives in code comments.

## The rules

- **One decision per record.** If a record needs the word "also", it is two records.
- **Never rewrite a record in place.** A decision that reverses an earlier one gets a new record,
  and the old one is marked `Superseded by ADR-00NN` at the top. Editing a record to say what you
  now believe erases the reasoning someone may be relying on.
- **A record that is only partly reversed is `Amended by`, not superseded.** Marking a record
  superseded when most of it still holds sends the next reader away from a decision that is still in
  force. The amending record says which clause it takes over, and the amended one is otherwise left
  exactly as it was. A record that needs a second amendment was probably two records to begin with.
- **Fixing a typo is fine.** Changing what a record decided is not.
- **Record the rejected options.** The `Considered options` section is the part that gets read
  later. A record with only a decision is a note; a record with the alternatives and why they lost
  is an argument.
- **Say what it costs.** `Consequences` includes the bad news. If a decision has no downside, it was
  not a decision.
- **Number sequentially, never reuse a number.** Filename is `NNNN-a-short-imperative-title.md`.
- **Write it when the decision is made**, not when the code lands. A record that waits for the
  implementation becomes a description of the implementation.

## Status values

| Status | Meaning |
| --- | --- |
| `Proposed` | Argued, not yet agreed. |
| `Accepted` | Agreed. May not be built yet: say so in Consequences. |
| `Superseded by ADR-00NN` | Reversed by a later record. Left in place, unedited. |
| `Amended by ADR-00NN` | One clause replaced by a later record; the rest stands. Left in place, unedited. |

## Format

```markdown
# ADR 00NN: Title in the imperative

**Status:** Accepted · YYYY-MM-DD

## Context
What forced a choice.

## Decision
What was chosen, stated plainly.

## Considered options
- **The one chosen**: why it won.
- **The others**: why they lost.

## Consequences
What this makes easy, what it makes hard, and what it rules out.
```

## The records

Each new record adds a row here.

| # | Title |
| --- | --- |
| [0001](0001-start-from-a-copy-of-scratchpis-wiring-pages-and-evolve-on-our-own.md) | Start from a copy of scratchpi's wiring pages, and evolve on our own |
| [0002](0002-draw-a-pico-2-w-on-a-half-size-breadboard-and-nothing-else-yet.md) | Draw a Pico 2 W on a half-size breadboard, and nothing else yet |
| [0003](0003-turn-the-drawing-by-a-quarter-turn-chosen-when-it-is-generated.md) | Turn the drawing by a quarter turn, chosen when it is generated |
| [0004](0004-make-each-asset-one-self-contained-page-per-circuit.md) | Make each asset one self-contained page per circuit |
| [0005](0005-fix-a-pages-theme-and-language-when-it-is-generated.md) | Fix a page's theme and language when it is generated |
| [0006](0006-describe-each-circuit-in-one-typescript-file-with-what-it-is-and-where-it-goes.md) | Describe each circuit in one TypeScript file, with what it is and where it goes |
| [0007](0007-keep-a-circuits-file-declarative-and-everything-that-computes-outside-it.md) | Keep a circuit's file declarative, and everything that computes outside it |
| [0008](0008-write-the-engine-in-plain-typescript-with-no-framework-and-no-bundler.md) | Write the engine in plain TypeScript, with no framework and no bundler |
| [0009](0009-run-everything-on-bun-its-tests-included.md) | Run everything on Bun, its tests included |
| [0010](0010-let-a-circuit-be-written-in-one-language-or-several-and-make-a-page-only-in-one-it-has.md) | Let a circuit be written in one language or several, and make a page only in one it has |
| [0011](0011-hold-every-languages-text-to-rules-a-test-can-check-cyrillic-included.md) | Hold every language's text to rules a test can check, Cyrillic included (proposed) |
