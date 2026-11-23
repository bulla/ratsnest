# Architecture decision records

One record per decision. A record says what was decided, what it was decided _against_, and what
the decision costs, so that the next person to question a choice finds the argument already made
rather than having to reconstruct it.

## Why bother

Most of the expensive mistakes in a small project are re-litigated decisions: something was settled
carefully, the reasoning evaporated, and six weeks later the same question gets a different answer
for worse reasons. A record is cheap insurance against that. It is also the honest place to write
down what a decision _costs_, a claim that rarely survives in code comments.

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

| Status                   | Meaning                                                                          |
| ------------------------ | -------------------------------------------------------------------------------- |
| `Proposed`               | Argued, not yet agreed.                                                          |
| `Accepted`               | Agreed. May not be built yet: say so in Consequences.                            |
| `Superseded by ADR-00NN` | Reversed by a later record. Left in place, unedited.                             |
| `Amended by ADR-00NN`    | One clause replaced by a later record; the rest stands. Left in place, unedited. |

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

| #                                                                                                                | Title                                                                                              |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [0001](0001-start-from-a-copy-of-scratchpis-wiring-pages-and-evolve-on-our-own.md)                               | Start from a copy of scratchpi's wiring pages, and evolve on our own                               |
| [0002](0002-draw-a-pico-2-w-on-a-half-size-breadboard-and-nothing-else-yet.md)                                   | Draw a Pico 2 W on a half-size breadboard, and nothing else yet                                    |
| [0003](0003-turn-the-drawing-by-a-quarter-turn-chosen-when-it-is-generated.md)                                   | Turn the drawing by a quarter turn, chosen when it is generated                                    |
| [0004](0004-make-each-asset-one-self-contained-page-per-circuit.md)                                              | Make each asset one self-contained page per circuit                                                |
| [0005](0005-fix-a-pages-theme-and-language-when-it-is-generated.md)                                              | Fix a page's theme and language when it is generated                                               |
| [0006](0006-describe-each-circuit-in-one-typescript-file-with-what-it-is-and-where-it-goes.md)                   | Describe each circuit in one TypeScript file, with what it is and where it goes                    |
| [0007](0007-keep-a-circuits-file-declarative-and-everything-that-computes-outside-it.md)                         | Keep a circuit's file declarative, and everything that computes outside it                         |
| [0008](0008-write-the-engine-in-plain-typescript-with-no-framework-and-no-bundler.md)                            | Write the engine in plain TypeScript, with no framework and no bundler                             |
| [0009](0009-run-everything-on-bun-its-tests-included.md)                                                         | Run everything on Bun, its tests included                                                          |
| [0010](0010-let-a-circuit-be-written-in-one-language-or-several-and-make-a-page-only-in-one-it-has.md)           | Let a circuit be written in one language or several, and make a page only in one it has            |
| [0011](0011-hold-every-languages-text-to-rules-a-test-can-check-cyrillic-included.md)                            | Hold every language's text to rules a test can check, Cyrillic included                            |
| [0012](0012-set-every-page-in-nunito-carried-inside-it-and-measure-the-drawing-with-the-same-files.md)           | Set every page in Nunito, carried inside it, and measure the drawing with the same files           |
| [0013](0013-publish-a-page-as-an-artifact-only-when-asked-one-per-set-of-inputs-its-link-kept-by-each-person.md) | Publish a page as an Artifact only when asked, one per set of inputs, its link kept by each person |
| [0014](0014-make-ratsnest-a-builder-and-let-circuits-live-in-projects-of-their-own.md)                           | Make ratsnest a builder, and let circuits live in projects of their own                            |
| [0015](0015-give-every-circuit-file-a-format-number-and-migrate-it-with-ratsnest-update.md)                      | Give every circuit file a format number, and migrate it with `ratsnest update`                     |
| [0016](0016-ship-ratsnest-as-a-standalone-executable-built-by-bun-from-github-releases.md)                       | Ship ratsnest as a standalone executable, built by Bun, from GitHub Releases                       |
| [0017](0017-number-every-release-by-strict-semver-computed-from-what-changed-and-refused-otherwise.md)           | Number every release by strict SemVer, computed from what changed, and refused otherwise           |
| [0018](0018-license-ratsnests-code-under-mit-and-carry-what-it-inherits.md)                                      | License ratsnest's code under MIT, and carry what it inherits                                      |
| [0019](0019-publish-pages-only-from-circuits-projects.md)                                                        | Publish pages only from circuits projects                                                          |
| [0020](0020-check-every-change-and-every-release-with-github-actions-on-bun-alone.md)                            | Check every change and every release with GitHub Actions, on Bun alone                             |
| [0021](0021-keep-versions-at-0-y-z-until-ratsnest-is-done-though-its-repository-is-public.md)                    | Keep versions at 0.y.z until ratsnest is done, though its repository is public                     |
| [0022](0022-write-the-circuit-format-as-one-file-of-types-apart-from-the-engines-model.md)                       | Write the circuit format as one file of types, apart from the engine's model                       |
| [0023](0023-write-a-generated-page-into-pages-named-by-its-four-inputs.md)                                       | Write a generated page into `pages/`, named by its four inputs                                     |
| [0024](0024-put-the-labels-past-the-boards-far-end-whichever-way-it-is-turned.md)                                | Put the labels past the board's far end, whichever way it is turned                                |
| [0025](0025-let-init-ignore-pages-in-a-projects-git.md)                                                          | Let `init` ignore `pages/` in a project's git                                                      |
| [0026](0026-give-each-button-blocked-on-the-channel-a-lane-of-its-own-alternating-sides.md)                      | Give each button blocked on the channel a lane of its own, alternating sides                       |
| [0027](0027-put-a-second-board-parts-label-past-the-end-nearer-to-it.md)                                         | Put a second board's part's label past the end nearer to it                                        |
| [0028](0028-let-a-button-sit-on-the-second-board.md)                                                             | Let a button sit on the second board                                                               |
| [0029](0029-install-rnest-beside-ratsnest-as-a-shorter-name-for-the-same-executable.md)                          | Install `rnest` beside `ratsnest`, as a shorter name for the same executable                       |
| [0030](0030-bring-a-release-to-develop-by-pull-request-and-push-its-tag-after-the-merge.md)                      | Bring a release to `develop` by pull request, and push its tag after the merge                     |
| [0031](0031-offer-the-drawing-alone-as-a-self-contained-svg-made-by-generate-format-svg.md)                      | Offer the drawing alone as a self-contained SVG, made by `generate --format svg`                   |
| [0032](0032-let-a-circuit-be-powered-from-one-pair-of-rails-by-a-supply-instead-of-a-pico.md)                    | Let a circuit be powered from one pair of rails by a supply, instead of a Pico                     |
| [0033](0033-check-a-supply-circuits-wiring-against-its-plus-and-minus-rails.md)                                  | Check a supply circuit's wiring against its + and − rails                                          |
| [0034](0034-make-circuit-one-type-with-two-shapes-a-pico-circuit-or-a-supply-circuit.md)                         | Make `Circuit` one type with two shapes, a Pico circuit or a supply circuit                        |
| [0035](0035-let-each-circuit-carry-its-drawings-credit-in-its-own-words.md)                                      | Let each circuit carry its drawing's credit, in its own words                                      |
| [0036](0036-write-what-every-circuit-has-once-its-test-among-it-in-format-2.md)                                  | Write what every circuit has once, its `test` among it, in format 2                                |
| [0037](0037-say-what-every-circuits-breadboard-starts-with-in-its-setup.md)                                      | Say what every circuit's breadboard starts with, in its `setup`                                    |
| [0038](0038-bring-each-new-part-with-the-circuit-that-needs-it-and-teach-the-wiring-check-that-use.md)           | Bring each new part with the circuit that needs it, and teach the wiring check that use            |
| [0039](0039-take-each-new-part-from-a-closed-list-of-real-models-each-with-its-pinout-and-print.md)              | Take each new part from a closed list of real models, each with its pinout and print               |
| [0040](0040-print-what-identifies-a-part-on-its-body-upright-and-the-same-in-every-language.md)                  | Print what identifies a part on its body, upright and the same in every language                   |
| [0041](0041-place-a-new-part-in-its-step-as-a-resistor-is-with-no-name-of-its-own.md)                            | Place a new part in its step as a resistor is, with no name of its own                             |
| [0042](0042-offer-the-drawing-as-a-png-or-a-webp-drawn-by-buns-webview-from-its-svg.md)                          | Offer the drawing as a PNG or a WebP, drawn by Bun's WebView from its SVG                          |
| [0043](0043-keep-a-light-lit-with-an-electrolytic-capacitor-on-a-supply.md)                                      | Keep a light lit with an electrolytic capacitor, on a supply                                       |
| [0044](0044-let-a-pin-switch-a-light-through-an-npn-transistor.md)                                               | Let a pin switch a light through an NPN transistor                                                 |
| [0045](0045-let-a-pin-switch-a-light-on-the-high-side-through-a-pnp-transistor.md)                               | Let a pin switch a light on the high side, through a PNP transistor                                |
| [0046](0046-let-two-npn-transistors-flash-two-lights-on-a-supply-and-test-a-capacitor.md)                        | Let two NPN transistors flash two lights on a supply, and test a capacitor                         |
| [0047](0047-lift-a-lights-leader-over-the-transistors-and-capacitors-in-its-way.md)                              | Lift a light's leader over the transistors and capacitors in its way                               |
