# ADR 0041: Place a new part in its step as a resistor is, with no name of its own

**Status:** Accepted · 2026-11-23 · Amended by ADR-0043 (a part the script reads on a pin is named, as a button is)

## Context

A circuit file has two shapes for a part:

- **A named component**: a light, a button or a buzzer. It is declared once in a list at the top of
  the circuit, with an `id` and a `name` in each of the circuit's languages, and placed in a step by
  its `id`. The drawing gives it a callout past the board's end, "red LED, long leg in h15". It is
  named because the script drives it by its pin and the reader watches it.
- **An anonymous part**: a wire or a resistor. Everything about it is in the step that places it,
  `{ kind: "resistor", ohms: 330, from: "i10", to: "i15" }`. What it looks like says what it is, and
  it has no callout.

Capacitors, transistors and diodes need one of the two.

## Decision

**A new part is placed in its step as a resistor is, with no name of its own.** Its legs are named
by what they are, and its model or value is on it:

```ts
{ kind: "electrolytic", microfarads: 470, plus: "h12", minus: "h14" }
{ kind: "transistor", model: "2N3904", emitter: "e10", base: "e11", collector: "e12" }
{ kind: "diode", model: "1N4001", anode: "i8", cathode: "i13" }
```

The engine writes the step's sentence from them, "A 2N3904 NPN transistor: emitter in e10, base in
e11, collector in e12", and what is printed on it is what tells it apart on the drawing (ADR 0040).
The exact names of each kind and its fields are settled when that part is taken up.

## Considered options

- **Anonymous, as a resistor**: chosen. No new list at the top of a circuit, no `id` to keep in
  step with the part that refers to it, and no callout to fit past the board's end. A capacitor or a
  transistor is neither driven by name nor watched, and its print says what it is.
- **Named, as a light**: rejected. Every new kind would add a list at the top of the circuit and a
  callout to the drawing; the capacitor tester alone would want six callouts, two transistors, two
  capacitors and two lights, where the column past the board's end holds about nine. Its names,
  `T1` or `C2`, would be the only thing the list adds.
- **Anonymous, with an optional name**: not now. A name a circuit may give is a second way to say
  one thing, and no circuit needs one yet. Added later, it is an addition to the format, a minor
  release and no migration.

## Consequences

- **A circuit's own words point at a part by the step that places it**, since they write no value
  (ADR 0011) and the part has no name: the capacitor tester places the capacitor to test in a step of
  its own, and its `test` says to swap that one. The reference designators of a schematic, `T1`,
  `C1`, `R1`, do not appear on the page.
- **Two parts alike in one step cannot be told apart in its words** except by the holes the engine's
  sentences give them.
- **A new part has no callout**, so a reader finds it on the drawing by its print and by the step
  that picks it out.
