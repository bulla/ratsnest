# ADR 0006: Describe each circuit in one TypeScript file, with what it is and where it goes

**Status:** Accepted · 2026-11-20

## Context

scratchpi described a circuit in two places. Its record, in `circuits.ts`, said what was on which
pin, and carried what scratchpi's app needed besides: which blocks the palette showed, and ids that
saved programs depended on. Its layout, in `layouts.ts`, placed each part in holes, step by step,
with a test script. A test wired the layout up and compared it with the record.

ratsnest has no app (ADR 0001), and its pages are generated from whatever describes a circuit
(ADR 0004).

## Decision

**Each circuit is one TypeScript file, `circuits/<name>.ts`, named for the circuit**, holding:

- **what it is**: its name, a sentence saying what it does, and what is on the Pico's pins, each
  light, button and buzzer and the pin it is on;
- **where it goes**: the steps to build it, each placing its parts in holes named the way the
  breadboard prints them, `a21` or `top-19`, with a title and, where it helps, a note;
- **its test script**: the MicroPython the page offers (ADR 0004).

**The wiring check keeps comparing the two halves.** It wires up where the parts go and fails if the
result is not what the file says the circuit is. The sentences that name holes are written by the
engine from the parts, so a step's title and note say what the parts cannot, and never name a hole.
What scratchpi's record carried for its app is gone.

How the file is written, and what may be in it, is ADR 0007.

## Considered options

- **One TypeScript file with both halves**: chosen. Adding a circuit is writing one file, and the
  part types that came with the copy check every field of it.
- **Two shared files for every circuit, as in scratchpi**: rejected. A circuit would be read in two
  places that a test then has to hold together, when the two halves are about the same thing.
- **Only where the parts go**: rejected. The check could still find a short, but not an LED on GP16
  that should be on GP15, which is the mistake a reader cannot see for themselves.
- **JSON or YAML**: rejected. It needs a schema and a validator of its own to do what the types do
  for free, and it allows no comments, where a circuit's reasons (why this pin, why that hole)
  belong beside it.

## Consequences

- **Adding a circuit means writing TypeScript**, not filling in a form.
- **The test script is written by hand**, and nothing checks yet that it drives the pins the file
  declares.
- **The kinds of part come with the copy**: wires, resistors, LEDs, buttons, buzzers, the RGB LED
  and the ring. A new kind is a change to the engine (ADR 0007), not to a circuit.
- **How a file holds its words in more than one language** is decided with the languages.
