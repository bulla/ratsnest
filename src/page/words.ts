import { formatNanofarads } from "../ceramics";
import type { ButtonColour, LedColour, Supply } from "../circuit";
import type { DiodeUse } from "../diodes";
import type { WireRole } from "../drawing/breadboard";
import { type Band, formatMicrofarads, formatOhms } from "../drawing/breadboard-svg";
import { plural } from "../language";
import type { Orientation } from "../orientation";
import type { TransistorLeg, TransistorType } from "../transistors";

/**
 * Everything a page says of its own, in each language the engine writes (ADR 0010): the sentences it
 * builds from the parts, the headings and the notes. A circuit's own words, its name, its
 * description, its credit and its steps' titles and notes, are the circuit's, and are not here.
 *
 * The pages are written for an adult with a breadboard, so the French says `vous`. Its sentences are
 * built around holes and part names, which is where French grammar has to be got right: a light is
 * feminine (*la LED*) and a button and a buzzer masculine, `à le` is `au` and `de le` is `du`, and an
 * article loses its vowel before a name that starts with one.
 */

/**
 * Where a part's leg goes: a hole, already written as the page marks one up — the hole, and
 * the pin that shares its strip — or one of the rails.
 */
export type Place =
  | { readonly kind: "hole"; readonly html: string; readonly second?: boolean }
  | {
      readonly kind: "rail";
      readonly side: "top" | "bottom";
      readonly sign: "+" | "−";
      readonly second?: boolean;
    };

/**
 * A light, a button, a buzzer or a sensor: what an article agrees with in a language that has
 * gender.
 */
export type PartKind = "led" | "button" | "buzzer" | "sensor";

/** Where a button sits on the breadboard (`placementOf`, scratchpi's ADR 0154). */
export type ButtonPlacement = "across" | "above" | "below";

export interface PageWords {
  /** For `<html lang>`. */
  readonly tag: string;
  readonly eyebrow: string;
  readonly tapStep: string;
  readonly railMinus: string;
  readonly railPlus: (used: boolean) => string;
  readonly build: string;
  readonly parts: string;
  readonly script: string;
  readonly copy: string;
  readonly copied: string;
  readonly selected: string;

  /** The drawing's own title, on one breadboard or two (scratchpi's ADR 0226), and its description's start. */
  readonly drawingTitle: (circuit: string, boards: number) => string;
  /** Where the Pico sits and which way its USB points, at the drawing's quarter turn (ADR 0003). */
  readonly drawingIntro: (orientation: Orientation) => string;

  /** A hole's pin, after the hole: `(GP16, pin 21)`. */
  readonly pinNote: (label: string, number: number) => string;
  /** A place as the leg of a part starts from it, ends at it and sits in it. */
  readonly from: (place: Place) => string;
  readonly to: (place: Place) => string;
  readonly in: (place: Place) => string;
  /** A list read aloud: `a`, `a and b`, `a, b and c`. */
  readonly list: (items: readonly string[]) => string;

  /** A value in ohms, as the language writes a decimal: `4.7 kΩ`, `4,7 kΩ`. */
  readonly ohms: (value: number) => string;
  /** A value in microfarads, as the language writes it: `470 µF`, `0,47 µF`, `470 мкФ`. */
  readonly microfarads: (value: number) => string;
  /** A value in nanofarads, as the language writes it: `100 nF`, `4,7 nF`, `100 нФ`. */
  readonly nanofarads: (value: number) => string;
  /** A resistor's colour, band by band. */
  readonly band: (band: Band) => string;
  /** A jumper's colour, by what it carries, agreeing with how many there are. */
  readonly wire: (role: WireRole, count: number) => string;

  /** Each part's sentence, the places already written. `name` is escaped already. */
  readonly jumper: (colour: string, from: Place, to: Place) => string;
  /** A long flexible jumper that arches over the board rather than lying on it (scratchpi's ADR 0166). */
  readonly archingJumper: (colour: string, from: Place, to: Place) => string;
  readonly resistor: (ohms: string, from: Place, to: Place) => string;
  readonly led: (name: string, anode: Place, cathode: Place) => string;
  /** A button, with its cap's colour (scratchpi's ADR 0174): *BTN1, the red button, across the channel*. */
  readonly button: (
    name: string,
    cap: ButtonColour,
    where: ButtonPlacement,
    legs: readonly string[],
    /** Whether its legs are on the second breadboard (ADR 0028), said once rather than for each. */
    second: boolean,
  ) => string;
  readonly buzzer: (name: string, plus: Place, minus: Place) => string;
  /**
   * An RGB LED (scratchpi's ADR 0222): its four holes, in the guide's order of its legs, and whether they
   * are on the second breadboard (scratchpi's ADR 0226), which is said once rather than for each hole.
   */
  readonly rgbLed: (name: string, legs: readonly string[], second: boolean) => string;
  /**
   * The ring (scratchpi's ADR 0234, 0238): the hole each of its four pins goes in, by the name its back
   * prints beside it, data in first.
   */
  readonly ring: (
    name: string,
    dataIn: Place,
    power: Place,
    ground: Place,
    dataOut: Place,
  ) => string;
  /** An electrolytic capacitor (ADR 0043), its value written already: its + leg, then its − leg. */
  readonly electrolytic: (microfarads: string, plus: Place, minus: Place) => string;
  /** A transistor (ADR 0044), by its model and type, and where each of its legs goes. */
  readonly transistor: (
    model: string,
    type: TransistorType,
    emitter: Place,
    base: Place,
    collector: Place,
  ) => string;
  /** A diode (ADR 0049), by its model: its anode, then its cathode, the end its band is at. */
  readonly diode: (model: string, anode: Place, cathode: Place) => string;
  /** A ceramic capacitor (ADR 0051), its value written already, the code it prints, and its legs. */
  readonly ceramic: (nanofarads: string, code: string, from: Place, to: Place) => string;
  /** A slide switch (ADR 0052): its middle leg, then its outer ones, left and right. */
  readonly slideSwitch: (middle: Place, left: Place, right: Place) => string;
  /**
   * A slide potentiometer (ADR 0053), its value written already: its wiper, the end beside it, and
   * its other end, on the other breadboard.
   */
  readonly slidePotentiometer: (ohms: string, wiper: Place, end: Place, otherEnd: Place) => string;
  /**
   * A PIR motion sensor beside the board (ADR 0055, ADR 0056): where the jumper on each of its pins
   * goes, by the name its board prints beside the pin, and the jumper's colour.
   */
  readonly pir: (name: string, power: Place, output: Place, ground: Place) => string;
  /**
   * A DIP switch (ADR 0054): how many switches, the holes of switch 1's two legs and of the last's,
   * and whether they are on the second breadboard, which is said once rather than for each hole.
   */
  readonly dipSwitch: (
    switches: number,
    first: readonly string[],
    last: readonly string[],
    second: boolean,
  ) => string;

  /**
   * An LED bar graph (ADR 0058): how many segments, their colour as this language writes it beside
   * them, the holes of segment 1's anode and cathode and of the last's, and whether they are on the
   * second breadboard, which is said once rather than for each hole.
   */
  readonly barGraph: (
    segments: number,
    colour: string,
    first: readonly string[],
    last: readonly string[],
    second: boolean,
  ) => string;
  /**
   * A resistor array (ADR 0059): its value, written already, how many resistors, the code it
   * prints, the holes of its common leg and of its first and last resistors' legs, and whether they
   * are on the second breadboard.
   */
  readonly resistorArray: (
    ohms: string,
    resistors: number,
    code: string,
    common: string,
    first: string,
    last: string,
    second: boolean,
  ) => string;
  /** A bar graph's segments' colour, as its sentence and its parts list's line write it beside them. */
  readonly segmentColour: Readonly<Record<LedColour, string>>;

  /** The labels in the drawing's margin, which are plain text. */
  readonly ledLabel: (anode: string) => string;
  readonly buttonLabel: (where: ButtonPlacement) => string;
  readonly buzzerLabel: (plus: string) => string;
  readonly rgbLedLabel: (dataIn: string) => string;
  /** A motion sensor's label: the hole its OUT jumper goes in (ADR 0057). */
  readonly pirLabel: (output: string) => string;

  /** The first step and the last, which every circuit has. */
  readonly picoTitle: string;
  readonly picoBody: (pinOne: string, lands: readonly string[], orientation: Orientation) => string;
  /** Where one of the circuit's pins lands once the Pico is in. */
  readonly land: (gpio: number, hole: string) => string;
  readonly testTitle: string;
  readonly testBody: (test: string) => string;

  /** The parts list. A name is escaped already, and capitalised where it starts a line. */
  readonly listPico: string;
  /** One half-size breadboard, or two that join along their long sides (scratchpi's ADR 0226). */
  readonly listBreadboard: (count: number) => string;
  readonly listLed: (name: string) => string;
  readonly listRgbLed: (name: string) => string;
  readonly listRing: (name: string) => string;
  readonly listResistor: (ohms: string, count: number, bands: string, five: string) => string;
  /** A button, and the colour of the cap to fit on it (scratchpi's ADR 0174). */
  readonly listButton: (name: string, cap: ButtonColour) => string;
  readonly listBuzzer: (name: string) => string;
  /** Electrolytic capacitors of one value, written already, and how many (ADR 0043). */
  readonly listElectrolytic: (microfarads: string, count: number) => string;
  /** Transistors of one model, and how many (ADR 0044). */
  readonly listTransistor: (model: string, type: TransistorType, count: number) => string;
  /** Diodes of one model, what they are sold as, and how many (ADR 0049). */
  readonly listDiode: (model: string, use: DiodeUse, count: number) => string;
  /** Slide switches, and how many (ADR 0052). */
  readonly listSlideSwitch: (count: number) => string;
  /** Slide potentiometers of one value, written already, and how many (ADR 0053). */
  readonly listSlidePotentiometer: (ohms: string, count: number) => string;
  /** DIP switches of one size, and how many (ADR 0054). */
  readonly listDipSwitch: (switches: number, count: number) => string;
  /** Bar graphs of one size and colour, the colour written already, and how many (ADR 0058). */
  readonly listBarGraph: (segments: number, colour: string, count: number) => string;
  /** Resistor arrays of one value and size, the value written already, the code, and how many (ADR 0059). */
  readonly listResistorArray: (
    ohms: string,
    resistors: number,
    code: string,
    count: number,
  ) => string;
  /** Motion sensors, and how many (ADR 0055). */
  readonly listPir: (name: string) => string;
  /** The female-to-male jumpers that join motion sensors to the board, three for each. */
  readonly listPirJumpers: (count: number) => string;
  /** Ceramic capacitors of one value, written already, the code they print, and how many (ADR 0051). */
  readonly listCeramic: (nanofarads: string, code: string, count: number) => string;
  readonly listWire: (colour: string, count: number) => string;
  readonly listLongWire: (colour: string, count: number) => string;
  readonly listCable: string;

  /** The notes under the script. */
  readonly ledPolarity: string;
  /** Which way round an RGB LED goes, and what turning it round would do (scratchpi's ADR 0222). */
  readonly rgbLedPolarity: (dataPin: string) => string;
  /** Which way round the ring goes, and what turning it round would do (scratchpi's ADR 0238). */
  readonly ringPolarity: (dataPin: string) => string;
  readonly anyResistor: (low: string, high: string) => string;
  /** Which way round an electrolytic capacitor goes, and what turning it round would do. */
  readonly electrolyticPolarity: string;
  /** Which way round a light goes on a Pico whose lights a transistor may switch (ADR 0044). */
  readonly switchedLedPolarity: string;
  /**
   * A transistor model's legs, left to right, and a model that looks the same and has them in
   * another order (ADR 0039, ADR 0045).
   */
  readonly transistorPinout: (
    model: string,
    legs: readonly TransistorLeg[],
    unlike: string,
  ) => string;
  /** What a transistor's base resistor can be. */
  readonly baseResistor: (low: string, high: string) => string;
  /** Which way round a diode goes, and what turning it round would do (ADR 0049). */
  readonly diodePolarity: string;
  /** What a slide switch joins, and that it stays so when let go, as a button does not (ADR 0052). */
  readonly slideSwitchNote: string;
  /** Which leg of a slide potentiometer is its wiper, the analogue pins it can go to, and why (ADR 0053). */
  readonly slidePotentiometerWiper: (pins: readonly string[]) => string;
  /** That each switch goes from ground to a pin the Pico pulls up, and why not to 3V3 (ADR 0054). */
  readonly dipPullUp: string;
  /** That each segment of a bar graph is a light, and that its anodes' row is not marked alike (ADR 0058). */
  readonly barGraphPolarity: string;
  /** That a resistor array's resistors share the leg under its dot, and how its code says its value (ADR 0059). */
  readonly resistorArrayCode: (code: string, ohms: string) => string;
  /** That a motion sensor's jumpers go on by its pins' names, and that it settles once powered. */
  readonly pirPins: string;
  /** The diodes ratsnest knows, every one of which does on a light's way (ADR 0049). */
  readonly diodeAlike: (models: readonly string[]) => string;
  /** That a ceramic capacitor goes either way round, and how its code says its value (ADR 0051). */
  readonly ceramicCode: (code: string, nanofarads: string) => string;
  /** What a ceramic capacitor's charging resistor can be (ADR 0051). */
  readonly chargeResistor: (low: string, high: string) => string;
  readonly rowsLettered: string;
  readonly unplug: string;

  /**
   * A circuit with a supply in the Pico's place (ADR 0032). Its voltage as the language writes a
   * decimal and its unit: `4.5 V`, `4,5 V`, `4,5 В`.
   */
  readonly volts: (volts: number) => string;
  /** The + rail's legend: the supply's voltage, written already. */
  readonly railSupply: (volts: string) => string;
  /** Where the supply is, at the drawing's quarter turn, its voltage written already (ADR 0003). */
  readonly supplyIntro: (volts: string, orientation: Orientation) => string;
  /** The last step: the supply's two leads in their rails, and then the circuit's test. */
  readonly supplyTitle: string;
  readonly supplyBody: (plus: Place, minus: Place, test: string) => string;
  /** What gives each voltage, in the parts list in the Pico's place. */
  readonly listSupply: (volts: Supply["volts"]) => string;
  /** The notes that say the Pico's pin or its cable, said of the supply instead. */
  readonly supplyLedPolarity: string;
  readonly supplyUnplug: string;
}

const ENGLISH_BANDS = [
  "black",
  "brown",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "violet",
  "grey",
  "white",
] as const;

const ENGLISH_WIRES: Record<WireRole, string> = { ground: "black", power: "red", signal: "yellow" };

/** A button cap's colour, as a step and the parts list say it (scratchpi's ADR 0174). */
const ENGLISH_CAPS: Record<ButtonColour, string> = {
  red: "red",
  green: "green",
  blue: "blue",
  yellow: "yellow",
};

const ENGLISH_PLACEMENT: Record<ButtonPlacement, string> = {
  across: "across the channel",
  above: "above the channel",
  below: "below the channel",
};

/** Where the USB is, at each quarter turn: on the left at 0°, then round clockwise. */
const ENGLISH_USB: Record<Orientation, string> = {
  0: "to the left",
  90: "to the top",
  180: "to the right",
  270: "to the bottom",
};

/** Where a supply is, beside the board, at each quarter turn: where the USB would be. */
const ENGLISH_SUPPLY_SIDE: Record<Orientation, string> = {
  0: "to the left of",
  90: "above",
  180: "to the right of",
  270: "below",
};

/** What gives each voltage a supply can be (ADR 0032). */
const ENGLISH_SUPPLIES: Record<Supply["volts"], string> = {
  3: "Two AA batteries, in a holder with a red and a black lead.",
  3.7: "A protected 3.7 V Li-Po cell, with a protection circuit, usually under yellow tape by its leads. Its plug needs an adapter to two pins. Charge it only with a Li-Po charger.",
  4.5: "Three AA batteries, in a holder with a red and a black lead.",
  5: "A USB charger and its cable, into a USB-C breakout board for breadboards, which brings + and − out on two pins.",
};

const ENGLISH_JUMPERS = { one: "jumper wire", other: "jumper wires" } as const;

const ENGLISH_LEGS: Record<TransistorLeg, string> = {
  emitter: "emitter",
  base: "base",
  collector: "collector",
};

const capitalised = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** `the top − rail`, or the hole as the page marked it up, and which board it is on. */
const englishPlace = (place: Place): string =>
  (place.kind === "rail" ? `the ${place.side} ${place.sign} rail` : place.html) +
  (place.second ? " on the second breadboard" : "");

const englishFrom = (place: Place): string => `from ${englishPlace(place)}`;
const englishTo = (place: Place): string => `to ${englishPlace(place)}`;
const englishIn = (place: Place): string => `in ${englishPlace(place)}`;

const englishList = (items: readonly string[]): string =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export const ENGLISH_PAGE: PageWords = {
  tag: "en",
  eyebrow: "ratsnest · wiring guide",
  tapStep: "Tap a step to pick out its parts.",
  railMinus: "− rail: ground",
  railPlus: (used) => `+ rail: ${used ? "3V3" : "not used"}`,
  build: "Build it",
  parts: "Parts",
  script: "Test it from Thonny",
  copy: "Copy",
  copied: "Copied",
  selected: "Selected",

  drawingTitle: (circuit, boards) =>
    `${circuit}, on ${boards > 1 ? "two half-size breadboards" : "a half-size breadboard"}`,
  drawingIntro: (orientation) =>
    `A Pico 2 W across the middle of the breadboard, its USB ${ENGLISH_USB[orientation]}.`,

  pinNote: (label, number) => `(${label}, pin ${number})`,
  from: englishFrom,
  to: englishTo,
  in: englishIn,
  list: englishList,

  ohms: formatOhms,
  microfarads: formatMicrofarads,
  nanofarads: formatNanofarads,
  band: (band) => (band === "gold" ? "gold" : (ENGLISH_BANDS[Number(band)] ?? band)),
  wire: (role) => ENGLISH_WIRES[role],

  jumper: (colour, from, to) => `A ${colour} jumper ${englishFrom(from)} ${englishTo(to)}.`,
  archingJumper: (colour, from, to) =>
    `A long ${colour} jumper ${englishFrom(from)} ${englishTo(to)}, arching over the board.`,
  resistor: (ohms, from, to) => `A ${ohms} resistor ${englishFrom(from)} ${englishTo(to)}.`,
  led: (name, anode, cathode) =>
    `The ${name}: its long leg ${englishIn(anode)}, its short leg ${englishIn(cathode)}.`,
  button: (name, cap, where, legs, second) =>
    `${name}, the ${ENGLISH_CAPS[cap]} button, ${ENGLISH_PLACEMENT[where]}, its legs in ${englishList(legs)}${second ? " on the second breadboard" : ""}.`,
  buzzer: (name, plus, minus) =>
    `The ${name}: its + leg ${englishIn(plus)}, its other leg ${englishIn(minus)}.`,
  rgbLed: (name, legs, second) =>
    `The ${name}, its legs in ${englishList(legs)}${second ? " on the second breadboard" : ""}: +5 V, then data out, the longest, then ground, then data in.`,
  ring: (name, dataIn, power, ground, dataOut) =>
    `The ${name}, standing up: data in ${englishIn(dataIn)}, 5 V ${englishIn(power)}, ground ${englishIn(ground)} and data out ${englishIn(dataOut)}.`,
  electrolytic: (microfarads, plus, minus) =>
    `A ${microfarads} capacitor: its + leg ${englishIn(plus)}, and its − leg, under the stripe, ${englishIn(minus)}.`,
  transistor: (model, type, emitter, base, collector) =>
    `A ${model} ${type} transistor, its flat face towards row <span class="hole">j</span>: its emitter ${englishIn(emitter)}, its base ${englishIn(base)} and its collector ${englishIn(collector)}.`,
  diode: (model, anode, cathode) =>
    `A ${model} diode: its anode ${englishIn(anode)}, and its cathode, at the band, ${englishIn(cathode)}.`,
  ceramic: (nanofarads, code, from, to) =>
    `A ${nanofarads} ceramic capacitor, marked ${code}, either way round: one leg ${englishIn(from)} and the other ${englishIn(to)}.`,
  slideSwitch: (middle, left, right) =>
    `A slide switch, either way round: its middle leg ${englishIn(middle)}, one outer leg ${englishIn(left)} and the other ${englishIn(right)}.`,
  slidePotentiometer: (ohms, wiper, end, otherEnd) =>
    `A ${ohms} slide potentiometer, lying across both breadboards: its wiper ${englishIn(wiper)}, the end beside it ${englishIn(end)}, and its other end ${englishIn(otherEnd)}.`,
  dipSwitch: (switches, first, last, second) =>
    `A ${switches}-way DIP switch across the channel, its ON side towards row <span class="hole">a</span>: switch 1 in ${englishList(first)}, and switch ${switches} in ${englishList(last)}${second ? ", on the second breadboard" : ""}.`,
  barGraph: (segments, colour, first, last, second) =>
    `A ${segments}-segment ${colour} LED bar graph across the channel, its anodes in row <span class="hole">f</span>: segment 1 in ${englishList(first)}, and segment ${segments} in ${englishList(last)}${second ? ", on the second breadboard" : ""}.`,
  resistorArray: (ohms, resistors, code, common, first, last, second) =>
    `A ${ohms} resistor array of ${resistors} resistors, marked ${code}, standing in one row: its common leg, under the dot, in ${common}, and its resistors' legs in ${first} to ${last}${second ? ", on the second breadboard" : ""}.`,
  segmentColour: {
    red: "red",
    green: "green",
    amber: "amber",
    blue: "blue",
    yellow: "yellow",
    pink: "pink",
    purple: "purple",
    orange: "orange",
    aqua: "aqua",
    white: "white",
  },
  pir: (name, power, output, ground) =>
    `The ${name}, beside the board, dome up: a red jumper from its VCC pin ${englishTo(power)}, a yellow one from its OUT pin ${englishTo(output)} and a black one from its GND pin ${englishTo(ground)}.`,

  ledLabel: (anode) => `long leg in ${anode}`,
  buttonLabel: (where) => ENGLISH_PLACEMENT[where],
  buzzerLabel: (plus) => `+ leg in ${plus}`,
  rgbLedLabel: (dataIn) => `data in at ${dataIn}`,
  pirLabel: (output) => `OUT to ${output}`,

  picoTitle: "Put the Pico across the middle",
  picoBody: (pinOne, lands, orientation) =>
    `The USB goes ${ENGLISH_USB[orientation]}. Its pins go in rows <span class="hole">c</span> and <span class="hole">h</span>, from column 2 to column 21, and pin 1 goes in ${pinOne}.` +
    (lands.length > 0 ? ` That puts ${englishList(lands)}.` : ""),
  land: (gpio, hole) => `GP${gpio} in ${hole}`,
  testTitle: "Plug in and test",
  testBody: (test) => `Plug the USB cable in and run the script on this page in Thonny. ${test}`,

  listPico: "Raspberry Pi Pico 2 W, with its header pins soldered on. A Pico 2 WH comes with them.",
  listBreadboard: (count) =>
    plural("en", count, {
      one: "Half-size breadboard: 30 columns, with a rail the whole length of each side.",
      other:
        "Half-size breadboards: 30 columns each, with a rail the whole length of each side. They join along their long sides.",
    }),
  listLed: (name) => `${capitalised(name)}, 5 mm.`,
  listRgbLed: (name) => `${capitalised(name)}: a 10 mm addressable LED. It needs no resistor.`,
  listRing: (name) =>
    `${capitalised(name)}: twelve addressable RGB LEDs in a ring about 48 mm across, with a header of four pins. It needs no resistor.`,
  listResistor: (ohms, count, bands, five) =>
    `${ohms} ${plural("en", count, { one: "resistor", other: "resistors" })} ${bands}` +
    `<span class="aside">On a blue 5-band one: ${five}.</span>`,
  listButton: (name, cap) =>
    `${capitalised(name)}: a 6 mm tactile switch with four legs, and a ${ENGLISH_CAPS[cap]} cap.`,
  listBuzzer: (name) => `Passive ${name}, with its + leg marked.`,
  listElectrolytic: (microfarads, count) =>
    `${microfarads} electrolytic ${plural("en", count, { one: "capacitor", other: "capacitors" })}, rated 16 V or more.`,
  listTransistor: (model, type, count) =>
    `${model} ${type} ${plural("en", count, { one: "transistor", other: "transistors" })}, in a TO-92 case.`,
  listDiode: (model, use, count) =>
    `${model} ${use} ${plural("en", count, { one: "diode", other: "diodes" })}, in ${use === "signal" ? "an orange glass case" : "a black case"}.`,
  listSlideSwitch: (count) =>
    plural("en", count, {
      one: "SPDT slide switch, its three legs 2.54 mm apart, as a breadboard's holes are.",
      other:
        "SPDT slide switches, each with three legs 2.54 mm apart, as a breadboard's holes are.",
    }),
  listSlidePotentiometer: (ohms, count) =>
    `${ohms} slide ${plural("en", count, { one: "potentiometer", other: "potentiometers" })}, 45 mm long, with two legs at one end and one at the other, and a cap for the knob.`,
  listDipSwitch: (switches, count) =>
    `${switches}-way DIP ${plural("en", count, { one: "switch", other: "switches" })}, with its legs in two rows 7.62 mm apart, to go across the channel.`,
  listBarGraph: (segments, colour, count) =>
    `${segments}-segment ${colour} LED bar ${plural("en", count, { one: "graph", other: "graphs" })}, with its legs in two rows 7.62 mm apart, to go across the channel.`,
  listResistorArray: (ohms, resistors, code, count) =>
    `${ohms} resistor ${plural("en", count, { one: "array", other: "arrays" })} of ${resistors} resistors, bussed: ${resistors + 1} legs in a row, one of them common to every resistor, marked ${code}.`,
  listPir: (name) =>
    `${capitalised(name)}: a PIR module with three pins, VCC, OUT and GND, that runs on 5 V. Its OUT gives 3.3 V while it sees movement.`,
  listPirJumpers: () =>
    "Female-to-male jumpers, about 20 cm: a red, a yellow and a black one for each motion sensor, to go on its pins.",
  listCeramic: (nanofarads, code, count) =>
    `${nanofarads} ceramic ${plural("en", count, { one: "capacitor", other: "capacitors" })}, marked ${code}.`,
  listWire: (colour, count) =>
    `${capitalised(colour)} ${plural("en", count, ENGLISH_JUMPERS)}, short.`,
  listLongWire: (colour, count) =>
    `${capitalised(colour)} ${plural("en", count, ENGLISH_JUMPERS)}, long and flexible: about 10 cm.`,
  listCable: "Micro-USB cable that carries data. A charge-only cable will not reach the Pico.",

  ledPolarity:
    "An LED's long leg is + and goes towards the pin. One put in backwards stays dark, but it is not damaged: turn it round.",
  rgbLedPolarity: (dataPin) =>
    `The RGB LED's longest leg is data out, and goes in the second hole. Check it before the LED goes in: turned round, it would put 5 V on ${dataPin}.`,
  ringPolarity: (dataPin) =>
    `The ring's back names its four pins: data in, 5 V, ground and data out. Check them against the steps before it goes in: turned round, it would put 5 V on ${dataPin}.`,
  anyResistor: (low, high) =>
    `Any resistor from ${low} to ${high} works for a light. A bigger one makes it dimmer.`,
  electrolyticPolarity:
    "An electrolytic capacitor goes in one way round: its − leg is the shorter one, under the pale stripe down its side, and goes towards −. Put in backwards, it can be damaged.",
  switchedLedPolarity:
    "An LED's long leg is + and goes towards the pin, or, where a transistor switches it, towards 3V3 or towards the transistor, as its step says. One put in backwards stays dark, but it is not damaged: turn it round.",
  transistorPinout: (model, legs, unlike) =>
    `With its flat face towards you and its legs down, a ${model}'s legs are its ${englishList(legs.map((leg) => ENGLISH_LEGS[leg]))}, left to right. Others that look the same, such as a ${unlike}, have them in another order: take the model the parts list names.`,
  baseResistor: (low, high) => `Any resistor from ${low} to ${high} works for a transistor's base.`,
  diodePolarity:
    "A diode lets current through one way only: from its anode to its cathode, the end with the band, which goes towards −. One put in backwards lets none through, and its light stays dark, but it is not damaged: turn it round.",
  slideSwitchNote:
    "A slide switch joins its middle leg to one outer leg or the other, whichever way its slide is pushed, and stays so when let go, where a push button joins its legs only while it is held.",
  slidePotentiometerWiper: (pins) =>
    `Of a slide potentiometer's two legs at one end, its wiper is the one with no leg in line with it at the other end. It goes to an analogue pin, ${englishList(pins).replace(" and ", " or ")}, and the two ends to 3V3(OUT) and ground, either way round. Wired to 3V3(OUT) instead, the wiper would join it to ground at one end of its travel.`,
  barGraphPolarity:
    "Each segment of an LED bar graph is a light of its own: its anode goes towards its pin, and its cathode towards ground, through a resistor. Not every bar graph marks which row of legs is its anodes'. Put in the wrong way round, it stays dark and takes no harm: turn it round.",
  resistorArrayCode: (code, ohms) =>
    `The resistors of a resistor array share the leg under its dot, which goes to ground. Its value is printed on it as a code, after an A for that shared leg: two figures and then how many zeros follow them. ${code} is ${ohms} for each resistor.`,
  pirPins:
    "A motion sensor's board names its three pins, beside them or under its dome: VCC or +, OUT or SIG, and GND. Push each jumper onto the pin of its name, whatever order they are in: it differs from one sensor to another. Once powered, it takes up to a minute to settle.",
  dipPullUp:
    "Each switch of a DIP switch joins its two legs while it is on. One leg goes to ground and the other to a pin of its own, which the script pulls up inside the Pico, so it reads 1 while its switch is off and 0 while it is on. Wired to 3V3(OUT) instead, each pin would need a pull-down, and the Pico 2 W's own cannot be relied on to hold it low.",
  diodeAlike: (models) =>
    `The ${englishList(models)} all do on a light's way: a light takes far less current than any of them can carry.`,
  ceramicCode: (code, nanofarads) =>
    `A ceramic capacitor goes in either way round. Its value is printed on it as a code in picofarads, two figures and then how many zeros follow them: ${code} is ${nanofarads}.`,
  chargeResistor: (low, high) =>
    `Any resistor from ${low} to ${high} works to charge the capacitor. A bigger one, or a bigger capacitor, takes longer.`,
  rowsLettered:
    "Some breadboards letter their rows the other way up. If yours does, follow the picture rather than the letters.",
  unplug: "Unplug the USB cable while you change the wiring.",

  volts: (volts) => `${volts} V`,
  railSupply: (volts) => `+ rail: ${volts}`,
  supplyIntro: (volts, orientation) =>
    `A ${volts} supply ${ENGLISH_SUPPLY_SIDE[orientation]} the breadboard.`,
  supplyTitle: "Connect the supply and test",
  supplyBody: (plus, minus, test) =>
    `Put the supply's red lead ${englishIn(plus)} and its black lead ${englishIn(minus)}, both in column 1. ${test}`,
  listSupply: (volts) => ENGLISH_SUPPLIES[volts],
  supplyLedPolarity:
    "An LED's long leg is + and goes towards the + rail. One put in backwards stays dark, but it is not damaged: turn it round.",
  supplyUnplug: "Disconnect the supply while you change the wiring.",
};

// --- French. ---

/** The narrow no-break space French puts before `: ; ? !` (ADR 0011). */
const NNBSP = " ";

/** Où est le port USB, à chaque quart de tour. */
const FRENCH_USB: Record<Orientation, string> = {
  0: "à gauche",
  90: "en haut",
  180: "à droite",
  270: "en bas",
};

/** Où est l’alimentation, à côté de la plaque, à chaque quart de tour. */
const FRENCH_SUPPLY_SIDE: Record<Orientation, string> = {
  0: "à gauche",
  90: "au-dessus",
  180: "à droite",
  270: "au-dessous",
};

/** Ce qui donne chaque tension (ADR 0032). */
const FRENCH_SUPPLIES: Record<Supply["volts"], string> = {
  3: "Deux piles AA, dans un boîtier avec un fil rouge et un fil noir.",
  3.7: "Un accu Li-Po de 3,7 V protégé, avec un circuit de protection, souvent sous un ruban jaune près de ses fils. Sa fiche demande un adaptateur vers deux broches. Ne le chargez qu’avec un chargeur Li-Po.",
  4.5: "Trois piles AA, dans un boîtier avec un fil rouge et un fil noir.",
  5: "Un chargeur USB et son câble, branchés sur une carte d’adaptation USB-C pour plaque d’essai, qui sort le + et le − sur deux broches.",
};

const FRENCH_BANDS = [
  "noir",
  "marron",
  "rouge",
  "orange",
  "jaune",
  "vert",
  "bleu",
  "violet",
  "gris",
  "blanc",
] as const;

/** A jumper's colour, as `un fil noir` and `des fils noirs` have it. */
const FRENCH_WIRES: Record<WireRole, readonly [string, string]> = {
  ground: ["noir", "noirs"],
  power: ["rouge", "rouges"],
  signal: ["jaune", "jaunes"],
};

/** `le rail − du haut`, with the article a preposition before it contracts. */
const frenchRail = (place: Extract<Place, { kind: "rail" }>) =>
  `rail ${place.sign} du ${place.side === "top" ? "haut" : "bas"}`;

/** Which board a place is on, after it, when it is the second (scratchpi's ADR 0226). */
const frenchBoard = (place: Place): string => (place.second ? " de la seconde plaque" : "");

/** A hole is `en e26`, the way a square on a board is named; a rail is `dans le rail`. */
const frenchIn = (place: Place): string =>
  (place.kind === "rail" ? `dans le ${frenchRail(place)}` : `en ${place.html}`) +
  frenchBoard(place);

/** `de a19`, and `du rail`: *de le* is always *du*. */
const frenchFrom = (place: Place): string =>
  (place.kind === "rail" ? `du ${frenchRail(place)}` : `de ${place.html}`) + frenchBoard(place);

/** `à a26`, and `au rail`: *à le* is always *au*. */
const frenchTo = (place: Place): string =>
  (place.kind === "rail" ? `au ${frenchRail(place)}` : `à ${place.html}`) + frenchBoard(place);

/** A transistor's legs, with the article each takes. */
const FRENCH_LEGS: Record<TransistorLeg, string> = {
  emitter: "l’émetteur",
  base: "la base",
  collector: "le collecteur",
};

/** A cap's colour, agreeing with *bouton* and *capuchon*, which are both masculine. */
const FRENCH_CAPS: Record<ButtonColour, string> = {
  red: "rouge",
  green: "vert",
  blue: "bleu",
  yellow: "jaune",
};

const FRENCH_PLACEMENT: Record<ButtonPlacement, string> = {
  across: "à cheval sur la rainure centrale",
  above: "au-dessus de la rainure centrale",
  below: "au-dessous de la rainure centrale",
};

/**
 * The same, as short as the margin wants it: no longer than `sur la rainure`, or it runs off
 * the drawing's edge. A button on one half is said by the half it is on.
 */
const FRENCH_LABEL: Record<ButtonPlacement, string> = {
  across: "sur la rainure",
  above: "moitié du haut",
  below: "moitié du bas",
};

const frenchList = (items: readonly string[]): string =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;

/**
 * The definite article a part's name takes at the start of a sentence: *La* for a light,
 * *Le* for a button, a buzzer or a sensor, *détecteur* or *capteur*, and *L’* before a vowel or a
 * mute *h*, whatever the gender.
 */
function the(kind: PartKind, name: string): string {
  if (/^[aeiouyhàâéèêëîïôöùûü]/i.test(name)) return `L’${name}`;
  return `${kind === "led" ? "La" : "Le"} ${name}`;
}

export const FRENCH_PAGE: PageWords = {
  tag: "fr",
  eyebrow: "ratsnest · guide de câblage",
  tapStep: "Touchez une étape pour faire ressortir ses composants.",
  railMinus: `rail −${NNBSP}: masse`,
  railPlus: (used) => `rail +${NNBSP}: ${used ? "3V3" : "non utilisé"}`,
  build: "Montage",
  parts: "Composants",
  script: "Testez-le depuis Thonny",
  copy: "Copier",
  copied: "Copié",
  selected: "Sélectionné",

  drawingTitle: (circuit, boards) =>
    `${circuit}, sur ${boards > 1 ? "deux plaques d’essai demi-taille" : "une plaque d’essai demi-taille"}`,
  drawingIntro: (orientation) =>
    `Un Pico 2 W au milieu de la plaque d’essai, son port USB ${FRENCH_USB[orientation]}.`,

  pinNote: (label, number) => `(${label}, broche ${number})`,
  from: frenchFrom,
  to: frenchTo,
  in: frenchIn,
  list: frenchList,

  ohms: (value) => formatOhms(value).replace(".", ","),
  microfarads: (value) => formatMicrofarads(value).replace(".", ","),
  nanofarads: (value) => formatNanofarads(value).replace(".", ","),
  band: (band) => (band === "gold" ? "or" : (FRENCH_BANDS[Number(band)] ?? band)),
  wire: (role, count) => {
    const [one, more] = FRENCH_WIRES[role];
    return plural("fr", count, { one, many: more, other: more });
  },

  jumper: (colour, from, to) => `Un fil ${colour} ${frenchFrom(from)} ${frenchTo(to)}.`,
  archingJumper: (colour, from, to) =>
    `Un long fil ${colour} ${frenchFrom(from)} ${frenchTo(to)}, qui passe par-dessus la plaque.`,
  resistor: (ohms, from, to) => `Une résistance de ${ohms} ${frenchFrom(from)} ${frenchTo(to)}.`,
  led: (name, anode, cathode) =>
    `${the("led", name)}${NNBSP}: sa grande patte ${frenchIn(anode)}, sa petite patte ${frenchIn(cathode)}.`,
  button: (name, cap, where, legs, second) =>
    `${name}, le bouton ${FRENCH_CAPS[cap]}, ${FRENCH_PLACEMENT[where]}, ses pattes en ${frenchList(legs)}${second ? " de la seconde plaque" : ""}.`,
  buzzer: (name, plus, minus) =>
    `${the("buzzer", name)}${NNBSP}: sa patte + ${frenchIn(plus)}, son autre patte ${frenchIn(minus)}.`,
  rgbLed: (name, legs, second) =>
    `${the("led", name)}, ses pattes en ${frenchList(legs)}${second ? " de la seconde plaque" : ""}${NNBSP}: le +5 V, puis la sortie des données, la plus longue, puis la masse, puis l’entrée des données.`,
  ring: (name, dataIn, power, ground, dataOut) =>
    `${the("led", name)}, debout${NNBSP}: l’entrée des données ${frenchIn(dataIn)}, le 5 V ${frenchIn(power)}, la masse ${frenchIn(ground)} et la sortie des données ${frenchIn(dataOut)}.`,
  electrolytic: (microfarads, plus, minus) =>
    `Un condensateur de ${microfarads}${NNBSP}: sa patte + ${frenchIn(plus)}, et sa patte −, du côté de la bande, ${frenchIn(minus)}.`,
  transistor: (model, type, emitter, base, collector) =>
    `Un transistor ${type} ${model}, sa face plate vers la rangée <span class="hole">j</span>${NNBSP}: son émetteur ${frenchIn(emitter)}, sa base ${frenchIn(base)} et son collecteur ${frenchIn(collector)}.`,
  diode: (model, anode, cathode) =>
    `Une diode ${model}${NNBSP}: son anode ${frenchIn(anode)}, et sa cathode, du côté de la bande, ${frenchIn(cathode)}.`,
  ceramic: (nanofarads, code, from, to) =>
    `Un condensateur céramique de ${nanofarads}, marqué ${code}, dans un sens ou dans l’autre${NNBSP}: une patte ${frenchIn(from)} et l’autre ${frenchIn(to)}.`,
  slideSwitch: (middle, left, right) =>
    `Un interrupteur à glissière, dans un sens ou dans l’autre${NNBSP}: sa patte du milieu ${frenchIn(middle)}, une patte extérieure ${frenchIn(left)} et l’autre ${frenchIn(right)}.`,
  slidePotentiometer: (ohms, wiper, end, otherEnd) =>
    `Un potentiomètre à glissière de ${ohms}, couché à cheval sur les deux plaques${NNBSP}: son curseur ${frenchIn(wiper)}, l’extrémité à côté ${frenchIn(end)}, et son autre extrémité ${frenchIn(otherEnd)}.`,
  dipSwitch: (switches, first, last, second) =>
    `Un interrupteur DIP à ${switches} voies à cheval sur la rainure centrale, son côté ON vers la rangée <span class="hole">a</span>${NNBSP}: l’interrupteur 1 en ${frenchList(first)}, et l’interrupteur ${switches} en ${frenchList(last)}${second ? ", sur la seconde plaque" : ""}.`,
  barGraph: (segments, colour, first, last, second) =>
    `Un bargraphe à LED de ${segments} segments ${colour} à cheval sur la rainure centrale, ses anodes sur la rangée <span class="hole">f</span>${NNBSP}: le segment 1 en ${frenchList(first)}, et le segment ${segments} en ${frenchList(last)}${second ? ", sur la seconde plaque" : ""}.`,
  resistorArray: (ohms, resistors, code, common, first, last, second) =>
    `Un réseau de ${resistors} résistances de ${ohms}, marqué ${code}, debout sur une rangée${NNBSP}: sa patte commune, sous le point, en ${common}, et les pattes de ses résistances de ${first} à ${last}${second ? ", sur la seconde plaque" : ""}.`,
  segmentColour: {
    red: "rouges",
    green: "verts",
    amber: "ambre",
    blue: "bleus",
    yellow: "jaunes",
    pink: "roses",
    purple: "violets",
    orange: "orange",
    aqua: "turquoise",
    white: "blancs",
  },
  pir: (name, power, output, ground) =>
    `${the("sensor", name)}, à côté de la plaque, dôme en haut${NNBSP}: un fil rouge de sa broche VCC ${frenchTo(power)}, un fil jaune de sa broche OUT ${frenchTo(output)} et un fil noir de sa broche GND ${frenchTo(ground)}.`,

  ledLabel: (anode) => `grande patte en ${anode}`,
  buttonLabel: (where) => FRENCH_LABEL[where],
  buzzerLabel: (plus) => `patte + en ${plus}`,
  rgbLedLabel: (dataIn) => `entrée en ${dataIn}`,
  pirLabel: (output) => `OUT en ${output}`,

  picoTitle: "Placez le Pico à cheval sur la rainure centrale",
  picoBody: (pinOne, lands, orientation) =>
    `Le port USB va ${FRENCH_USB[orientation]}. Ses broches vont dans les rangées <span class="hole">c</span> et <span class="hole">h</span>, de la colonne 2 à la colonne 21, et la broche 1 va en ${pinOne}.` +
    (lands.length > 0 ? ` Ainsi, ${frenchList(lands)}.` : ""),
  land: (gpio, hole) => `GP${gpio} est en ${hole}`,
  testTitle: "Branchez et testez",
  testBody: (test) =>
    `Branchez le câble USB et lancez dans Thonny le script de cette page. ${test}`,

  listPico: "Raspberry Pi Pico 2 W, avec ses connecteurs soudés. Un Pico 2 WH est livré avec.",
  listBreadboard: (count) => {
    const more = `Plaques d’essai demi-taille${NNBSP}: 30 colonnes chacune, avec un rail sur toute la longueur de chaque côté. Elles s’emboîtent par leurs grands côtés.`;
    return plural("fr", count, {
      one: `Plaque d’essai demi-taille${NNBSP}: 30 colonnes, avec un rail sur toute la longueur de chaque côté.`,
      many: more,
      other: more,
    });
  },
  listLed: (name) => `${capitalised(name)}, 5 mm.`,
  listRgbLed: (name) =>
    `${capitalised(name)}${NNBSP}: une LED adressable de 10 mm. Elle n’a besoin d’aucune résistance.`,
  listRing: (name) =>
    `${capitalised(name)}${NNBSP}: douze LED RVB adressables en anneau d’environ 48 mm de diamètre, avec un connecteur de quatre broches. Il n’a besoin d’aucune résistance.`,
  listResistor: (ohms, count, bands, five) =>
    `${plural("fr", count, { one: "Résistance", many: "Résistances", other: "Résistances" })} de ${ohms} ${bands}` +
    `<span class="aside">Sur une résistance bleue à 5 anneaux${NNBSP}: ${five}.</span>`,
  listButton: (name, cap) =>
    `${capitalised(name)}${NNBSP}: un interrupteur tactile de 6 mm à quatre pattes, avec un capuchon ${FRENCH_CAPS[cap]}.`,
  listBuzzer: (name) => `${capitalised(name)} passif, avec sa patte + marquée.`,
  listElectrolytic: (microfarads, count) =>
    `${plural("fr", count, { one: "Condensateur électrolytique", many: "Condensateurs électrolytiques", other: "Condensateurs électrolytiques" })} de ${microfarads}, de 16 V ou plus.`,
  listTransistor: (model, type, count) =>
    `${plural("fr", count, { one: "Transistor", many: "Transistors", other: "Transistors" })} ${type} ${model}, en boîtier TO-92.`,
  listDiode: (model, use, count) =>
    `${plural("fr", count, { one: "Diode", many: "Diodes", other: "Diodes" })} ${use === "signal" ? "de signal" : "de redressement"} ${model}, en boîtier ${use === "signal" ? "de verre orange" : "noir"}.`,
  listSlideSwitch: (count) =>
    plural("fr", count, {
      one: "Interrupteur à glissière inverseur (SPDT), ses trois pattes espacées de 2,54 mm, comme les trous d’une plaque d’essai.",
      many: "Interrupteurs à glissière inverseurs (SPDT), chacun à trois pattes espacées de 2,54 mm, comme les trous d’une plaque d’essai.",
      other:
        "Interrupteurs à glissière inverseurs (SPDT), chacun à trois pattes espacées de 2,54 mm, comme les trous d’une plaque d’essai.",
    }),
  listSlidePotentiometer: (ohms, count) =>
    `${plural("fr", count, { one: "Potentiomètre à glissière", many: "Potentiomètres à glissière", other: "Potentiomètres à glissière" })} de ${ohms}, de 45 mm de long, à deux pattes à un bout et une à l’autre, avec un capuchon pour le bouton.`,
  listDipSwitch: (switches, count) =>
    `${plural("fr", count, { one: "Interrupteur", many: "Interrupteurs", other: "Interrupteurs" })} DIP à ${switches} voies, ses pattes sur deux rangées espacées de 7,62 mm, pour se mettre à cheval sur la rainure centrale.`,
  listBarGraph: (segments, colour, count) =>
    `${plural("fr", count, { one: "Bargraphe", many: "Bargraphes", other: "Bargraphes" })} à LED de ${segments} segments ${colour}, ses pattes sur deux rangées espacées de 7,62 mm, pour se mettre à cheval sur la rainure centrale.`,
  listResistorArray: (ohms, resistors, code, count) =>
    `${plural("fr", count, { one: "Réseau", many: "Réseaux", other: "Réseaux" })} de ${resistors} résistances de ${ohms} à patte commune${NNBSP}: ${resistors + 1} pattes en rangée, dont une commune à toutes les résistances, ${plural("fr", count, { one: "marqué", many: "marqués", other: "marqués" })} ${code}.`,
  listPir: (name) =>
    `${capitalised(name)}${NNBSP}: un module PIR à trois broches, VCC, OUT et GND, alimenté en 5 V. Sa broche OUT donne 3,3 V tant qu’il voit du mouvement.`,
  listPirJumpers: () =>
    `Fils de connexion femelle-mâle, d’environ 20 cm${NNBSP}: un rouge, un jaune et un noir pour chaque détecteur de mouvement, à brancher sur ses broches.`,
  listCeramic: (nanofarads, code, count) =>
    `${plural("fr", count, { one: "Condensateur céramique", many: "Condensateurs céramiques", other: "Condensateurs céramiques" })} de ${nanofarads}, ${plural("fr", count, { one: "marqué", many: "marqués", other: "marqués" })} ${code}.`,
  listWire: (colour, count) => {
    const more = `Fils de connexion ${colour}, courts.`;
    return plural("fr", count, {
      one: `Fil de connexion ${colour}, court.`,
      many: more,
      other: more,
    });
  },
  listLongWire: (colour, count) => {
    const more = `Fils de connexion ${colour}, longs et souples${NNBSP}: environ 10 cm.`;
    return plural("fr", count, {
      one: `Fil de connexion ${colour}, long et souple${NNBSP}: environ 10 cm.`,
      many: more,
      other: more,
    });
  },
  listCable:
    "Câble micro-USB qui transporte les données. Un câble de charge seule n’atteindra pas le Pico.",

  ledPolarity: `La grande patte d’une LED est le + et va du côté de la broche. Une LED mise à l’envers reste éteinte, mais elle n’est pas abîmée${NNBSP}: retournez-la.`,
  rgbLedPolarity: (dataPin) =>
    `La plus longue patte de la LED RVB est la sortie des données, et va dans le deuxième trou. Vérifiez-la avant de planter la LED${NNBSP}: à l’envers, elle mettrait 5 V sur ${dataPin}.`,
  ringPolarity: (dataPin) =>
    `Le dos de l’anneau nomme ses quatre broches${NNBSP}: entrée des données, 5 V, masse et sortie des données. Vérifiez-les d’après les étapes avant de le planter${NNBSP}: à l’envers, il mettrait 5 V sur ${dataPin}.`,
  anyResistor: (low, high) =>
    `N’importe quelle résistance de ${low} à ${high} convient pour une LED. Plus elle est grande, plus la LED éclaire faiblement.`,
  electrolyticPolarity: `Un condensateur électrolytique se plante dans un seul sens${NNBSP}: sa patte − est la plus courte, du côté de la bande pâle sur son flanc, et va vers le −. Monté à l’envers, il peut être abîmé.`,
  switchedLedPolarity: `La grande patte d’une LED est le + et va du côté de la broche, ou, quand un transistor la commande, du côté du 3V3 ou du transistor, comme le dit son étape. Une LED mise à l’envers reste éteinte, mais elle n’est pas abîmée${NNBSP}: retournez-la.`,
  transistorPinout: (model, legs, unlike) =>
    `Face plate vers vous et pattes en bas, les pattes d’un ${model} sont ${frenchList(legs.map((leg) => FRENCH_LEGS[leg]))}, de gauche à droite. D’autres qui lui ressemblent, comme le ${unlike}, les ont dans un autre ordre${NNBSP}: prenez le modèle que nomme la liste des composants.`,
  baseResistor: (low, high) =>
    `N’importe quelle résistance de ${low} à ${high} convient pour la base d’un transistor.`,
  diodePolarity: `Une diode ne laisse passer le courant que dans un sens${NNBSP}: de son anode à sa cathode, le bout marqué d’une bande, qui va vers le −. Une diode mise à l’envers ne laisse rien passer, et sa LED reste éteinte, mais elle n’est pas abîmée${NNBSP}: retournez-la.`,
  slideSwitchNote:
    "Un interrupteur à glissière relie sa patte du milieu à l’une ou l’autre de ses pattes extérieures, selon le côté où l’on pousse sa glissière, et reste ainsi une fois lâché, là où un bouton poussoir ne relie ses pattes que tant qu’on le maintient enfoncé.",
  slidePotentiometerWiper: (pins) =>
    `Des deux pattes d’un même bout d’un potentiomètre à glissière, le curseur est celle qui n’a aucune patte dans son alignement à l’autre bout. Il va sur une broche analogique, ${frenchList(pins).replace(" et ", " ou ")}, et les deux extrémités sur le 3V3(OUT) et la masse, dans un sens ou dans l’autre. Relié au 3V3(OUT), le curseur le relierait à la masse à un bout de sa course.`,
  barGraphPolarity: `Chaque segment d’un bargraphe à LED est une LED à part entière${NNBSP}: son anode va du côté de sa broche, et sa cathode vers la masse, à travers une résistance. Tous les bargraphes ne marquent pas la rangée de leurs anodes. Monté à l’envers, il reste éteint, mais il n’est pas abîmé${NNBSP}: retournez-le.`,
  resistorArrayCode: (code, ohms) =>
    `Les résistances d’un réseau partagent la patte sous son point, qui va à la masse. Sa valeur y est imprimée en code, après un A pour cette patte commune${NNBSP}: deux chiffres, puis le nombre de zéros qui les suivent. ${code} vaut ${ohms} pour chaque résistance.`,
  pirPins: `La carte d’un détecteur de mouvement nomme ses trois broches, à côté d’elles ou sous son dôme${NNBSP}: VCC ou +, OUT ou SIG, et GND. Branchez chaque fil sur la broche de son nom, quel que soit leur ordre${NNBSP}: il change d’un détecteur à l’autre. Une fois alimenté, il lui faut jusqu’à une minute pour se stabiliser.`,
  dipPullUp:
    "Chaque interrupteur d’un interrupteur DIP relie ses deux pattes tant qu’il est en marche. Une patte va à la masse et l’autre à une broche à elle, que le script tire vers le haut à l’intérieur du Pico, si bien qu’elle lit 1 tant que son interrupteur est à l’arrêt et 0 tant qu’il est en marche. Relié au 3V3(OUT), chaque broche aurait besoin d’une résistance de tirage vers le bas, et celles du Pico 2 W ne suffisent pas à la maintenir au niveau bas.",
  diodeAlike: (models) =>
    `Les diodes ${frenchList(models)} conviennent toutes sur le chemin d’une LED${NNBSP}: une LED consomme bien moins de courant que chacune d’elles n’en supporte.`,
  ceramicCode: (code, nanofarads) =>
    `Un condensateur céramique se plante dans un sens ou dans l’autre. Sa valeur y est imprimée en code, en picofarads${NNBSP}: deux chiffres, puis le nombre de zéros qui les suivent. ${code} vaut ${nanofarads}.`,
  chargeResistor: (low, high) =>
    `N’importe quelle résistance de ${low} à ${high} convient pour charger le condensateur. Plus elle est grande, ou plus le condensateur l’est, plus il met de temps à se charger.`,
  rowsLettered:
    "Sur certaines plaques d’essai, les lettres des rangées vont dans l’autre sens. Si c’est le cas de la vôtre, suivez le dessin plutôt que les lettres.",
  unplug: "Débranchez le câble USB pendant que vous changez le câblage.",

  volts: (volts) => `${String(volts).replace(".", ",")} V`,
  railSupply: (volts) => `rail +${NNBSP}: ${volts}`,
  supplyIntro: (volts, orientation) =>
    `Une alimentation de ${volts} ${FRENCH_SUPPLY_SIDE[orientation]} de la plaque d’essai.`,
  supplyTitle: "Branchez l’alimentation et testez",
  supplyBody: (plus, minus, test) =>
    `Enfoncez le fil rouge de l’alimentation ${frenchIn(plus)} et son fil noir ${frenchIn(minus)}, tous deux en colonne 1. ${test}`,
  listSupply: (volts) => FRENCH_SUPPLIES[volts],
  supplyLedPolarity: `La grande patte d’une LED est le + et va du côté du rail +. Une LED mise à l’envers reste éteinte, mais elle n’est pas abîmée${NNBSP}: retournez-la.`,
  supplyUnplug: "Débranchez l’alimentation pendant que vous changez le câblage.",
};

// --- Russian. ---
//
// The engine's Russian, which a reader of Russian checks before it ships and whenever it changes
// (ADR 0010, ADR 0011): a test cannot check grammar. A part's name stands only where it is written as
// it is, at the start of a sentence or before a colon, and never as the object of a verb, so that it
// never has to be inflected (ADR 0011). The parts list is written as a bill of materials is, a noun
// and what it is, its count in the column beside it.

const RUSSIAN_BANDS = [
  "чёрный",
  "коричневый",
  "красный",
  "оранжевый",
  "жёлтый",
  "зелёный",
  "синий",
  "фиолетовый",
  "серый",
  "белый",
] as const;

/** A jumper's colour, agreeing with *перемычка*, which is feminine. */
const RUSSIAN_WIRES: Record<WireRole, string> = {
  ground: "чёрная",
  power: "красная",
  signal: "жёлтая",
};

/** A cap's colour, as *колпачок* takes it: after *с*, and on its own. */
const RUSSIAN_CAPS: Record<ButtonColour, { with: string; alone: string }> = {
  red: { with: "красным", alone: "красный" },
  green: { with: "зелёным", alone: "зелёный" },
  blue: { with: "синим", alone: "синий" },
  yellow: { with: "жёлтым", alone: "жёлтый" },
};

const RUSSIAN_PLACEMENT: Record<ButtonPlacement, string> = {
  across: "поперёк центральной канавки",
  above: "над центральной канавкой",
  below: "под центральной канавкой",
};

/** The same, as short as the margin wants it. */
const RUSSIAN_LABEL: Record<ButtonPlacement, string> = {
  across: "на канавке",
  above: "верхняя половина",
  below: "нижняя половина",
};

/** Where the USB is, and which way it points, at each quarter turn. */
const RUSSIAN_USB: Record<Orientation, string> = {
  0: "слева",
  90: "сверху",
  180: "справа",
  270: "снизу",
};
const RUSSIAN_USB_POINTS: Record<Orientation, string> = {
  0: "влево",
  90: "вверх",
  180: "вправо",
  270: "вниз",
};

/** What gives each voltage (ADR 0032). */
const RUSSIAN_SUPPLIES: Record<Supply["volts"], string> = {
  3: "Две батарейки AA в держателе с красным и чёрным проводом.",
  3.7: "Защищённый литий-полимерный аккумулятор 3,7 В со схемой защиты, обычно под жёлтой лентой у проводов. Для его разъёма нужен переходник на два штырька. Заряжайте его только зарядным устройством для Li-Po.",
  4.5: "Три батарейки AA в держателе с красным и чёрным проводом.",
  5: "Зарядное устройство USB с кабелем и переходная плата USB-C для макетной платы, которая выводит + и − на два штырька.",
};

/** A rail, in the case a preposition asks for: *от верхней шины −*, *в верхнюю шину −*. */
const russianRail = (place: Extract<Place, { kind: "rail" }>, accusative: boolean) =>
  `${place.side === "top" ? (accusative ? "верхнюю" : "верхней") : accusative ? "нижнюю" : "нижней"} ${accusative ? "шину" : "шины"} ${place.sign}`;

const russianBoard = (place: Place): string => (place.second ? " на второй плате" : "");

const russianFrom = (place: Place): string =>
  (place.kind === "rail" ? `от ${russianRail(place, false)}` : `от ${place.html}`) +
  russianBoard(place);

const russianTo = (place: Place): string =>
  (place.kind === "rail" ? `до ${russianRail(place, false)}` : `до ${place.html}`) +
  russianBoard(place);

const russianIn = (place: Place): string =>
  (place.kind === "rail" ? `в ${russianRail(place, true)}` : `в ${place.html}`) +
  russianBoard(place);

/** A DIP switch's positions, as *на* takes them: *на 2 позиции*, *на 5 позиций* (ADR 0054). */
const russianPositions = (count: number): string =>
  plural("ru", count, { one: "позицию", few: "позиции", many: "позиций", other: "позиции" });

/** A bar graph's segments, as *на* takes them after a number: *на 2 сегмента*, *на 5 сегментов* (ADR 0058). */
const russianSegments = (count: number): string =>
  plural("ru", count, { one: "сегмент", few: "сегмента", many: "сегментов", other: "сегмента" });

const russianList = (items: readonly string[]): string =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} и ${items[items.length - 1]}`;

/** A transistor's legs. */
const RUSSIAN_LEGS: Record<TransistorLeg, string> = {
  emitter: "эмиттер",
  base: "база",
  collector: "коллектор",
};

/** A value in microfarads as Russian writes it: a decimal comma, and *мкФ*. */
const russianMicrofarads = (value: number): string =>
  formatMicrofarads(value).replace(".", ",").replace("µF", "мкФ");

/** A value in ohms as Russian writes it: a decimal comma, and *Ом*. */
const russianOhms = (value: number): string =>
  formatOhms(value).replace(".", ",").replace("kΩ", "кОм").replace("Ω", "Ом");

export const RUSSIAN_PAGE: PageWords = {
  tag: "ru",
  eyebrow: "ratsnest · схема сборки",
  tapStep: "Нажмите на шаг, чтобы выделить его детали.",
  railMinus: "шина −: земля",
  railPlus: (used) => `шина +: ${used ? "3V3" : "не используется"}`,
  build: "Сборка",
  parts: "Детали",
  script: "Проверка в Thonny",
  copy: "Копировать",
  copied: "Скопировано",
  selected: "Выделено",

  drawingTitle: (circuit, boards) =>
    `${circuit}: ${boards > 1 ? "на двух половинных макетных платах" : "на половинной макетной плате"}`,
  drawingIntro: (orientation) =>
    `Pico 2 W посередине макетной платы, его USB ${RUSSIAN_USB[orientation]}.`,

  pinNote: (label, number) => `(${label}, вывод ${number})`,
  from: russianFrom,
  to: russianTo,
  in: russianIn,
  list: russianList,

  ohms: russianOhms,
  microfarads: russianMicrofarads,
  nanofarads: (value) => formatNanofarads(value).replace(".", ",").replace("nF", "нФ"),
  band: (band) => (band === "gold" ? "золотой" : (RUSSIAN_BANDS[Number(band)] ?? band)),
  wire: (role) => RUSSIAN_WIRES[role],

  jumper: (colour, from, to) =>
    `${capitalised(colour)} перемычка ${russianFrom(from)} ${russianTo(to)}.`,
  archingJumper: (colour, from, to) =>
    `Длинная ${colour} перемычка ${russianFrom(from)} ${russianTo(to)}, перекинутая над платой.`,
  resistor: (ohms, from, to) => `Резистор ${ohms} ${russianFrom(from)} ${russianTo(to)}.`,
  led: (name, anode, cathode) =>
    `${name}: длинная ножка ${russianIn(anode)}, короткая ножка ${russianIn(cathode)}.`,
  button: (name, cap, where, legs, second) =>
    `${name}: кнопка с ${RUSSIAN_CAPS[cap].with} колпачком, ${RUSSIAN_PLACEMENT[where]}, ножки в ${russianList(legs)}${second ? " на второй плате" : ""}.`,
  buzzer: (name, plus, minus) =>
    `${name}: ножка + ${russianIn(plus)}, другая ножка ${russianIn(minus)}.`,
  rgbLed: (name, legs, second) =>
    `${name}: ножки в ${russianList(legs)}${second ? " на второй плате" : ""}: +5 В, затем выход данных, самая длинная, затем земля, затем вход данных.`,
  ring: (name, dataIn, power, ground, dataOut) =>
    `${name}, стоя: вход данных ${russianIn(dataIn)}, 5 В ${russianIn(power)}, земля ${russianIn(ground)} и выход данных ${russianIn(dataOut)}.`,
  electrolytic: (microfarads, plus, minus) =>
    `Конденсатор ${microfarads}: ножка + ${russianIn(plus)}, ножка −, со стороны полосы, ${russianIn(minus)}.`,
  transistor: (model, type, emitter, base, collector) =>
    `Транзистор ${type} ${model}, плоской стороной к ряду <span class="hole">j</span>: эмиттер ${russianIn(emitter)}, база ${russianIn(base)}, коллектор ${russianIn(collector)}.`,
  diode: (model, anode, cathode) =>
    `Диод ${model}: анод ${russianIn(anode)}, катод, со стороны полосы, ${russianIn(cathode)}.`,
  ceramic: (nanofarads, code, from, to) =>
    `Керамический конденсатор ${nanofarads} с маркировкой ${code}, любой стороной: одна ножка ${russianIn(from)}, другая ${russianIn(to)}.`,
  slideSwitch: (middle, left, right) =>
    `Ползунковый переключатель, любой стороной: средняя ножка ${russianIn(middle)}, одна крайняя ножка ${russianIn(left)}, другая ${russianIn(right)}.`,
  dipSwitch: (switches, first, last, second) =>
    `DIP-переключатель на ${switches} ${russianPositions(switches)} поперёк центральной канавки, стороной ON к ряду <span class="hole">a</span>: переключатель 1 в ${russianList(first)}, переключатель ${switches} в ${russianList(last)}${second ? ", на второй плате" : ""}.`,
  slidePotentiometer: (ohms, wiper, end, otherEnd) =>
    `Ползунковый потенциометр ${ohms}, поперёк обеих плат: движок ${russianIn(wiper)}, вывод рядом с ним ${russianIn(end)}, другой вывод ${russianIn(otherEnd)}.`,
  barGraph: (segments, colour, first, last, second) =>
    `Светодиодная шкала на ${segments} ${colour} ${russianSegments(segments)} поперёк центральной канавки, аноды в ряду <span class="hole">f</span>: сегмент 1 в ${russianList(first)}, сегмент ${segments} в ${russianList(last)}${second ? ", на второй плате" : ""}.`,
  resistorArray: (ohms, resistors, code, common, first, last, second) =>
    `Резисторная сборка из ${resistors} резисторов по ${ohms}, маркировка ${code}, вертикально в один ряд: общий вывод, под точкой, в ${common}, выводы резисторов с ${first} по ${last}${second ? ", на второй плате" : ""}.`,
  segmentColour: {
    red: "красных",
    green: "зелёных",
    amber: "янтарных",
    blue: "синих",
    yellow: "жёлтых",
    pink: "розовых",
    purple: "фиолетовых",
    orange: "оранжевых",
    aqua: "бирюзовых",
    white: "белых",
  },
  pir: (name, power, output, ground) =>
    `${name}, рядом с платой, куполом вверх: красная перемычка от вывода VCC ${russianIn(power)}, жёлтая от вывода OUT ${russianIn(output)} и чёрная от вывода GND ${russianIn(ground)}.`,

  ledLabel: (anode) => `длинная ножка в ${anode}`,
  buttonLabel: (where) => RUSSIAN_LABEL[where],
  buzzerLabel: (plus) => `ножка + в ${plus}`,
  rgbLedLabel: (dataIn) => `вход данных в ${dataIn}`,
  pirLabel: (output) => `OUT в ${output}`,

  picoTitle: "Установите Pico поперёк середины",
  picoBody: (pinOne, lands, orientation) =>
    `USB смотрит ${RUSSIAN_USB_POINTS[orientation]}. Выводы входят в ряды <span class="hole">c</span> и <span class="hole">h</span>, со столбца 2 по столбец 21, а вывод 1 входит в ${pinOne}.` +
    (lands.length > 0 ? ` Тогда ${russianList(lands)}.` : ""),
  land: (gpio, hole) => `GP${gpio} окажется в ${hole}`,
  testTitle: "Подключите и проверьте",
  testBody: (test) => `Подключите кабель USB и запустите скрипт с этой страницы в Thonny. ${test}`,

  listPico:
    "Raspberry Pi Pico 2 W с припаянными штыревыми выводами. Pico 2 WH продаётся уже с ними.",
  listBreadboard: (count) =>
    plural("ru", count, {
      one: "Половинная макетная плата: 30 столбцов, с шиной по всей длине каждой стороны.",
      few: "Половинные макетные платы: по 30 столбцов, с шиной по всей длине каждой стороны. Они соединяются длинными сторонами.",
      many: "Половинные макетные платы: по 30 столбцов, с шиной по всей длине каждой стороны. Они соединяются длинными сторонами.",
      other:
        "Половинные макетные платы: по 30 столбцов, с шиной по всей длине каждой стороны. Они соединяются длинными сторонами.",
    }),
  listLed: (name) => `${capitalised(name)}, 5 мм.`,
  listRgbLed: (name) => `${capitalised(name)}: адресуемый светодиод 10 мм. Резистор не нужен.`,
  listRing: (name) =>
    `${capitalised(name)}: двенадцать адресуемых RGB-светодиодов в кольце около 48 мм в диаметре, с разъёмом на четыре вывода. Резистор не нужен.`,
  listResistor: (ohms, _count, bands, five) =>
    `Резистор ${ohms} ${bands}<span class="aside">На синем, с 5 полосами: ${five}.</span>`,
  listButton: (name, cap) =>
    `${capitalised(name)}: тактовая кнопка 6 мм с четырьмя ножками и ${RUSSIAN_CAPS[cap].alone} колпачок.`,
  listBuzzer: (name) => `${capitalised(name)}: пассивного типа, ножка + отмечена.`,
  listElectrolytic: (microfarads) =>
    `Электролитический конденсатор ${microfarads}, на 16 В или больше.`,
  listTransistor: (model, type) => `Транзистор ${type} ${model} в корпусе TO-92.`,
  listDiode: (model, use) =>
    use === "signal"
      ? `Импульсный диод ${model} в оранжевом стеклянном корпусе.`
      : `Выпрямительный диод ${model} в чёрном корпусе.`,
  listSlideSwitch: () =>
    "Ползунковый переключатель SPDT: три ножки с шагом 2,54 мм, как отверстия макетной платы.",
  listSlidePotentiometer: (ohms) =>
    `Ползунковый потенциометр ${ohms}, длиной 45 мм: два вывода с одного конца и один с другого, с колпачком для ручки.`,
  listDipSwitch: (switches) =>
    `DIP-переключатель на ${switches} ${russianPositions(switches)}: ножки в два ряда на расстоянии 7,62 мм, чтобы встать поперёк центральной канавки.`,
  listBarGraph: (segments, colour) =>
    `Светодиодная шкала на ${segments} ${colour} ${russianSegments(segments)}: ножки в два ряда на расстоянии 7,62 мм, чтобы встать поперёк центральной канавки.`,
  listResistorArray: (ohms, resistors, code) =>
    `Резисторная сборка из ${resistors} резисторов по ${ohms} с общим выводом: ${resistors + 1} выводов в ряд, один из них общий для всех резисторов, маркировка ${code}.`,
  listPir: (name) =>
    `${capitalised(name)}: модуль PIR с тремя выводами, VCC, OUT и GND, питание 5 В. Пока он видит движение, на OUT 3,3 В.`,
  listPirJumpers: () =>
    "Перемычка мама-папа, около 20 см: красная, жёлтая и чёрная на каждый датчик движения, для его выводов.",
  listCeramic: (nanofarads, code) => `Керамический конденсатор ${nanofarads}, маркировка ${code}.`,
  listWire: (colour) => `Перемычка ${colour}, короткая.`,
  listLongWire: (colour) => `Перемычка ${colour}, длинная и гибкая: около 10 см.`,
  listCable:
    "Кабель micro-USB, передающий данные. Кабель только для зарядки не подойдёт: по нему Pico не получит данных.",

  ledPolarity:
    "Длинная ножка светодиода: это +, она идёт к выводу. Светодиод, вставленный наоборот, не горит, но и не портится: переверните его.",
  rgbLedPolarity: (dataPin) =>
    `Самая длинная ножка RGB-светодиода: выход данных, она идёт во второе отверстие. Проверьте её до установки: перевёрнутый, он подал бы 5 В на ${dataPin}.`,
  ringPolarity: (dataPin) =>
    `На обороте кольца подписаны его четыре вывода: вход данных, 5 В, земля и выход данных. Сверьте их с шагами до установки: перевёрнутое, оно подало бы 5 В на ${dataPin}.`,
  anyResistor: (low, high) =>
    `Для светодиода подойдёт любой резистор от ${low} до ${high}. Чем больше сопротивление, тем тусклее свет.`,
  electrolyticPolarity:
    "Электролитический конденсатор ставится только одной стороной: ножка − короче, она под светлой полосой на корпусе и идёт к −. Вставленный наоборот, он может испортиться.",
  switchedLedPolarity:
    "Длинная ножка светодиода: это +, она идёт к выводу, а если светодиод переключает транзистор, к 3V3 или к транзистору, как сказано в его шаге. Светодиод, вставленный наоборот, не горит, но и не портится: переверните его.",
  transistorPinout: (model, legs, unlike) =>
    `Если смотреть на плоскую сторону, ножками вниз, у ${model} слева направо: ${russianList(legs.map((leg) => RUSSIAN_LEGS[leg]))}. У похожих на него, например ${unlike}, порядок другой: берите модель, названную в списке деталей.`,
  baseResistor: (low, high) => `Для базы транзистора подойдёт любой резистор от ${low} до ${high}.`,
  diodePolarity:
    "Диод пропускает ток только в одну сторону: от анода к катоду, концу с полосой, который смотрит к −. Диод, вставленный наоборот, ничего не пропускает, и его светодиод не горит, но диод не портится: переверните его.",
  slideSwitchNote:
    "Ползунковый переключатель соединяет среднюю ножку с одной или другой крайней, смотря куда сдвинут ползунок, и остаётся так, когда его отпускают, а кнопка соединяет свои ножки, только пока её держат.",
  slidePotentiometerWiper: (pins) =>
    `Из двух выводов на одном конце ползункового потенциометра движком служит тот, напротив которого на другом конце вывода нет. Он идёт на аналоговый вывод ${russianList(pins).replace(" и ", " или ")}, а крайние выводы идут на 3V3(OUT) и землю, в любом порядке. Подключённый к 3V3(OUT), движок замкнул бы его на землю в одном конце хода.`,
  barGraphPolarity:
    "Каждый сегмент светодиодной шкалы: отдельный светодиод. Его анод идёт к своему выводу, катод через резистор к земле. Не на всех шкалах отмечено, в каком ряду аноды. Вставленная наоборот, шкала не горит, но и не портится: переверните её.",
  resistorArrayCode: (code, ohms) =>
    `Резисторы сборки делят общий вывод под точкой, он идёт на землю. Номинал напечатан на корпусе кодом после буквы A, которая означает общий вывод: две цифры, затем число нулей после них. ${code} означает ${ohms} на каждый резистор.`,
  pirPins:
    "На плате датчика движения подписаны три вывода, рядом с ними или под куполом: VCC или +, OUT или SIG, и GND. Надевайте каждую перемычку на вывод с её подписью, в каком бы порядке они ни шли: у разных датчиков он разный. После включения датчику нужно до минуты, чтобы успокоиться.",
  dipPullUp:
    "Каждый переключатель DIP-переключателя соединяет свои две ножки, пока он включён. Одна ножка идёт на землю, другая на свой вывод, который скрипт подтягивает вверх внутри Pico, так что вывод читает 1, пока переключатель выключен, и 0, пока он включён. Если подключить переключатели к 3V3(OUT), каждому выводу понадобится подтяжка вниз, а на встроенную подтяжку Pico 2 W нельзя положиться.",
  diodeAlike: (models) =>
    `На пути светодиода подойдёт любой из диодов ${russianList(models)}: светодиоду нужно гораздо меньше тока, чем выдерживает каждый из них.`,
  ceramicCode: (code, nanofarads) =>
    `Керамический конденсатор ставится любой стороной. Номинал напечатан на корпусе кодом в пикофарадах: две цифры, затем число нулей после них. ${code} означает ${nanofarads}.`,
  chargeResistor: (low, high) =>
    `Для зарядки конденсатора подойдёт любой резистор от ${low} до ${high}. Чем больше сопротивление или ёмкость, тем дольше зарядка.`,
  rowsLettered:
    "На некоторых макетных платах ряды подписаны в обратном порядке. Если на вашей так, следуйте рисунку, а не буквам.",
  unplug: "Отключайте кабель USB, пока меняете схему.",

  volts: (volts) => `${String(volts).replace(".", ",")} В`,
  railSupply: (volts) => `шина +: ${volts}`,
  supplyIntro: (volts, orientation) =>
    `Источник питания ${volts} ${RUSSIAN_USB[orientation]} от макетной платы.`,
  supplyTitle: "Подключите питание и проверьте",
  supplyBody: (plus, minus, test) =>
    `Вставьте красный провод источника ${russianIn(plus)}, а чёрный ${russianIn(minus)}, оба в столбец 1. ${test}`,
  listSupply: (volts) => RUSSIAN_SUPPLIES[volts],
  supplyLedPolarity:
    "Длинная ножка светодиода: это +, она идёт к шине +. Светодиод, вставленный наоборот, не горит, но и не портится: переверните его.",
  supplyUnplug: "Отключайте питание, пока меняете схему.",
};
