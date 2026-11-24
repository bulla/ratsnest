# ADR 0051: Let two pins time a ceramic capacitor through a resistor

**Status:** Accepted · 2026-11-24

## Context

The sixth new part is the ceramic capacitor, with the circuit that teaches it (ADR 0038): on a Pico,
a pin charges a 100 nF capacitor through a resistor while another pin reads it, and the script prints
how long it takes. ADR 0039 left a capacitor's value free, as a resistor's is, ADR 0040 printed what
tells a part apart on its body, and ADR 0041 placed it as a resistor is. The roadmap left one
question to this record, what the disc prints: `104`, as the real one does, or `100 nF`. This record
settles that and what is left: its fields, its rule and its drawing. As with the parts before it, the
owner had the work go on alone, and signs the drawing off on its pull request; there, the owner chose
what the disc prints.

Two things bear on the rule. A ceramic capacitor is named by no component, so the pins it is on are
named by nothing but the wires and the resistor that reach them, and a step's words could name only
the pins a light, a button or a buzzer is on. And on an RP2350, an input leaks while its voltage is
between low and high (erratum E9), which holds a pin weakly pulled down at about 2.2 V: the
capacitor's leg is such a pin, emptied through its resistor between readings.

## Decision

**The part is `{ kind: "ceramic", nanofarads, from, to }`**, placed in its step as a resistor is,
either way round, its legs in one row, one hole apart. Its value is in nanofarads, between the
picofarads its code counts and the microfarads a bag may say, and free (ADR 0039), as long as its
code can print it: two significant figures, and 10 pF at least, `100`, `4.7` or `0.022`.

**The disc prints its value, as the can does** (ADR 0043): its number over its unit, `100` over `nF`,
the same in every language (ADR 0040), as a resistor's tag says `4.7 kΩ` and a can `470 µF`. A number
too long to cross the disc at full size, `0.022`, is printed smaller. The real disc prints a code
instead, in picofarads, two figures and how many zeros follow them, `104` for 100 nF, so the page
gives the code beside the value, as its parts list gives a resistor's bands: "A 100 nF ceramic
capacitor, marked 104, either way round: one leg in e26 and the other in e27.", lists it "100 nF
ceramic capacitor, marked 104.", and a note says how the code reads: "104 is 100 nF".

**It has one use, on a Pico: being timed by two pins.** The wiring check holds every ceramic
capacitor on a Pico to it:

1. **One leg straight on ground.**
2. **The other leg on one GPIO, straight**, the pin that reads it, and on nothing else but:
3. **One resistor from a second GPIO**, the pin that charges it, **of 1 kΩ to 8.2 kΩ**: 3.3 mA from
   the pin at most, and strong enough, as a pull-down is, to empty the capacitor past an input that
   leaks (erratum E9).
4. **Slowly enough to be timed**: its capacitance times that resistor, its time constant, is 0.1 ms
   at least, which a MicroPython loop counts in its microseconds. 100 nF through 4.7 kΩ is about
   0.5 ms. A capacitor too small for its resistor is refused with the capacitance it needs.

A resistor that charges a capacitor is accounted for, as a light's, a pull-down or a base resistor
is. On a supply a ceramic capacitor is refused, as a part that needs a Pico.

**A step's words may name a pin the layout wires a part to**, as well as one a component is on: a
ceramic capacitor's pins are named by nothing else. And the test step picks the capacitor out, as it
does the components a reader watches, since the script times it.

**It is drawn standing, seen from the front**: a mustard disc 4.6 mm across, larger than life so
that its value reads, standing 1.4 mm above the board on its two legs, so that it stands over the two
rows above them. Its value is printed dark on it, upright at every quarter turn. A value tag keeps off
it, and a light's leader rises over it (ADR 0050). Its two colours are tokens, the same in both
themes, the value held to 4.5:1.

The example is `examples/capacitor-timer.ts`: GP16 charges a 100 nF capacitor through 4.7 kΩ while
GP17 reads it, all of it in the top half beside the Pico, and the script prints the time five times.

## Considered options

- **The value on the disc, `100` over `nF`**: chosen, by the owner, on this record's pull request.
  It is how the drawing writes every other value, a resistor's `4.7 kΩ` though its body carries
  bands, and a can's `470 µF`; and the page gives the code beside it, by which the reader finds the
  part in their box.
- **The code on the disc, `104`, as the real one prints**: rejected by the owner, after this record
  first chose it. It is what the part in the reader's hand says, but it would make the disc the one
  part on the drawing whose value a reader decodes.
- **Both, the value on the disc and the code on a tag**: rejected. The tag is one more to place, and
  the page's sentence and its parts list already give the code.
- **A value in picofarads, or in microfarads**: rejected. Picofarads write 100 nF as `100000`, and
  microfarads as `0.1`; nanofarads write the values a kit's discs have as plain numbers.
- **One pin, charging through a resistor from 3V3 and emptying the capacitor itself**: rejected. A
  pin set low across a charged capacitor empties it with nothing to hold the current back, and the
  rule would hold a pin that changes what it is between two lines of the script.
- **A 10 kΩ resistor, as many tutorials take**: rejected by erratum E9. Above 8.2 kΩ, the input that
  reads the capacitor can hold it near 2.2 V while it should be emptying.
- **Legs two holes apart, as many discs' are**: rejected. Their legs bend to one hole apart, and one
  shape is one fewer to check; the electrolytic capacitor's are one hole apart too (ADR 0043).
- **A blue disc**, as some multilayer capacitors are: rejected. The mustard disc is the one a kit's
  `104` comes as, and blue is near the − rail's.
- **Fritzing's ceramic capacitor**, a disc seen at an angle with no code on it: ratsnest's prints its
  code. It was not set beside ratsnest's: this session could not fetch Fritzing's parts.

## Consequences

- **The drawing's disc says `100 nF` where the reader's says `104`.** The page's sentence, its parts
  list and its note give the code; a drawing used alone, as an SVG or a picture put elsewhere
  (ADR 0031, ADR 0042), gives the value and not the code.
- **A long value prints smaller**: `0.022` crosses the disc at about three quarters of `100`'s size.
- **The time the script prints is near the time constant, not equal to it**: it depends on where the
  RP2350's input reads high, and E9's leak bends the curve. The page says what the script does, not
  what it should print.
- **A step's words may name any pin the layout reaches**, a light's resistor's pin among them, which
  a component names already; a pin nothing reaches is still refused.
- **The disc covers the two rows above its legs on the drawing**, so a layout reaches its legs from
  below, or from the rows above the disc in the top half, as the example does from row a.
- **On a supply, a ceramic capacitor is refused** until a circuit brings a use for it there.
