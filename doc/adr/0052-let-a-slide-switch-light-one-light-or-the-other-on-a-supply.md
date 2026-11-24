# ADR 0052: Let a slide switch light one light or the other, on a supply

**Status:** Accepted · 2026-11-24

## Context

The seventh new part is the slide switch, with the circuit that teaches it (ADR 0038): on a supply,
an SPDT slide switch's middle leg on +, and each outer leg on a light's way, so that one light or the
other is lit, and stays lit when let go, which a push button cannot do. The owner chose the SPDT
slide switch, and the roadmap left two questions to this record: a model whose legs fit the
breadboard's 2.54 mm pitch, and which way its slide is drawn. This record settles those and what is
left: its fields, its rule and its drawing. As with the parts before it, the owner had the work go on
alone, and signs the drawing off on its pull request.

The wiring check of a circuit with a supply judged every light with every button held, which joins
the most any button can (ADR 0033). A slide switch is not a button: it joins its middle leg to one
outer leg or to the other, never both and never neither, once it is slid, and the two ways light
different lights.

## Decision

**The part is `{ kind: "slideSwitch", left, middle, right }`**, its three legs side by side in one
row, left to right, as a transistor's are (ADR 0044), placed in its step as a resistor is, with no
name of its own (ADR 0041). Its slide joins `middle` to `left` or to `right`, whichever way it is
pushed, and it goes in either way round, front or back. It has no model: every SPDT slide switch has
its common leg in the middle, so the one thing to buy right is legs that fit, and the parts list says
it, "SPDT slide switch, its three legs 2.54 mm apart, as a breadboard's holes are."

**It has one use, on a supply: lighting one light or the other.** The wiring check reads every way
the slide switches can be set, each slid towards its left leg or its right one, and judges each
light at the first way that wires it from + through one resistor to −, every button held; a resistor
a light takes at any way is that light's. It holds:

1. **No short at any way it can be slid**: + joined to −, with nothing held or every button held, is
   refused saying which way the switch was slid.
2. **Each outer leg on a light's way**: slid towards either outer leg, with every button held, the
   switch lights a light that slid the other way it does not. An outer leg that lights nothing of its
   own is refused saying which.
3. **Its legs side by side**, its middle leg between the other two, a pitch from each.

Its middle leg may be on +, as the example's is, or anywhere on a light's way: a resistor on its
middle leg, which the light each way lights shares, is as good as one on each outer leg. A diode, a
button and a capacitor are judged at every way as they were with one, so a circuit with no slide
switch is checked exactly as before. On a Pico it has no use yet, and is refused saying so.

**It is drawn standing, seen from the front**, as the transistor and the capacitors are: a metal
shell on a black base, 8.6 mm wide, standing 1.2 mm above the board on its three legs, which come
straight down to their holes a pitch apart, and its black slide on top, in a slot along it. **The
slide is drawn towards its left leg**, to which it joins the middle one: a drawing shows the switch
one way, and the page's test says what each way does. Nothing is printed on it, so nothing needs
turning upright. It stands over the rows above its legs, a value tag keeps off it, and a light's
leader rises over it (ADR 0050). Its three colours are tokens, the same in both themes, the slide
held to 3:1 on the shell, since where it sits says which way the switch is set.

**The page says it**: the step's sentence, "A slide switch, either way round: its middle leg in f15,
one outer leg in f14 and the other in f16."; the parts list's line; and a note, that a slide switch
joins its middle leg to one outer leg or the other, whichever way its slide is pushed, and stays so
when let go, where a push button joins its legs only while held. The test step picks the switch out,
since the reader slides it.

The example is `examples/one-light-or-the-other.ts`: three AA batteries, the switch's middle leg on +,
a red light on its left leg's way and a green one on its right's.

## Considered options

- **Three legs named by place, `left`, `middle` and `right`**: chosen. A layout is written as the board
  is seen at 0°, as a transistor's legs are, and the drawing's slide needs one end to be towards.
- **The middle leg and the two others as a pair, `ends: [a, b]`**: rejected. It is one more shape for
  the field checks and the printer, for two legs that differ only in which end the slide is drawn at.
- **A model from a closed list, such as the E-Switch EG1218** (ADR 0039): rejected. Every SPDT slide
  switch has the same legs in the same order, which is what a model is for; the list would name a
  part where any of a dozen alike would do, and the parts list says what matters, the pitch.
- **Judging every light with the switch's middle leg joined to both outer legs at once**, as every
  button held joins the most: rejected. It is a state no slide switch is ever in, and it would refuse
  a resistor shared on the middle leg, which works, and miss a short only one way makes.
- **The middle leg required on +**: rejected. A switch between a light's resistor and the light does
  the same, and the rule refuses what a reader could get wrong (ADR 0038), not what the example does
  not do.
- **Drawn from above, its slot and slide seen flat**: rejected. Its legs would be hidden under its
  body, and every other part that stands is drawn from the front, standing over the rows above it.
- **The slide drawn in the middle of its slot**: rejected. No slide switch rests there, and the reader
  would be shown a switch that matches neither way.
- **A toggle switch**: not now. It is in the roadmap's Later; its lever stands up out of the board,
  and its legs are rarely a pitch apart.
- **Fritzing's slide switch**, seen from above: ratsnest's is seen from the front, as its other
  standing parts are. It was not set beside ratsnest's: this session could not fetch Fritzing's parts.

## Consequences

- **The supply check is run once for each way the switches can be set**, twice for one switch, four
  times for two: still nothing next to a page's making, but it grows as two to the switches' number.
- **A step's words cannot say which way to slide it**, since they name no hole; the test says what
  one way and the other do, and the drawing shows it towards its left leg.
- **The switch stands over the rows above its legs**, so a layout reaches its legs from below, as the
  example does, or from the rows above it in the top half.
- **A switch on a Pico is refused**, until a circuit brings a use for it there: a pin reading it would
  be a rule of its own, as the DIP switch's will be.
- **No new value is checked**: the lights' resistors are held to the range they always were.
