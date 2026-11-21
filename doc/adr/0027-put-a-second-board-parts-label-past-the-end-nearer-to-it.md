# ADR 0027: Put a second board's part's label past the end nearer to it

**Status:** Accepted · 2026-11-21

## Context

ADR 0024 puts every label past the board's far end, the end away from the USB, because that is where
the parts are: the Pico takes columns 2 to 21 of the first board, and leaves only its far end free.
The second board, snapped onto the first (scratchpi's ADR 0226), has no Pico on it. Its parts can be
anywhere along it, and the RGB LED that a circuit puts there sits at columns 2 to 5, by the USB. Its
leader then runs the whole length of the board to a label at the other end.

## Decision

**A part on the second board has its label past whichever end of the board is nearer to it**, by its
middle column: 1 to 15, the end by the USB; 16 to 30, the far end. Every part on the first board keeps
the far end. A leader towards the near end leaves from the part's other side and runs along the gap
between two rows as it does towards the far end, so it still crosses no row.

The labels past the near end stand as the others do, mirrored: at 0° in a column to the left of the
board, at 90° in a row above it, at 180° in a column to its right, and at 270° in a row below it.
This amends ADR 0024, whose rule now holds for the first board's parts and the second board's far
half.

## Considered options

- **The nearer end, for the second board only**: chosen. It shortens the leaders that are long for no
  reason, and changes nothing on the first board, where the near end is the Pico's.
- **The near end for every part on the second board**: rejected. A part at column 28 of the second
  board would run its leader the whole length the other way, which is the problem turned round.
- **The nearer end on either board**: not chosen. On the first board it changes nothing today, but it
  would invite a part at column 1, beside the USB cable, to put its label where the cable is drawn.
- **Leave every label at the far end**: rejected by the owner. A leader the length of the board is
  hard to follow back to its part, past every other part on the way.

## Consequences

- **A drawing can have labels at both ends**, and grows on both sides to hold them. At 0° the
  picture widens to the left; at 90° it grows above the board, beside the USB cable.
- **Every page with an RGB LED or ring on the second board changes**, ratsnest's RGB LED example
  among them, and a project republishes its Artifacts to show it.
- **Which end is nearer is a rule on columns**, not a measurement of the leader, so a part across
  columns 15 and 16 takes its end by its middle, as the rule says, even where the other would be
  barely shorter.
