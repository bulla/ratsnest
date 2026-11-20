---
name: circuit
description: Adds or changes a ratsnest circuit, translates it, and makes its wiring page, keeping every circuit file declarative so that every page looks like every other. Use when asked to add a circuit, change one, add a language to one, or make a circuit's page in a given orientation, theme and language.
argument-hint: [the circuit to add, change or translate, or the page to make]
triggers:
  - add a circuit
  - wire up a new circuit
  - change a circuit
  - translate a circuit
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

## Its languages (ADR 0010, ADR 0011)

- **Every text a reader sees is an object keyed by language**: its name, its sentence, its parts'
  names, each step's title and note, and its test script. `en`, `fr` and `ru` are the engine's
  languages, and a circuit needs one at least.
- **A circuit's languages are the languages of its name**, and every other text has exactly those.
  Adding a language to a circuit means writing every one of its texts in it.
- **Write each language in its own script.** Russian is Cyrillic throughout, with a Latin word only
  whole (`GP15`, `USB`, `Thonny`); English and French hold no Cyrillic letter. Never let a Latin
  look-alike into a Cyrillic word, or the other way round.
- **Write no values in a circuit's text.** The engine writes every number and unit in the page's
  language. Write a part's name as it stands, never inflected for its place in a sentence.
- **Keep each language's typography**: in French, a narrow no-break space (U+202F) before `: ; ? !`
  and inside `« »`; in Russian, `« »` and no space before `: ; ? !`.
- **Write only characters the page's font has** (ADR 0012). Nunito has no `←` or `→`, and a test
  names any other it lacks. Never swap the font, or let a page fall back to another: change the word.

## The inputs (ADR 0003, ADR 0005, ADR 0010)

A page is made from four inputs, and the same four always make the same file.

| Input | Values | If the request does not say |
| --- | --- | --- |
| Circuit | a file in `circuits/` | ask |
| Theme | `dark` or `light` | ask |
| Language | one of the circuit's own: the languages of its name | ask, offering only the circuit's own |
| Orientation | `0`, `90`, `180` or `270` degrees clockwise: the USB left, top, right or bottom | `0` |

**Check the language before calling the generator.** If the request names a language the circuit
does not have, say so, name the ones it has, and offer to add the one asked for. Never generate in
another language instead. The generator refuses one too, but the skill asks first.

## How to run it

1. **Read the records the change touches**, in `doc/adr/`, and the Design section of `CLAUDE.md`.
2. **Write or change the one circuit file**, and nothing else in `circuits/`.
3. **Run the checks** (the Commands section of `CLAUDE.md`). The declarative check, the wiring check,
   the language checks and the overlap check, in every language the circuit has, must all pass.
   When one fails, go back to step 2.
4. **Check the four inputs**, the language against the circuit's own.
5. **Generate the page** from them.
6. **Look at it in Chromium**, at its orientation and in its language. The checks say a circuit is
   correct, not that it is tidy, and parts that crowd each other send you back to step 2.
7. **Hand over the file**, and say which four inputs made it.
