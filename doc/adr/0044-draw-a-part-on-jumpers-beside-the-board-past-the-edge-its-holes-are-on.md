# ADR 0044: Draw a part on jumpers beside the board, past the edge its holes are on

**Status:** Accepted · 2026-11-26

## Context

Every part ratsnest draws stands or lies in its holes, and only the ring hangs past the board's
edge, from a header in its holes. A PIR motion sensor (ADR 0043) is not in the board at all: it
lies beside it, dome up, and three female-to-male jumpers join its pins to three holes. The owner
asked for it to be drawn so, as the tutorial they learned it from draws it: the sensor past the
board's edge, its three jumpers running onto the board.

The sensor's board is about 32 mm by 24 mm, half the breadboard's height, and its three pins are
2.54 mm apart, which is narrower than their names: `GND` at 1.3 mm is 2.95 mm wide in Nunito.

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

**Its pins' names are printed beside them, upright at every quarter turn** (ADR 0040), on a strip of
its board below the dome, and the header is drawn wider than life, 3.6 mm from pin to pin, so that
each name has room beside its neighbour's at 0° and 180°. Past the bottom edge, the sensor is
turned round, its pins towards the board, so its pins read in the other order.

## Considered options

- **Past the edge its holes are on, at its size**: chosen. It is where it lies on the bench, the
  jumpers are short and do not cross the board, and it is what the tutorial shows.
- **Past the board's far end, beside the labels**: rejected. The column past the far end holds the
  labels (ADR 0024), and its jumpers would run the board's whole length to reach the Pico's pins.
- **Wherever a circuit says, by an offset in its file**: rejected. A circuit says nothing about how
  anything looks (ADR 0007).
- **Smaller than life, to keep the picture short**: rejected. Drawn at a quarter of its height it
  would look like a part on the board, which it is not.
- **Its pins 2.54 mm apart, and their names smaller**: rejected. At 1 mm, the size that fits, the
  names are too small to read on a phone.
- **Their names staggered on two rows, the pins 2.54 mm apart**: rejected. A reader matches a name
  to the pin beneath it, and a staggered name stands over its neighbour's.
- **No names on it, the colours alone**: rejected. The reader plugs each jumper on by the name on the
  real sensor, and the drawing is what they hold it against.

## Consequences

- **A picture with a sensor is taller**, by about 40 mm past one edge, as one with the ring is.
- **The holes a sensor's jumpers may go in are fewer than the board's**: one side of the channel.
  Every pin it needs is on the top side, VBUS and ground among them, so no circuit is turned away
  for it; one that wants it below the channel brings VBUS across, as the ring's example does.
- **A value tag keeps off its jumpers**, as it keeps off every other jumper.
- **The header drawn wider than life** puts the jumpers' plugs a little apart, where real ones touch.
