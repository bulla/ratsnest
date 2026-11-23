# ADR 0035: Let each circuit carry its drawing's credit, in its own words

**Status:** Accepted · 2026-11-22 · Amends ADR-0018 (a page's footer carries its circuit's credit, if it has one), ADR-0031 (the credit line is the circuit's, if it has one), ADR-0032 (a supply circuit's footer is its credit) and ADR-0034 (both shapes may carry a credit) · Amended by ADR-0036 (a circuit written before is given ratsnest's credit)

## Context

The drawing is an adaptation of Raspberry Pi's figure under CC BY-SA 4.0, and Nunito is under the
SIL Open Font License (ADR 0018). Every page credits both in its footer, and the drawing alone as an
SVG in a line along its bottom edge (ADR 0031). Both are the engine's words, in its tables for
English, French and Russian, and nobody writing a circuit can change them, or leave them out.

ADR 0032 to ADR 0034, decided the same day, let a circuit have a supply on its rails in the Pico's
place, as a second shape of `Circuit`, with its footer still the engine's words, and kept format 1.

The owner wants the credit to be a circuit's own text, like its name and its description: written in
the circuit file, in each of its languages, adaptable and translatable, with the `circuit` skill
writing a default. And they want it removable: a tutorial built of several of these drawings would
repeat the same credit under each of them, when its author would rather credit them once, somewhere
else on the page.

## Decision

**A circuit file may have a `credit`**, a text in each of its languages (ADR 0010), after its
description. It says where the drawing and the font come from, and under which licences. The page
writes it as its footer, and the drawing alone along its bottom edge: one credit, in one place, for
both. **A circuit without one has no footer and no credit line**, and the engine writes nothing in
their place: its own tables no longer hold a credit.

**It is held to the rules every text is** (ADR 0011), and to nothing more. Its words are free:
`ratsnest check` does not look in it for the licence, and the circuit's author answers for crediting
the drawing, there or elsewhere.

**The `circuit` skill writes ratsnest's credit into every circuit it makes**, in its languages, and
into every language it adds: where the Pico is drawn from, © Raspberry Pi Ltd, CC BY-SA 4.0 with the
licence's address written out, the same licence for this drawing, and Nunito under the SIL Open Font
License 1.1. The skill is the one place that default is written. Asked to remove it, the skill says
what the licence asks, and removes it.

**Both of `Circuit`'s shapes may carry it** (ADR 0034). A supply circuit's default credits the
breadboard's drawing without beginning with the Pico, as ADR 0032 wanted its footer to, and the
skill writes it when it makes one.

**The format stays at 1** (ADR 0015): a field a file may leave out breaks no file.

This amends ADR 0018, where every page's footer carries the attribution: it carries its circuit's
credit, if it has one, which is the attribution unless its author changes it; ADR 0031, where the
credit line was the engine's words, the footer's shortened, and is now the circuit's, if it has one;
ADR 0032, where a supply circuit's footer was the engine's words; and ADR 0034, whose shapes may both
carry a credit. Everything else in them stands.

## Considered options

- **In the circuit, optional, with the skill writing ratsnest's**: chosen. Every circuit made by the
  skill credits the drawing, and its author can reword the credit, translate it, or take it out to
  credit the drawing once elsewhere.
- **In the circuit, required, so the format rises to 2**: rejected by the owner. A tutorial of several
  drawings would have to repeat the same credit under each of them. It was built first, with a
  migration giving every circuit ratsnest's credit, and taken out before it landed.
- **In the circuit, optional, with the engine's credit when it is left out**: rejected. The engine
  would still hold a credit of its own, and a circuit could not be without one.
- **The engine's words, as ADR 0031 has them**: rejected. A circuit could neither reword its credit,
  have it in a language ratsnest does not write, nor leave it out.
- **The line along an SVG's edge from the circuit, and the page's footer still the engine's**:
  rejected. The same credit would be written twice, in two places that could come to disagree.
- **Checked for the licence's essentials**, its holder, its name and its address, in every language:
  rejected by the owner. The credit is the author's text, and the author answers for the licence.

## Consequences

- **A page or a drawing can carry no credit**, and nothing stops it. Shown without one, the drawing
  is not attributed as CC BY-SA 4.0 asks, unless the page around it credits it; that is the circuit's
  author's to answer for. `ATTRIBUTION.md` says so.
- **A circuit written before this has no credit**, and its pages lose the footer the engine used to
  write. The `circuit` skill offers to add ratsnest's after an update, and `rnest update` changes no
  circuit, since nothing about the format breaks.
- **The release that brings it adds to the surface**, an optional field, which on its own raises z
  (ADR 0017, ADR 0021).
- **The footer becomes plain text.** Its links to the datasheet, the licence and the font's licence
  go, and the licence's address is written out instead.
- **The default is written in the skill alone**, and the tests read it from there: they hold it to
  every check a circuit's text meets, at every orientation and in every language, and ratsnest's
  examples carry it.
- **The Russian credit leaves the engine's table** for the skill, so the reading of the engine's
  Russian (M6) reads it there.
- **The circuits people write were already theirs** (ADR 0018), and the credit is now among their
  words.
