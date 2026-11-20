# ADR 0007: Keep a circuit's file declarative, and everything that computes outside it

**Status:** Accepted · 2026-11-20

## Context

ADR 0006 puts each circuit in a TypeScript file, and TypeScript can compute. A circuit file could
build its steps in a loop, work a hole out from a number, import a helper, or nudge a label left to
make room. The owner wants every page to look the same, whenever its circuit was made, and a skill to
keep them so. A file that can compute can also draw, and every circuit that is a little different
in code is a page that looks a little different.

## Decision

**A circuit's file only declares.** It is `import type` lines and one
`export default { … } satisfies Circuit`, and every value in it is a string, a number, `true` or
`false`, or an array or object of those. A template string may have no `${}` in it, and comments are
welcome. Nothing else: no function, no call, no variable, no spread, no condition, no computed key,
and no import that brings a value.

**It says what the circuit is and where its parts go, in the breadboard's own terms**: pins, holes,
parts, values and words. **It never says how anything looks**: no millimetres, no colours, no sizes,
no SVG or CSS, and no place for a label.

**Everything that computes is the engine, in `src/`:**

- the **validator**, which refuses a circuit whose wiring is not what it says it is (the wiring check
  that came with the copy, ADR 0001), and one where anything overlaps: two legs in one hole, a part
  over another or under the Pico, a jumper across a hole in use, a word over a wire, a part or
  another word, at every orientation (ADR 0003);
- the **renderer**, which draws a valid circuit and writes its page;
- the **post-processor**, which works out what the data leaves unsaid before the page is written:
  where each word sits, how a jumper arches, and how the drawing turns with its words upright.

**Nothing in `src/` names a circuit**, its tests included. A test of the engine builds the circuit it
needs, and the circuits that ship are checked by walking `circuits/`. So the engine has no case for
one circuit, and a circuit has no code.

**A test holds both directions.** It parses every file in `circuits/` as TypeScript and fails on
anything this record does not allow, naming the file and the line, and it fails on any file in
`src/` that names a circuit. Which parser does it is the stack's choice. `circuits/` holds circuit files and nothing else. The `circuit`
skill (`.claude/skills/circuit/`) writes to these rules, and `CLAUDE.md` states them.

## Considered options

- **Declarative files, the engine outside them, and a test holding both**: chosen. A circuit cannot
  look different from the others by accident, because nothing in its file can say how it looks.
- **The same, by convention and the skill alone**: rejected. A rule no test holds is broken by the
  first hurried change, and a skill can be skipped.
- **Shared steps, imported from a file of declared steps**: rejected for now. Joining both − rails
  to ground would be written once, but a circuit's file would no longer say everything on its own,
  and an import is a door that code comes back through.
- **Named constants for values, such as 330 Ω for a light's resistor**: rejected. A value is read
  where it is used, and the validator checks its range wherever it is written.
- **Let a circuit nudge the engine's placing, such as where a label goes**: rejected. That is the
  look leaking back into the data. A circuit whose label has nowhere to go moves its part, and if a
  rule has to change, it changes for every circuit, with a record.

## Consequences

- **Consistency is structural.** The skill's whole job is writing data that passes the checks; the
  look is the engine's alone.
- **Whatever the data cannot say is a change to the engine**, made for every circuit at once. That
  is slower than a tweak for one circuit, on purpose.
- **Common steps are written out in every file that uses them**, and two files may join the same
  rails through different holes. Both pass the checks, and their pages differ. If the repetition
  starts to hurt, standard steps that the engine knows by name are the way out, as a record of their
  own.
- **The declarative check has to understand TypeScript's syntax**, and grows with the format.
- **A new kind of part is a change to the engine**: its drawing, its legs, and what the validator
  knows of it.
