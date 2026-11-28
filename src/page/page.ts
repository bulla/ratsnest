import { ceramicCode } from "../ceramics";
import type { ButtonColour, Layout, LedColour, PlainLed, ShownCircuit } from "../circuit";
import { DIODE_NAMES, DIODES, type DiodeName } from "../diodes";
import {
  barGraphLegsOf,
  dipLegsOf,
  type Hole,
  holeAt,
  holeOfPin,
  isOnSecondBoard,
  legsOf,
  type Part,
  pinOfStrip,
  placementOf,
  printedName,
  resistorArrayLegsOf,
  supplyLeadsOf,
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
import { CYRILLIC, FONT_FAMILY, type FontFile, isCyrillic, LATIN, widthOf } from "../fonts";
import { DEFAULT_LANGUAGE, type Language } from "../language";
import {
  ANALOGUE_GPIOS,
  BASE_OHMS_RANGE,
  CHARGE_OHMS_RANGE,
  FLASHER_BASE_OHMS_RANGE,
  LIGHT_OHMS_RANGE,
} from "../netlist";
import { isStanding, type Orientation } from "../orientation";
import { resistorArrayCode } from "../resistor-arrays";
import { DEFAULT_THEME, type Theme } from "../theme";
import { TRANSISTORS, type TransistorName } from "../transistors";
import { ENGLISH_PAGE, FRENCH_PAGE, type PageWords, type Place, RUSSIAN_PAGE } from "./words";

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
  ru: RUSSIAN_PAGE,
};

/** What the page is made from that lives in files rather than in code. */
export interface PageFiles {
  /** `src/page/tokens.css`. */
  readonly tokens: string;
  /** `src/page/drawing.css`: the drawing's own styles, which a page and a drawing alone carry (ADR 0031). */
  readonly drawing: string;
  /** `src/page/page.css`. */
  readonly css: string;
  /** `src/page/steps.js`. */
  readonly script: string;
}

/**
 * What a page is made from besides its circuit: the four inputs it is a pure function of (ADR 0004,
 * ADR 0005, ADR 0003, ADR 0010), the circuit named by its file, as `pages/` and the page's own tag
 * name it (ADR 0013, ADR 0023).
 */
export interface PageInputs {
  /** The circuit file's name, without `.ts`: `push-button`. */
  readonly circuit: string;
  readonly orientation: Orientation;
  readonly theme: Theme;
  readonly language: Language;
}

/** The inputs a page is made with when nothing says otherwise, as `generate` defaults them. */
export const DEFAULT_INPUTS: PageInputs = {
  circuit: "circuit",
  orientation: 0,
  theme: DEFAULT_THEME,
  language: DEFAULT_LANGUAGE,
};

/**
 * The page's four inputs as its `<meta name="ratsnest">` says them (ADR 0013), so that a page whose
 * file is gone can still be matched to the Artifact made from it: `circuit=push-button;orientation=0;…`.
 */
export const inputsTag = (inputs: PageInputs): string =>
  `circuit=${inputs.circuit};orientation=${inputs.orientation};theme=${inputs.theme};language=${inputs.language}`;

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
function placeOf(hole: Hole, words: PageWords, pico = true): Place {
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
  // A circuit with a supply has no Pico, and so no pin shares a hole's strip (ADR 0032).
  const pin = pico ? pinOfStrip(hole) : undefined;
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
const holeHtml = (hole: Hole, words: PageWords, pico = true): string => {
  const place = placeOf(hole, words, pico);
  return place.kind === "hole" ? place.html : words.in({ ...place, second: false });
};

interface Names {
  /** Whether the circuit is on a Pico, or has a supply in its place (ADR 0032). */
  readonly pico: boolean;
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
    pico: !circuit.supply,
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
  const at = (hole: Hole) => placeOf(hole, words, names.pico);
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
        legsOf(part).map((leg) => holeHtml(leg, words, names.pico)),
        part.board === 2,
      );
    case "buzzer":
      return words.buzzer(escaped(names.buzzer(part.buzzer)), at(part.plus), at(part.minus));
    case "rgbLed":
      return words.rgbLed(
        escaped(names.led(part.led)),
        legsOf(part).map((leg) => holeHtml(leg, words, names.pico)),
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
    case "electrolytic":
      return words.electrolytic(words.microfarads(part.microfarads), at(part.plus), at(part.minus));
    case "transistor":
      return words.transistor(
        part.model,
        TRANSISTORS[part.model].type,
        at(part.emitter),
        at(part.base),
        at(part.collector),
      );
    case "diode":
      return words.diode(part.model, at(part.anode), at(part.cathode));
    case "ceramic":
      return words.ceramic(
        words.nanofarads(part.nanofarads),
        ceramicCode(part.nanofarads) ?? "",
        at(part.from),
        at(part.to),
      );
    case "slideSwitch":
      return words.slideSwitch(at(part.middle), at(part.left), at(part.right));
    case "slidePotentiometer":
      return words.slidePotentiometer(
        words.ohms(part.ohms),
        at(part.wiper),
        at(part.end),
        at(part.otherEnd),
      );
    case "dipSwitch": {
      const legs = dipLegsOf(part).map((pair) =>
        pair.map((leg) => holeHtml(leg, words, names.pico)),
      );
      return words.dipSwitch(
        part.switches,
        legs[0] ?? [],
        legs[legs.length - 1] ?? [],
        part.board === 2,
      );
    }
    case "pir":
      return words.pir(escaped(part.name), at(part.power), at(part.output), at(part.ground));
    case "barGraph": {
      const legs = barGraphLegsOf(part).map((pair) =>
        pair.map((leg) => holeHtml(leg, words, names.pico)),
      );
      return words.barGraph(
        part.segments,
        words.segmentColour[part.colour],
        legs[0] ?? [],
        legs[legs.length - 1] ?? [],
        part.board === 2,
      );
    }
    case "resistorArray": {
      const [common = part.common, ...legs] = resistorArrayLegsOf(part).map((leg) =>
        holeHtml(leg, words, names.pico),
      );
      return words.resistorArray(
        words.ohms(part.ohms),
        part.resistors,
        resistorArrayCode(part.ohms) ?? "",
        common,
        legs[0] ?? "",
        legs[legs.length - 1] ?? "",
        isOnSecondBoard(part.common),
      );
    }
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
    case "pir":
      return { title: part.name, detail: words.pirLabel(printedName(part.output)) };
    default:
      return undefined;
  }
}

const isComponent = (part: Part) =>
  part.kind === "led" ||
  part.kind === "button" ||
  part.kind === "buzzer" ||
  part.kind === "rgbLed" ||
  part.kind === "ring" ||
  part.kind === "pir";

/**
 * The parts the test step picks out: the components a reader watches and presses, a ceramic
 * capacitor, which is what its circuit's script times (ADR 0051), a slide switch, a slide
 * potentiometer and a DIP switch, which the reader slides (ADR 0052 to ADR 0054), and a bar graph,
 * whose segments the reader watches light (ADR 0058). A motion sensor,
 * which the reader moves in front of, is a component, named as every part outside the board is
 * (ADR 0057).
 */
const isTested = (part: Part) =>
  isComponent(part) ||
  part.kind === "ceramic" ||
  part.kind === "slideSwitch" ||
  part.kind === "slidePotentiometer" ||
  part.kind === "dipSwitch" ||
  part.kind === "barGraph";

/** The steps' groups: `step-1` for the first of the layout's own, after the Pico. */
const stepGroup = (index: number) => `step-${index + 1}`;
const TEST_GROUP = "test";
/** The group a circuit's supply is drawn in, picked out by the last step (ADR 0032). */
const SUPPLY_GROUP = "supply";

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
    ...circuit.leds.flatMap((led) => (led.pin ? [{ name: led.name, gpio: led.pin.gpio }] : [])),
    ...circuit.buttons.flatMap((button) =>
      button.pin ? [{ name: button.name, gpio: button.pin.gpio }] : [],
    ),
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

function partsListHtml(
  circuit: ShownCircuit,
  parts: readonly Part[],
  names: Names,
  words: PageWords,
): string {
  const boards = usesSecondBoard(parts) ? 2 : 1;
  const items: [number, string][] = [
    [1, circuit.supply ? words.listSupply(circuit.supply.volts) : words.listPico],
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
  const slides = parts.filter((p) => p.kind === "slideSwitch").length;
  if (slides > 0) items.push([slides, words.listSlideSwitch(slides)]);
  const potentiometers = [
    ...new Set(parts.flatMap((p) => (p.kind === "slidePotentiometer" ? [p.ohms] : []))),
  ].sort((a, b) => a - b);
  for (const value of potentiometers) {
    const count = parts.filter((p) => p.kind === "slidePotentiometer" && p.ohms === value).length;
    items.push([count, words.listSlidePotentiometer(words.ohms(value), count)]);
  }
  const dips = [
    ...new Set(parts.flatMap((p) => (p.kind === "dipSwitch" ? [p.switches] : []))),
  ].sort((a, b) => a - b);
  for (const switches of dips) {
    const count = parts.filter((p) => p.kind === "dipSwitch" && p.switches === switches).length;
    items.push([count, words.listDipSwitch(switches, count)]);
  }
  const graphs = [
    ...new Set(parts.flatMap((p) => (p.kind === "barGraph" ? [`${p.segments} ${p.colour}`] : []))),
  ];
  for (const graph of graphs) {
    const [segments, colour] = graph.split(" ") as [string, LedColour];
    const count = parts.filter(
      (p) => p.kind === "barGraph" && `${p.segments} ${p.colour}` === graph,
    ).length;
    items.push([count, words.listBarGraph(Number(segments), words.segmentColour[colour], count)]);
  }
  const arrays = [
    ...new Set(
      parts.flatMap((p) => (p.kind === "resistorArray" ? [`${p.ohms} ${p.resistors}`] : [])),
    ),
  ];
  for (const array of arrays) {
    const [ohms, resistors] = array.split(" ").map(Number) as [number, number];
    const count = parts.filter(
      (p) => p.kind === "resistorArray" && `${p.ohms} ${p.resistors}` === array,
    ).length;
    items.push([
      count,
      words.listResistorArray(words.ohms(ohms), resistors, resistorArrayCode(ohms) ?? "", count),
    ]);
  }
  // Each motion sensor by its name (ADR 0057), and the three jumpers each one takes to the board
  // (ADR 0055).
  const sensors = parts.flatMap((p) => (p.kind === "pir" ? [p] : []));
  for (const sensor of sensors) items.push([1, words.listPir(escaped(sensor.name))]);
  if (sensors.length > 0) {
    items.push([3 * sensors.length, words.listPirJumpers(3 * sensors.length)]);
  }
  const microfarads = [
    ...new Set(parts.flatMap((p) => (p.kind === "electrolytic" ? [p.microfarads] : []))),
  ].sort((a, b) => a - b);
  for (const value of microfarads) {
    const count = parts.filter((p) => p.kind === "electrolytic" && p.microfarads === value).length;
    items.push([count, words.listElectrolytic(words.microfarads(value), count)]);
  }
  for (const model of transistorModelsOf(parts)) {
    const count = parts.filter((p) => p.kind === "transistor" && p.model === model).length;
    items.push([count, words.listTransistor(model, TRANSISTORS[model].type, count)]);
  }
  for (const value of nanofaradsOf(parts)) {
    const count = parts.filter((p) => p.kind === "ceramic" && p.nanofarads === value).length;
    items.push([
      count,
      words.listCeramic(words.nanofarads(value), ceramicCode(value) ?? "", count),
    ]);
  }
  for (const model of diodeModelsOf(parts)) {
    const count = parts.filter((p) => p.kind === "diode" && p.model === model).length;
    items.push([count, words.listDiode(model, DIODES[model].use, count)]);
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
  if (!circuit.supply) items.push([1, words.listCable]);
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
  return `GP${circuit.leds.find((each) => each.id === led)?.pin?.gpio ?? "?"}`;
}

/** The models of the transistors a circuit has, each once, in the order the steps place them. */
const transistorModelsOf = (parts: readonly Part[]): TransistorName[] => [
  ...new Set(parts.flatMap((p) => (p.kind === "transistor" ? [p.model] : []))),
];

/** The values of the ceramic capacitors a circuit has, each once, smallest first. */
const nanofaradsOf = (parts: readonly Part[]): number[] =>
  [...new Set(parts.flatMap((p) => (p.kind === "ceramic" ? [p.nanofarads] : [])))].sort(
    (a, b) => a - b,
  );

/** The models of the diodes a circuit has, each once, in the order the steps place them. */
const diodeModelsOf = (parts: readonly Part[]): DiodeName[] => [
  ...new Set(parts.flatMap((p) => (p.kind === "diode" ? [p.model] : []))),
];

function notesHtml(circuit: ShownCircuit, parts: readonly Part[], words: PageWords): string {
  const notes: string[] = [];
  const models = transistorModelsOf(parts);
  if (parts.some((p) => p.kind === "led")) {
    const [low, high] = LIGHT_OHMS_RANGE;
    notes.push(
      circuit.supply
        ? words.supplyLedPolarity
        : models.length > 0
          ? words.switchedLedPolarity
          : words.ledPolarity,
      words.anyResistor(words.ohms(low), words.ohms(high)),
    );
  }
  for (const model of models) {
    notes.push(words.transistorPinout(model, TRANSISTORS[model].legs, TRANSISTORS[model].unlike));
  }
  if (models.length > 0) {
    // A flasher's base resistors set its beat, and are larger than a switch's (ADR 0046).
    const [low, high] = circuit.supply ? FLASHER_BASE_OHMS_RANGE : BASE_OHMS_RANGE;
    notes.push(words.baseResistor(words.ohms(low), words.ohms(high)));
  }
  for (const part of parts) {
    if (part.kind === "rgbLed") notes.push(words.rgbLedPolarity(dataPinOf(circuit, part.led)));
    if (part.kind === "ring") notes.push(words.ringPolarity(dataPinOf(circuit, part.led)));
  }
  if (parts.some((p) => p.kind === "electrolytic")) notes.push(words.electrolyticPolarity);
  if (parts.some((p) => p.kind === "slideSwitch")) notes.push(words.slideSwitchNote);
  if (parts.some((p) => p.kind === "slidePotentiometer")) {
    notes.push(words.slidePotentiometerWiper(ANALOGUE_GPIOS.map((gpio) => `GP${gpio}`)));
  }
  if (parts.some((p) => p.kind === "dipSwitch")) notes.push(words.dipPullUp);
  if (parts.some((p) => p.kind === "barGraph")) {
    notes.push(words.barGraphPolarity);
    if (!parts.some((p) => p.kind === "led")) {
      const [low, high] = LIGHT_OHMS_RANGE;
      notes.push(words.anyResistor(words.ohms(low), words.ohms(high)));
    }
  }
  const [array] = parts.flatMap((p) => (p.kind === "resistorArray" ? [p.ohms] : []));
  if (array !== undefined) {
    notes.push(words.resistorArrayCode(resistorArrayCode(array) ?? "", words.ohms(array)));
  }
  if (parts.some((p) => p.kind === "pir")) notes.push(words.pirPins);
  const [ceramic] = nanofaradsOf(parts);
  if (ceramic !== undefined) {
    const [low, high] = CHARGE_OHMS_RANGE;
    notes.push(
      words.ceramicCode(ceramicCode(ceramic) ?? "", words.nanofarads(ceramic)),
      words.chargeResistor(words.ohms(low), words.ohms(high)),
    );
  }
  if (diodeModelsOf(parts).length > 0)
    notes.push(words.diodePolarity, words.diodeAlike(DIODE_NAMES));
  notes.push(words.rowsLettered, circuit.supply ? words.supplyUnplug : words.unplug);
  return notes.map((note) => `<li>${escaped(note)}</li>`).join("");
}

/**
 * The drawing of a circuit, as one `<svg>` element: the one a page draws, and the one the drawing
 * alone is made of (ADR 0031), so the two are the same drawing.
 */
function drawingOf(circuit: ShownCircuit, layout: Layout, inputs: PageInputs): string {
  const { language, orientation } = inputs;
  const words = PAGE_WORDS[language];
  const names = namesOf(circuit);
  const parts = layout.steps.flatMap((step) => step.parts);
  const drawn: DrawnPart[] = layout.steps.flatMap((step, index) =>
    step.parts.map((part) => {
      const label = labelOf(part, names, words);
      return {
        part,
        group: isTested(part) ? `${stepGroup(index)} ${TEST_GROUP}` : stepGroup(index),
        ...(label ? { label } : {}),
      };
    }),
  );
  const ledColour = (led: string) =>
    circuit.leds.find((l): l is PlainLed => l.id === led && l.colour !== "rgb")?.colour ?? "red";
  const supply = circuit.supply;
  const volts = supply ? words.volts(supply.volts) : "";
  return drawBreadboard({
    orientation,
    ohms: words.ohms,
    parts: drawn,
    tags: supply ? [] : tagsOf(layout),
    ...(supply ? { supply: { rails: supply.rails, label: volts, group: SUPPLY_GROUP } } : {}),
    ledColour,
    buttonColour: (button) => buttonColourOf(circuit, button),
    title: words.drawingTitle(circuit.name, usesSecondBoard(parts) ? 2 : 1),
    description: [
      supply ? words.supplyIntro(volts, orientation) : words.drawingIntro(orientation),
      ...layout.steps.flatMap((step) =>
        step.parts.map((part) => plain(sentenceOf(part, names, words))),
      ),
    ].join(" "),
  });
}

/** The whole document for one circuit, laid out as its layout says, in one language. */
export function wiringPage(
  circuit: ShownCircuit,
  layout: Layout,
  files: PageFiles,
  given: Partial<PageInputs> = {},
): string {
  const inputs: PageInputs = { ...DEFAULT_INPUTS, ...given };
  const { language, orientation, theme } = inputs;
  const words = PAGE_WORDS[language];
  const names = namesOf(circuit);
  const parts = layout.steps.flatMap((step) => step.parts);
  const svg = drawingOf(circuit, layout, inputs);
  const supply = circuit.supply;
  const volts = supply ? words.volts(supply.volts) : "";

  // A circuit on a Pico starts with the Pico and ends with its script; one with a supply has no
  // Pico, and ends with its supply connected and its test (ADR 0032).
  const first = supply ? 1 : 2;
  const leads = supply ? supplyLeadsOf(supply.rails) : undefined;
  const steps = [
    ...(supply
      ? []
      : [
          stepHtml({
            number: 1,
            title: words.picoTitle,
            body: picoStep(circuit, words, orientation),
            groups: PICO_GROUP,
          }),
        ]),
    ...layout.steps.map((step, index) =>
      stepHtml({
        number: index + first,
        title: step.title,
        body: [
          ...step.parts.map((part) => sentenceOf(part, names, words)),
          ...(step.note ? [escaped(step.note)] : []),
        ].join(" "),
        groups: stepGroup(index),
      }),
    ),
    leads
      ? stepHtml({
          number: layout.steps.length + first,
          title: words.supplyTitle,
          body: words.supplyBody(
            placeOf(leads.plus, words, false),
            placeOf(leads.minus, words, false),
            escaped(layout.test),
          ),
          groups: `${SUPPLY_GROUP} ${TEST_GROUP}`,
          test: true,
        })
      : stepHtml({
          number: layout.steps.length + first,
          title: words.testTitle,
          body: words.testBody(escaped(layout.test)),
          groups: TEST_GROUP,
          test: true,
        }),
  ];

  const usesPower = parts.some((p) => p.kind === "wire" && p.role === "power");
  // The circuit's own credit (ADR 0035), and no footer at all when it has none.
  const footer =
    circuit.credit === undefined ? "" : `\n  <footer>\n    ${escaped(circuit.credit)}\n  </footer>`;

  return finished(`<!doctype html>
<html lang="${words.tag}" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escaped(circuit.name)}</title>
<meta name="ratsnest" content="${escaped(inputsTag(inputs))}">
<meta name="description" content="${escaped(circuit.description)}">
<style>${files.tokens}</style>
<style>${files.drawing}</style>
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
      <span class="key"><i style="background: var(--color-rail-plus)"></i>${escaped(supply ? words.railSupply(volts) : words.railPlus(usesPower))}</span>
    </figcaption>
  </figure>

  <div class="columns">
    <section class="column" aria-labelledby="build">
      <h2 id="build">${escaped(words.build)}</h2>
      <ol class="steps">${steps.join("")}</ol>
    </section>

    <section class="column" aria-labelledby="parts">
      <h2 id="parts">${escaped(words.parts)}</h2>
      <div class="panel card"><ul class="parts">${partsListHtml(circuit, parts, names, words)}</ul></div>
${
  layout.script === undefined
    ? ""
    : `
      <div class="script-head">
        <h2 id="script-title">${escaped(words.script)}</h2>
        <button class="copy" type="button" data-copies="script" data-copied="${escaped(words.copied)}" data-selected="${escaped(words.selected)}">${escaped(words.copy)}</button>
      </div>
      <pre id="script"><code>${escaped(layout.script)}</code></pre>
`
}
      <ul class="notes">${notesHtml(circuit, parts, words)}</ul>
    </section>
  </div>
${footer}
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
  return narrowSpaces(html).replace("<style>", `<style>${fontFacesFor(html)}</style>\n<style>`);
}

/** Nunito's files as a document carries them: the Latin one always, the Cyrillic one when it writes a Cyrillic letter. */
const fontFacesFor = (text: string): string =>
  [LATIN, ...([...text].some(isCyrillic) ? [CYRILLIC] : [])].map(fontFace).join("");

/**
 * The credit line along the drawing alone's bottom edge (ADR 0031), as `drawing.css` sets it: its
 * size in millimetres and its weight, the height of each line, the gap above it and the margin
 * around it.
 */
export const CREDIT = { size: 1.5, weight: 600, line: 2, gap: 1.5, margin: 1.5 } as const;

/** How many pixels the drawing alone says a millimetre is (ADR 0031): about the page's own scale. */
export const PX_PER_MM = 6;

const mm = (value: number): number => Math.round(value * 1000) / 1000;

/** Text as XML writes it inside an element. */
const xmlText = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Words broken into lines no wider than `width`, each measured in Nunito at the credit's size, and
 * broken only at a space: a word wider than the line has a line of its own.
 */
export function creditLines(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const longer = line ? `${line} ${word}` : word;
    if (line && widthOf(longer, CREDIT.size, CREDIT.weight) > width) {
      lines.push(line);
      line = word;
    } else {
      line = longer;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The box a drawing's `<svg>` draws, read from the one place it says it. */
function viewOf(svg: string): { x: number; y: number; w: number; h: number } {
  const found = /^<svg class="breadboard-drawing" viewBox="(\S+) (\S+) (\S+) (\S+)"/.exec(svg);
  if (!found) throw new Error("The drawing no longer opens with its class and its viewBox");
  const [x, y, w, h] = found.slice(1).map(Number) as [number, number, number, number];
  return { x, y, w, h };
}

/**
 * A circuit's drawing alone, as one SVG file that needs nothing else (ADR 0031): a picture for other
 * pages to embed by `<img>`. It carries Nunito, the tokens in its theme and the drawing's own styles,
 * paints its own background, writes its circuit's credit along its bottom edge when it has one, and
 * says its size in pixels.
 * Like a page, it is a function of its four inputs and nothing else.
 */
export function drawingFile(
  circuit: ShownCircuit,
  layout: Layout,
  files: PageFiles,
  given: Partial<PageInputs> = {},
): string {
  const inputs: PageInputs = { ...DEFAULT_INPUTS, ...given };
  const drawing = drawingOf(circuit, layout, inputs);
  const view = viewOf(drawing);
  // The circuit's own credit (ADR 0035), and no line, nor room for one, when it has none. A narrow
  // space is Nunito's thin one in a drawing (ADR 0012), so it is measured as it is drawn.
  const credit = circuit.credit?.replaceAll(NARROW, THIN);
  const lines = credit === undefined ? [] : creditLines(credit, view.w - 2 * CREDIT.margin);
  const below =
    lines.length === 0
      ? 0
      : CREDIT.gap + CREDIT.size + (lines.length - 1) * CREDIT.line + CREDIT.margin;
  const height = view.h + below;
  const box = `${mm(view.x)} ${mm(view.y)} ${mm(view.w)} ${mm(height)}`;
  const nested = drawing.replace(
    '<svg class="breadboard-drawing" ',
    `<svg class="breadboard-drawing" x="${mm(view.x)}" y="${mm(view.y)}" width="${mm(view.w)}" height="${mm(view.h)}" `,
  );
  const top = view.y + view.h + CREDIT.gap + CREDIT.size;
  const text = lines
    .map(
      (line, index) =>
        `<text class="drawing-credit" x="${mm(view.x + CREDIT.margin)}" y="${mm(top + index * CREDIT.line)}">${xmlText(line)}</text>`,
    )
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" data-theme="${inputs.theme}" ` +
    `width="${mm(view.w * PX_PER_MM)}" height="${mm(height * PX_PER_MM)}" viewBox="${box}">` +
    `<style><![CDATA[${files.tokens}${files.drawing}]]></style>` +
    `<rect x="${mm(view.x)}" y="${mm(view.y)}" width="${mm(view.w)}" height="${mm(height)}" fill="var(--color-surface)"/>` +
    `${nested}${text}</svg>\n`;
  const faces = `<style><![CDATA[${fontFacesFor(svg)}]]></style>`;
  return svg.replace("<style>", `${faces}<style>`).replaceAll(NARROW, THIN);
}
