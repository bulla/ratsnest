import type { ButtonColour, Layout, PlainLed, ShownCircuit } from "../circuit";
import {
  type Hole,
  holeAt,
  holeOfPin,
  isOnSecondBoard,
  legsOf,
  type Part,
  pinOfStrip,
  placementOf,
  printedName,
  usesSecondBoard,
} from "../drawing/breadboard";
import {
  type Band,
  type DrawnPart,
  drawBreadboard,
  PICO_GROUP,
  type PinTag,
  resistorBands,
} from "../drawing/breadboard-svg";
import { HEADER_PINS, headerPinOfGpio } from "../drawing/geometry";
import { CYRILLIC, FONT_FAMILY, type FontFile, isCyrillic, LATIN } from "../fonts";
import { DEFAULT_LANGUAGE, type Language } from "../language";
import { LIGHT_OHMS_RANGE } from "../netlist";
import { isStanding, type Orientation } from "../orientation";
import { ENGLISH_PAGE, FRENCH_PAGE, type PageWords, type Place } from "./words";

/**
 * A circuit's wiring page (ADR 0004): the breadboard drawing, the steps to build it, the parts to
 * buy and a script to test it with, as one self-contained HTML document, written as a string
 * (ADR 0008). The page is a function of what it is handed and nothing else: the same circuit,
 * layout and language make the same file.
 *
 * Every word that names a hole is written here from the layout, so the page cannot tell anyone to
 * use a hole the drawing does not show. The sentences around them are the language's, in
 * `words.ts`.
 */

/** Each language's words for the page. */
export const PAGE_WORDS: Readonly<Record<Language, PageWords>> = {
  en: ENGLISH_PAGE,
  fr: FRENCH_PAGE,
};

/** What the page is made from that lives in files rather than in code. */
export interface PageFiles {
  /** `src/page/tokens.css`. */
  readonly tokens: string;
  /** `src/page/page.css`. */
  readonly css: string;
  /** `src/page/steps.js`. */
  readonly script: string;
}

/** The scale every page is drawn in, until the theme is an input of its own (ADR 0005). */
export const PAGE_THEME = "dark";

const escaped = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** What a sentence says without its markup, for the drawing's description. */
const plain = (html: string): string =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

/**
 * A hole as a sentence places it: `a21 (GP16, pin 21)` when a Pico pin shares its strip, so
 * the reader can check the pin as well as the hole, and a rail as the rail it is. Which
 * words go round it — `from`, `du`, `en` — is the language's (`words.ts`).
 */
function placeOf(hole: Hole, words: PageWords): Place {
  const at = holeAt(hole);
  // A hole on the second board says so (scratchpi's ADR 0226), and is named as that board prints it.
  const second = at.board === 2 ? { second: true } : {};
  if (at.kind === "rail") {
    return {
      kind: "rail",
      side: at.rail.startsWith("top") ? "top" : "bottom",
      sign: at.rail.endsWith("+") ? "+" : "−",
      ...second,
    };
  }
  const pin = pinOfStrip(hole);
  const header = pin === undefined ? undefined : HEADER_PINS.find((p) => p.number === pin);
  const chip = `<span class="hole">${printedName(hole)}</span>`;
  return {
    kind: "hole",
    html: header ? `${chip} ${words.pinNote(escaped(header.label), header.number)}` : chip,
    ...second,
  };
}

/**
 * A hole on its own, in a list of legs: the chip and its pin. Which board it is on is left for
 * the sentence to say once, about all of them.
 */
const holeHtml = (hole: Hole, words: PageWords): string => {
  const place = placeOf(hole, words);
  return place.kind === "hole" ? place.html : words.in({ ...place, second: false });
};

interface Names {
  readonly led: (id: string) => string;
  readonly button: (id: string) => string;
  /** A button's cap colour (scratchpi's ADR 0174). */
  readonly cap: (id: string) => ButtonColour;
  readonly buzzer: (id: string) => string;
}

function namesOf(circuit: ShownCircuit): Names {
  const find = (list: readonly { id: string; name: string }[], id: string) =>
    list.find((item) => item.id === id)?.name ?? id;
  return {
    led: (id) => find(circuit.leds, id),
    button: (id) => find(circuit.buttons, id),
    cap: (id) => buttonColourOf(circuit, id),
    buzzer: (id) => find(circuit.buzzers, id),
  };
}

/**
 * The colour of a button's cap (scratchpi's ADR 0174). A layout's button is one its circuit has, or the
 * wiring check fails first (ADR 0007), so the red is never reached by a page that is made.
 */
const buttonColourOf = (circuit: ShownCircuit, id: string): ButtonColour =>
  circuit.buttons.find((button) => button.id === id)?.colour ?? "red";

/** One part, as the sentence that says where it goes. */
function sentenceOf(part: Part, names: Names, words: PageWords): string {
  const at = (hole: Hole) => placeOf(hole, words);
  switch (part.kind) {
    case "wire":
      return (part.arch ? words.archingJumper : words.jumper)(
        words.wire(part.role, 1),
        at(part.from),
        at(part.to),
      );
    case "resistor":
      return words.resistor(words.ohms(part.ohms), at(part.from), at(part.to));
    case "led":
      return words.led(escaped(names.led(part.led)), at(part.anode), at(part.cathode));
    case "button":
      return words.button(
        escaped(names.button(part.button)),
        names.cap(part.button),
        placementOf(part),
        legsOf(part).map((leg) => holeHtml(leg, words)),
      );
    case "buzzer":
      return words.buzzer(escaped(names.buzzer(part.buzzer)), at(part.plus), at(part.minus));
    case "rgbLed":
      return words.rgbLed(
        escaped(names.led(part.led)),
        legsOf(part).map((leg) => holeHtml(leg, words)),
        isOnSecondBoard(part.power),
      );
    case "ring":
      return words.ring(
        escaped(names.led(part.led)),
        at(part.dataIn),
        at(part.power),
        at(part.ground),
        at(part.dataOut),
      );
  }
}

/** The label in the margin, for the parts that are the circuit's components. */
function labelOf(part: Part, names: Names, words: PageWords): DrawnPart["label"] {
  switch (part.kind) {
    case "led":
      return { title: names.led(part.led), detail: words.ledLabel(part.anode) };
    case "button":
      return { title: names.button(part.button), detail: words.buttonLabel(placementOf(part)) };
    case "buzzer":
      return { title: names.buzzer(part.buzzer), detail: words.buzzerLabel(part.plus) };
    case "rgbLed":
    case "ring":
      return { title: names.led(part.led), detail: words.rgbLedLabel(printedName(part.dataIn)) };
    default:
      return undefined;
  }
}

const isComponent = (part: Part) =>
  part.kind === "led" ||
  part.kind === "button" ||
  part.kind === "buzzer" ||
  part.kind === "rgbLed" ||
  part.kind === "ring";

/** The steps' groups: `step-1` for the first of the layout's own, after the Pico. */
const stepGroup = (index: number) => `step-${index + 1}`;
const TEST_GROUP = "test";

/** Which Pico pins the circuit uses, and the step that first reaches each one. */
function tagsOf(layout: Layout): PinTag[] {
  const tags = new Map<number, string>();
  layout.steps.forEach((step, index) => {
    for (const part of step.parts) {
      for (const hole of legsOf(part)) {
        const pin = pinOfStrip(hole);
        if (pin !== undefined && !tags.has(pin)) tags.set(pin, `${stepGroup(index)} ${PICO_GROUP}`);
      }
    }
  });
  return [...tags].map(([pin, group]) => ({ pin, group }));
}

/** The GPIO each of the circuit's components is on, in the order the circuit lists them. */
function componentPins(circuit: ShownCircuit): { name: string; gpio: number }[] {
  return [
    ...circuit.leds.map((led) => ({ name: led.name, gpio: led.pin.gpio })),
    ...circuit.buttons.map((button) => ({ name: button.name, gpio: button.pin.gpio })),
    ...circuit.buzzers.map((buzzer) => ({ name: buzzer.name, gpio: buzzer.pin.gpio })),
  ];
}

function picoStep(circuit: ShownCircuit, words: PageWords, orientation: Orientation): string {
  const lands = componentPins(circuit).flatMap(({ gpio }) => {
    const pin = headerPinOfGpio(gpio);
    return pin ? [words.land(gpio, `<span class="hole">${holeOfPin(pin.number)}</span>`)] : [];
  });
  return words.picoBody(`<span class="hole">${holeOfPin(1)}</span>`, lands, orientation);
}

function stepHtml(options: {
  number: number;
  title: string;
  body: string;
  groups: string;
  test?: boolean;
}): string {
  return (
    `<li><button class="step" type="button" data-groups="${options.groups}"${options.test ? ' data-test=""' : ""} aria-pressed="false">` +
    `<span class="number">${options.number}</span>` +
    `<strong>${escaped(options.title)}</strong>` +
    `<span class="body">${options.body}</span>` +
    "</button></li>"
  );
}

function bandsHtml(bands: readonly Band[], words: PageWords): string {
  return (
    `<span class="bands" role="img" aria-label="${bands.map(words.band).join(", ")}">` +
    bands.map((band) => `<i style="background: var(--color-band-${band})"></i>`).join("") +
    "</span>"
  );
}

function partsListHtml(parts: readonly Part[], names: Names, words: PageWords): string {
  const boards = usesSecondBoard(parts) ? 2 : 1;
  const items: [number, string][] = [
    [1, words.listPico],
    [boards, words.listBreadboard(boards)],
  ];
  for (const part of parts) {
    if (part.kind === "led") items.push([1, words.listLed(escaped(names.led(part.led)))]);
    if (part.kind === "rgbLed") items.push([1, words.listRgbLed(escaped(names.led(part.led)))]);
    if (part.kind === "ring") items.push([1, words.listRing(escaped(names.led(part.led)))]);
  }
  const ohms = [...new Set(parts.flatMap((p) => (p.kind === "resistor" ? [p.ohms] : [])))].sort(
    (a, b) => a - b,
  );
  for (const value of ohms) {
    const count = parts.filter((p) => p.kind === "resistor" && p.ohms === value).length;
    const bands = resistorBands(value);
    items.push([
      count,
      words.listResistor(
        words.ohms(value),
        count,
        bandsHtml(bands.four, words),
        bands.five.map(words.band).join(", "),
      ),
    ]);
  }
  // The buttons by name, BTN1 first (scratchpi's ADR 0173), whatever order the steps put them in.
  const buttons = parts
    .flatMap((part) => (part.kind === "button" ? [part.button] : []))
    .sort((a, b) => names.button(a).localeCompare(names.button(b), undefined, { numeric: true }));
  for (const button of buttons) {
    items.push([1, words.listButton(escaped(names.button(button)), names.cap(button))]);
  }
  for (const part of parts) {
    if (part.kind === "buzzer") {
      items.push([1, words.listBuzzer(escaped(names.buzzer(part.buzzer)))]);
    }
  }
  for (const arch of [false, true]) {
    for (const role of ["ground", "power", "signal"] as const) {
      const count = parts.filter(
        (p) => p.kind === "wire" && p.role === role && Boolean(p.arch) === arch,
      ).length;
      const list = arch ? words.listLongWire : words.listWire;
      if (count > 0) items.push([count, list(words.wire(role, count), count)]);
    }
  }
  items.push([1, words.listCable]);
  return items
    .map(([count, what]) => `<li><span class="count">${count}</span><span>${what}</span></li>`)
    .join("");
}

/**
 * The pin an addressable LED's data goes in on, as the Pico's header names it: what its 5 V would
 * reach if it went in turned round. A layout's light is one its circuit has, or the wiring check
 * fails first (ADR 0007), so the question mark is never reached by a page that is made.
 */
function dataPinOf(circuit: ShownCircuit, led: string): string {
  return `GP${circuit.leds.find((each) => each.id === led)?.pin.gpio ?? "?"}`;
}

function notesHtml(circuit: ShownCircuit, parts: readonly Part[], words: PageWords): string {
  const notes: string[] = [];
  if (parts.some((p) => p.kind === "led")) {
    const [low, high] = LIGHT_OHMS_RANGE;
    notes.push(words.ledPolarity, words.anyResistor(words.ohms(low), words.ohms(high)));
  }
  for (const part of parts) {
    if (part.kind === "rgbLed") notes.push(words.rgbLedPolarity(dataPinOf(circuit, part.led)));
    if (part.kind === "ring") notes.push(words.ringPolarity(dataPinOf(circuit, part.led)));
  }
  notes.push(words.rowsLettered, words.unplug);
  return notes.map((note) => `<li>${escaped(note)}</li>`).join("");
}

/** The whole document for one circuit, laid out as its layout says, in one language. */
export function wiringPage(
  circuit: ShownCircuit,
  layout: Layout,
  files: PageFiles,
  language: Language = DEFAULT_LANGUAGE,
  orientation: Orientation = 0,
): string {
  const words = PAGE_WORDS[language];
  const names = namesOf(circuit);
  const parts = layout.steps.flatMap((step) => step.parts);

  const drawn: DrawnPart[] = layout.steps.flatMap((step, index) =>
    step.parts.map((part) => {
      const label = labelOf(part, names, words);
      return {
        part,
        group: isComponent(part) ? `${stepGroup(index)} ${TEST_GROUP}` : stepGroup(index),
        ...(label ? { label } : {}),
      };
    }),
  );
  const ledColour = (led: string) =>
    circuit.leds.find((l): l is PlainLed => l.id === led && l.colour !== "rgb")?.colour ?? "red";
  const svg = drawBreadboard({
    orientation,
    parts: drawn,
    tags: tagsOf(layout),
    ledColour,
    buttonColour: (button) => buttonColourOf(circuit, button),
    title: words.drawingTitle(circuit.name, usesSecondBoard(parts) ? 2 : 1),
    description: [
      words.drawingIntro(orientation),
      ...layout.steps.flatMap((step) =>
        step.parts.map((part) => plain(sentenceOf(part, names, words))),
      ),
    ].join(" "),
  });

  const steps = [
    stepHtml({
      number: 1,
      title: words.picoTitle,
      body: picoStep(circuit, words, orientation),
      groups: PICO_GROUP,
    }),
    ...layout.steps.map((step, index) =>
      stepHtml({
        number: index + 2,
        title: step.title,
        body: [
          ...step.parts.map((part) => sentenceOf(part, names, words)),
          ...(step.note ? [escaped(step.note)] : []),
        ].join(" "),
        groups: stepGroup(index),
      }),
    ),
    stepHtml({
      number: layout.steps.length + 2,
      title: words.testTitle,
      body: words.testBody(escaped(layout.scriptDoes)),
      groups: TEST_GROUP,
      test: true,
    }),
  ];

  const usesPower = parts.some((p) => p.kind === "wire" && p.role === "power");

  return finished(`<!doctype html>
<html lang="${words.tag}" data-theme="${PAGE_THEME}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escaped(words.title(circuit.name))}</title>
<meta name="description" content="${escaped(circuit.description)}">
<style>${files.tokens}</style>
<style>${files.css}</style>
</head>
<body>
<main class="page${isStanding(orientation) ? " standing" : ""}">
  <header>
    <p class="eyebrow">${escaped(words.eyebrow)}</p>
    <h1>${escaped(circuit.name)}</h1>
    <p class="lede">${escaped(circuit.description)}</p>
  </header>

  <figure class="panel drawing">
    <div class="scroll">${svg}</div>
    <figcaption>
      <span>${escaped(words.tapStep)}</span>
      <span class="key"><i style="background: var(--color-rail-minus)"></i>${escaped(words.railMinus)}</span>
      <span class="key"><i style="background: var(--color-rail-plus)"></i>${escaped(words.railPlus(usesPower))}</span>
    </figcaption>
  </figure>

  <div class="columns">
    <section class="column" aria-labelledby="build">
      <h2 id="build">${escaped(words.build)}</h2>
      <ol class="steps">${steps.join("")}</ol>
    </section>

    <section class="column" aria-labelledby="parts">
      <h2 id="parts">${escaped(words.parts)}</h2>
      <div class="panel card"><ul class="parts">${partsListHtml(parts, names, words)}</ul></div>

      <div class="script-head">
        <h2 id="script-title">${escaped(words.script)}</h2>
        <button class="copy" type="button" data-copies="script" data-copied="${escaped(words.copied)}" data-selected="${escaped(words.selected)}">${escaped(words.copy)}</button>
      </div>
      <pre id="script"><code>${escaped(layout.script)}</code></pre>

      <ul class="notes">${notesHtml(circuit, parts, words)}</ul>
    </section>
  </div>

  <footer>
    ${words.footer}
  </footer>
</main>
<script>${files.script}</script>
</body>
</html>
`);
}

/** The code points a font file has, as `unicode-range` writes them: `U+20-7E, U+A0-FF, …`. */
function unicodeRangeOf(file: FontFile): string {
  const points = [...file.font.characterSet].sort((a, b) => a - b);
  const ranges: string[] = [];
  for (let i = 0; i < points.length; ) {
    const from = points[i] ?? 0;
    let to = from;
    while (points[i + 1] === to + 1) to = points[++i] ?? to;
    i += 1;
    const hex = (point: number) => point.toString(16).toUpperCase();
    ranges.push(from === to ? `U+${hex(from)}` : `U+${hex(from)}-${hex(to)}`);
  }
  return ranges.join(", ");
}

/** One of Nunito's files as the page carries it, inside it, under ratsnest's own family name. */
const fontFace = (file: FontFile): string =>
  `@font-face{font-family:"${FONT_FAMILY}";font-style:normal;font-weight:200 1000;font-display:block;` +
  `src:url(data:font/woff2;base64,${Buffer.from(file.bytes).toString("base64")}) format("woff2");` +
  `unicode-range:${unicodeRangeOf(file)}}`;

/** The narrow no-break space French writes before `: ; ? !` and inside `« »`. */
const NARROW = "\u202F";
/** Nunito's thin space, which stands for it (ADR 0012). */
const THIN = "\u2009";

/**
 * The narrow no-break space as Nunito draws it (ADR 0012): its thin space, since Nunito has no
 * narrow one. Where text wraps, the words either side are held together by `nowrap`, so it still
 * never breaks; in the drawing, where nothing wraps, and in an attribute, it is the thin space
 * alone. The script, in the device's own monospace, is left as it is written.
 */
function narrowSpaces(html: string): string {
  let inSvg = false;
  let verbatim = false;
  return html
    .split(/(<[^>]*>)/)
    .map((piece) => {
      if (piece.startsWith("<")) {
        const tag = /^<\/?([a-zA-Z0-9]+)/.exec(piece)?.[1]?.toLowerCase();
        const closing = piece.startsWith("</");
        if (tag === "svg") inSvg = !closing;
        if (tag === "pre" || tag === "script" || tag === "style") verbatim = !closing;
        return piece.replaceAll(NARROW, THIN);
      }
      if (verbatim || !piece.includes(NARROW)) return piece;
      if (inSvg) return piece.replaceAll(NARROW, THIN);
      return piece.replace(
        new RegExp(`[^\\s${NARROW}]*(?:${NARROW}[^\\s${NARROW}]*)+`, "g"),
        (words) => `<span class="nowrap">${words.replaceAll(NARROW, THIN)}</span>`,
      );
    })
    .join("");
}

/**
 * The page as it is written: Nunito carried inside it, the Latin file always and the Cyrillic one
 * when the page writes a Cyrillic letter (ADR 0012), and every narrow no-break space as Nunito
 * draws it.
 */
function finished(html: string): string {
  const files = [LATIN, ...([...html].some(isCyrillic) ? [CYRILLIC] : [])];
  return narrowSpaces(html).replace(
    "<style>",
    `<style>${files.map(fontFace).join("")}</style>\n<style>`,
  );
}
