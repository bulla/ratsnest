# ADR 0036: Write what every circuit has once, its `test` among it, in format 2

**Status:** Accepted · 2026-11-23 · Amends ADR-0034 (its shapes share one base, and the format is 2) and ADR-0035 (a circuit written before is given ratsnest's credit)

## Context

`Circuit` has two shapes (ADR 0034): a Pico circuit and a supply circuit. Each writes out the same
fields, the format, the name, the description, the credit (ADR 0035) and the steps, and each ends
with what its last step tells the reader, under two names: a Pico circuit's `scriptDoes`, what its
script does, and a supply circuit's `test`, what to do once the supply is connected (ADR 0032). The
engine's own model already calls both `test`.

ADR 0032 rejected one name for both, since renaming `scriptDoes` breaks every file, and ADR 0034 kept
format 1 because nothing it did broke one. The owner has since changed a good deal of the format,
and would rather it say each thing once, in one name, even at the cost of a new format and an
update.

## Decision

**What every circuit has is written once, in `CircuitBase`**: its format, its name, its description,
its credit, its steps and its `test`. `PicoCircuit` and `SupplyCircuit` extend it, and each adds only
its own: a Pico circuit its pins' lights, buttons and buzzers, and its `script`; a supply circuit
its `supply`, and lights and buttons that name no pin.

**A Pico circuit's `scriptDoes` is now its `test`**, as a supply circuit's is: what the reader does in
the last step, and what a working circuit then does. A Pico circuit still has its `script`.

**The circuit format rises to 2** (ADR 0015), and the migration from format 1:

- renames a Pico circuit's `scriptDoes` to `test`, where it stood, its comments with it;
- gives a circuit with no `credit` ratsnest's, for its kind, in each of its languages, after its
  description, so that its pages keep the footer the engine used to write for them. Its author may
  take it out, as ADR 0035 allows.

ratsnest's examples are migrated, and their files in format 1 are kept in `examples/format-1/`, as
`develop` had them, for the migration's test.

**The public surface records what an interface extends**, so that a shape that stopped sharing the
base would be seen as the change it is (ADR 0017).

This amends ADR 0034, whose two shapes now share one base and whose format is 2, and ADR 0035, under
which a circuit written before had no credit until someone added one. Everything else in them
stands.

## Considered options

- **One base, one `test`, format 2**: chosen. Each field is written once, and means the same in every
  circuit.
- **`scriptDoes` kept, both shapes written out in full**: rejected by the owner. The same fields twice,
  and one meaning under two names.
- **One base, keeping `scriptDoes`**: rejected. The base could not hold the last step's words, and
  the two names would stay.
- **The migration leaving the credit out**: rejected. Every page of a circuit written before would
  lose the footer it had, in the same update that renames its `test`, and nothing would say so.

## Consequences

- **Every Pico circuit file breaks, and `rnest update` mends it.** This is ratsnest's first
  migration, and the release that brings it is 0.2.0, as M12's was to be (ADR 0017, ADR 0021).
- **ratsnest's credit is written in two places again**: the `circuit` skill, for new circuits, and
  the migration, for old ones. The migration's is fixed when format 2 is made, as every migration is,
  and the skill's may change after it; the migration's test holds the migration to its own.
- **The type an editor shows is one level deeper**: a Pico circuit's name is `CircuitBase`'s.
- **`scriptDoes` is gone from the words a circuit's author learns**, and from the skill.
