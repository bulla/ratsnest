import type { ButtonColour } from "../circuit";
import type { WireRole } from "../drawing/breadboard";
import { type Band, formatOhms } from "../drawing/breadboard-svg";

/**
 * Everything a page says of its own, in each language the engine writes (ADR 0010): the sentences it
 * builds from the parts, the headings, the notes and the footer. A circuit's own words, its name, its
 * description and its steps' titles and notes, are the circuit's, and are not here.
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

/** A light, a button or a buzzer: what an article agrees with in a language that has gender. */
export type PartKind = "led" | "button" | "buzzer";

/** Where a button sits on the breadboard (`placementOf`, scratchpi's ADR 0154). */
export type ButtonPlacement = "across" | "above" | "below";

export interface PageWords {
  /** For `<html lang>`. */
  readonly tag: string;
  readonly title: (circuit: string) => string;
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
  /** The attribution the drawing and the font are owed (ADR 0012, ADR 0018): markup, with links. */
  readonly footer: string;

  /** The drawing's own title, on one breadboard or two (scratchpi's ADR 0226), and its description's start. */
  readonly drawingTitle: (circuit: string, boards: number) => string;
  readonly drawingIntro: string;

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

  /** The labels in the drawing's margin, which are plain text. */
  readonly ledLabel: (anode: string) => string;
  readonly buttonLabel: (where: ButtonPlacement) => string;
  readonly buzzerLabel: (plus: string) => string;
  readonly rgbLedLabel: (dataIn: string) => string;

  /** The first step and the last, which every circuit has. */
  readonly picoTitle: string;
  readonly picoBody: (pinOne: string, lands: readonly string[]) => string;
  /** Where one of the circuit's pins lands once the Pico is in. */
  readonly land: (gpio: number, hole: string) => string;
  readonly testTitle: string;
  readonly testBody: (scriptDoes: string) => string;

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
  readonly rowsLettered: string;
  readonly unplug: string;
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
  title: (circuit) => `${circuit} · ratsnest`,
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
  footer: `The Pico 2 W is drawn from the measurements in its datasheet, adapting the
    <a href="https://datasheets.raspberrypi.com/picow/pico-2-w-datasheet.pdf">Raspberry Pi Pico 2 W pinout</a>,
    © Raspberry Pi Ltd, under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.
    This drawing is shared under the same licence. Set in Nunito, by the Nunito Project Authors,
    under the <a href="https://openfontlicense.org">SIL Open Font License 1.1</a>.`,

  drawingTitle: (circuit, boards) =>
    `${circuit}, on ${boards > 1 ? "two half-size breadboards" : "a half-size breadboard"}`,
  drawingIntro: "A Pico 2 W across the middle of the breadboard, its USB to the left.",

  pinNote: (label, number) => `(${label}, pin ${number})`,
  from: englishFrom,
  to: englishTo,
  in: englishIn,
  list: englishList,

  ohms: formatOhms,
  band: (band) => (band === "gold" ? "gold" : (ENGLISH_BANDS[Number(band)] ?? band)),
  wire: (role) => ENGLISH_WIRES[role],

  jumper: (colour, from, to) => `A ${colour} jumper ${englishFrom(from)} ${englishTo(to)}.`,
  archingJumper: (colour, from, to) =>
    `A long ${colour} jumper ${englishFrom(from)} ${englishTo(to)}, arching over the board.`,
  resistor: (ohms, from, to) => `A ${ohms} resistor ${englishFrom(from)} ${englishTo(to)}.`,
  led: (name, anode, cathode) =>
    `The ${name}: its long leg ${englishIn(anode)}, its short leg ${englishIn(cathode)}.`,
  button: (name, cap, where, legs) =>
    `${name}, the ${ENGLISH_CAPS[cap]} button, ${ENGLISH_PLACEMENT[where]}, its legs in ${englishList(legs)}.`,
  buzzer: (name, plus, minus) =>
    `The ${name}: its + leg ${englishIn(plus)}, its other leg ${englishIn(minus)}.`,
  rgbLed: (name, legs, second) =>
    `The ${name}, its legs in ${englishList(legs)}${second ? " on the second breadboard" : ""}: +5 V, then data out, the longest, then ground, then data in.`,
  ring: (name, dataIn, power, ground, dataOut) =>
    `The ${name}, standing up: data in ${englishIn(dataIn)}, 5 V ${englishIn(power)}, ground ${englishIn(ground)} and data out ${englishIn(dataOut)}.`,

  ledLabel: (anode) => `long leg in ${anode}`,
  buttonLabel: (where) => ENGLISH_PLACEMENT[where],
  buzzerLabel: (plus) => `+ leg in ${plus}`,
  rgbLedLabel: (dataIn) => `data in at ${dataIn}`,

  picoTitle: "Put the Pico across the middle",
  picoBody: (pinOne, lands) =>
    `The USB goes to the left. Its pins go in rows <span class="hole">c</span> and <span class="hole">h</span>, from column 2 to column 21, and pin 1 goes in ${pinOne}.` +
    (lands.length > 0 ? ` That puts ${englishList(lands)}.` : ""),
  land: (gpio, hole) => `GP${gpio} in ${hole}`,
  testTitle: "Plug in and test",
  testBody: (scriptDoes) =>
    `Plug the USB cable in and run the script on this page in Thonny. ${scriptDoes}`,

  listPico: "Raspberry Pi Pico 2 W, with its header pins soldered on. A Pico 2 WH comes with them.",
  listBreadboard: (count) =>
    count > 1
      ? "Half-size breadboards: 30 columns each, with a rail the whole length of each side. They join along their long sides."
      : "Half-size breadboard: 30 columns, with a rail the whole length of each side.",
  listLed: (name) => `${capitalised(name)}, 5 mm.`,
  listRgbLed: (name) =>
    `${capitalised(name)}: a 10 mm addressable LED, like the one in The Pi Hut's Let it Glow calendar. It needs no resistor.`,
  listRing: (name) =>
    `${capitalised(name)}: twelve addressable RGB LEDs in a ring about 48 mm across, with a header of four pins, like the one in The Pi Hut's Let it Glow calendar. It needs no resistor.`,
  listResistor: (ohms, count, bands, five) =>
    `${ohms} resistor${count > 1 ? "s" : ""} ${bands}` +
    `<span class="aside">On a blue 5-band one: ${five}.</span>`,
  listButton: (name, cap) =>
    `${capitalised(name)}: a 6 mm tactile switch with four legs, and a ${ENGLISH_CAPS[cap]} cap.`,
  listBuzzer: (name) => `Passive ${name}, with its + leg marked.`,
  listWire: (colour, count) => `${capitalised(colour)} jumper wire${count > 1 ? "s" : ""}, short.`,
  listLongWire: (colour, count) =>
    `${capitalised(colour)} jumper wire${count > 1 ? "s" : ""}, long and flexible: about 10 cm.`,
  listCable: "Micro-USB cable that carries data. A charge-only cable will not reach the Pico.",

  ledPolarity:
    "An LED's long leg is + and goes towards the pin. One put in backwards stays dark, but it is not damaged: turn it round.",
  rgbLedPolarity: (dataPin) =>
    `The RGB LED's longest leg is data out, and goes in the second hole. Check it before the LED goes in: turned round, it would put 5 V on ${dataPin}.`,
  ringPolarity: (dataPin) =>
    `The ring's back names its four pins: data in, 5 V, ground and data out. Check them against the steps before it goes in: turned round, it would put 5 V on ${dataPin}.`,
  anyResistor: (low, high) =>
    `Any resistor from ${low} to ${high} works for a light. A bigger one makes it dimmer.`,
  rowsLettered:
    "Some breadboards letter their rows the other way up. If yours does, follow the picture rather than the letters.",
  unplug: "Unplug the USB cable while you change the wiring.",
};

// --- French. ---

/** The narrow no-break space French puts before `: ; ? !` (ADR 0011). */
const NNBSP = " ";

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
 * *Le* for a button or a buzzer, and *L’* before a vowel or a mute *h*, whatever the gender.
 */
function the(kind: PartKind, name: string): string {
  if (/^[aeiouyhàâéèêëîïôöùûü]/i.test(name)) return `L’${name}`;
  return `${kind === "led" ? "La" : "Le"} ${name}`;
}

export const FRENCH_PAGE: PageWords = {
  tag: "fr",
  title: (circuit) => `${circuit} · ratsnest`,
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
  footer: `Le Pico 2 W est dessiné d’après les mesures de sa fiche technique, en adaptant le
    <a href="https://datasheets.raspberrypi.com/picow/pico-2-w-datasheet.pdf">brochage du Raspberry Pi Pico 2 W</a>,
    © Raspberry Pi Ltd, sous licence <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.
    Ce dessin est partagé sous la même licence. Composé en Nunito, par les auteurs du projet Nunito,
    sous la <a href="https://openfontlicense.org">licence SIL Open Font 1.1</a>.`,

  drawingTitle: (circuit, boards) =>
    `${circuit}, sur ${boards > 1 ? "deux plaques d’essai demi-taille" : "une plaque d’essai demi-taille"}`,
  drawingIntro: "Un Pico 2 W au milieu de la plaque d’essai, son port USB à gauche.",

  pinNote: (label, number) => `(${label}, broche ${number})`,
  from: frenchFrom,
  to: frenchTo,
  in: frenchIn,
  list: frenchList,

  ohms: (value) => formatOhms(value).replace(".", ","),
  band: (band) => (band === "gold" ? "or" : (FRENCH_BANDS[Number(band)] ?? band)),
  wire: (role, count) => FRENCH_WIRES[role][count > 1 ? 1 : 0],

  jumper: (colour, from, to) => `Un fil ${colour} ${frenchFrom(from)} ${frenchTo(to)}.`,
  archingJumper: (colour, from, to) =>
    `Un long fil ${colour} ${frenchFrom(from)} ${frenchTo(to)}, qui passe par-dessus la plaque.`,
  resistor: (ohms, from, to) => `Une résistance de ${ohms} ${frenchFrom(from)} ${frenchTo(to)}.`,
  led: (name, anode, cathode) =>
    `${the("led", name)}${NNBSP}: sa grande patte ${frenchIn(anode)}, sa petite patte ${frenchIn(cathode)}.`,
  button: (name, cap, where, legs) =>
    `${name}, le bouton ${FRENCH_CAPS[cap]}, ${FRENCH_PLACEMENT[where]}, ses pattes en ${frenchList(legs)}.`,
  buzzer: (name, plus, minus) =>
    `${the("buzzer", name)}${NNBSP}: sa patte + ${frenchIn(plus)}, son autre patte ${frenchIn(minus)}.`,
  rgbLed: (name, legs, second) =>
    `${the("led", name)}, ses pattes en ${frenchList(legs)}${second ? " de la seconde plaque" : ""}${NNBSP}: le +5 V, puis la sortie des données, la plus longue, puis la masse, puis l’entrée des données.`,
  ring: (name, dataIn, power, ground, dataOut) =>
    `${the("led", name)}, debout${NNBSP}: l’entrée des données ${frenchIn(dataIn)}, le 5 V ${frenchIn(power)}, la masse ${frenchIn(ground)} et la sortie des données ${frenchIn(dataOut)}.`,

  ledLabel: (anode) => `grande patte en ${anode}`,
  buttonLabel: (where) => FRENCH_LABEL[where],
  buzzerLabel: (plus) => `patte + en ${plus}`,
  rgbLedLabel: (dataIn) => `entrée en ${dataIn}`,

  picoTitle: "Placez le Pico à cheval sur la rainure centrale",
  picoBody: (pinOne, lands) =>
    `Le port USB va à gauche. Ses broches vont dans les rangées <span class="hole">c</span> et <span class="hole">h</span>, de la colonne 2 à la colonne 21, et la broche 1 va en ${pinOne}.` +
    (lands.length > 0 ? ` Ainsi, ${frenchList(lands)}.` : ""),
  land: (gpio, hole) => `GP${gpio} est en ${hole}`,
  testTitle: "Branchez et testez",
  testBody: (scriptDoes) =>
    `Branchez le câble USB et lancez dans Thonny le script de cette page. ${scriptDoes}`,

  listPico: "Raspberry Pi Pico 2 W, avec ses connecteurs soudés. Un Pico 2 WH est livré avec.",
  listBreadboard: (count) =>
    count > 1
      ? `Plaques d’essai demi-taille${NNBSP}: 30 colonnes chacune, avec un rail sur toute la longueur de chaque côté. Elles s’emboîtent par leurs grands côtés.`
      : `Plaque d’essai demi-taille${NNBSP}: 30 colonnes, avec un rail sur toute la longueur de chaque côté.`,
  listLed: (name) => `${capitalised(name)}, 5 mm.`,
  listRgbLed: (name) =>
    `${capitalised(name)}${NNBSP}: une LED adressable de 10 mm, comme celle du calendrier Let it Glow de The Pi Hut. Elle n’a besoin d’aucune résistance.`,
  listRing: (name) =>
    `${capitalised(name)}${NNBSP}: douze LED RVB adressables en anneau d’environ 48 mm de diamètre, avec un connecteur de quatre broches, comme celui du calendrier Let it Glow de The Pi Hut. Il n’a besoin d’aucune résistance.`,
  listResistor: (ohms, count, bands, five) =>
    `Résistance${count > 1 ? "s" : ""} de ${ohms} ${bands}` +
    `<span class="aside">Sur une résistance bleue à 5 anneaux${NNBSP}: ${five}.</span>`,
  listButton: (name, cap) =>
    `${capitalised(name)}${NNBSP}: un interrupteur tactile de 6 mm à quatre pattes, avec un capuchon ${FRENCH_CAPS[cap]}.`,
  listBuzzer: (name) => `${capitalised(name)} passif, avec sa patte + marquée.`,
  listWire: (colour, count) =>
    count > 1 ? `Fils de connexion ${colour}, courts.` : `Fil de connexion ${colour}, court.`,
  listLongWire: (colour, count) =>
    count > 1
      ? `Fils de connexion ${colour}, longs et souples${NNBSP}: environ 10 cm.`
      : `Fil de connexion ${colour}, long et souple${NNBSP}: environ 10 cm.`,
  listCable:
    "Câble micro-USB qui transporte les données. Un câble de charge seule n’atteindra pas le Pico.",

  ledPolarity: `La grande patte d’une LED est le + et va du côté de la broche. Une LED mise à l’envers reste éteinte, mais elle n’est pas abîmée${NNBSP}: retournez-la.`,
  rgbLedPolarity: (dataPin) =>
    `La plus longue patte de la LED RVB est la sortie des données, et va dans le deuxième trou. Vérifiez-la avant de planter la LED${NNBSP}: à l’envers, elle mettrait 5 V sur ${dataPin}.`,
  ringPolarity: (dataPin) =>
    `Le dos de l’anneau nomme ses quatre broches${NNBSP}: entrée des données, 5 V, masse et sortie des données. Vérifiez-les d’après les étapes avant de le planter${NNBSP}: à l’envers, il mettrait 5 V sur ${dataPin}.`,
  anyResistor: (low, high) =>
    `N’importe quelle résistance de ${low} à ${high} convient pour une LED. Plus elle est grande, plus la LED éclaire faiblement.`,
  rowsLettered:
    "Sur certaines plaques d’essai, les lettres des rangées vont dans l’autre sens. Si c’est le cas de la vôtre, suivez le dessin plutôt que les lettres.",
  unplug: "Débranchez le câble USB pendant que vous changez le câblage.",
};
