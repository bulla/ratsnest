# ADR 0043: Let a pin switch a light through an NPN transistor

**Status:** Accepted · 2026-11-23

## Context

The second new part is the NPN transistor, with the circuit that teaches it (ADR 0038): on a Pico,
a pin switches a light through a 2N3904, the pin feeding only the transistor's base and the light's
current coming from 3V3. ADR 0039 made a transistor a model from a closed list, ADR 0040 printed its
type, its model and its legs' letters on it, and ADR 0041 placed it as a resistor is. This record
settles what is left: its fields, which way it faces, the rule the wiring check holds it to, and its
drawing. As with ADR 0042, the owner had the work go on alone, and signs the drawing off on its pull
request.

## Decision

**The part is `{ kind: "transistor", model, emitter, base, collector }`**, and `model` is one that
`src/transistors.ts` holds, with its type and its legs' order. The list starts with the 2N3904, NPN,
whose legs are emitter, base and collector, left to right, with its flat face towards you; the
2N3906 joins it with the PNP's own circuit.

**Its legs are side by side in one row, in its model's order from left to right**, so that its flat
face is towards row j, the board's near edge as the drawing looks at it. A transistor turned round,
its flat face away, is refused: the drawing would show its blank back, and its legs' order is the
one thing a reader must not get wrong.

**On a Pico, it switches a light.** The light keeps the `pin` it declares, now the pin that switches
it, and the check finds its transistor by its collector. It holds:

1. **The light the right way round**, its long leg towards 3V3(OUT) and its short leg towards the
   collector.
2. **The emitter on ground.**
3. **The base on the light's pin through one resistor of 1 kΩ to 10 kΩ.** From a 3.3 V pin, 1 kΩ
   lets 2.6 mA into the base, and 10 kΩ 0.26 mA, which a 2N3904 turns into all of a light's current.
   A base straight on the pin is refused first, since nothing then limits the current from the pin.
4. **The light between 3V3(OUT) and the collector, through one resistor of 220 Ω to 1 kΩ**, on
   either side of the light, as a light on a pin has it.
5. **Every transistor switches a light**, and every resistor is a light's, a pull-down or a
   transistor's base resistor.

On a supply, a transistor is refused until the capacitor tester brings its use there.

**It is drawn standing, its flat face towards the viewer** (ADR 0040): a black TO-92 case 6.6 mm
wide and 5 mm tall, standing 2 mm above the board, so that it stands over the two rows above its
legs. Its legs leave the case 1.27 mm apart, as a TO-92's do, and bend out to the holes. On its face,
white, are its type, `NPN`, large, its model, `2N3904`, small beneath, and `E`, `B` and `C` above
the legs, each upright at every quarter turn and the same in every language. A value tag keeps off
the case. Its two colours are tokens, the same in both themes, the print held to 4.5:1.

**The page says it**: the step's sentence, "A 2N3904 NPN transistor, its flat face towards row j:
its emitter in e24, its base in e25 and its collector in e26."; the parts list's line, "2N3904 NPN
transistor, in a TO-92 case."; and three notes: the model's legs in order, and that another that
looks the same, such as a BC547, has them otherwise; the range of a base resistor; and, in place of
the light's usual note, that a light's long leg goes towards the pin, or towards 3V3 where a
transistor switches it.

The example is `examples/transistor-switch.ts`: GP16 switches a red light through a 2N3904, all of
it in the top half, between the top rails.

## Considered options

- **One facing, the flat face towards row j**: chosen. The print is always seen, and the legs'
  order is always the model's, left to right.
- **Either facing, the back drawn when the flat face is away**: rejected. A TO-92's back is blank,
  so the drawing would lose its type and its model where the order of the legs is reversed, which is
  where a reader most needs them.
- **The light on VBUS's 5 V**, which shows best what a transistor is for: not now. The + rail's
  legend says 3V3 on every Pico circuit, and a red wire may carry VBUS only to a part that takes it;
  both would change. A circuit that needs 5 V brings it as a use of its own (ADR 0038).
- **A pin of the transistor's own**, `base: { gpio }`: rejected. The light is what the script
  drives and the reader watches, so the light names the pin, as it always has.
- **A wider base resistor range, up to 47 kΩ**: rejected. At 47 kΩ the base takes 55 µA, and a
  2N3904 whose gain is at its low end lets through too little for a light to be bright.
- **The case drawn tall, as a real one is, or seen from above**: rejected, as the capacitor's was
  (ADR 0042). A tall case stands over every hole its legs' neighbours need; seen from above it hides
  its print, which is on its flat face.
- **Fritzing's transistor**, a TO-92 seen at an angle with its model on it: ratsnest's prints its
  type larger than its model, and names each leg. It was not set beside ratsnest's: this session
  could not fetch Fritzing's parts.

## Consequences

- **A pin can switch a light through a transistor**, and the page says which leg is which and that
  another model may differ.
- **A layout has three columns to reach under one standing part**, each only from below its legs
  or from the row above its case. The example found room in the top half, between the rails.
- **A light on a transistor runs from 3V3 only.** 5 V, from VBUS, waits for a circuit that needs it.
- **The page's note on a light's long leg changes on every Pico circuit with a transistor**, to say
  both of its directions.
- **The test that holds value tags where they always were leaves out a layout with a transistor**,
  whose case they keep off.
