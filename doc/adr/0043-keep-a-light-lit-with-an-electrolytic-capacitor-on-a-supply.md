# ADR 0043: Keep a light lit with an electrolytic capacitor, on a supply

**Status:** Accepted · 2026-11-23

## Context

The first new part is the electrolytic capacitor, with the circuit that teaches it (ADR 0038): on a
supply, a button charges a capacitor across a light and its resistor, and once the button is let go
the capacitor empties into the light, which fades out. ADR 0039 to ADR 0041 settled how a part is
bought, printed and placed; this record settles what is left for this one: its kind and fields, the
shape of its legs, the rule the wiring check holds it to, and its drawing.

The interview left the details to this record, and the owner asked for the work to go on without
stopping for each one. The drawing was mocked up in three colourings, below, and the owner signs it
off when the pull request is reviewed rather than before it was written.

## Decision

**The part is `{ kind: "electrolytic", microfarads, plus, minus }`**, placed in its step as a
resistor is (ADR 0041). Its value is in microfarads, as its can prints it, and free, as `ohms` is
(ADR 0039): `470`, or `0.47`. Its legs are in one row, one hole apart, which suits the cans of up to
about 8 mm a kit has; a 10 mm can's legs are 5 mm apart, and go in squeezed.

**It has one use, on a supply: keeping a light lit.** The wiring check holds every electrolytic
capacitor in a supply circuit to it:

1. **The right way round**: its − leg on −, its + leg never on −. One in backwards is refused first,
   since an electrolytic capacitor in backwards can be damaged.
2. **Its − leg on −**, straight, with nothing between.
3. **Its + leg between a button and a light's resistor**: not on + itself, where it would be across
   the supply and keep nothing lit; joined to + when the button is held, so that it is charged; and
   with exactly one light's resistor from it, the light's cathode on −, so that the light is what it
   empties into.
4. **Slowly enough to be seen**: its capacitance times that resistor, its time constant, is 0.2 s at
   least. The light then fades over half a second or more; 470 µF through 1 kΩ is about 1.5 s. A
   capacitor too small for its resistor is refused with the capacitance that resistor needs.

On a Pico it has no use yet, and is refused saying so. The next use, the capacitor tester, brings
its own rule (ADR 0038).

**It is drawn standing, seen from the side, as a light is** (ADR 0040): a can in a navy sleeve,
5.4 mm across and short, standing on its legs 2 mm above the board, so that it stands over the three
rows above its legs and no more. A pale stripe runs down the side its − leg is on, with three minus
signs; its top is aluminium, scored with a cross; its + leg is kinked, as a light's long leg is; and
its value is printed white on the sleeve, the number over its unit, `470` over `µF`, upright at
every quarter turn and the same in every language. A resistor's value tag keeps off it. Its colours
are four tokens, the same in both themes, its two prints held to 4.5:1.

**The page says it** in each language: the step's sentence, "A 470 µF capacitor: its + leg in i5,
and its − leg, under the stripe, in i4."; the parts list's line, "470 µF electrolytic capacitor,
rated 16 V or more."; and a note that it goes in one way round, its − leg the shorter, under the
stripe, and that backwards it can be damaged. 16 V is the rating a kit's capacitors have, and well
over every supply's 5 V at most.

The example is `examples/fading-light.ts`: three AA batteries, a button, 470 µF, and a red light
through 1 kΩ.

## Considered options

- **A navy sleeve with a pale stripe**: chosen. It stands apart from the black wires, the button's
  black body and the board's holes, and from both rails.
- **A black sleeve with gold print**, as many real ones are: rejected. It reads, but beside the
  black jumpers and the button's body it is one more black thing on the board.
- **A bright blue sleeve**: rejected. It is near the − rail's blue, and a part the colour of the −
  rail reads as a thing that belongs to it.
- **A tall can, as real ones are, or one seen from above**: rejected. A can as tall as a real
  470 µF one, 12 mm, would stand over five rows and every hole a wire needs near it; seen from above
  it would break the way every standing part is drawn.
- **A range of capacitance alone, as a light's resistor has**: rejected. 470 µF through 220 Ω
  empties in a tenth of a second, which no one sees, and 100 µF through 1 kΩ does too: what decides
  is the two together.
- **The capacitor across the light alone, after its resistor**: rejected as this use. It also keeps
  the light lit, but it fills only through the resistor, so the light comes on slowly too, and the
  check would hold two shapes for one circuit. It is refused, saying where the + leg goes.
- **Fritzing's electrolytic capacitor**, a can seen at an angle with a stripe and no value on it:
  ratsnest's prints its value, which Fritzing shows only in its inspector. It was not set beside
  ratsnest's drawing: this session could not fetch Fritzing's parts.

## Consequences

- **A first capacitor circuit needs no Pico** and shows what a capacitor does with nothing but a
  light.
- **The can is shorter than any real one**, as the other parts are drawn to read rather than to
  scale. Its legs' kink and its stripe say which way round it goes; its leg's length does not show,
  since the board hides it.
- **The can covers the three rows above its legs on the drawing**, so a layout keeps those holes
  free of anything a reader needs to see, as it does above a light.
- **On a Pico, a capacitor is refused** until a circuit brings a use for it there.
- **The rule knows one shape.** A capacitor that keeps a light lit some other way, or that does
  anything else, is refused until a circuit brings its rule.
