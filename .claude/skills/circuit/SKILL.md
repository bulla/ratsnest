---
name: circuit
description: Adds or changes a ratsnest circuit and makes its wiring page, keeping every circuit file declarative so that every page looks like every other. Use when asked to add a circuit, change one, or make a circuit's page in a given orientation, theme and language.
argument-hint: [the circuit to add or change, or the page to make]
triggers:
  - add a circuit
  - wire up a new circuit
  - change a circuit
  - make a wiring page
user-invocable: true
---

# Circuit (`/circuit`)

Every ratsnest page looks like every other because only the engine draws, and a circuit's file only
declares (ADR 0007). This skill adds and changes circuits without breaking that, and makes their
pages.

## First, check there is an engine

If `circuits/` or the engine in `src/` does not exist yet, say that it has not been built (see
**Next** in `doc/ROADMAP.md`) and stop. Never draw a breadboard, write SVG or write a page by hand
instead: a page is only ever the engine's output.

## The rules (ADR 0006, ADR 0007)

- **One circuit, one file**: `circuits/<name>.ts`. It holds what the circuit is (its name, a sentence
  saying what it does, and what is on each pin), where its parts go (the steps, each placing parts in
  holes such as `a21` or `top-19`), and its MicroPython test script.
- **The file only declares.** `import type` lines and one `export default { … } satisfies Circuit`.
  Every value is a string, a number, `true` or `false`, or an array or object of those, and a
  template string has no `${}`. No function, call, variable, spread, condition, computed key, or
  import that brings a value. Comments are welcome, for the reasons a reader cannot see in the data.
- **It never says how anything looks**: no millimetres, colours, sizes, SVG, CSS or label positions.
  A step's title and note never name a hole; the engine writes the sentences that do.
- **When a check refuses a circuit, change the circuit.** Move the part to other holes. Never loosen a
  check, and never teach the engine about one circuit: nothing in `src/` names a circuit, its tests
  included. A change the engine needs is its own piece of work, for every circuit, with its own
  record.
- **Never edit a generated page.** Change the circuit or the engine, and generate it again.

## The inputs (ADR 0003, ADR 0005)

A page is made from four inputs, and the same four always make the same file.

| Input | Values | If the request does not say |
| --- | --- | --- |
| Circuit | a file in `circuits/` | ask |
| Theme | `dark` or `light` | ask |
| Language | one ratsnest has | ask |
| Orientation | `0`, `90`, `180` or `270` degrees clockwise: the USB left, top, right or bottom | `0` |

## How to run it

1. **Read the records the change touches**, in `doc/adr/`, and the Design section of `CLAUDE.md`.
2. **Write or change the one circuit file**, and nothing else in `circuits/`.
3. **Run the checks** (the Commands section of `CLAUDE.md`). The declarative check, the wiring check
   and the overlap check must all pass. When one fails, go back to step 2.
4. **Generate the page** from its four inputs.
5. **Look at it in Chromium**, at its orientation. The checks say a circuit is correct, not that it
   is tidy, and parts that crowd each other send you back to step 2.
6. **Hand over the file**, and say which four inputs made it.
