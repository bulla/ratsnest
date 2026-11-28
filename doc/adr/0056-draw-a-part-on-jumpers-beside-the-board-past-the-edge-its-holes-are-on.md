# ADR 0056: Draw a part on jumpers beside the board, past the edge its holes are on

**Status:** Accepted · 2026-11-26 · Amended by ADR-0061 (a part with its pins at one end lies along the board)

## Context

Every part ratsnest draws stands or lies in its holes, and only the ring hangs past the board's
edge, from a header in its holes. A PIR motion sensor (ADR 0055) is not in the board at all: it
lies beside it, dome up, and three female-to-male jumpers join its pins to three holes. The owner
asked for it to be drawn so, as the tutorial they chose draws it: the sensor past the board's edge,
its three jumpers running onto the board.

The sensor's board is about 32 mm by 24 mm, half the breadboard's height, and its three pins are
2.54 mm apart, which is narrower than their names at the size the Pico's pin chips are printed:
`GND` at 1.3 mm is 2.95 mm wide in Nunito. The dome's square base nearly fills the board, so its
face has no room for them either.

## Decision

**A part on jumpers is drawn past the edge of the board its holes are on, the top or the bottom,
its pins towards the board, at its own size, and its jumpers run from its pins to their holes.**
Its three holes are on one side of the channel of the first board, rows a to e and the top rails,
or rows f to j and the bottom rails, so that it has one edge to lie past; with a second board above
the first, they are on the bottom side. The wiring check refuses any other holes, saying which.

It lies level with its holes, its middle over theirs, moved along only as far as keeps it within
the board's length, so that it never meets the Pico's cable or the labels past the board's far end.
Two of them, or one and the ring, that meet past the same edge are refused by the crowding check,
as two value tags are.

**Its jumpers are coloured by what they carry**, red to VCC, yellow to OUT and black to GND, as the
board's own jumpers are, and are drawn over the board's flat jumpers, under the arching ones.

**Its callout leaves its own board**, past the breadboard's edge, where nothing else is, since it is
named (ADR 0057), and runs past the board's far end with the others.

**Its pins are drawn 2.54 mm apart, as they are**: nothing outside the board is drawn to a spacing
other than its own. **Their names are printed beside them, upright at every quarter turn**
(ADR 0040), at 1 mm, as small as the Pico's own smallest print, `BOOTSEL` at 0.85 mm to 1.05 mm,
on a strip of its board below the dome, deep enough to hold `GND` upright on a standing board. The
strip makes the drawn board about 2 mm taller than the real one, at the owner's choice; its pins and
its dome are their own size. Past the bottom edge, the sensor is turned round, its pins towards the
board, so its pins read in the other order.

## Considered options

- **Past the edge its holes are on, at its size**: chosen. It is where it lies on the bench, the
  jumpers are short and do not cross the board, and it is what the tutorial shows.
- **Past the board's far end, beside the labels**: rejected. The column past the far end holds the
  labels (ADR 0024), and its jumpers would run the board's whole length to reach the Pico's pins.
- **Wherever a circuit says, by an offset in its file**: rejected. A circuit says nothing about how
  anything looks (ADR 0007).
- **Smaller than life, to keep the picture short**: rejected. Drawn at a quarter of its height it
  would look like a part on the board, which it is not.
- **Its pins 2.54 mm apart, their names at 1 mm on a strip that makes the board 2 mm taller**:
  chosen by the owner. The pins are as they are, and the names as large as the Pico's smallest print.
- **Its header drawn wider than life, 3.6 mm from pin to pin, its names at 1.3 mm**: rejected by the
  owner, though it was this record's first draft. A part outside the board is drawn at its own
  spacing, not stretched to fit its print.
- **Their names staggered on two rows, the pins 2.54 mm apart**: rejected. A reader matches a name
  to the pin beneath it, and a staggered name stands over its neighbour's.
- **No names on it, everything its true size**: rejected by the owner. The reader plugs each jumper
  on by the name on the real sensor, and the drawing is what they hold it against.

## Consequences

- **A picture with a sensor is taller**, by about 40 mm past one edge, as one with the ring is.
- **The holes a sensor's jumpers may go in are fewer than the board's**: one side of the channel.
  Every pin it needs is on the top side, VBUS and ground among them, so no circuit is turned away
  for it; one that wants it below the channel brings VBUS across, as the ring's example does.
- **A value tag keeps off its jumpers**, as it keeps off every other jumper.
- **Its pins' names are small**, 1 mm, legible on a large screen and only just on a phone; the
  jumpers' colours and the step's sentence say the same.
- **The drawn board is about 2 mm taller than the real one**, for the strip its names are printed on.
