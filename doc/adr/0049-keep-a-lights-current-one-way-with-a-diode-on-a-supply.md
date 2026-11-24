# ADR 0049: Keep a light's current one way with a diode, on a supply

**Status:** Accepted · 2026-11-24

## Context

The fifth new part is the diode, with the circuit that teaches it (ADR 0038): on a supply, two
buttons each light a light of their own and one they share, and two diodes keep each button from
lighting the other's light through the shared one. ADR 0039 made a diode a model from a closed list,
"several of them, chosen when the diode is taken up", ADR 0040 put its print on a tag, since lying it
is too thin to hold an upright word, and ADR 0041 placed it as a resistor is. This record settles
what is left: which models, its fields, the rule the wiring check holds it to, and its drawing. As
with the parts before it, the owner had the work go on alone, and signs the drawing off on its pull
request.

The wiring check knew a light's way as one shape: + and − joined by strips and buttons, and one
resistor between them and the light. A diode joins nothing, as a button joins two strips: it lets
current through from its anode to its cathode alone, and takes about 0.7 V doing so. The shared
light's way starts where two diodes meet, a strip that + reaches through either.

## Decision

**The part is `{ kind: "diode", model, anode, cathode }`**, and `model` is one that `src/diodes.ts`
holds: the **1N4148**, a small signal diode in an orange glass case with a black band, and the
**1N4001** and **1N4007**, the ends of the rectifier series a kit holds, in a black case with a grey
band. Any of them does on a light's way, whose few milliamperes are far below what each carries; a
circuit names the one its page lists. Its legs are three holes apart or more, in any two holes a
resistor's could be, so that its body lies between them.

**It has one use, on a supply: keeping a light's current one way.** A diode is on a light's way, the
right way round, its band towards −: between + and the light's resistor, between the resistor and
the light, or between the light and −. The wiring check reads + as reaching every strip it can
through diodes the right way round, the fewest first, and − likewise, so that a light's way is a
chain from a strip + reaches to one − reaches, through one resistor, the light and any diodes, with
nothing else on a strip between them. It holds:

1. **No diode from + straight to −**, alone or with others, with nothing held or with every button
   held: the right way round, it is a short, refused before anything else.
2. **Every diode on a light's way**: in the chain itself, or taking + one step further to where a
   light's way starts, or − to where one ends. A diode that would be on a light's way turned round is
   refused as in backwards, its band towards its button; any other, as on no light's way.
3. **Enough of the supply left for the light**: the supply's voltage, less the light's own, 2 V, or
   3 V for a blue, white, green, aqua, pink or purple one (ADR 0033), less 0.7 V for each diode on its
   way, leaves 0.5 V at least for its resistor. On the 3 V supply, a light with a diode is refused,
   saying to take 3.7 V; on 3.7 V, a 3 V light with a diode is, saying to take 4.5 V.

On a Pico it has no use yet, and is refused saying so.

**It is drawn lying, as a resistor is** (ADR 0040): its lead straight between its holes, and its case
on it, orange glass with a black band for a 1N4148, which its lead shows through, and black with a
grey band for a 1N4001 or a 1N4007, larger, the band at its cathode. Its model is printed on a tag
beside it, `1N4148`, placed as a resistor's value is and the same in every language; a resistor's tag
and a diode's keep off each other's bodies. Its colours are four tokens, the same in both themes,
each band held to 3:1 on its case, since the band is what says which way round it goes.

**The page says it**: the step's sentence, "A 1N4148 diode: its anode in g21, and its cathode, at the
band, in g18."; the parts list's line, "1N4148 signal diode, in an orange glass case." or "1N4007
rectifier diode, in a black case."; and two notes, that a diode lets current through one way only,
towards its band, and that one in backwards keeps its light dark but is not damaged; and that the
1N4148, 1N4001 and 1N4007 all do on a light's way.

The example is `examples/two-buttons-three-lights.ts`: three AA batteries, BTN1 and BTN2, each with
a light of its own, red and green, and a yellow one they share through two 1N4148s.

## Considered options

- **Three models, one glass and two black**: chosen. The 1N4148 is the diode most kits hold, and a
  1N4001 or a 1N4007 the one a reader may hold instead; each is drawn as it looks, so the drawing
  matches the part in the hand.
- **One model, the 1N4148**: rejected. A reader with a 1N4007 would have a part the page does not
  name, and nothing would tell them it does the same here.
- **The whole 1N4001 to 1N4007 series**: not now. They differ only in the voltage each blocks, and
  seven entries alike are a list to read for nothing; each is one entry, when a reader asks.
- **A Schottky diode, such as the 1N5819**: not now. It takes less voltage, which no circuit needs
  yet, and it is in the roadmap's Later with the Zener.
- **A diode only between + and a light's resistor**: rejected. A diode under a light, or between its
  resistor and its long leg, does the same, and a reader who puts it there would be refused for
  nothing.
- **Each diode required to keep two lights apart**, as the example's do: rejected. A diode in series
  with one light is a circuit that works, and the rule refuses what a reader could get wrong
  (ADR 0038), not what an example does not do.
- **No check of the voltage left**: rejected. A red light and a diode on two AA batteries glow dimly
  enough to look broken, which is the kind of failure a page should prevent.
- **A voltage for each model**: rejected. At a light's current the three take about the same, and the
  check's 0.5 V is a margin, not a measurement.
- **The model printed on its case**: rejected by ADR 0040. Lying, the case is too thin to hold an
  upright word at a quarter turn.
- **Fritzing's diode**, a black body with a grey band and its model on the body: ratsnest's is drawn
  as each model's case looks, with its model on a tag. It was not set beside ratsnest's: this
  session could not fetch Fritzing's parts.

## Consequences

- **A light's way is now any chain of diodes, one resistor and the light**, and a strip + or −
  reaches through diodes counts as + or −. Without diodes it is the shape it always was, and every
  circuit before it is checked as it was.
- **A diode across a light's resistor is refused twice**, the light as having no resistor and the
  diode as on no light's way: it takes the light's current round the resistor.
- **The example needs a light lifted over the other lights and the buttons**, which the drawing could
  not do; that is ADR 0050.
- **A Russian page carries Latin print on its tags**, `1N4148`, as it carries `NPN` (ADR 0040).
- **On a Pico, a diode is refused** until a circuit brings a use for it there.
