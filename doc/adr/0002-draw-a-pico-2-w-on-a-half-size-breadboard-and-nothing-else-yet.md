# ADR 0002: Draw a Pico 2 W on a half-size breadboard, and nothing else yet

**Status:** Accepted · 2026-11-20

## Context

The code copied from scratchpi (ADR 0001) knows one board and one breadboard. The board is a
Raspberry Pi Pico 2 W, drawn from the millimetres of its datasheet, with its 40 header pins and
which of them are GPIO, ground and power. The breadboard is the half-size kind: 30 columns, rows a
to j with the channel between e and f, and four power rails that each run the whole length. The Pico
sits the same way in every layout, across the channel with its USB to the left and its pins in rows
c and h, columns 2 to 21, and a second board of the same kind can be snapped onto the first one's
top edge.

*Graphical wiring for breadboards* promises more than that: an Arduino, an ESP32, a full-size
board.

## Decision

**ratsnest draws a Pico 2 W on a half-size breadboard, and nothing else.** The Pico sits where the
copied code puts it, in every layout, and the second board above the first stays. Another board,
or another kind of breadboard, is a record of its own, written when a circuit needs it.

## Considered options

- **The Pico 2 W and the half-size breadboard, as copied**: chosen. Everything copied works on day
  one, the wiring check included, because it is the hardware the check was written for.
- **Any board, from a description of its outline and pins**: rejected for now. A format good enough
  to draw a board an adult recognises, and to check wiring against, is a project of its own, and no
  circuit asks for it yet.
- **The whole Pico family** (Pico, Pico W, Pico 2): not yet. They share the footprint and most of the
  pinout, but the drawing is of the W, and the onboard LED is wired differently on a W than on the
  others. Cheap to add later, and nothing needs it now.
- **A full-size breadboard**: rejected for now. Many split their power rails halfway along, and the
  check models a rail as one strip, so a layout correct on one board would be wrong on another.

## Consequences

- **Every circuit is a Pico 2 W circuit.** The pages say which board and which breadboard to buy.
- **The name promises more than the first version does.** That is accepted: one board done well
  first.
- **A second kind of board means generalising the model**: the drawing, the pin list, where the
  board sits and what the check knows about power and ground. It is real work, and that is why it
  waits for a record.
