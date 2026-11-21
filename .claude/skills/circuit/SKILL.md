---
name: circuit
description: Adds or changes a ratsnest circuit, translates it, makes its wiring page and publishes it as an Artifact, keeping every circuit file declarative so that every page looks like every other. Use when asked to add a circuit, change one, add a language to one, make a circuit's page in a given orientation, theme and language, publish or republish one, or update a project to a newer ratsnest.
argument-hint: [the circuit to add, change or translate, or the page to make]
triggers:
  - add a circuit
  - wire up a new circuit
  - change a circuit
  - translate a circuit
  - make a wiring page
  - publish a circuit as an artifact
  - update ratsnest
user-invocable: true
---

# Circuit (`/circuit`)

Every ratsnest page looks like every other because only the engine draws, and a circuit's file only
declares. This skill adds and changes circuits without breaking that, makes their pages, and
publishes them.

It is ratsnest's own, and the same text wherever it is: in ratsnest itself, and in every circuits
project, where `ratsnest init` put it and `ratsnest update` replaces it. Never edit a project's copy;
a project that wants something else adds a skill of its own beside it. The records named below are
ratsnest's, in `doc/adr/` of https://github.com/bulla/ratsnest.

## First, find the builder (ADR 0014, ADR 0016)

- **In a circuits project**, `ratsnest.json` names the version of ratsnest it expects, and the
  `ratsnest` executable, on the `PATH`, answers `ratsnest --version`. The circuits are in
  `circuits/`, and the `Circuit` type in `.ratsnest/`.
- **In ratsnest's own repository**, the engine is in `src/`, run from its source through `bun run`
  (ADR 0009), and the circuits are the examples, in `examples/`.

If neither is there, say so and stop. Never draw a breadboard, write SVG or write a page by hand
instead: a page is only ever the engine's output.

| To | In a circuits project | In ratsnest itself |
| --- | --- | --- |
| Check every circuit | `ratsnest check` | `bun run ratsnest check examples` |
| Make a page | `ratsnest generate <file> --orientation <0, 90, 180 or 270> --theme <dark or light> --language <en, fr or ru>` | the same, after `bun run` |
| Move to a newer ratsnest | `ratsnest update` | not needed: it is the newest |

**When the executable says it is older or newer than the project**, run `ratsnest update` before
anything else. Never edit `ratsnest.json`, or the type in `.ratsnest/`, by hand.

## The rules (ADR 0006, ADR 0007, ADR 0015)

- **One circuit, one file**, in `circuits/<name>.ts` (`examples/<name>.ts` in ratsnest). It holds
  what the circuit is (its name, a sentence saying what it does, and what is on each pin), where its
  parts go (the steps, each placing parts in holes such as `a21` or `top-19`), and its MicroPython
  test script.
- **The file only declares.** `import type` lines and one `export default { … } satisfies Circuit`,
  the type imported from `ratsnest`. Every value is a string, a number, `true` or `false`, or an
  array or object of those, and a template string has no `${}`. No function, call, variable, spread,
  condition, computed key, or import that brings a value. Comments are welcome, for the reasons a
  reader cannot see in the data.
- **It never says how anything looks**: no millimetres, colours, sizes, SVG, CSS or label positions.
  A step's title and note never name a hole; the engine writes the sentences that do.
- **It says its format**, `format: <n>`. A new file takes the current one, which `ratsnest check`
  reports. Never change a file's format by hand: `ratsnest update` moves old files on.
- **When a check refuses a circuit, change the circuit.** Move the part to other holes. Never loosen a
  check, and never teach the engine about one circuit: nothing in ratsnest names a circuit, its
  tests included. A change the engine needs is a change to ratsnest, for every circuit, with its own
  record.
- **Never edit a generated page.** Change the circuit, or ratsnest, and generate it again.

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
- **Write only characters the page's font has** (ADR 0012). Nunito has no `←` or `→`, and a check
  names any other it lacks. Never swap the font, or let a page fall back to another: change the word.

## The inputs (ADR 0003, ADR 0005, ADR 0010)

A page is made from four inputs, and the same four always make the same file.

| Input | Values | If the request does not say |
| --- | --- | --- |
| Circuit | a file in `circuits/`, or in `examples/` in ratsnest | ask |
| Theme | `dark` or `light` | ask |
| Language | one of the circuit's own: the languages of its name | ask, offering only the circuit's own |
| Orientation | `0`, `90`, `180` or `270` degrees clockwise: the USB left, top, right or bottom | `0` |

**Check the language before calling the generator.** If the request names a language the circuit
does not have, say so, name the ones it has, and offer to add the one asked for. Never generate in
another language instead. The generator refuses one too, but the skill asks first.

## How to run it

1. **Read the records the change touches**, by their numbers above.
2. **Write or change the one circuit file**, and nothing else among the circuits.
3. **Run the check** (the table above). The declarative check, the field checks, the wiring check,
   the language checks and the overlap check, in every language the circuit has, must all pass.
   When one fails, go back to step 2. When it refuses a file's format as older, run the update first.
4. **Check the four inputs**, the language against the circuit's own.
5. **Generate the page** from them.
6. **Look at it in Chromium**, at its orientation and in its language. The checks say a circuit is
   correct, not that it is tidy, and parts that crowd each other send you back to step 2.
7. **Hand over the file**, and say which four inputs made it. Publish it only if asked (below).

## Publishing it as an Artifact (ADR 0013, ADR 0014, ADR 0019)

Only when the request asks for it, and only in a circuits project. In ratsnest itself, say that its
examples are published from a circuits project, which `ratsnest init` makes, and stop. One
Artifact holds one set of four inputs.

1. **Look for the link in `ARTIFACTS.md`**, at the root of the project, in a row with the same four
   inputs. Make the file, with the header row below, if it is not there. Follow the project: commit
   the row with the change if the file is tracked, as `ratsnest init` leaves it, and leave it if the
   project ignores it.
2. **If there is no row, look through the person's own Artifacts before making a new one.** List the
   ones titled with the circuit's name in the page's language, read each, and take the one whose
   `<meta name="ratsnest">` names the same four inputs. A cloud session can start without the file,
   so this is a usual case there, not a rare one.
3. **Publish the generated file as it is**: to that Artifact's link when one was found, or as a new
   Artifact, with a description that names the four inputs. Never edit the page to suit the Artifact
   tool or its design guidance: a page is only ever the engine's output, and a disagreement is a
   change to ratsnest, with a record.
4. **Write the row**: the four inputs, the link, the commit the page was made from, and the date.

```markdown
| Circuit | Orientation | Theme | Language | Link | Made from | Published |
| --- | --- | --- | --- | --- | --- | --- |
```

**Republishing after a change to ratsnest** is the same steps for every row, on request.

## Updating a project (ADR 0015, ADR 0016)

`ratsnest update` fetches the newer executable and puts it in place of the old one, moves
`ratsnest.json` on, migrates every circuit file to the current format, replaces this skill and the
type in `.ratsnest/`, and runs the checks. Read what it says it could not decide, and ask the person
about each one; never guess a migration's answer. Then run the checks again, and offer to republish
the project's Artifacts.
