# ADR 0039: Take each new part from a closed list of real models, each with its pinout and print

**Status:** Accepted · 2026-11-23

## Context

A page has to tell its reader what to buy, and a part of the wrong kind can go in the right holes
and not work. Transistors are the plainest case. Every small one comes in the same black TO-92
body, three legs in a row, but not with the same legs in the same order. Read with the flat face
towards you and the legs down:

| Model           | Type    | Legs, left to right |
| --------------- | ------- | ------------------- |
| 2N3904 / 2N3906 | NPN/PNP | E B C               |
| S8050 / S8550   | NPN/PNP | E B C               |
| BC547 / BC557   | NPN/PNP | C B E               |
| P2N2222A        | NPN     | C B E               |

A page that says "an NPN transistor" and is laid out E B C puts a BC547, the usual one in European
kits, in with its emitter and collector swapped. Nothing burns, but the light barely glows, and
nothing on the page says why.

## Decision

**A part that a reader buys by its model names a model from a list the engine holds.** For each
model, the engine knows its type, its legs in order, what the drawing prints on it, and its line in
the parts list; the circuit names the model, and everything else follows from it. The lists start
small and grow by one entry at a time:

- **transistors: 2N3904, NPN, and 2N3906, PNP**, a complementary pair, both E B C, so the NPN and
  the PNP are one body drawn twice;
- **diodes: several models**, chosen when the diode is taken up.

**A part that a reader buys by its value keeps its value free**, as a resistor's `ohms` is: a
capacitor names its capacitance, and the wiring check holds it to the range its use needs
(ADR 0038). Where a value needs more to be bought safely, the parts list says it, such as an
electrolytic capacitor's voltage, 16 V or more.

## Considered options

- **A closed list of models, each with what ratsnest knows of it**: chosen. The page names the part
  to buy, and the drawing and the check know its legs. It is what ADR 0032 did for a supply: each
  voltage is something real to buy, and the parts list names it.
- **The type alone, `npn`, with the parts list saying "any NPN, such as 2N3904"**: rejected. Half of
  the NPN transistors sold have the other pinout, and the page would draw legs it cannot vouch for.
- **The type alone, one pinout taken as the rule, and a warning about the others**: rejected. A
  warning in the parts list is read once, if at all, and the drawing would still be wrong for half
  the parts a reader holds.
- **A model for capacitors too**: rejected. Capacitors of one value and kind go in alike, and a
  value is what a reader looks for.

## Consequences

- **The parts list names a part to buy**, and the drawing's legs are that part's.
- **A reader who has only a BC547 cannot follow a page laid out for a 2N3904** without working out
  the swap. Adding BC547 and BC557 is one entry each, with their pinout and their print, and a
  circuit chooses which it is laid out for.
- **Each model is engine data**, tested like the rest: a new model is a change to ratsnest, and a
  minor release, not a line in a circuit file.
- **A list of one or two models looks narrow** next to a parts box. It is meant to: each entry is a
  promise the drawing keeps.
