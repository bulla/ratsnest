# ADR 0033: Check a supply circuit's wiring against its + and − rails

**Status:** Accepted · 2026-11-22

## Context

The wiring check (`src/netlist.ts`) holds a Pico circuit to rules written around the Pico's pins:

- a light runs from its pin through one resistor to ground;
- a button is between its pin and 3V3, open until pressed, with a pull-down to ground;
- no pin is joined to ground, pressed or not, and no two pins are joined while nothing is pressed;
- a wire's colour is what it carries;
- nothing has a leg in a net that joins nothing.

A supply circuit (ADR 0032) has no pin. Its + and − are the rails the supply's leads are in, and
its buttons switch the current to its lights themselves. One of its supplies, a Li-Po cell, can
drive tens of amperes through a short.

## Decision

**The check holds a supply circuit to the rules of the Pico circuit's kind, written around the
supply's + and − rails:**

1. **Every leg where it can go**, as in any circuit: in a hole that exists, one leg to a hole, and
   nothing under a button's body. The supply's two holes are taken like any leg's.
2. **Every light the right way round, between + and −, through exactly one resistor of 220 Ω to
   1 kΩ**, the range a light has on a Pico's pin, with buttons on its way if it has any.
3. **Every button on some light's way**, on either side of the light. A button that switches
   nothing is refused.
4. **No short: + never joined to −, with every button held.** Pressing a button only ever joins
   two nets, so a short that any buttons make, all of them held makes too.
5. **A wire's colour is what it carries**: red on +, black on −, yellow anything else, such as the
   line from a button to its light.
6. **On the 3 V supply, a light that needs about 3 V is refused**: blue, white, green, aqua, pink
   and purple, whose 5 mm LEDs are made the way a blue one is. Red, amber, orange and yellow need
   about 2 V. The problem says to take 4.5 V or another colour.
7. **Nothing has a leg in a net that joins nothing**, as in any circuit.

The range of the second rule is safe on every supply: at 5 V, a red light through 220 Ω draws
about 14 mA, under the 20 mA a 5 mm LED is made for; on a Li-Po cell full, at 4.2 V, about 10 mA;
and at 3 V, through 1 kΩ, about 1 mA, dim and lit.

## Considered options

- **The Pico circuit's rules, written around + and −, the light's range kept, and the 3 V rule**:
  chosen. One range for both kinds of circuit, safe at all four voltages, and one table of colours.
- **A current worked out for each light**, from its colour's forward voltage and the supply's, and
  held to a range of currents: rejected for now. It is more exact, but it needs every colour's
  forward voltage, and the range it would replace is safe already.
- **The short alone**: rejected. A page would show a circuit whose lights stay dark.
- **The short sought in every combination of buttons**: not needed. All of them held is the most
  any combination joins.
- **Green allowed at 3 V**: rejected. Some green LEDs are the older kind that needs about 2 V, but
  the kits sold today mostly hold the kind that needs about 3 V, which would not light.

## Consequences

- **A supply circuit that passes lights every light and shorts nothing**, with any of its buttons
  held: the wiring check's part in keeping a Li-Po cell safe.
- **An older green LED is refused at 3 V** though it would light. A circuit with one takes 4.5 V.
- **The same resistor lights a light more brightly at 4.5 V than at 3 V.** The page's note that any
  resistor in the range works for a light stays true.
- **The check cannot say what a button does to a light**, only that it is on the light's way. A
  circuit's `test` says it in words, which no check reads, as `scriptDoes` does.
- **The wiring check has two sets of rules**, one for each kind of circuit, sharing the rules on
  placing parts, on wires' colours and on legs that join nothing.
