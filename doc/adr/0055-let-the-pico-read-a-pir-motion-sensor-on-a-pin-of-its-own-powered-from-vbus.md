# ADR 0055: Let the Pico read a PIR motion sensor on a pin of its own, powered from VBUS

**Status:** Accepted · 2026-11-26

## Context

The owner has a PIR motion sensor and wants a circuit that lights a light for two seconds when it
sees someone move, after a tutorial the owner chose. The sensor is a small green board with a white
dome on one side and three pins on the other, named on the board `VCC`, `OUT` and `GND`, or `+`,
`SIG` and `GND` on some. It takes 5 V on VCC, and its own regulator gives OUT 3.3 V while it sees
movement and 0 V otherwise, so OUT can go straight to a Pico's pin. Two dials on it set how sensitive
it is and how long OUT stays high. The tutorial wires it by three female-to-male jumpers, the sensor
lying beside the breadboard, and the owner asked for it to be drawn so (ADR 0056).

The sensors sold differ in the order of their three pins, as the tutorial warns, and ADR 0039 keeps
a closed list of models for a part whose legs' order the drawing has to vouch for.

Three parts the script reads were settled before it: the ceramic capacitor (ADR 0051), the slide
potentiometer (ADR 0053) and the DIP switch (ADR 0054). Each is placed in its step as a resistor is,
with no name of its own (ADR 0041), and the wiring check finds the pin it is read on from the
wiring, which a step's words may then name.

## Decision

**The part is `{ kind: "pir", name, power, output, ground }`**: its name, which every part outside
the board has (ADR 0057), and the holes its three jumpers go in, by the names the ring's pins have,
which its VCC, OUT and GND pins are. It is placed in its step as a resistor is, its pin read from the
wiring and declared nowhere, and is a Pico's part: a circuit with a supply has none.

**The wiring check learns its one use** (ADR 0038), being read:

1. **VCC on VBUS**, the USB's 5 V, as an RGB LED's +5 V is.
2. **GND on ground.**
3. **OUT straight on one GPIO, with nothing else on it.** It needs no resistor, since OUT is driven
   both ways, and any GPIO reads it, so the check names none. Each problem says what the leg is on and
   where it goes.

**It is bought as what it is, not by a model.** Its pins are joined to the board by jumpers pushed
onto them one at a time, so the order they are in on the sensor never reaches the breadboard. The
page tells the reader to plug each jumper on by the name printed beside its pin.

**The page says it, by its name**: its label past the board's end, "motion sensor, OUT to a13"; the
step's sentence, "The motion sensor, beside the board, dome up: a red jumper from its VCC pin to a2
(VBUS, pin 40), a yellow one from its OUT pin to a13 (GP22, pin 29) and a black one from its GND pin
to a14 (GND, pin 28)."; the parts list's two lines, "Motion sensor: a PIR module with three pins,
VCC, OUT and GND, that runs on 5 V", and its three female-to-male jumpers; and a note that the
jumpers go on by the names on its board, whatever order its pins are in, and that it takes up to a
minute to settle once powered. The test step picks it out, since the reader moves in front of it.
Its circuit's page names no shop or product, at the owner's asking.

The example is `examples/motion-light.ts`: the sensor's jumpers in the strips of VBUS, GP22 and the
GND beside it, a red light on GP15, and a script that lights it for two seconds each time OUT rises.

## Considered options

- **Placed as a resistor is, its pin read from the wiring, its name on the part**: chosen. Its pin is
  found as the three parts the script reads before it find theirs, so a step's words may name it, as
  they may the slide potentiometer's; and its name is the one every part outside the board carries
  (ADR 0057).
- **Named, in a `sensors` list, as a button is in `buttons`, with its pin declared there**: rejected,
  though it was this record's first draft, written before ADR 0051 to ADR 0054 were seen. Its pin
  would be declared where the parts the script reads before it have none, and each new kind of part
  outside the board would add a list; ADR 0057 says why its name goes on the part instead.
- **No name of its own, as ADR 0041 has new parts**: rejected by the owner, and this record's second
  draft. A part outside the board is a board of its own, and is named (ADR 0057).
- **A closed list of models, as ADR 0039 has transistors take**: rejected. A transistor's legs go
  straight into holes in their order, so the order is the drawing's; a jumper goes onto whichever
  pin bears its name. The note says to read the names, as the ring's note does.
- **VCC on 3V3(OUT)**: rejected. The sensors are made for 5 V, and on 3.3 V most fall a little short
  of what their regulator needs, and see movement only now and then.
- **OUT through a resistor, or with a pull-down**: rejected. OUT is driven high and low by the sensor,
  so a resistor would be a part with no use the check knows.

## Consequences

- **A circuit can read a motion sensor**, and its page names the parts to buy for it: the sensor,
  and three female-to-male jumpers.
- **It has a callout**, as a light has, its line leaving its own board past the breadboard's edge,
  where nothing else is. The Pico step's list of where pins land still leaves its pin out, as it does
  the slide potentiometer's, since no component declares it.
- **VBUS reaches past the Pico on a jumper**, which is 5 V a slip could put on a GPIO pin. The check
  refuses VBUS joined to any pin, as it does for an RGB LED, and the jumper is red, as a power wire
  is.
- **A sensor with its dials set otherwise behaves otherwise.** OUT can stay high from a few seconds
  to minutes, which the circuit's script and words have to allow for; the engine cannot see the
  dials.
- **The engine's Russian grows** by its sentence, its label, its parts list's lines and its note, which the
  owner's reader of Russian reads with the rest (ADR 0010, ADR 0011).
