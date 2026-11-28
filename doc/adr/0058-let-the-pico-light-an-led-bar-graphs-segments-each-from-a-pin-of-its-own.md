# ADR 0058: Let the Pico light an LED bar graph's segments, each from a pin of its own

**Status:** Accepted · 2026-11-28

## Context

The owner asked for an LED bar graph lit through a resistor array, after a tutorial they chose. Its
bar graph has five segments, each an LED of its own in one body, with its anode on one row of legs and
its cathode on the other, 7.62 mm apart, so that it sits across the channel as a DIP switch does
(ADR 0054). Each segment's anode goes to a pin of its own, GP13 to GP9, and each cathode to ground
through one of the five resistors of a resistor array (ADR 0059). The script lights them in turn, at
random, and as a counter.

A bar graph is bought by how many segments it has and their colour, as a DIP switch is bought by how
many switches it has. A segment is a light like any other, and takes the resistor a light does,
220 Ω to 1 kΩ. Which row of legs is the anodes' is not the same on every bar graph sold, and few
mark it plainly.

The tutorial's pins, GP13 to GP9, are on the Pico's row beside the first breadboard's bottom half.
Only two rows of that half are free below the Pico, so five wires from them to a bar graph past the
Pico would lie over each other's ends, as the DIP switch's first layout found (ADR 0054).

## Decision

**The part is `{ kind: "barGraph", segments, colour, column, board }`**: 2 to 10 segments side by
side across the channel, their legs in rows e and f, segment 1 in `column` and the rest to its right,
**its anodes in row f** and its cathodes in row e, in one of a light's colours. It is placed as a DIP
switch is, by its column, on the second breadboard with `board: 2` (ADR 0028), with no name of its
own (ADR 0041). It has no model: bar graphs of one size and colour are alike.

**The wiring check learns its one use** (ADR 0038), segment by segment, each a light:

1. **The anode straight on one GPIO of its own**, with nothing else on it.
2. **The cathode to ground through one resistor of a light's range**, 220 Ω to 1 kΩ, with nothing
   else on the net between: a resistor, or one of a resistor array's (ADR 0059).
3. **The segment the right way round**: a cathode on a pin, or an anode on ground, is refused saying
   that its anodes are in row f.

On a supply, a bar graph is refused until a circuit brings a use for it there.

**It is drawn lying, seen from above**: a dark body between its two rows of legs, whose ends show
past its edges, a window over each segment lit in its colour in the test step and dark before it,
and a corner cut off its body beside segment 1's anode, as many real ones have, drawn larger than
life (ADR 0040). It prints nothing: its segments say what it is, and the page says which row its
anodes go in.

**The page says it**: the step's sentence, "A 5-segment red LED bar graph across the channel, its
anodes in row f: segment 1 in f15 and e15, and segment 5 in f19 and e19, on the second breadboard.";
the parts list's line, "5-segment red LED bar graph, with its legs in two rows 7.62 mm apart, to go
across the channel."; and a note, that the anodes' side is not marked alike on every bar graph, that
a segment in backwards only stays dark, and to turn it round if none lights. The test step picks it
out, since the reader watches it.

The example is `examples/level-meter.ts`: a five-segment bar graph on the second breadboard, its
anodes wired straight down to GP21, GP20, GP19, GP18 and GP17, its cathodes through a resistor array
to ground, and a script whose bar rises a segment at a time and falls back.

## Considered options

- **Placed by its column, as a DIP switch is, anodes in row f**: chosen. It is a DIP switch's shape,
  and one field says all its legs.
- **Its anodes' row a field, `e` or `f`**: rejected, until a layout needs the other way. Row f is
  towards the Pico on the second breadboard, where its wires come from, and towards the Pico's own
  bottom row on the first.
- **Each segment a light of the circuit's, named in its `leds`, with its pin**: rejected. Ten
  segments would be ten names, ten callouts past the board's end, where about nine fit, and a part
  that is one body would read as many.
- **The tutorial's pins, GP13 to GP9, on the first breadboard**: rejected. Two free rows below the
  Pico take two wires to a bar graph past it, not five, and five arching jumpers peak on top of each
  other, as ADR 0054 found for the DIP switch. On the second breadboard the Pico's top row is right
  below the bar graph, and its five wires run straight, from GP21 to GP17.
- **A closed list of models** (ADR 0039): rejected. Bar graphs of one size and colour are alike, and
  which row is the anodes' is the one thing that differs, which no model number says either.
- **Its segments drawn lit in every step**: rejected. A light is dark until the test step (ADR 0004's
  page), and a bar graph is lights.
- **`+` printed on its anodes' side**: rejected. No real bar graph prints it, and a reader looking
  for it on theirs would not find it.

## Consequences

- **A reader following the tutorial wires other pins**, GP21 to GP17, on a second breadboard; the
  description says which, and the page draws them.
- **Every segment takes a pin**, and five take five GPIOs.
- **A bar graph whose anodes are on its other side lights nothing** when put in as the page draws
  it. Nothing burns, and the note says to turn it round.
- **On a supply, a bar graph is refused**, as a DIP switch is.
- **Lit from the DIP switch**, as the tutorial's later activities do, it is one more circuit, with
  both parts on the second breadboard, in the roadmap's Later.
