# ADR 0054: Let the Pico read a DIP switch's switches, each from ground through its own pull-up

**Status:** Accepted · 2026-11-24

## Context

The ninth new part is the DIP switch, with the circuit that teaches it (ADR 0038): the owner chose
day 5 of The Pi Hut's Let it Glow Maker Advent Calendar. On a Pico, a five-way DIP switch sits across
the channel, every top leg on 3V3(OUT) and each lower leg on a pin of its own, switch 1 on GP6 to
switch 5 on GP2, and the script prints which switches are on. The tutorial holds each pin low with
the Pico's own pull-down.

On the Pico 2 W that cannot be relied on: the RP2350's erratum E9 leaks current into an input whose
voltage is between low and high, and a pin held only by its own pull-down can sit near 2.2 V and read
high, so a switch turned off can read on. ratsnest's buttons have an external pull-down of 1 kΩ to
8.2 kΩ for that reason. The roadmap left this record to choose between five such pull-downs and the
switches wired to ground with the Pico's own pull-ups, to say where it sits, and to say how its page
credits the tutorial, whose words and code it does not copy. As with the parts before it, the owner
had the work go on alone, and signs the drawing off on its pull request.

## Decision

**The part is `{ kind: "dipSwitch", switches, column, board }`**: 2 to 8 switches side by side across
the channel, their legs in rows e and f, switch 1 in `column` and the rest to its right, its ON side
towards row a. It is placed as a button is, by its column, on the second breadboard with `board: 2`
(ADR 0028), with no name of its own (ADR 0041). It has no model: every DIP switch of so many switches
has its legs 2.54 mm apart in two rows 7.62 mm apart, and is bought by how many it has.

**Each switch goes from ground to a pin of its own, which the script pulls up inside the Pico.** The
Pico's own pull-up is not hurt by E9: a pin held high reads high until its switch joins it to ground.
A switch on reads 0, and the script turns that round. The wiring check holds every DIP switch on a
Pico to it, switch by switch:

1. **No leg on 3V3(OUT)**: refused first, saying that each switch goes from ground to a pin the
   script pulls up, since the Pico's pull-downs cannot be relied on (erratum E9). It is how the
   tutorial wires it, and the message says why ratsnest does not.
2. **One leg straight on ground**, and not both.
3. **The other leg straight on one GPIO**, with nothing else on it.
4. **Every switch on a pin of its own.**

A switch joins a pin to ground by design, so the check for shorts never closes one. On a supply a DIP
switch is refused, as a part that needs a Pico.

**It is drawn lying, seen from above**: a blue body between its two rows of legs, whose ends show past
its edges, a dark window over each switch with its white slide in it, drawn off, at the end away from
ON, **ON printed along its top edge between switches 1 and 2, and each switch's number along its
bottom edge**, every word upright at every quarter turn and the same in every language (ADR 0040).
Its four colours are tokens, the same in both themes, each slide held to 3:1 on its window, since
where it sits says whether the switch is on, and the print to 4.5:1 on the body.

**The page says it**: the step's sentence, "A 5-way DIP switch across the channel, its ON side towards
row a: switch 1 in e13 and f13, and switch 5 in e17 and f17, on the second breadboard."; the parts
list's line, "5-way DIP switch, with its legs in two rows 7.62 mm apart, to go across the channel.";
and a note, that each switch joins its legs while on, goes from ground to a pin the script pulls up,
reads 0 while on, and why not to 3V3(OUT). The test step picks it out, since the reader turns its
switches.

**The tutorial is credited in the circuit's description**, as the slide potentiometer's is
(ADR 0053), which also says that its switches go to 3V3, which the Pico 2 W cannot hold low on its
own. The page's words, its layout and its script are ratsnest's own.

The example is `examples/five-switches.ts`: a five-way DIP switch across the second breadboard's
channel, its top legs to that breadboard's top − rail, fed from one of the Pico's GND pins, and its
lower legs to GP22, GP21, GP20, GP19 and GP18, on the row of the Pico the second breadboard is beside.

## Considered options

- **Each switch to ground, read through the Pico's own pull-up**: chosen. It needs no part the
  tutorial does not have, E9 does not touch it, and it teaches a pull-up, which no circuit had.
- **Five external pull-downs, of 1 kΩ to 8.2 kΩ, as a button has**: rejected. Five resistors a pitch
  apart have no room for five value tags at a quarter turn, which the crowding check holds, and they
  are five parts the tutorial does not have.
- **The tutorial's own pull-downs**: rejected by E9. A switch turned off can read on, and nothing on
  the page would say why.
- **The tutorial's pins, GP6 to GP2**: rejected. They are on the Pico's far row from the second
  breadboard, and five wires from it would cross the Pico.
- **The DIP switch on the first breadboard, past the Pico**: rejected. Its five wires to the Pico's
  pins would run along the same rows and cross, and five arching jumpers would peak on top of each
  other.
- **Its legs named hole by hole**: rejected. Ten legs would be ten fields the check holds to one shape;
  a column says them all, as a button's columns do.
- **A closed list of models** (ADR 0039): rejected. DIP switches of one size are alike, and bought by
  how many switches they have.
- **Its slides drawn on**: rejected. The step asks for them off before it goes in, and the test asks
  the reader to turn them on.
- **ON printed in its corner, beside switch 1**: rejected. Turned a quarter, the upright word ran into
  switch 1's window.
- **A red body**, as many are: rejected. It is near the + rail's and the power wires' red; a blue body
  is as common, and a body is not a line.
- **Fritzing's DIP switch**: it was not set beside ratsnest's: this session could not fetch
  Fritzing's parts.

## Consequences

- **A reader following the tutorial wires the switches the other way**, to ground, and the script
  reads 0 for on; the description and a note say so, and the check refuses the tutorial's 3V3 with a
  reason.
- **Every switch takes a pin**, and five take five GPIOs.
- **The check for shorts does not close a DIP switch**, so a switch from 3V3(OUT) to ground is caught
  only by the DIP switch's own rule, which refuses any leg on 3V3(OUT).
- **On a supply, a DIP switch is refused** until a circuit brings a use for it there: a switch per
  light would be a rule of its own.
- **The LED bar graph and the resistor array**, which the tutorial's later activities light from the
  switches, stay in the roadmap's Later.
