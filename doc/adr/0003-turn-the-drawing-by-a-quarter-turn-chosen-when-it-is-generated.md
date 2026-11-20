# ADR 0003: Turn the drawing by a quarter turn, chosen when it is generated

**Status:** Accepted · 2026-11-20

## Context

The copied drawing (ADR 0001) is horizontal and nothing else: the breadboard lies with column 1 on
the left, row a at the top, and the Pico's USB pointing left. A reader's board may sit on the desk
another way, and a full-size breadboard, if one ever comes (ADR 0002), would probably be drawn
standing up.

A layout names holes as the breadboard prints them, `a21` or `top-19`, and turning the board does
not rename a hole. So which way the board is drawn is a question for the drawing alone.

## Decision

**The generator takes an orientation, in degrees clockwise from the copied drawing:**

| Orientation | The board | The Pico's USB |
| --- | --- | --- |
| `0` (the default) | horizontal | on the left |
| `90` | vertical | at the top |
| `180` | horizontal | on the right |
| `270` | vertical | at the bottom |

- **A layout is written once and drawn at any of the four.** The holes keep their names and the
  wiring check never sees the orientation.
- **The drawing is turned, never mirrored.** A mirrored Pico would put every pin on the wrong side.
- **Every word drawn stays upright**: the column numbers, the pins' names, the resistors' values and
  the labels in the margin. They are placed again for each orientation rather than turned with the
  board.
- **The page arranges itself around the drawing.** A vertical board is tall, and on a wide screen it
  stands in a column beside the steps rather than above them.

## Considered options

- **Four quarter turns, as a parameter**: chosen. Any way the board sits on a desk can be drawn as
  the reader sees it, from one layout.
- **Horizontal or vertical only**: rejected by the owner. Which side the USB cable leaves from is
  part of how the board sits on a desk.
- **Orientation as part of the circuit**: rejected. It is about where the reader's board sits, not
  about the circuit, and the same circuit should be drawable every way.
- **The whole SVG turned with one transform**: rejected. Every word would turn with it, and at 90°
  the reader would tilt their head to read a pin.
- **Any angle**: rejected. A breadboard on a desk is square to its edge, and a word placed clear of
  every wire at a quarter turn may not be clear at 30°.

## Consequences

- **Placing words is checked four times.** Every test that keeps a label off a wire, a part or
  another label runs at all four orientations, and a layout that is tidy at 0° can crowd at 90°.
- **Upright words are a small departure from the real board.** Turned half round, a real
  breadboard's printed numbers are upside down; the drawing's are not. That is accepted: the drawing
  is there to be read.
- **At 180° the columns run from 30 on the left to 1 on the right**, as on the real board turned
  round. A reader who expects 1 on the left will see the board as it is.
- **Each orientation is its own file** (ADR 0004), so publishing every one of them means four pages
  per circuit, per theme and language (ADR 0005).
