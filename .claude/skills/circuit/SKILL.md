---
name: circuit
description: Adds or changes a ratsnest circuit, translates it, makes its wiring page or its drawing alone as an SVG, a PNG or a WebP, and publishes a page as an Artifact, keeping every circuit file declarative so that every page looks like every other. Use when asked to add a circuit, change one, add a language to one, make a circuit's page in a given orientation, theme and language, make its drawing as an SVG, a PNG or a WebP to put elsewhere, publish or republish a page, or update a project to a newer ratsnest.
argument-hint: [the circuit to add, change or translate, or the page to make]
triggers:
  - add a circuit
  - wire up a new circuit
  - change a circuit
  - translate a circuit
  - make a wiring page
  - make a circuit's drawing as an SVG, a PNG or a WebP
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
| Make the drawing alone, as an SVG, a PNG or a WebP | the same, and `--format svg`, `--format png` or `--format webp` | the same, after `bun run` |
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
- **may have electrolytic capacitors, each keeping a light lit, two NPN transistors that flash
  two lights, diodes on lights' ways, and slide switches lighting one light or another** (below).

## Capacitors, transistors, diodes, switches, potentiometers and sensors (ADR 0038 to ADR 0041, ADR 0043 to ADR 0047, ADR 0049 to ADR 0056)

ratsnest knows a new part only in the use its example teaches, and refuses it anywhere else
(ADR 0038). A part goes in its step as a resistor does, its legs named by what they are, with no
name of its own and no list at the top of the circuit (ADR 0041). Its value is never written in the
circuit's own words, as a resistor's is not: point at it by the step that places it.

- **An electrolytic capacitor**, on a supply, keeps a light lit once its button is let go
  (ADR 0043):

  ```ts
  { kind: "electrolytic", microfarads: 470, plus: "i5", minus: "i4" },
  ```

  Its legs are side by side in one row. Its − leg goes straight to −, by a black wire, and its + leg
  between a button and a light's resistor, so that the button fills it and the light empties it.
  Its microfarads times that resistor's ohms, over a million, is 0.2 s at least, or the light goes
  out too fast to see it fade: 470 µF through 1 kΩ is about right. The can is drawn standing over
  the three rows above its legs, so keep those holes free, and wire its − leg from the row below.
  On a Pico it has no use yet, and is refused.
- **A transistor**, on a Pico, lets a pin switch a light (ADR 0044):

  ```ts
  { kind: "transistor", model: "2N3904", emitter: "e24", base: "e25", collector: "e26" },
  ```

  Its model is one ratsnest knows: `2N3904`, NPN, or `2N3906`, PNP (ADR 0045). Its legs are side by
  side in one row, emitter, base and collector from left to right, so that its flat face is towards
  row j. The light keeps its `pin`, the pin that switches it, and its base goes on that pin through
  one resistor of 1 kΩ to 10 kΩ. An NPN's emitter goes on ground, and the light between 3V3(OUT) and
  its collector; a PNP's emitter goes on 3V3(OUT), never VBUS, and the light between its collector and
  ground, lit while the pin is low. Either way, the light has one resistor of 220 Ω to 1 kΩ. The case
  stands over the two rows above its legs, so reach each leg from the row below it, or from the row
  above its case.
- **Two NPN transistors on a supply flash two lights** (ADR 0046), and are the only use a transistor
  has there. Each one's emitter goes on −; its light from + to its collector, through one resistor
  of 220 Ω to 1 kΩ; its base from + through one resistor of 10 kΩ to 100 kΩ; and one electrolytic
  capacitor from the other transistor's collector to its base, its + leg towards the collector. The
  base resistor and that capacitor hold the transistor off for about 0.69 times the two, 0.1 s to
  5 s. A circuit that tests a capacitor places that one in a step of its own and says so in the
  step's title. Standing everything in row f leaves the rows below for the wiring.
- **A diode**, on a supply, keeps a light's current one way (ADR 0049):

  ```ts
  { kind: "diode", model: "1N4148", anode: "h13", cathode: "h18" },
  ```

  Its model is one ratsnest knows: `1N4148`, a signal diode in orange glass, or `1N4001` or
  `1N4007`, rectifiers in black; any of them does here. It lies as a resistor does, its legs three
  holes apart or more, and goes on a light's way with its band, its cathode, towards −: between +
  and the light's resistor, between the resistor and the light, or between the light and −. Two
  buttons whose currents meet through a diode each keep apart what the other lights, as
  `two-buttons-three-lights.ts` shows. Each diode takes about 0.7 V: on the 3 V supply a light with a
  diode is refused, and on 3.7 V a blue, white, green, aqua, pink or purple one is. Its model goes on
  a tag beside it, as a resistor's value does, so leave it a row free on one side. On a Pico it has
  no use yet, and is refused.

- **A ceramic capacitor**, on a Pico, is timed by two pins (ADR 0051):

  ```ts
  { kind: "ceramic", nanofarads: 100, from: "e26", to: "e27" },
  ```

  Its value is in nanofarads, two figures at most and 0.01 or more, as the code a real disc prints can
  say it, `104` for 100 nF: the drawing's disc prints the value, and the page gives the code. It goes
  in either way round, its legs side by side in one row. One leg goes straight to ground; the other
  straight to a pin that reads it, and through one resistor of 1 kΩ to 8.2 kΩ to a second pin, which
  charges it, with nothing else on that leg. Its nanofarads times that resistor's ohms, over a
  thousand million, is 0.1 ms at least, or the script cannot time it: 100 nF through 4.7 kΩ is about
  right. Its script sets the charging pin low, waits, sets it high and counts until the reading pin
  reads high, as `capacitor-timer.ts` does. A step's words may name those two pins, though no
  component is on them. The disc stands over the two rows above its legs. On a supply it has no use
  yet, and is refused.

- **A slide switch**, on a supply, lights one light or the other, and stays so when let go
  (ADR 0052):

  ```ts
  { kind: "slideSwitch", left: "f14", middle: "f15", right: "f16" },
  ```

  It has no model: any SPDT slide switch with its legs 2.54 mm apart. Its three legs are side by side
  in one row, left, middle and right, left to right. Slid one way, it joins its middle leg to its left
  one; the other way, to its right one. Put its middle leg on +, or anywhere on a light's way, and
  each outer leg on a light's way of its own, so that each way lights a light the other does not, as
  `one-light-or-the-other.ts` shows; one resistor on its middle leg may serve both lights. The step's
  words cannot say which way to slide it, since they name no hole: the test says what one way and the
  other do. The switch stands over the two rows above its legs, so reach them from the rows below. On
  a Pico it has no use yet, and is refused.

- **A slide potentiometer**, on a Pico, is read on an analogue pin (ADR 0053):

  ```ts
  { kind: "slidePotentiometer", ohms: 10000, wiper: "a8", end: "a6", otherEnd: "2:e6" },
  ```

  Its value is free, from 1 kΩ to 100 kΩ, and 10 kΩ is the usual one. It is too long for one
  breadboard, so it lies across both: its wiper and the end beside it two holes apart in one row, and
  its other end in that end's column, 17 rows along, on the other breadboard. Row a of the first
  board pairs with row e of the second, and row f of the first with row j of the second. Its wiper
  goes straight to GP26, GP27 or GP28, with nothing else on it, and its ends to 3V3(OUT) and ground,
  either way round; never its wiper on 3V3(OUT). On the Pico's row c side, `a6` and `a8` are 3V3(OUT)
  and GP28 already, as `colours-on-a-slider.ts` uses them. Its body lies over the holes between its
  legs, across their three columns, so put nothing there. Its script reads it with
  `ADC(Pin(28)).read_u16()`, from 0 to 65535. A step's words may name its wiper's pin. On a supply it
  has no use yet, and is refused. If the circuit follows a tutorial, say so in its description.

- **A DIP switch**, on a Pico, is read switch by switch (ADR 0054):

  ```ts
  { kind: "dipSwitch", switches: 5, column: 13, board: 2 },
  ```

  It has 2 to 8 switches side by side across the channel, their legs in rows e and f, switch 1 in
  `column` and the rest to its right, its ON side towards row a; `board: 2` puts it on the second
  breadboard. Each switch goes from ground, on one leg, to a pin of its own, on the other, with
  nothing else on that pin and never 3V3(OUT): the script pulls each pin up, `Pin(22, Pin.IN,
  Pin.PULL_UP)`, and a switch on reads 0. A tutorial that wires the switches to 3V3 and its pins to the
  Pico's own pull-downs is refused, since the Pico 2 W's pull-downs cannot be relied on: wire them to
  ground instead, and say so in the description. On the second breadboard, the Pico's row c pins are
  right below it, as `five-switches.ts` uses them. On a supply it has no use yet, and is refused.
- **A PIR motion sensor**, on a Pico, is read on a pin of its own (ADR 0055):

  ```ts
  {
    kind: "pir",
    name: { en: "motion sensor", fr: "détecteur de mouvement" },
    power: "a2",
    output: "a13",
    ground: "a14",
  },
  ```

  Every part outside the breadboard has a `name`, in each of the circuit's languages, written on the
  part (ADR 0057): its label, its step's sentence and its parts list's line call it by it. It lies
  beside the board, and its three female-to-male jumpers go in these holes: `power`, from
  its VCC pin, on VBUS for its 5 V, `a2` or `b2`, never 3V3; `output`, from its OUT pin, straight on
  one GPIO with nothing else on it, and no resistor; `ground`, from its GND pin, on ground, better a
  pin the Pico prints `GND` than pin 33, `AGND`. All three go on one side of the channel, rows a to e
  and the top rails or rows f to j and the bottom rails, since the drawing lays it past that edge
  (ADR 0056); the top side has VBUS, GND and GP16 to GP22 and GP26 to GP28. With a second breadboard
  above, the bottom side. The script reads the pin, `Pin(22, Pin.IN)`, high while it sees movement,
  and the `test` says to wait up to a minute after plugging in for it to settle. On a supply it is
  refused.

- **An LED bar graph and a resistor array**, on a Pico, light a segment from each pin (ADR 0058,
  ADR 0059):

  ```ts
  { kind: "barGraph", segments: 5, colour: "red", column: 15, board: 2 },
  { kind: "resistorArray", ohms: 330, resistors: 5, common: "2:d14" },
  ```

  The bar graph has 2 to 10 segments side by side across the channel, in one of a light's colours,
  segment 1 in `column` and the rest to its right, each with its anode in row f and its cathode in
  row e, the side a real one marks with its flat corner and its writing, which a step's note can
  point the reader to; `board: 2` puts it on the second breadboard. Each anode goes straight to a pin of its own,
  with nothing else on it, and each cathode to ground through one resistor of 220 Ω to 1 kΩ: a plain
  resistor, or one of a resistor array's. The array stands in one row, its common leg, under its
  dot, in `common`, and one leg for each resistor to its right, a hole apart: put it in the cathodes'
  half, its resistors' legs in their strips, and wire its common strip to ground from a hole below
  it, since its body stands over the two rows above its legs. Its `ohms` is one its code can print,
  two figures and zeros, `330` for `A331`. Every resistor of an array goes to a segment. On the
  second breadboard, the Pico's row c pins are right below the anodes, as `level-meter.ts` uses
  them; the Pico's own bottom row has room for two wires past it, not five. On a supply both are
  refused.

A light's leader rises over the lights, buttons, transistors and capacitors between it and its label,
each to a lane of its own (ADR 0047, ADR 0050), but a button's runs straight along the channel. So
put the lights that stand in row f or g further from the board's far end than every button, and keep
the top half above them free; a light in row h or i may stand past the buttons, under their leaders.

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

**The drawing as a picture** (ADR 0042). `--format png` and `--format webp` make a picture of that
same SVG, at twice its size, its credit and background with it; a WebP is lossless. Make one when the
request asks for a PNG, a WebP, or a picture for somewhere that takes no SVG, such as a chat, a
forum or slides; an SVG when the drawing goes into a web page. A browser draws it, so on Linux and
Windows the executable needs Chrome, Chromium, Edge or Brave installed. When it says none could be
started, pass on what it says to install, and never make the picture another way, from a screenshot
of the page or by converting the SVG yourself.

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
   could load it by `<img>`. Whoever puts an SVG, a PNG or a WebP somewhere hosts it, and keeps its
   credit line in it.

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
