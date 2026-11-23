# ADR 0034: Make `Circuit` one type with two shapes, a Pico circuit or a supply circuit

**Status:** Accepted · 2026-11-22 · Amended by ADR-0035 (both shapes may carry a credit) · Amended by ADR-0036 (its shapes share one base, and the format is 2)

## Context

The circuit format is one file of types, `src/format.ts` (ADR 0022), whose `Circuit` is one
interface: a Pico circuit, whose lights, buttons and buzzers name their pins, with a `script` and a
`scriptDoes`. Every circuit file ends `satisfies Circuit`, and the reader refuses one that does not
(ADR 0007).

A supply circuit (ADR 0032) has a `supply`, lights and buttons that name no pin, no buzzer, and a
`test` in place of the script.

A release's version is computed from `api/surface.json`, which holds the format's types member by
member (ADR 0017): `Circuit.leds`, `Circuit.script` and so on. A member that goes or changes breaks
someone, and before 1.0.0 that raises the middle number of the version; a member that only arrives
raises the last (ADR 0021).

## Decision

**`Circuit` becomes `PicoCircuit | SupplyCircuit`.** `PicoCircuit` is the `Circuit` of today,
exactly. `SupplyCircuit` has the format, the name, the description, the `supply`, lights and
buttons without a `pin`, the steps and the `test`. Every file still ends `satisfies Circuit`, and
the reader's rule does not change. `supply` is what tells the two apart, for an editor as for the
engine.

**The format stays at 1**: every circuit file is valid as it is, so there is nothing to migrate
(ADR 0015). The release computes a change that breaks the surface all the same, since the
`Circuit.*` members move into `PicoCircuit`, and so the version after 0.1.1 is 0.2.0.

## Considered options

- **One `Circuit` with two shapes**: chosen. One name to learn, and the field says which kind a
  circuit is, once.
- **`SupplyCircuit` beside an unchanged `Circuit`**, a supply circuit ending
  `satisfies SupplyCircuit`: rejected, though it only adds to the surface and its version would be
  0.1.2. A file would say its kind twice, by its field and by its type's name, and the two could
  disagree; `Circuit` would mean a Pico circuit for good; and the reader would take two names.
- **One interface whose fields may all be left out**: `supply`, `script` and every `pin`: rejected.
  An editor would take a Pico circuit with no script, or a supply circuit with a buzzer, and only
  the checks would say what the type could have. A required field made optional breaks the surface
  too.
- **A format 2**: rejected. ADR 0015 raises the format when a circuit file breaks, and none does.

## Consequences

- **0.2.0, though no file breaks.** The number says the format's type changed shape, which is what
  happened, and before 1.0.0 a new kind of circuit is a fair reason for it.
- **The surface gains the new types' members**, so the next change to any of them is computed as
  for any other.
- **A project's type in `.ratsnest/` is replaced by `rnest update`**, as it always is, and an editor
  then knows both shapes.
- **The engine asks which kind a circuit is wherever it reads one**, by its `supply`.
- **A third kind of circuit is a third member of the union**, with a record of its own.
