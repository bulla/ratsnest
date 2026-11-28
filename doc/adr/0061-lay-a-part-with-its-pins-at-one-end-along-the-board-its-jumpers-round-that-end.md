# ADR 0061: Lay a part with its pins at one end along the board, its jumpers round that end

**Status:** Accepted · 2026-11-28 · Amends ADR-0056 (a part with its pins at one end lies along the board, not with its pins towards it)

## Context

ADR 0056 draws a part on jumpers past the edge its holes are on, its pins towards the board, so that
its jumpers run straight onto it, as the motion sensor's three do. The motion sensor's pins are along
one of its long edges, and it is about 32 mm wide.

The character LCD (ADR 0060) is 80 mm by 36 mm, nearly the breadboard's length, and its backpack's
four pins stick out past one of its short ends, its left as its screen is read, in a column 2.54 mm
apart. The tutorial the owner chose draws it so: lying beside the board, its screen readable, its
jumpers coming round into its left end. Turned with its pins towards the board, it would stand
80 mm past the board's edge, half again the picture's height, its screen on its side.

## Decision

**A part whose pins are at one of its ends lies along the board, as it is read, past the edge its
holes are on, and its jumpers come round that end.** It is never turned round, past either edge.

**It lies at the board's length, its far end with the board's**, since at 80 mm it has nowhere else
to go: its pins' end then reaches a little past the board's near end, below or above the Pico's
cable, where the picture already has room.

**Its jumpers leave their plugs away from it, turn towards the board, run along between the board
and the part, each in a lane of its own, and turn into their holes.** The lanes are kept in the order
of their holes, the one nearest the board going to the hole nearest the near end, so that no jumper
crosses another over the board; where its pins' order is not its holes', the jumpers cross by its
end, as they do on the bench. Its jumpers are coloured as ADR 0056 says, by what they carry, red to
VCC and black to GND, and its signal jumpers each in a colour of their own: yellow, and blue to the
LCD's SDA, as the tutorial's are.

**Its pins' names are printed beside them, on its board, upright at every quarter turn**, at 1 mm,
as the motion sensor's are (ADR 0056). The LCD has room for them between its board's end and its
screen's frame, so it needs no strip.

## Considered options

- **Along the board, its jumpers round its end**: chosen. Its screen reads as it does on the bench,
  it adds 50 mm to the picture rather than 95 mm, and it is what the tutorial shows.
- **Its pins towards the board, as ADR 0056 has the sensor**: rejected for a part with its pins at
  one end. The LCD would stand 80 mm past the board, its screen on its side, and the picture would
  grow by more than the board's height.
- **Its jumpers as one curve each, from its plug to its hole**: rejected. From its left end to holes
  in the board's middle, a curve crosses its own board's corner and its pins' names.
- **Its middle over its holes', as ADR 0056 places the sensor**: rejected for the LCD. It is longer
  than the board's length leaves room to move it in; it always lies at the far end.
- **Turned round past the bottom edge, as the sensor is**: rejected. Its pins would come out at its
  right-hand end, under the labels, and its screen would read upside down.
- **Its signal jumpers both yellow, as a board's signal wires are**: rejected. SDA and SCL side by side
  in one colour are told apart only by their holes; the tutorial's blue and yellow tell them apart
  at a glance.

## Consequences

- **The picture grows past the edge the LCD lies past**, by its 36 mm and the lanes between, and a
  little past the near end, where the Pico's cable already widens it.
- **Jumpers can cross**, by the part's end, where its pins' order and its holes' differ, as the
  example's do. A jumper's colour, and the step's sentence, say which is which.
- **A new colour token**, the blue of a data jumper, which only a part beside the board draws.
- **ADR 0056 holds for a part with its pins along an edge**, as the sensor's are, and its status line
  says it is amended.
