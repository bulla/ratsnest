# ADR 0045: Let two NPN transistors flash two lights on a supply, and test a capacitor

**Status:** Accepted · 2026-11-23

## Context

The owner brought the fourth circuit: a capacitor tester and flasher, from a schematic of a
two-transistor astable multivibrator on 3 V. Two NPN transistors each light a light on their
collector; each one's base is fed from + through a large resistor; and a capacitor runs from each
one's collector to the other's base, + towards the collector. Each time one transistor turns on, the
capacitor from its collector pulls the other's base below its emitter and holds it off, until the
base resistor has charged it again: the two lights flash in turn. One of the two capacitors is the
one under test: a good one keeps the lights flashing, and a larger one holds its transistor off for
longer; an open or a shorted one stops them.

It needs the electrolytic capacitor (ADR 0042) and the 2N3904 (ADR 0043) together, on a supply,
where neither had a use. As with the parts before it, the owner had the work go on alone.

## Decision

**A transistor may be placed in a circuit with a supply**, and has one use there: half of a
flasher. The wiring check holds every transistor on a supply to it:

1. **An NPN.** A PNP on a supply is refused, with no use there yet.
2. **Its emitter on −.**
3. **A light on its collector**, from + through one resistor of 220 Ω to 1 kΩ, on either side of the
   light, its long leg towards +, as on a Pico.
4. **Its base fed from + through one resistor of 10 kΩ to 100 kΩ.** A flasher's base resistor sets
   its beat with its capacitor, and is larger than a switch's on a Pico (ADR 0043). At 3 V, 47 kΩ
   lets 49 µA into the base, which a 2N3904 turns into a light's few milliamperes.
5. **One capacitor from the other transistor's collector to its base**, its + leg towards the
   collector and its stripe towards the base.
6. **A beat that can be seen**: its base resistor and its capacitor hold it off for about 0.69 times
   the two, which is 0.1 s at least, or the lights blur into one, and 5 s at most, or they seem to
   have stopped.

Each transistor's rule names the other only as "another transistor's collector", so two of them,
each held to it, are the flasher.

**A capacitor on a supply has two uses now**: from a collector to a base, as above, or keeping a
light lit (ADR 0042), which every other capacitor is still held to.

**The page notes the flasher's base resistor's range** in place of a switch's, in the note on a
transistor's base resistor.

**The example is `examples/capacitor-tester.ts`**: two AA batteries, two 2N3904s, a red light and a
yellow one through 220 Ω, two 47 kΩ base resistors, and two capacitors, 10 µF and 22 µF. The 22 µF
one is the one to test, and is placed in a step of its own, whose title says so, so that the
circuit's words point at it without a value or a name (ADR 0011, ADR 0041). Every part stands in row
f, where what it stands over is the channel and the empty top half, and its legs are reached from
the rows below.

## Considered options

- **Each transistor held to its half, the pair implied**: chosen. One rule for each transistor, as
  every other rule is for one part, and two of them make the circuit.
- **The multivibrator as one shape the check looks for whole**: rejected. It is the same rules
  written for two parts at once, and the problems it finds would name the circuit rather than the
  part that is wrong.
- **The capacitor under test as a part of its own, a socket or two wires to clip a capacitor to**:
  rejected. It is a capacitor like any other on the board; the step that places it says which one
  it is, and the circuit's `test` says what to do with it.
- **The schematic's values, as its page gives them**: not known. This session could not reach the
  page, and the values above were worked out for two AA batteries and red and yellow lights.
- **A range for the base resistor alone, as for a switch**: not enough. What a reader sees is the
  beat, which the resistor and the capacitor make together, so the beat is what is held to a range.
- **A PNP flasher**: not now. It is the same circuit upside down, and no circuit asks for it.

## Consequences

- **A reader can test an electrolytic capacitor** with two AA batteries and the parts in a starter
  kit, and see a flasher work.
- **On a supply, a transistor is always half of a flasher.** A transistor that a button switches,
  for instance, is refused until a circuit brings that use.
- **The 3 V supply lights only red, amber, orange and yellow lights**, as before (ADR 0033), so the
  example's lights are red and yellow.
- **The example's red light's leader would run behind both transistors and both cans** to its label,
  which ADR 0046 lifts over them.
