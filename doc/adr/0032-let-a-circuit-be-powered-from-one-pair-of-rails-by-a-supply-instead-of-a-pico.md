# ADR 0032: Let a circuit be powered from one pair of rails by a supply, instead of a Pico

**Status:** Accepted · 2026-11-22 · Amends ADR-0002 (a circuit has a Pico, or a supply in its place) · Amended by ADR-0035 (its footer is its circuit's credit) · Amended by ADR-0037 (its voltage and rails are in the circuit's `setup`)

## Context

ADR 0002 draws a Pico 2 W on a half-size breadboard, and nothing else, and says that another board
waits for a record of its own, written when a circuit needs it. The owner now wants to start a
circuit without the Pico: lights and buttons on a breadboard, powered by a source whose two leads
go into the top or the bottom rails, with nothing to program.

Everything in ratsnest assumes the Pico today:

- **the format**: every light, button and buzzer names the GPIO it is on;
- **the wiring check**: its nets start from the Pico's header pins, and the only power it knows is
  3V3(OUT), and VBUS for an RGB LED;
- **the page**: a step that puts the Pico across the middle, a MicroPython script for Thonny, the
  Pico and its cable in the parts list, and the drawing's quarter turn said by where the USB points.

## Decision

**A circuit may declare `supply: { volts, rails }`, and then it has no Pico.** `volts` is 3, 3.7,
4.5 or 5, and `rails` is `"top"` or `"bottom"`. A circuit without the field is a Pico circuit, as
every circuit has been.

**Each voltage is something real to buy, and the parts list names it:**

| Volts | The parts list's line                                                                                                                                                        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3     | Two AA batteries, in a holder with a red and a black lead.                                                                                                                   |
| 4.5   | Three AA batteries, in a holder with a red and a black lead.                                                                                                                 |
| 3.7   | A protected 3.7 V Li-Po cell, with a protection circuit, usually under yellow tape by its leads. Its plug needs an adapter to two pins. Charge it only with a Li-Po charger. |
| 5     | A USB charger and its cable, into a USB-C breakout board for breadboards, which brings + and − out on two pins.                                                              |

**The engine places the supply, and the circuit names no hole for it.** Its red lead goes in column
1 of the + rail and its black lead in column 1 of the − rail, on the side the circuit names: the
board's near end, where the Pico's USB is, and which a circuit without a Pico leaves empty. It is
drawn beside that end as one small cell, whatever gives the voltage: a square silver pouch about
7 mm across, against the board's 84, with a thin yellow stripe at the end its tabs are on, both
leads leaving from that end, the side nearer the board, and its voltage written on it. The cell and
its leads are outlined, so that they read on either theme, and their colours are tokens in
`tokens.css`, like every other colour a page draws (ADR 0004).

**A supply circuit holds plain lights and buttons, and nothing else, and they name no pin.** A
light is lit from the supply through its resistor, and a button switches the current itself. The
RGB LED, the ring and the buzzer need a Pico to drive them, and are refused, saying so.

**A supply circuit has `test` in place of `script` and `scriptDoes`**: what to do once the power is
on, and what a working circuit then does. The engine writes the last step, "Connect the supply and
test": the holes its leads go in, then the circuit's `test`.

**Its page says what a circuit without a Pico needs:**

- no step for the Pico, so the circuit's own steps come first, and no section for Thonny;
- the drawing's introduction says where the supply is, at the quarter turn it is drawn at, in the
  words the USB has: "A 4.5 V supply on the left of the breadboard.";
- the rails' legend says the supply's voltage, `+ rail: 4.5 V`;
- the parts list has the supply's line in place of the Pico and its cable;
- the notes say to disconnect the supply while the wiring changes, and that a light's long leg goes
  towards +;
- the footer still credits Raspberry Pi's figure, and still says the drawing is CC BY-SA 4.0, in
  words that no longer begin with the Pico: the breadboard and the cell are drawn by the code in
  `src/drawing/`, which is the adaptation (ADR 0018).

**The `circuit` skill asks**, when it adds a circuit and the request does not say: with a Pico, or
with a supply; and then which voltage, suggesting 4.5 V, and which rails, suggesting the bottom
ones. No command is added.

How the format's type carries the two kinds of circuit is ADR 0034, and what the wiring check holds
a supply circuit to is ADR 0033.

This amends ADR 0002, whose Pico was on every circuit: a circuit now has the Pico or a supply. The
breadboard is still the half-size one, and the Pico 2 W still the only board.

## Considered options

- **A supply named by its voltage and its rails, placed by the engine**: chosen. A circuit cannot
  put a lead in a wrong hole, since it names none, and the near end it takes is the one a circuit
  without a Pico has free.
- **A breadboard power module, of the MB102 kind**: rejected. It plugs into both pairs of rails at
  once, at one end, rather than the top or the bottom; it needs a supply of its own; it gives 3.3 V
  or 5 V on each side; and drawn, it is larger than the board's end and overhangs it.
- **A battery as a part placed in a step, with `plus` and `minus` holes the circuit chooses**:
  rejected. The check would have to keep both holes on one pair of rails, and the drawing would
  have to put the cell beside any column. No circuit asks for that freedom.
- **The voltages of batteries alone, 3, 3.7 and 4.5 V**: not enough. The owner added 5 V, from a
  USB charger, which no battery gives.
- **The voltages of regulated supplies, 3.3 V and 5 V**: rejected. No battery gives 3.3 V, and the
  number on the cell has to be what the reader's parts give.
- **Any Li-Po cell**: rejected. One without a protection circuit drives tens of amperes through a
  jumper put across the two rails by mistake, which are side by side, and is spoiled by a circuit
  left on. The parts list says protected, and the charger.
- **Other drawings of the supply**, mocked up on the board in both themes: a holder seen from above
  with its two cells, the clearest and the largest; a chip in the drawing's pin style, the smallest,
  but read as a label rather than a thing to plug in; the leads alone, cut by a zigzag, which never
  show what they plug into; and the cell in black, which the dark theme loses. The silver pouch is
  small, holds any voltage, and reads on both.
- **The buzzer kept, as an active buzzer, in a supply circuit**: rejected. One part's name would
  mean two parts, by the kind of file it is in.
- **`scriptDoes` in a supply circuit**: rejected. It names a script that is not there, and renaming
  it everywhere breaks every file, so the format would rise and need a migration (ADR 0015).
- **A command that starts a circuit, `rnest new`**: rejected for now. It adds a command, its options
  and its words to the public surface, to do what the skill does. It is worth adding if people who
  write circuits by hand ask for it.

## Consequences

- **A first circuit can have nothing to program**: lights and buttons on two AA batteries.
- **Every part of the engine learns two kinds of circuit**: the format, the field checks, the
  wiring check, the drawing, the page and its words in three languages. The Russian ones wait for a
  reader, with the rest of M6's.
- **Lights and buttons only, for now.** An active buzzer, a motor or any other part that runs on a
  supply alone is a record of its own, written when a circuit needs it.
- **The supply always takes column 1 of its rails**, so a supply circuit can use neither of those
  two holes, and cannot have its leads anywhere else.
- **The page names a Li-Po cell, which can do harm.** It says protected, and the charger, and the
  wiring check refuses a short (ADR 0033); it cannot see the cell the reader holds.
- **A supply circuit may use the second board**, its rails reached from the first board's by
  jumpers, as every part there is.
- **The cell is part of the drawing**, so the drawing made alone as an SVG (ADR 0031) carries it.
