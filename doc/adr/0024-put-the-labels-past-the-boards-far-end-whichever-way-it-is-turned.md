# ADR 0024: Put the labels past the board's far end, whichever way it is turned

**Status:** Accepted · 2026-11-21 · Amended by ADR-0027 (a part on the second board takes the end nearer to it)

## Context

The drawing names each light, button and buzzer in a label beside the board: a title, a line under
it, and a leader from the part. At 0°, the only orientation the copy drew, the labels stand in a
column to the right of the board, and each leader leaves its part along the gap between two rows,
towards column 30, where the parts are: the Pico takes columns 2 to 21, so everything else is near
the board's far end, away from the USB.

ADR 0003 turns the drawing by a quarter turn at a time and keeps every word upright, placed again
for each orientation, but does not say where the labels go once the board is turned. A leader that
crossed the rows to reach a label to one side of a standing board would cross the parts in them.

## Decision

**The labels go past the board's far end, the end away from the USB, at every orientation**, and
every leader leaves its part as it does at 0°, along the gap between two rows towards that end.

| Orientation | The USB       | The labels                                                |
| ----------- | ------------- | --------------------------------------------------------- |
| `0`         | on the left   | in a column to the right, each line starting at the board |
| `90`        | at the top    | in a row below                                            |
| `180`       | on the right  | in a column to the left, each line ending at the board    |
| `270`       | at the bottom | in a row above                                            |

In a column, labels keep the order their parts come in and move apart only as far as their height
needs, as at 0°. In a row they do the same along the board, each as wide as Nunito measures its
title and its line (ADR 0012), and the drawing widens if the row does not fit beside the board.

## Considered options

- **Past the far end, the leaders as at 0°**: chosen. A leader never crosses a row of holes, at any
  orientation, because it is the same leader turned.
- **Always to the right of the drawing**: rejected. On a standing board a leader would cross the rows
  to get there, over the very parts the labels are for.
- **No labels on a turned board**: rejected. The labels are how a reader tells BTN1 from BTN2 in the
  drawing, and that matters as much at 90°.
- **The labels inside the board, beside each part**: rejected. A tidy place beside every part, clear of
  every wire, at four orientations, is a placement problem the margin exists to avoid.

## Consequences

- **A standing board's labels make the drawing taller**, by a row of labels below or above it, and
  wider when its parts' labels do not fit beside it.
- **Labels in a row need their widths, which only measuring gives**, so this rests on ADR 0012.
- **At 180° the labels end at the board rather than starting at it**, so their left edges do not line
  up. That is the mirror of 0°, and the cost of keeping every leader short.
