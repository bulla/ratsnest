# ADR 0038: Bring each new part with the circuit that needs it, and teach the wiring check that use

**Status:** Accepted · 2026-11-23

## Context

The owner wants more parts: capacitors, transistors and diodes first, then others. ratsnest knows
seven kinds today: wires, resistors, plain LEDs, buttons, buzzers, an RGB LED and a ring of them.

A part is more than its drawing. Each kind reaches the format's type, the field checks, the wiring
check, the drawing and its crowding check, the step's sentence and the parts list's line in three
languages, and an example. The wiring check is the hard part: it does not reason about electricity
in general, it recognises the shapes it knows, such as a light from a pin through one resistor to
ground, or a button with its pull-down, and refuses anything else. A resistor that is neither a
light's nor a pull-down is refused today, so a capacitor put on a board, whatever it does, would
fail the check.

That check is what every published page leans on: a page whose circuit passes lights its lights,
with every LED the right way round and every resistor in a safe range (ADR 0033).

## Decision

**A new part comes into ratsnest with a circuit that needs it, and the wiring check learns that one
use.** The circuit is an example, in `examples/`, checked like anyone's; the use is a rule in
`src/netlist.ts`, refusing what a reader could get wrong, as the rules for lights and buttons do. A
second use of a part, such as a capacitor that debounces a button after one that keeps a light lit,
is a rule of its own, and comes with its own circuit.

Each step of the work brings, as far as it can, one new drawing and one new rule, so that each is
small. The order is the roadmap's, in its Backlog.

## Considered options

- **Each part with its circuit, and a rule for that use**: chosen. Every page keeps the check's
  promise, the part comes with an example that shows it working, and it is what ADR 0002 and
  ADR 0032 already said of a board and of a supply: a record of its own, written when a circuit
  needs it.
- **A free part, held to generic rules**: rejected. A part could go anywhere, every leg joining
  something, no short, never both legs in one strip, and the resistor's rule would loosen with it,
  since a transistor's base resistor is neither a light's nor a pull-down. It gives up the check's
  promise where a beginner most needs it: a diode in backwards, or a transistor's base with no
  resistor, would pass.
- **A circuit that declares its schematic, held against its breadboard**: rejected. The check would
  compare the nets the parts make with the nets the circuit says, which allows any circuit, but the
  format would break, to format 3, every connection would be written twice, and the check would no
  longer know whether the schematic itself works, a light without its resistor among it. No circuit
  has asked for that freedom.

## Consequences

- **Every page still shows a circuit that works**, the new parts in it included.
- **ratsnest only knows the uses its examples teach.** Someone who wants a part in a way no rule
  knows gets a refusal, and the answer is a new rule with its circuit, which is engine work, not a
  circuit file.
- **The wiring check grows by a rule for each use.** Each is small and tested both ways, but the
  file grows with them, and two rules can meet in one circuit, as the capacitor tester's transistors
  and capacitors do.
- **Each new part is an addition to the format**, so the format stays 2 with no migration
  (ADR 0015), and the release that brings it is minor (ADR 0017).
