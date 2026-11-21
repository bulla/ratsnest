# ADR 0028: Let a button sit on the second board

**Status:** Accepted · 2026-11-21

## Context

A second half-size board can be snapped onto the first one's top edge (scratchpi's ADR 0226), and
every part that names its holes can go on it: a hole says so first, `2:f5`. A button does not name
its holes. It gives two columns and, on one half of the board, two rows (scratchpi's ADR 0154), and
the engine makes its four legs from them, always on the first board. So a button cannot go on the
second board, where nothing but the RGB LED has gone so far.

A circuit with its buttons in a line wants the room the second board has: its whole length is free,
where the first board's is the Pico's but for columns 22 to 30.

## Decision

**A button part may say `board: 2`, and then its legs are on the second board.** Its columns and
rows mean what they always have, on that board. Left out, it is on the first board, as every button
has been. The format stays at 1: a field that may be left out breaks no file (ADR 0015), and it is
an addition to the public surface (ADR 0017).

The engine makes a button's holes in one place, so the wiring check, the drawing, its leader and its
label, and the sentence that names its legs all follow. The sentence says once that the legs are on
the second breadboard, as the RGB LED's does.

## Considered options

- **An optional `board: 2`**: chosen. Every file stays valid, and the field reads as what it is.
- **A button that names its four holes, like every other part**: rejected. Four holes say more than
  a button can be: they could be three rows apart in one column and two in the other, which the
  checks would then have to refuse. Columns and rows say exactly what a button's shape allows, and
  changing them would change the format.
- **`board: 1 | 2`, required**: rejected. Every circuit file with a button would break, for no
  reader's sake.
- **Columns written as `2:22`**: rejected. A column is a number, and a string that holds one is a
  second way of writing a hole.

## Consequences

- **Buttons can be anywhere on two boards**, and a line of them on the second board has room for its
  pull-downs beside it.
- **A button on the second board is wired to the Pico by jumpers across both boards' rails**, as the
  RGB LED's are, and its 3V3 has to reach the second board's rail or its strips the same way.
- **The format's type gains a field**, and `.ratsnest/` in a project has it once `ratsnest update` has
  run there.
