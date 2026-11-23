# ADR 0044: Let a pin switch a light on the high side, through a PNP transistor

**Status:** Accepted · 2026-11-23

## Context

The third new part is the PNP transistor, with the circuit that teaches it (ADR 0038): on a Pico, a
2N3906 between 3V3 and a light, the light lit while its pin is low. ADR 0043 brought the NPN
transistor, its drawing, its words and the rule for a light on its collector; the 2N3906 has the
2N3904's case and the same order of legs, and its rule is the NPN's mirrored. This record settles
what the mirror changes. As before, the owner had the work go on alone.

## Decision

**The 2N3906 joins the models ratsnest knows**, PNP, its legs emitter, base and collector, left to
right, with its flat face towards you, as the 2N3904's are. Each model also names one that looks
the same and has its legs in another order, which the page's note on its legs names: the BC547 for
the 2N3904, the BC557 for the 2N3906.

**On a Pico, a PNP transistor switches a light on the high side.** The check holds:

1. **The light the right way round**, its long leg towards the collector and its short leg towards
   ground.
2. **The emitter on 3V3(OUT)**, and on nothing else. A PNP whose emitter is on VBUS's 5 V never
   turns off, since a 3.3 V pin cannot raise its base to its emitter; the check refuses it.
3. **The base on the light's pin through one resistor of 1 kΩ to 10 kΩ**, as an NPN's is.
4. **The light between the collector and ground, through one resistor of 220 Ω to 1 kΩ**, on
   either side of the light.

The NPN's rule and the PNP's are one rule, read by the model's type: which rail the emitter goes
on, and which side of the light faces the transistor.

**It is drawn as the NPN is**, its type, `PNP`, large and its model, `2N3906`, small on its flat
face. The page's words are the NPN's, but for the note on a light's long leg, which now says that
where a transistor switches a light, the long leg goes towards 3V3 or towards the transistor, as its
step says.

The example is `examples/high-side-switch.ts`: GP16 switches a red light through a 2N3906, the
light lit while the pin is low, in the top half between the top rails, as the NPN's example is.

## Considered options

- **The mirror of the NPN's rule, read by type**: chosen. One rule, which a third type would extend
  rather than copy.
- **A rule of its own for the PNP**: rejected. It would repeat every check the NPN's makes, and
  every message.
- **The emitter on 3V3 or VBUS**: rejected. On VBUS, a 3.3 V pin leaves the PNP's base 1.7 V below
  its emitter, and the light never goes out: the mistake this circuit is most often built with.
- **The look-alike named in the note the same for both, the BC547**: rejected. The BC547 is an NPN;
  a reader with a PNP kit holds BC557s.

## Consequences

- **A pin can switch a light from either side**, and the two examples show the same light switched
  both ways.
- **The light is lit while its pin is low**, so the example's script sets the pin high first and
  leaves it high when it stops, and its words say so.
- **The capacitor tester's two transistors are NPN**, so it needs nothing of this record but the
  case they share.
