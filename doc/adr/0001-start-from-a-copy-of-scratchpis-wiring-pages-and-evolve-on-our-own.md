# ADR 0001: Start from a copy of scratchpi's wiring pages, and evolve on our own

**Status:** Accepted · 2026-11-20

## Context

scratchpi (`bulla/scratchpi`) has a static page per circuit that shows an adult how to build it on
a breadboard: a drawing in the manner of Fritzing's breadboard view, a list of steps that pick out
their parts in the drawing, a parts list with each resistor's colour bands, and a test that wires
every layout up and checks it against what the circuit is meant to be. The owner liked that design,
the visuals above all, and wants it stand-alone in ratsnest.

The code is in four places there: the breadboard model (`src/sim/breadboard.ts`), the drawing
(`src/sim/breadboard-svg.ts`), the wiring check (`src/details/netlist.ts`) and the page generator
(`src/details/page.ts`, with its stylesheet and script). It is written against scratchpi's own
circuit record, word tables and colour tokens.

## Decision

**Copy that code into ratsnest as the starting point, and let ratsnest evolve on its own from
then.** scratchpi is an inspiration, not an upstream. Nothing is shared between the two
repositories, nothing is kept in step, and scratchpi has no place in ratsnest's roadmap.

## Considered options

- **Copy it, and diverge**: chosen. ratsnest starts with visuals the owner already likes and a
  wiring check that already works, and is free to change either without asking what it does to
  another project.
- **A shared package both repositories use**: rejected. It ties two projects together with
  versioning and releases before anyone knows what ratsnest's version will look like, and it
  changes a project whose work is largely done.
- **ratsnest replaces scratchpi's pages**: rejected. It makes scratchpi depend on ratsnest, which is
  the coupling the owner does not want.
- **Start from nothing**: rejected. It throws away the look the owner asked for, and the wiring
  check that makes a drawing trustworthy.

## Consequences

- **The two drawings will drift apart, and nothing will notice.** A fix made in one does not reach
  the other. That is accepted: they are two projects now.
- **The copy brings scratchpi's assumptions with it**: one board, one size of breadboard,
  scratchpi's circuit record and colour tokens, its words in English and French, and a test script
  for Thonny. Each one is kept or dropped by a record of its own, not by the copy.
- **The Pico's drawing is an adaptation of the official pinout under CC BY-SA 4.0** (scratchpi's
  ADR 0023), and the obligation comes with it. A record says how ratsnest carries it.
