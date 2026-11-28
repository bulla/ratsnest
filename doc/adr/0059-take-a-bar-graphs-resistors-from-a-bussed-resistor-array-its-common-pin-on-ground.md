# ADR 0059: Take a bar graph's resistors from a bussed resistor array, its common pin on ground

**Status:** Accepted · 2026-11-28

## Context

The owner's tutorial lights its bar graph's segments through a resistor array (ADR 0058): one
standing body with a row of legs a pitch apart, five resistors each between a leg of their own and
one common leg, which is marked with a dot. This kind is called bussed; an isolated array, whose
resistors each have two legs of their own, is the other. The tutorial's has five resistors, one for
each segment, and so six legs.

A real array prints its value as a code, as a ceramic capacitor does (ADR 0051): two figures and how
many zeros follow them, `331` for 330 Ω, after a letter that says its kind, `A` for bussed, and
often a letter for its tolerance after, `A331J`.

## Decision

**The part is `{ kind: "resistorArray", ohms, resistors, common }`**: a bussed array of 2 to 10
resistors of `ohms` each, standing in one row, its common leg in `common` and one leg for each
resistor to its right, a pitch apart. It is placed as a resistor is, by its value, with no name of its
own (ADR 0041), and the value is one the code can say: two figures and the zeros after them.

**The wiring check learns its one use** (ADR 0038), a bar graph's resistors: **its common leg on
ground, and each resistor's leg on a segment's cathode**, with nothing else there, held to a light's
range, 220 Ω to 1 kΩ (ADR 0058). An array with a resistor that is not a segment's is refused. On a
supply, it is refused with the bar graph.

**It is drawn standing, seen from the side**, as a transistor is (ADR 0044): a yellow body over its
legs, larger than life, its code printed across it, `A331`, the dot over its common leg, every word
upright at every quarter turn and the same in every language (ADR 0040). Its colours are tokens, the
same in both themes, the print held to 4.5:1 on the body. It stands over the rows
above its legs, so a wire to its common strip goes in below it.

**The page says it**: the step's sentence, "A 330 Ω resistor array of 5 resistors, marked A331,
standing in one row: its common leg, under the dot, in d14, and its resistors' legs in d15 to d19, on
the second breadboard."; the parts list's line, "330 Ω resistor array of 5 resistors, bussed: 6 legs
in a row, one of them common to every resistor, marked A331."; and a note on the code, that `A331` is
330 Ω for each resistor, two figures and how many zeros follow them after an A for the shared leg,
which goes to ground.

## Considered options

- **Bussed, placed by its common leg and its value**: chosen. It is the tutorial's, it takes one
  ground wire for every segment, and one hole and the count place all its legs.
- **An isolated array, or five resistors**: rejected for this circuit. An isolated array takes five
  ground wires, and five lying resistors a pitch apart have no room for five value tags at a quarter
  turn (ADR 0054). The bar graph still takes a plain resistor on a segment, which the check holds the
  same way.
- **Its common leg at either end**: rejected, until a layout needs the other. An array goes in either
  way round, and the dot is what says which leg is common.
- **The value printed, `330 Ω`, as a can's is**: rejected. The reader's array prints its code, and
  the code is what they look for; the page gives the value beside it, as a ceramic capacitor's does.
- **Drawn from above**: rejected. Seen from above, an array is 2.5 mm thick and a print across it
  would not fit upright at a quarter turn.
- **A black body**: rejected. Black arrays are as common, but the bar graph's body beside it is dark,
  and yellow sets the two apart.

## Consequences

- **A resistor array has one use**, and is refused anywhere but a bar graph's cathodes.
- **The body hides the rows above its legs**, two of them, as a transistor's case does: the common
  strip's wire goes in below it, nearer the channel.
- **A value of three figures**, 332 Ω, **is refused**: no array's code can say it, and none is sold.
