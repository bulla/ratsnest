# ADR 0043: Read a PIR motion sensor on a pin, named as a button is, and power it from VBUS

**Status:** Accepted · 2026-11-26 · Amends ADR-0041 (a part the script reads on a pin is named, as a button is)

## Context

The owner has a PIR motion sensor and wants a circuit that lights a light for two seconds when it
sees someone move. The sensor is a small green board with a white dome on one side and three pins
on the other, named on the board `VCC`, `OUT` and `GND`, or `+`, `SIG` and `GND` on some. It takes
5 V on VCC, and its own regulator gives OUT 3.3 V while it sees movement and 0 V otherwise, so OUT
can go straight to a Pico's pin. Two dials on it set how sensitive it is and how long OUT stays
high. The tutorial the owner learned it from wires it to a Raspberry Pi by three female-to-male
jumpers, the sensor lying beside the breadboard.

ratsnest has two shapes for a part (ADR 0041): a named component, declared once with an `id`, a
`name` and the pin it is on, and placed in a step by its `id`; and an anonymous part, everything
about it in the step that places it. ADR 0041 put every new part in the second, but its reason was
that a capacitor or a transistor is "neither driven by name nor watched". A motion sensor is both:
the script reads it by its pin, and the reader waves at it.

The sensors sold differ in the order of their three pins, as the tutorial warns, and ADR 0039 keeps
a closed list of models for a part whose legs' order the drawing has to vouch for.

## Decision

**A PIR motion sensor is a named component, declared in a circuit's `sensors` and placed by a part
of kind `pir`**, as a button is declared in `buttons` and placed by a part of kind `button`:

```ts
sensors: [{ id: "pir", name: { en: "motion sensor" }, pin: { kind: "gpio", gpio: 28 } }],
  // …in a step:
  { kind: "pir", sensor: "pir", power: "a2", output: "a8", ground: "a9" };
```

`power`, `output` and `ground` are the holes its three jumpers go in, by the names the ring's pins
have, which its VCC, OUT and GND pins are. It is a Pico's part: a circuit with a supply has none.

**The wiring check learns its one use** (ADR 0038): VCC on VBUS, the USB's 5 V, as an RGB LED's is;
GND on ground; and OUT on the pin the sensor declares, with nothing else on that pin. It needs no
resistor: OUT is driven both ways.

**It is bought as what it is, not by a model.** Its pins are joined to the board by jumpers pushed
onto them one at a time, so the order they are in on the sensor never reaches the breadboard. The
page tells the reader to plug each jumper on by the name printed beside its pin, and the parts list
asks for a PIR module that runs on 5 V, with VCC, OUT and GND.

## Considered options

- **Named, in `sensors`, and placed by a `pir` part**: chosen. It is read on a pin, and has a callout
  and a line in the script, as a button does. `sensors` is a list of what the script reads, as
  `leds` is of what it lights, and the next kind of sensor joins it with a part kind of its own, as
  an RGB LED and a ring share `leds`.
- **Anonymous, as ADR 0041 says of new parts**: rejected. A sensor anonymous in its step would need
  its pin written there instead, unlike every other part a script uses, and the callout and the
  script's names would have nothing to call it.
- **A list named for it, `motionSensors` or `pirs`**: rejected. Each new kind of sensor would add a
  list, where `sensors` takes it as a new part kind.
- **A closed list of models, as ADR 0039 has transistors take**: rejected. A transistor's legs go
  straight into holes in their order, so the order is the drawing's; a jumper goes onto whichever
  pin bears its name. The note on the page says to read the names, as the ring's note does.
- **VCC on 3V3(OUT)**: rejected. The sensors are made for 5 V, and on 3.3 V most fall a little short
  of what their regulator needs, and see movement only now and then.

## Consequences

- **A circuit can read a motion sensor**, and its page names the parts to buy for it: the sensor,
  and three female-to-male jumpers.
- **ADR 0041 now holds for the parts no script reads.** A part read on a pin is named, as a button
  is, and has a callout past the board's end; ADR 0041's status line says so.
- **VBUS reaches past the Pico on a jumper**, which is 5 V a slip could put on a GPIO pin. The check
  refuses VBUS joined to any pin, as it does for an RGB LED, and the jumper is red, as a power wire
  is.
- **A sensor with the dials set otherwise behaves otherwise.** OUT can stay high from a few seconds
  to minutes, which the circuit's script and words have to allow for; the engine cannot see the
  dials.
- **The engine's Russian grows** by its sentence, its callout, its parts list's lines and its note,
  which the owner's reader of Russian reads with the rest (ADR 0010, ADR 0011).
