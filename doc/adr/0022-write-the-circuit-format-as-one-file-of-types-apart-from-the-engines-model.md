# ADR 0022: Write the circuit format as one file of types, apart from the engine's model

**Status:** Accepted · 2026-11-20

## Context

A circuit file says `satisfies Circuit`, with the type imported from `ratsnest` (ADR 0007). In a
circuits project, that type is a file `ratsnest init` writes into `.ratsnest/` and `ratsnest update`
replaces (ADR 0016), so it has to stand on its own. In ratsnest's repository, the examples need the
same type.

The copy from scratchpi brought the engine's own model with it (M2): a circuit and its layout as two
types, every text a plain string, and the parts and holes defined in `src/drawing/breadboard.ts`,
among the drawing's code. That model is what the drawing and the page are written against. It is
not the format: its texts are in one language where the format's are keyed by language (ADR 0010),
it has no format number (ADR 0015), and its parts are in a file under CC BY-SA 4.0 (ADR 0018), which
imports other files.

The format is also what M9 snapshots as part of the public surface (ADR 0017): a change to it is a
change users get, and one that breaks a file raises its number.

## Decision

**The circuit format is one file of types, `src/format.ts`**, written for the format and for nothing
else: the `Circuit` a file declares, its lights, buttons and buzzers, its steps and their parts, a
hole as the breadboard prints it, and a text keyed by language. It imports nothing and exports only
types, so it is the file `init` copies into `.ratsnest/` as it is, and the one `"ratsnest"` names in
ratsnest's own `tsconfig.json`, for the examples.

**The engine keeps its own model, and reads the format into it.** After the checks, a circuit is
taken into one language as the circuit and layout the drawing and the page were written against. The
format's types are stricter than the model's, a hole being a pattern of the breadboard's names rather
than any string, and every format part fits the model's part as it is, which the type checker holds.

**The format's types are written anew, by ratsnest, under MIT**, rather than moved out of
`src/drawing/`. They describe where parts go in the breadboard's terms, which owes nothing to the
datasheet figure the drawing adapts.

## Considered options

- **One file of types for the format, the engine's model apart**: chosen. A file's type changes only
  when the format does, and the engine can reshape its model freely.
- **The engine's model as the format**: rejected. Its texts are not keyed by language, its parts live
  among the drawing's code, under another licence, and every change to the engine would be a change
  to every project's type.
- **The format's file generated from the engine's types**, by emitting declarations: rejected. It
  would carry the model's shape, which is the problem, and TypeScript 7's emit runs as a separate
  native process that the engine's tests would then depend on.
- **A JSON schema beside the type**: rejected, as ADR 0006 rejected JSON: the types already check an
  editor's file, and the engine checks every field itself (ADR 0016).

## Consequences

- **A part is defined twice**: once in the format, once in the engine's model. The type checker holds
  that every format part fits the model, but a field added to the model is not in the format until the
  format says so, which is the point.
- **`src/format.ts` can import nothing**, and a test holds it, because `init` copies it alone.
- **Everything else the engine needs about the format is code**: the lists of colours and roles, the
  hole's grammar, the checks. Those are the engine's, and are checked against the format's types.
- **Changing `src/format.ts` is changing the public surface**: a change users get (ADR 0017), with a
  changelog line, and a migration if it breaks a file (ADR 0015).
