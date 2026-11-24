# ADR 0053: Let the Pico read a slide potentiometer, lying across both breadboards

**Status:** Accepted · 2026-11-24

## Context

The eighth new part is the slide potentiometer, with the circuit that teaches it (ADR 0038): the
owner chose day 7 of The Pi Hut's Let it Glow Maker Advent Calendar, read from an extract of its page
the owner saved. On a Pico, a 10 kΩ slide potentiometer, 45 mm long, has one end on 3V3(OUT), its wiper on GP28,
and its other end on ground, and the script reads it and lights the two addressable RGB LEDs of the
calendar's day 6. It is too long for one breadboard: its two legs at one end, the back, go
in the second breadboard, and its one leg at the other end, the front, in the first.

The roadmap left four questions to this record: how a circuit names an analogue pin, a part with legs
on both boards, its real legs and their spacing, and how its page credits the tutorial,
whose words and code it does not copy. As with the parts before it, the owner had the work go on
alone, and signs the drawing off on its pull request.

The tutorial's drawing places its back legs in row j of the second board, two columns
apart, and its front leg in row f of the first, in the column of one of them: seventeen rows along,
counting across the two boards' edges, 43.18 mm. Lying along a row instead, the two legs at one end
would share a strip, which is why it lies across. Its readers' commonest mistake was the wires to
the two back legs swapped, the wiper on 3V3 and an end on the pin.

## Decision

**The part is `{ kind: "slidePotentiometer", ohms, wiper, end, otherEnd }`**, placed in its step as a resistor
is, with no name of its own (ADR 0041). It is bought by its value, which is free (ADR 0039) and held
to **1 kΩ to 100 kΩ**: 3.3 mA through it at most, and low enough for the Pico's analogue input to read
it steadily. **Its legs are as the tutorial places them**: its wiper and the end beside it two holes
apart in one row, and its other end in that end's column, 17 rows along it, on the other breadboard.
Its body lies over the holes between its legs, across their three columns, rails included, and a leg
in one of them is refused, as one under a button's body is.

**A circuit names no analogue pin**: its wiper is on whichever pin the layout wires it to,
as a ceramic capacitor's pins are (ADR 0051), and a step's words may name it. The wiring check holds
it to an analogue one.

**It has one use, on a Pico: being read.** The wiring check holds every slide potentiometer on a
Pico to it:

1. **Its wiper on neither 3V3(OUT) nor ground**: either is refused first, as the wiper and an end
   swapped, saying which leg goes where. Wired so, the wiper would join 3V3(OUT) to ground at one end
   of its travel.
2. **One end on 3V3(OUT) and the other on ground**, either way round, which only turns the reading
   over.
3. **Its wiper straight on one GPIO, and an analogue one**, GP26, GP27 or GP28, with nothing else on
   it.
4. **Its value from 1 kΩ to 100 kΩ.**

On a supply it is refused, as a part that needs a Pico.

**It is drawn lying, seen from above**: a dark metal body between its legs, which show past its ends,
the slot along its middle, and the pale cap on its knob across the slot, halfway along. **Its value
is printed on its body** as a resistor's tag writes it, `10 kΩ`, between the knob and its other end,
upright at every quarter turn and the same in every language (ADR 0040), since its body is wide
enough to hold it. A value tag keeps off its body. Its four colours are tokens, the same in both
themes, the cap held to 3:1 on the body and the value to 4.5:1.

**The page says it**: the step's sentence, "A 10 kΩ slide potentiometer, lying across both
breadboards: its wiper in a8 (GP28, pin 34), the end beside it in a6 (3V3(OUT), pin 36), and its other
end in e6 on the second breadboard."; the parts list's line, "10 kΩ slide potentiometer, 45 mm long,
with two legs at one end and one at the other, and a cap for the knob."; and a note saying which leg
is the wiper, where each leg goes, and what the wiper on 3V3(OUT) would do. The test step picks it
out, since the reader slides it.

**The tutorial is credited in the circuit's description**, where a reader meets it first: "The
circuit follows day 7 of The Pi Hut's Let it Glow Maker Advent Calendar." The `credit` stays the one
the `circuit` skill writes, which credits the drawing and the font (ADR 0035). The page's words, its
layout and its script are ratsnest's own.

The example is `examples/colours-on-a-slider.ts`: the slider's wiper and the end beside it straight in
the strips of GP28 and 3V3(OUT), its other end on the second breadboard, grounded by a jumper, and two
RGB LEDs on the second breadboard, on GP22 and GP17, which the script colours from the reading.

## Considered options

- **`slidePotentiometer` as its kind**: chosen, at the owner's asking. It pairs with
  `slideSwitch`, the same form for another use, so the two cannot be taken for each other, and a
  rotary potentiometer would sit beside it by its own name.
- **`slider` as its kind**: rejected. It reads as the slide switch as readily as the potentiometer,
  and a slide switch's moving part is called its slide.
- **`fader`**: rejected. It is the owner's own word for it, but an audio one, less known to a reader
  new to electronics, and unrelated to a rotary potentiometer's name.
- **The legs as the tutorial places them**: chosen. They are what a reader following the calendar
  has, and the one geometry its drawing shows; the check holds every slide potentiometer to it.
- **Its real legs, measured**: not done. This session has none to measure, and only
  the tutorial's drawing to go by; the owner, who has one, checks it on the pull request.
- **An analogue pin kind, `{ kind: "adc", gpio: 28 }`, on a component named in the circuit**: rejected.
  A slide potentiometer is placed as a resistor is, with no name of its own (ADR 0041), and the wiring already
  says which pin its wiper is on, as it does for a ceramic capacitor's.
- **A closed list of models** (ADR 0039): rejected. A slide potentiometer is bought by its value and its
  length, and ratsnest knows one length, which the shape check holds.
- **The value printed as its code, `B103`**: rejected, as the ceramic capacitor's code was on
  its disc, at the owner's choice: the value is written as the drawing writes a resistor's.
- **The value on a tag beside it**: rejected. Its body is wide enough to hold it, at every quarter
  turn.
- **Drawn standing, from the front**: rejected. It lies flat, and what a reader looks at is its slot
  and its knob.
- **The knob drawn at one end of its travel**: rejected. Halfway is where it is neither end, and the
  test says what each end reads.
- **Its wiper on any pin**: rejected. Only GP26 to GP28 read a voltage on a Pico 2 W, and a reader of
  the tutorial's comments moved theirs to GP27 to mend one; the check names the three.
- **The tutorial in the `credit`**: rejected. The examples carry the skill's credit, which is about
  the drawing's licence, and a description is read before a footer.
- **The RGB LEDs on GP2, as the tutorial's code has one**: rejected. GP2 is on the Pico's far row,
  and its wire would cross the Pico; GP22 and GP17 are on the row the second breadboard is beside.

## Consequences

- **Every circuit with a slide potentiometer draws both breadboards**, and its body hides three columns of holes
  across both boards' edges, rails and all.
- **One slide potentiometer fits**: one of another length, or with its legs placed otherwise, is refused until
  ratsnest learns it, which is a change to this record.
- **A step's words may name the wiper's pin**, as they may a ceramic capacitor's, though no component
  is on it.
- **The example's pins differ from the tutorial's** for its RGB LEDs, so a reader following both
  rewires them.
- **On a supply, a slide potentiometer is refused** until a circuit brings a use for it there: a
  dimmer would be a rule of its own.
