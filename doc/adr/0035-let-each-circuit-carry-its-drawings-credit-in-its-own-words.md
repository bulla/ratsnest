# ADR 0035: Let each circuit carry its drawing's credit, in its own words

**Status:** Accepted · 2026-11-22 · Amends ADR-0018 (a page's footer carries its circuit's credit), ADR-0031 (the credit's words are the circuit's), ADR-0032 (a supply circuit's footer is its credit) and ADR-0034 (the format is 2, and both shapes carry a credit)

## Context

The drawing is an adaptation of Raspberry Pi's figure under CC BY-SA 4.0, and Nunito is under the
SIL Open Font License (ADR 0018). Every page credits both in its footer, and the drawing alone as an
SVG in a line along its bottom edge (ADR 0031). Both are the engine's words, in its tables for
English, French and Russian, and nobody writing a circuit can change them.

ADR 0032 to ADR 0034, decided the same day, let a circuit have a supply on its rails in the Pico's
place, as a second shape of `Circuit`, its footer still the engine's words, and kept format 1, since
that change breaks no file.

The owner wants that credit to be a circuit's own text, like its name and its description: written
in the circuit file, in each of its languages, adaptable and translatable, with the `circuit` skill
writing a default that its author may change. Nothing about it is to be written by the engine and
added when a page is made.

## Decision

**A circuit file has a `credit`, a text in each of its languages (ADR 0010), and it is required.**
It is what a reader is told about where the drawing and the font come from, and under which
licences. The page writes it as its footer, and the drawing alone along its bottom edge: one credit,
in one place, for both. The engine's own tables no longer hold one.

**It is held to the rules every text is** (ADR 0011), and to nothing more. Its words are free:
`ratsnest check` does not look in it for the licence, and the circuit's author answers for what it
says.

**Its default is ratsnest's credit, in the three languages ratsnest writes**: where the Pico is drawn
from, © Raspberry Pi Ltd, CC BY-SA 4.0 with the licence's address written out, the same licence for
this drawing, and Nunito under the SIL Open Font License 1.1. The `circuit` skill writes it into
every circuit it makes, and into every language it adds.

**The circuit format rises to 2** (ADR 0015), since a required field breaks every file without it.
The migration from format 1 gives each circuit the default credit in each of its languages, after
its description, and says so. ratsnest's examples are migrated by it, and their files in format 1
are kept as they were, in `examples/format-1/`, for the migration's test.

**Both of `Circuit`'s shapes carry it** (ADR 0034): a supply circuit has a `credit` as a Pico circuit
does, and both are format 2. A supply circuit's default credits the breadboard's drawing without
beginning with the Pico, as ADR 0032 wanted its footer to, and the `circuit` skill writes it when it
makes one.

This amends ADR 0018, where every page's footer carries the attribution: it now carries its
circuit's credit, which is the attribution unless its author changes it; ADR 0031, where the credit
line was the engine's words, the footer's shortened; ADR 0032, where a supply circuit's footer was
the engine's words, and is now its credit; and ADR 0034, where the format stayed at 1, and is 2 for
both shapes. Everything else in them stands.

## Considered options

- **In the circuit, required**: chosen. Every circuit says its credit, in every language it has, and
  the engine writes nothing of its own.
- **In the circuit, optional, with the engine's credit when it is left out**: rejected. The words a
  reader sees would come from two places, and the engine would still hold a credit of its own, which
  the owner does not want. It would have kept format 1.
- **The engine's words, as ADR 0031 has them**: rejected. A circuit could neither reword its credit
  nor have it in a language ratsnest does not write.
- **The line along an SVG's edge from the circuit, and the page's footer still the engine's**:
  rejected. The same credit would be written twice, in two places that could come to disagree.
- **Checked for the licence's essentials**, its holder, its name and its address, in every language:
  rejected by the owner. The credit is the author's text, and the author answers for the licence.

## Consequences

- **Every circuit file breaks, and `rnest update` mends it.** This is ratsnest's first migration, and
  the release that brings it raises y (ADR 0017, ADR 0021). A project's files gain the default credit,
  in each of their languages, until their author changes it.
- **A circuit can drop the credit's licence, and nothing stops it.** A page or an SVG made from it
  then carries the drawing without its attribution, which CC BY-SA 4.0 does not allow; that is on
  the circuit's author. `ATTRIBUTION.md` says so.
- **The default is written in two places**: in the `circuit` skill, for new circuits, and in the
  migration, for old ones. They are not one fact twice: the migration's is fixed when format 2 is
  made, as every migration is, and the skill's may change after it.
- **The footer becomes plain text.** Its links to the datasheet, the licence and the font's licence
  go, and the licence's address is written out instead.
- **The Russian credit leaves the engine's table** for the skill and the migration, so the reading of
  the engine's Russian (M6) reads it there.
- **The circuits people write were already theirs** (ADR 0018), and the credit is now among their
  words.
- **M12's supply circuits are built on format 2.** Their shape takes a `credit` with the rest, the
  engine writes no footer for them, and the skill gains a supply circuit's default credit, in
  English, French and Russian, when M12 makes the skill ask which kind of circuit it is.
