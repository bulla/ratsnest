---
name: circuit
description: Adds or changes a ratsnest circuit, translates it, makes its wiring page or its drawing alone as an SVG, and publishes a page as an Artifact, keeping every circuit file declarative so that every page looks like every other. Use when asked to add a circuit, change one, add a language to one, make a circuit's page in a given orientation, theme and language, make its drawing as an SVG to embed elsewhere, publish or republish a page, or update a project to a newer ratsnest.
argument-hint: [the circuit to add, change or translate, or the page to make]
triggers:
  - add a circuit
  - wire up a new circuit
  - change a circuit
  - translate a circuit
  - make a wiring page
  - make a circuit's drawing as an SVG
  - publish a circuit as an artifact
  - update ratsnest
user-invocable: true
---

# Circuit (`/circuit`)

Every ratsnest page looks like every other because only the engine draws, and a circuit's file only
declares. This skill adds and changes circuits without breaking that, makes their pages and their
drawings alone, and publishes the pages.

It is ratsnest's own, and the same text wherever it is: in ratsnest itself, and in every circuits
project, where `rnest init` put it and `rnest update` replaces it. Never edit a project's copy;
a project that wants something else adds a skill of its own beside it. The records named below are
ratsnest's, in `doc/adr/` of https://github.com/bulla/ratsnest.

## First, find the builder (ADR 0014, ADR 0016)

- **In a circuits project**, `ratsnest.json` names the version of ratsnest it expects, and the
  executable, on the `PATH`, answers `rnest --version`. `rnest` and `ratsnest` are two names for
  the same executable (ADR 0029): use `rnest`, and `ratsnest` where `rnest` is not on the `PATH`,
  as on Windows unless the download was saved as `rnest.exe`. The circuits are in `circuits/`, and
  the `Circuit` type in `.ratsnest/`.
- **In ratsnest's own repository**, the engine is in `src/`, run from its source through `bun run`
  (ADR 0009), and the circuits are the examples, in `examples/`.

If neither is there, say so and stop. Never draw a breadboard, write SVG or write a page by hand
instead: a page, and a drawing alone, is only ever the engine's output.

| To | In a circuits project | In ratsnest itself |
| --- | --- | --- |
| Check every circuit | `rnest check` | `bun run ratsnest check examples` |
| Make a page | `rnest generate <file> --orientation <0, 90, 180 or 270> --theme <dark or light> --language <en, fr or ru>` | the same, after `bun run` |
| Make the drawing alone, as an SVG | the same, and `--format svg` | the same, after `bun run` |
| Move to a newer ratsnest | `rnest update` | not needed: it is the newest |

**When the executable says it is older or newer than the project**, run `rnest update` before
anything else. Never edit `ratsnest.json`, or the type in `.ratsnest/`, by hand.

## The rules (ADR 0006, ADR 0007, ADR 0015)

- **One circuit, one file**, in `circuits/<name>.ts` (`examples/<name>.ts` in ratsnest). It holds
  what its breadboard is set up with (its `setup`, right after its format: a Pico, or a supply in
  its place), what the circuit is (its name, a sentence saying what it does, its credit, and what is
  on each pin, if it is on a Pico), where its parts go (the steps, each placing parts
  in holes such as `a21` or `top-19`), and its `test`: what the reader does in the last step, and
  what a working circuit then does. A circuit on a Pico also has its MicroPython `script`, and its
  `test` says what the script does (ADR 0036).
- **The file only declares.** `import type` lines and one `export default { … } satisfies Circuit`,
  the type imported from `ratsnest`. Every value is a string, a number, `true` or `false`, or an
  array or object of those, and a template string has no `${}`. No function, call, variable, spread,
  condition, computed key, or import that brings a value. Comments are welcome, for the reasons a
  reader cannot see in the data.
- **It never says how anything looks**: no millimetres, colours, sizes, SVG, CSS or label positions.
  A step's title and note never name a hole; the engine writes the sentences that do.
- **It says its format**, `format: <n>`. A new file takes the current one, which `rnest check`
  reports. Never change a file's format by hand: `rnest update` moves old files on.
- **When a check refuses a circuit, change the circuit.** Move the part to other holes. Never loosen a
  check, and never teach the engine about one circuit: nothing in ratsnest names a circuit, its
  tests included. A change the engine needs is a change to ratsnest, for every circuit, with its own
  record.
- **Never edit a generated page.** Change the circuit, or ratsnest, and generate it again.

## A Pico, or a supply in its place (ADR 0032, ADR 0033, ADR 0034, ADR 0037)

A circuit is on a Pico, or has a supply on one pair of rails instead, and its `setup` says which,
right after its format. Every circuit has one, and `rnest check` reads nothing else in a file
without it. **When adding a circuit and the request does not say which, ask first**: with a Pico, or
powered by a supply? For a supply, ask then which voltage, suggesting 4.5 V, and which rails,
suggesting the bottom ones.

```ts
  setup: { kind: "pico" },
```

```ts
  setup: { kind: "supply", volts: 4.5, rails: "bottom" },
```

A circuit on a Pico names nothing else in its `setup`: the engine puts the Pico across the middle
of the board, and its page says so first.

| Volts | What gives it |
| --- | --- |
| `3` | two AA batteries |
| `4.5` | three AA batteries |
| `3.7` | one protected Li-Po cell |
| `5` | a USB charger, through a USB-C breakout board |

A circuit with a supply:

- **declares `setup: { kind: "supply", volts, rails }`**, `rails` being `"top"` or `"bottom"`, and
  still ends `satisfies Circuit`;
- **has plain lights and buttons, and they name no `pin`**: no buzzer, RGB LED or ring, which need a
  Pico to drive them;
- **has no `script`**, and its `test`, which every circuit has, says what to do once the supply is
  connected, and what a working circuit then does;
- **names no hole for the supply**: the engine puts its red lead in column 1 of the + rail and its
  black lead in column 1 of the − rail, so leave those two holes free;
- **wires every light from + through one resistor of 220 Ω to 1 kΩ to −**, each button on a light's
  way, with no short when every button is held, red wires on +, black on − and yellow for the rest.
  On the 3 V supply, a blue, white, green, aqua, pink or purple light is refused: take 4.5 V.

## Its credit (ADR 0035)

A circuit may have a `credit`, after its description: where the drawing and the font come from, and
under which licences. The page writes it as its footer, and the drawing alone along its bottom
edge; a circuit without one has neither. When making a circuit, or adding a language to one, write
ratsnest's credit in each of its languages, the one below for its kind of circuit, unless the person
says otherwise. It is the
circuit's own text, so its author may reword it, translate it, or take it out, as a tutorial built
of several drawings would, to credit them once elsewhere.

The drawing is an adaptation under CC BY-SA 4.0, which asks for it to be credited wherever it is
shown. When asked to reword the credit, keep Raspberry Pi Ltd, CC BY-SA 4.0 and the licence's
address in it. When asked to drop it, or any of those, say that the licence asks for them wherever
the drawing is shown, so whatever shows the drawing must credit it, and then do as the person
decides. Nothing checks what a credit says.

For a circuit on a Pico:

```ts
  credit: {
    en: "The Pico 2 W is drawn from its datasheet, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). This drawing is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Le Pico 2 W est dessiné d’après sa fiche technique, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Ce dessin est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
    ru: "Pico 2 W нарисован по его спецификации, на основе распиновки Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, по лицензии CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Этот рисунок распространяется по той же лицензии. Шрифт Nunito, по лицензии SIL Open Font License 1.1.",
  },
```

For a circuit with a supply, whose drawing has no Pico on it (ADR 0032):

```ts
  credit: {
    en: "This drawing comes from the one ratsnest makes of the Pico 2 W, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), and is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Ce dessin vient de celui que ratsnest fait du Pico 2 W, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), et il est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
    ru: "Этот рисунок основан на рисунке Pico 2 W, который делает ratsnest, на основе распиновки Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, по лицензии CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), и распространяется по той же лицензии. Шрифт Nunito, по лицензии SIL Open Font License 1.1.",
  },
```

## Its languages (ADR 0010, ADR 0011)

- **Every text a reader sees is an object keyed by language**: its name, its sentence, its credit if
  it has one, its parts' names, each step's title and note, its `test`, and its `script` on a Pico.
  `en`, `fr` and `ru` are the engine's languages, and a circuit needs one at least.
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

**The page, or the drawing alone** (ADR 0031). `--format html`, the default, makes the whole page.
`--format svg` makes the drawing alone, from the same four inputs, as an SVG file for other pages to
embed by `<img>` or a Markdown image: it carries its font, its colours and its credit, and paints its
own background in its theme. Make one when the request asks for an SVG, an image or the drawing to
put somewhere else; a page otherwise. A host that wants both themes embeds both files, in a
`<picture>` with `prefers-color-scheme`.

**Check the language before calling the generator.** If the request names a language the circuit
does not have, say so, name the ones it has, and offer to add the one asked for. Never generate in
another language instead. The generator refuses one too, but the skill asks first.

## How to run it

1. **Read the records the change touches**, by their numbers above. For a new circuit, settle a
   Pico or a supply first (above).
2. **Write or change the one circuit file**, and nothing else among the circuits.
3. **Run the check** (the table above). The declarative check, the field checks, the wiring check,
   the language checks and the overlap check, in every language the circuit has, must all pass.
   When one fails, go back to step 2. When it refuses a file's format as older, run the update first.
4. **Check the four inputs**, the language against the circuit's own.
5. **Generate the page**, or the drawing alone, from them.
6. **Look at it in Chromium**, at its orientation and in its language. The checks say a circuit is
   correct, not that it is tidy, and parts that crowd each other send you back to step 2.
7. **Hand over the file**, and say which four inputs made it. Publish a page only if asked (below).
   Never publish a drawing alone: an Artifact opens only with a claude.ai sign-in, so no other page
   could load it by `<img>`. Whoever embeds an SVG hosts it, and keeps its credit line in it.

## Publishing it as an Artifact (ADR 0013, ADR 0014, ADR 0019)

Only a page, only when the request asks for it, and only in a circuits project. In ratsnest itself, say that its
examples are published from a circuits project, which `rnest init` makes, and stop. One
Artifact holds one set of four inputs.

1. **Look for the link in `ARTIFACTS.md`**, at the root of the project, in a row with the same four
   inputs. Make the file, with the header row below, if it is not there. Follow the project: commit
   the row with the change if the file is tracked, as `rnest init` leaves it, and leave it if the
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

`rnest update` fetches the newer executable and puts it in place of the old one, moves
`ratsnest.json` on, migrates every circuit file to the current format, replaces this skill and the
type in `.ratsnest/`, and runs the checks. Read what it says it could not decide, and ask the person
about each one; never guess a migration's answer. Then run the checks again, and offer to republish
the project's Artifacts. Moving from format 1 to 2 (ADR 0036, ADR 0037) writes every circuit's
`setup` after its format, `{ kind: "pico" }` on a Pico, renames a Pico circuit's `scriptDoes` to
`test`, and gives a circuit with no credit ratsnest's, so that its pages keep their footer: say so,
and that the person may reword the credit or take it out.
