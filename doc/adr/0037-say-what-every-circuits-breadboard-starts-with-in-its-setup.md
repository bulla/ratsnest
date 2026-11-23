# ADR 0037: Say what every circuit's breadboard starts with, in its `setup`

**Status:** Accepted · 2026-11-23 · Amends ADR-0032 (a supply's voltage and rails are in the circuit's `setup`), ADR-0034 (the two shapes are told apart by their `setup`) and ADR-0036 (format 2 carries the `setup`, and the migration from format 1 writes it)

## Context

A circuit's breadboard is set up with a Pico 2 W across its middle (ADR 0002), which its page puts in
first, or with a supply on one pair of rails in the Pico's place (ADR 0032), which its page connects
last, and every part is placed around it. A circuit file says which
only by what it leaves out: a file with a `supply` is a supply circuit, and one without is on a Pico
(ADR 0034). Nothing in a Pico circuit names the Pico.

The owner wants the start written in every circuit file, as a field it cannot leave out, and means
to have other boards to start from: the roadmap's Later has the rest of the Pico family and a
full-size breadboard.

Format 2 (ADR 0036) is on `develop`, and no release has carried it yet, so a field it requires
breaks no file anyone has.

## Decision

**Every circuit says what its breadboard starts with, in a required `setup`**, written after its
format: an object whose `kind` names the start, as a part's and a pin's `kind` says what they are,
with whatever that start needs beside it.

- `setup: { kind: "pico" }`: a Pico 2 W across the middle of the breadboard (ADR 0002).
- `setup: { kind: "supply", volts: 3, rails: "bottom" }`: a supply on one pair of rails, its voltage
  and its rails as ADR 0032 has them. The circuit's own `supply` field goes.

**`setup` is in `CircuitBase`**, and each shape narrows it: a `PicoCircuit`'s is a `PicoSetup`, and a
`SupplyCircuit`'s a `SupplySetup`. Its `kind` is what tells the two shapes apart, for an editor as
for the engine (ADR 0034).

**`rnest check` reads the `setup` right after the format.** A circuit without one, or whose `kind`
it does not know, is refused with what to write, and nothing else in it is checked, since the setup
decides what every other field may be.

**A new start is a new `kind`**, with what it needs beside it, in a record of its own.

**It is part of format 2**, which stays at 2. The migration from format 1 writes it: `{ kind: "pico" }`
after the format of a circuit without a supply, and a circuit's `supply` moved into its `setup`, its
comments with it, after `kind: "supply"`. ratsnest's examples carry it.

This amends ADR 0032, whose supply's voltage and rails are now its circuit's `setup`; ADR 0034, whose
two shapes were told apart by `supply`; and ADR 0036, whose format 2 carries the `setup` and whose
migration writes it. Everything else in them stands.

## Considered options

- **One required object, its `kind` naming the start**: chosen. One field says what the board starts
  with and how, nothing beside it can disagree with it, and another board is another `kind`.
- **A word, `setup: "pico"` or `setup: "supply"`, with `supply` beside it**: rejected. It is shorter to
  read, but the two fields could disagree, the check would have to refuse a file for it, and the next
  board's own settings would need a field of their own as well.
- **`type` in the place of `kind`**: chosen by the owner at first, and built, then given up. The
  format would have named what a thing is in two words, `kind` for a part or a pin and `type` for a
  setup.
- **`type` for every part, pin and setup**: chosen by the owner next, and begun, then given up before
  it was tested. `type` is no reserved word, and `{ type: "wire" }` is valid TypeScript, but in a
  file that opens with `import type` and ends with `satisfies Circuit` it already names the
  language's types, and the engine would have written `Extract<Part, { type: "wire" }>`. `kind` came
  in with scratchpi's drawing, which no record had chosen, and the engine already says it of its own
  things, a hole's place among them, so the format and the engine keep one word.
- **`start` or `base` for the field's name**: rejected. `setup` says what the board is set up with,
  whichever step puts it in.
- **A format 3**: rejected. Format 2 is in no release, so a format 3 would leave a format 2 that
  nobody ever wrote, and a migration from it for nobody.
- **The shape still told by `supply` alone**: rejected by the owner. A Pico circuit would never say
  it is on a Pico, and a circuit that names neither would read as one.

## Consequences

- **Every circuit file has one more line**, and a Pico circuit's says only what every Pico circuit
  says.
- **The format names what a thing is in one word**, `kind`, for a part, a pin and a setup alike,
  which is TypeScript's own habit for a union told apart by a field, and not the plainer English
  of "what type of part".
- **The surface changes**: `Supply` becomes `SupplySetup`, `SupplyCircuit.supply` goes, and `setup`
  arrives in every shape. All of it lands in 0.2.0, which format 2 already makes a breaking release
  (ADR 0017, ADR 0021).
- **A circuit with no `setup` is refused whole**, as one with no format is, so a mistake in it hides
  every other problem in the file until it is mended.
- **The engine's own model does not change**: a circuit shown in a language still has a supply or
  none, and the drawing a Pico or a cell. The next start changes both.
- **The `circuit` skill writes the `setup` into every circuit it makes**, from its first question: a
  Pico or a supply.
