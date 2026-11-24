import { ceramicCode } from "./ceramics";
import {
  BUTTON_COLOURS,
  isSupplied,
  LED_COLOURS,
  SUPPLY_RAILS,
  SUPPLY_VOLTS,
  THREE_VOLT_COLOURS,
} from "./circuit";
import { DIODE_NAMES } from "./diodes";
import { legsOf, type Part as Placed, parseHole, pinOfStrip } from "./drawing/breadboard";
import { HEADER_PINS } from "./drawing/geometry";
import { fileOf } from "./fonts";
import type { Circuit, Language, Setup, SupplyCircuit, Text } from "./format";
import { LANGUAGES } from "./language";
import { isUsableGpio } from "./pins";
import { pathOf } from "./read";
import { TRANSISTOR_NAMES } from "./transistors";

/**
 * Every field of a circuit's data checked by the engine itself, because a circuits project may never
 * run a type checker (ADR 0016): its format first (ADR 0015), then its setup (ADR 0037), then the
 * shape of every field, then
 * its languages (ADR 0010), then what its words may say (ADR 0006). What the wiring means is the
 * wiring check's (`netlist.ts`), which runs once these pass.
 *
 * A problem names the path of the field it is about, so that it can be pointed at in the file.
 */

/** The circuit format this engine reads, and the only one. */
export const FORMAT = 2;

/** Something wrong with a field, by its path: `steps[2].parts[0].from`. */
export interface FieldProblem {
  readonly path: string;
  readonly message: string;
}

const ROLES = ["ground", "power", "signal"] as const;
const ONE_HALF_ROWS = ["a,d", "b,e", "f,i", "g,j"];

type Record_ = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is Record_ =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const quoted = (values: readonly (string | number)[]): string => {
  const words = values.map((value) => `\`${value}\``);
  return words.length <= 1
    ? words.join("")
    : `${words.slice(0, -1).join(", ")} or ${words[words.length - 1]}`;
};

/**
 * The format a file says it is in, and whether this engine reads it. Asked before anything else: a
 * file of another format is refused whole, with what to do about it (ADR 0015).
 */
export function formatProblem(data: unknown): FieldProblem | undefined {
  const format = isRecord(data) ? data.format : undefined;
  if (format === FORMAT) return undefined;
  if (typeof format !== "number" || !Number.isInteger(format) || format < 1) {
    return {
      path: "format",
      message: `says no format: a circuit file says which it is written in, \`format: ${FORMAT}\` (ADR 0015)`,
    };
  }
  return format > FORMAT
    ? {
        path: "format",
        message: `is written in format ${format}, newer than this ratsnest reads (${FORMAT}): run \`ratsnest update\``,
      }
    : {
        path: "format",
        message: `is written in format ${format}, older than this ratsnest reads (${FORMAT}): run \`ratsnest update\``,
      };
}

/** A checker of one object: its fields by name, each required unless asked otherwise. */
class Fields {
  constructor(
    private readonly object: Record_,
    private readonly path: string,
    private readonly problems: FieldProblem[],
  ) {}

  private at(key: string): string {
    return pathOf(this.path, key);
  }

  problem(key: string, message: string): void {
    this.problems.push({ path: this.at(key), message });
  }

  /** The value of a field, or a problem saying it is missing. */
  required(key: string, what: string): unknown {
    if (!Object.hasOwn(this.object, key)) {
      this.problems.push({ path: this.path, message: `has no \`${key}\`, ${what}` });
      return undefined;
    }
    return this.object[key];
  }

  /** Every field the object has that it may not. */
  only(keys: readonly string[], what: string): void {
    for (const key of Object.keys(this.object)) {
      if (!keys.includes(key)) {
        this.problem(key, `is not a field of ${what}: it has ${quoted(keys)}`);
      }
    }
  }

  text(key: string, optional = false): void {
    if (optional && !Object.hasOwn(this.object, key)) return;
    const value = this.required(key, "a text");
    if (value !== undefined) textProblems(value, this.at(key), this.problems);
  }

  string(key: string): string | undefined {
    const value = this.required(key, "a string");
    if (value === undefined) return undefined;
    if (typeof value !== "string" || value.length === 0) {
      this.problem(key, "is not a string with something in it");
      return undefined;
    }
    return value;
  }

  hole(key: string): void {
    const value = this.required(key, "a hole");
    if (value === undefined) return;
    if (typeof value !== "string" || !parseHole(value)) {
      this.problem(
        key,
        `is not a hole on a half-size breadboard: holes are named as it prints them, \`a21\` or \`top-19\`, and \`2:f5\` on a second one`,
      );
    }
  }

  oneOf(key: string, values: readonly string[]): void {
    const value = this.required(key, "a choice");
    if (value === undefined) return;
    if (typeof value !== "string" || !values.includes(value)) {
      this.problem(key, `is not one of ${quoted(values)}`);
    }
  }

  integer(key: string, from: number): number | undefined {
    const value = this.required(key, "a whole number");
    if (value === undefined) return undefined;
    if (typeof value !== "number" || !Number.isInteger(value) || value < from) {
      this.problem(key, `is not a whole number of ${from} or more`);
      return undefined;
    }
    return value;
  }

  /** The array at a key, each item checked as an object; `optional` lists may be left out. */
  list(key: string, optional: boolean, item: (fields: Fields, index: number) => void): void {
    if (optional && !Object.hasOwn(this.object, key)) return;
    const value = this.required(key, "a list");
    if (value === undefined) return;
    if (!Array.isArray(value)) {
      this.problem(key, "is not a list");
      return;
    }
    value.forEach((each, index) => {
      const path = pathOf(this.at(key), index);
      if (!isRecord(each)) {
        this.problems.push({ path, message: "is not an object" });
        return;
      }
      item(new Fields(each, path, this.problems), index);
    });
  }
}

/** A text: an object keyed by language, one at least, each a string with something in it. */
function textProblems(value: unknown, path: string, problems: FieldProblem[]): void {
  if (!isRecord(value)) {
    problems.push({
      path,
      message: `is not a text keyed by language, such as \`{ en: "…" }\` (ADR 0010)`,
    });
    return;
  }
  const keys = Object.keys(value);
  if (keys.length === 0) {
    problems.push({ path, message: "is in no language: a text needs one at least (ADR 0010)" });
  }
  for (const key of keys) {
    if (!(LANGUAGES as readonly string[]).includes(key)) {
      problems.push({
        path: pathOf(path, key),
        message: `is not a language ratsnest writes: it writes ${quoted(LANGUAGES)} (ADR 0010)`,
      });
    } else if (typeof value[key] !== "string" || (value[key] as string).trim() === "") {
      problems.push({ path: pathOf(path, key), message: "is not a string with something in it" });
    }
  }
}

function pinProblems(fields: Fields, kind: "gpio" | "rgb"): void {
  fields.oneOf("kind", [kind]);
  const gpio = fields.integer("gpio", 0);
  if (gpio !== undefined && !isUsableGpio(gpio)) {
    fields.problem("gpio", `is GP${gpio}, which the Pico 2 W does not break out`);
  }
  if (kind === "rgb") fields.integer("count", 1);
}

/** The pin at `pin`, of the kind given. */
function pinField(fields: Fields, kind: "gpio" | "rgb", path: string, problems: FieldProblem[]) {
  const pin = fields.required("pin", "a pin");
  if (pin === undefined) return;
  if (!isRecord(pin)) {
    fields.problem("pin", 'is not a pin, such as `{ kind: "gpio", gpio: 15 }`');
    return;
  }
  const pinFields = new Fields(pin, pathOf(path, "pin"), problems);
  pinFields.only(kind === "rgb" ? ["kind", "gpio", "count"] : ["kind", "gpio"], "a pin");
  pinProblems(pinFields, kind);
}

const PART_FIELDS: Readonly<Record<string, readonly string[]>> = {
  wire: ["kind", "from", "to", "role", "arch"],
  resistor: ["kind", "ohms", "from", "to"],
  led: ["kind", "led", "anode", "cathode"],
  button: ["kind", "button", "columns", "rows", "board"],
  buzzer: ["kind", "buzzer", "plus", "minus"],
  rgbLed: ["kind", "led", "power", "dataOut", "ground", "dataIn"],
  ring: ["kind", "led", "dataIn", "power", "ground", "dataOut"],
  electrolytic: ["kind", "microfarads", "plus", "minus"],
  transistor: ["kind", "model", "emitter", "base", "collector"],
  diode: ["kind", "model", "anode", "cathode"],
  ceramic: ["kind", "nanofarads", "from", "to"],
  slideSwitch: ["kind", "left", "middle", "right"],
};

/** The parts a circuit with a supply may hold: no buzzer, RGB LED or ring, which need a Pico. */
const SUPPLY_PARTS = [
  "wire",
  "resistor",
  "led",
  "button",
  "electrolytic",
  "transistor",
  "diode",
  "slideSwitch",
];

function partProblems(part: Record_, fields: Fields, ids: Ids, supplied: boolean): void {
  const kind = part.kind;
  if (typeof kind !== "string" || !Object.hasOwn(PART_FIELDS, kind)) {
    fields.problem("kind", `is not a part ratsnest knows: ${quoted(Object.keys(PART_FIELDS))}`);
    return;
  }
  if (supplied && !SUPPLY_PARTS.includes(kind)) {
    fields.problem(
      "kind",
      `is \`${kind}\`, which needs a Pico to drive it: a circuit with a supply holds ${quoted(SUPPLY_PARTS)} (ADR 0032)`,
    );
    return;
  }
  fields.only(PART_FIELDS[kind] ?? [], `a ${kind}`);
  const reference = (key: string, known: ReadonlySet<string>, what: string) => {
    const id = fields.string(key);
    if (id !== undefined && !known.has(id)) {
      fields.problem(key, `is \`${id}\`, which is not the id of any of the circuit's ${what}`);
    }
  };
  switch (kind) {
    case "wire":
      fields.hole("from");
      fields.hole("to");
      fields.oneOf("role", ROLES);
      if (Object.hasOwn(part, "arch") && part.arch !== true) {
        fields.problem("arch", "is `true` when it is there: leave it out for a flat jumper");
      }
      return;
    case "resistor": {
      const ohms = fields.required("ohms", "a value in ohms");
      if (
        ohms !== undefined &&
        (typeof ohms !== "number" || !(ohms > 0) || !Number.isFinite(ohms))
      ) {
        fields.problem("ohms", "is not a value in ohms above 0");
      }
      fields.hole("from");
      fields.hole("to");
      return;
    }
    case "led":
      reference("led", ids.plainLeds, "plain lights");
      fields.hole("anode");
      fields.hole("cathode");
      return;
    case "button": {
      reference("button", ids.buttons, "buttons");
      const columns = fields.required("columns", "two columns");
      if (
        columns !== undefined &&
        !(
          Array.isArray(columns) &&
          columns.length === 2 &&
          columns.every((column) => Number.isInteger(column) && column >= 1 && column <= 30)
        )
      ) {
        fields.problem("columns", "is not two columns, each from 1 to 30");
      }
      if (Object.hasOwn(part, "rows")) {
        const rows = part.rows;
        if (!Array.isArray(rows) || !ONE_HALF_ROWS.includes(rows.join(","))) {
          fields.problem(
            "rows",
            `is not the rows of one half of the board: ${quoted(
              ONE_HALF_ROWS.map(
                (pair) =>
                  `[${pair
                    .split(",")
                    .map((row) => `"${row}"`)
                    .join(", ")}]`,
              ),
            )}, or left out for across the channel`,
          );
        }
      }
      if (Object.hasOwn(part, "board") && part.board !== 2) {
        fields.problem("board", "is not 2, the second breadboard, or left out for the first");
      }
      return;
    }
    case "buzzer":
      reference("buzzer", ids.buzzers, "buzzers");
      fields.hole("plus");
      fields.hole("minus");
      return;
    case "electrolytic": {
      const microfarads = fields.required("microfarads", "a value in microfarads");
      if (
        microfarads !== undefined &&
        (typeof microfarads !== "number" || !(microfarads > 0) || !Number.isFinite(microfarads))
      ) {
        fields.problem("microfarads", "is not a value in microfarads above 0, such as `470`");
      }
      fields.hole("plus");
      fields.hole("minus");
      return;
    }
    case "transistor":
      fields.oneOf("model", TRANSISTOR_NAMES);
      for (const leg of ["emitter", "base", "collector"]) fields.hole(leg);
      return;
    case "diode":
      fields.oneOf("model", DIODE_NAMES);
      fields.hole("anode");
      fields.hole("cathode");
      return;
    case "ceramic": {
      const nanofarads = fields.required("nanofarads", "a value in nanofarads");
      if (
        nanofarads !== undefined &&
        (typeof nanofarads !== "number" || !ceramicCode(nanofarads))
      ) {
        fields.problem(
          "nanofarads",
          "is not a value in nanofarads a ceramic capacitor's code can print: two figures at most, and 0.01 or more, such as `100` or `4.7`",
        );
      }
      fields.hole("from");
      fields.hole("to");
      return;
    }
    case "slideSwitch":
      for (const leg of ["left", "middle", "right"]) fields.hole(leg);
      return;
    case "rgbLed":
    case "ring":
      reference("led", ids.rgbLeds, "RGB lights");
      for (const leg of ["power", "dataOut", "ground", "dataIn"]) fields.hole(leg);
      return;
  }
}

/** The ids a circuit declares, by what they are, for the parts to refer to. */
interface Ids {
  readonly plainLeds: Set<string>;
  readonly rgbLeds: Set<string>;
  readonly buttons: Set<string>;
  readonly buzzers: Set<string>;
}

/**
 * Every problem with the shape of a circuit's data, its format already the current one. No problems
 * means the data is a `Circuit`.
 */
export function shapeProblems(data: unknown): FieldProblem[] {
  const problems: FieldProblem[] = [];
  if (!isRecord(data)) return [{ path: "", message: "is not an object" }];
  const circuit = new Fields(data, "", problems);
  // What the board is set up with decides what every other field may be (ADR 0037), so a circuit
  // whose setup says nothing this engine knows is checked no further.
  const kind = setupKind(data, problems);
  if (kind === undefined) return problems;
  // A circuit with a supply has no Pico (ADR 0032), and none of what a Pico drives or runs.
  const supplied = kind === "supply";
  const setup = new Fields(data.setup as Record_, "setup", problems);
  if (supplied) {
    const needsPico: Readonly<Record<string, string>> = {
      buzzers: "a buzzer needs a Pico to drive it",
      script: "it has no Pico to run a script, and its `test` says what to do instead",
    };
    for (const [key, why] of Object.entries(needsPico)) {
      if (Object.hasOwn(data, key)) {
        circuit.problem(key, `is not a field of a circuit with a supply: ${why} (ADR 0032)`);
      }
    }
    circuit.only(
      [
        "format",
        "setup",
        "name",
        "description",
        "credit",
        "leds",
        "buttons",
        "steps",
        "test",
      ].concat(Object.keys(needsPico)),
      "a circuit with a supply",
    );
    supplyProblems(setup);
  } else {
    circuit.only(
      [
        "format",
        "setup",
        "name",
        "description",
        "credit",
        "leds",
        "buttons",
        "buzzers",
        "steps",
        "script",
        "test",
      ],
      "a circuit",
    );
    setup.only(["kind"], "a Pico's setup");
  }
  circuit.text("name");
  circuit.text("description");
  circuit.text("credit", true);

  const ids: Ids = {
    plainLeds: new Set(),
    rgbLeds: new Set(),
    buttons: new Set(),
    buzzers: new Set(),
  };
  const seen = new Map<string, string>();
  const declare = (fields: Fields, path: string, into: Set<string>) => {
    const id = fields.string("id");
    if (id === undefined) return;
    const before = seen.get(id);
    if (before) fields.problem("id", `is \`${id}\`, which ${before} is already`);
    else seen.set(id, path);
    into.add(id);
  };
  /** A light's or a button's pin, which a circuit with a supply has none of (ADR 0032). */
  const pinless = (fields: Fields, item: Record_, what: string) => {
    if (Object.hasOwn(item, "pin")) {
      fields.problem(
        "pin",
        `is a pin, which ${what} in a circuit with a supply has none of: the supply powers it, so leave it out (ADR 0032)`,
      );
    }
    fields.only(["id", "name", "colour", "pin"], what);
  };

  circuit.list("leds", true, (fields, index) => {
    const path = pathOf("leds", index);
    const led = (data.leds as Record_[])[index] as Record_;
    const rgb = led.colour === "rgb";
    if (supplied) {
      pinless(fields, led, "a light");
      declare(fields, path, ids.plainLeds);
      fields.text("name");
      if (rgb) {
        fields.problem(
          "colour",
          "is `rgb`, an addressable LED, which needs a Pico to drive it: a circuit with a supply has plain lights (ADR 0032)",
        );
      } else fields.oneOf("colour", LED_COLOURS);
      return;
    }
    fields.only(["id", "name", "pin", "colour"], "a light");
    declare(fields, path, rgb ? ids.rgbLeds : ids.plainLeds);
    fields.text("name");
    fields.oneOf("colour", [...LED_COLOURS, "rgb"]);
    pinField(fields, rgb ? "rgb" : "gpio", path, problems);
  });
  circuit.list("buttons", true, (fields, index) => {
    const path = pathOf("buttons", index);
    if (supplied) {
      pinless(fields, (data.buttons as Record_[])[index] as Record_, "a button");
    } else {
      fields.only(["id", "name", "pin", "colour"], "a button");
    }
    declare(fields, path, ids.buttons);
    fields.text("name");
    fields.oneOf("colour", BUTTON_COLOURS);
    if (!supplied) pinField(fields, "gpio", path, problems);
  });
  if (!supplied) {
    circuit.list("buzzers", true, (fields, index) => {
      const path = pathOf("buzzers", index);
      fields.only(["id", "name", "pin"], "a buzzer");
      declare(fields, path, ids.buzzers);
      fields.text("name");
      pinField(fields, "gpio", path, problems);
    });
  }

  circuit.list("steps", false, (fields, index) => {
    fields.only(["title", "note", "parts"], "a step");
    fields.text("title");
    fields.text("note", true);
    const step = (data.steps as Record_[])[index] as Record_;
    fields.list("parts", false, (partFields, partIndex) => {
      partProblems((step.parts as Record_[])[partIndex] as Record_, partFields, ids, supplied);
    });
  });
  if (Array.isArray(data.steps) && data.steps.length === 0) {
    circuit.problem("steps", "is empty: a circuit has a step at least");
  }

  if (!supplied) circuit.text("script");
  circuit.text("test");
  return problems;
}

/** What a board can be set up with (ADR 0037), each a `kind` of the format's `Setup`. */
const SETUPS = ["pico", "supply"] as const satisfies readonly Setup["kind"][];

const SETUP_EXAMPLES = '`{ kind: "pico" }`, or `{ kind: "supply", volts: 4.5, rails: "bottom" }`';

/**
 * What a circuit's board is set up with (ADR 0037), or nothing, and a problem saying what to write:
 * asked before any other field, since it decides what every other field may be.
 */
function setupKind(data: Record_, problems: FieldProblem[]): Setup["kind"] | undefined {
  if (!Object.hasOwn(data, "setup")) {
    problems.push({
      path: "",
      message: `has no \`setup\`, what its breadboard is set up with: ${SETUP_EXAMPLES} (ADR 0037)`,
    });
    return undefined;
  }
  const setup = data.setup;
  if (!isRecord(setup)) {
    problems.push({
      path: "setup",
      message: `is not a setup, such as ${SETUP_EXAMPLES} (ADR 0037)`,
    });
    return undefined;
  }
  const kind = setup.kind;
  if ((SETUPS as readonly unknown[]).includes(kind)) return kind as Setup["kind"];
  problems.push(
    Object.hasOwn(setup, "kind")
      ? {
          path: pathOf("setup", "kind"),
          message: `is not ${quoted(SETUPS)}: a Pico 2 W across the middle of the board, or a supply in its place (ADR 0037)`,
        }
      : {
          path: "setup",
          message: `has no \`kind\`, which names what the breadboard is set up with: ${quoted(SETUPS)} (ADR 0037)`,
        },
  );
  return undefined;
}

/**
 * A supply's setup: its kind, a voltage it can give, and the rails its leads go in (ADR 0032,
 * ADR 0037).
 */
function supplyProblems(fields: Fields): void {
  fields.only(["kind", "volts", "rails"], "a supply's setup");
  const volts = fields.required("volts", "the voltage it gives");
  if (volts !== undefined && !(SUPPLY_VOLTS as readonly unknown[]).includes(volts)) {
    fields.problem(
      "volts",
      `is not ${quoted(SUPPLY_VOLTS)}: 3 or 4.5 from AA batteries, 3.7 from a Li-Po cell, or 5 from a USB charger (ADR 0032)`,
    );
  }
  fields.oneOf("rails", SUPPLY_RAILS);
}

/**
 * The lights a supply cannot light (ADR 0033): on the 3 V supply, those that need about 3 V
 * themselves, which no resistor leaves enough for.
 */
export function supplyLightProblems(circuit: SupplyCircuit): FieldProblem[] {
  if (circuit.setup.volts !== 3) return [];
  return (circuit.leds ?? []).flatMap((led, index) =>
    (THREE_VOLT_COLOURS as readonly string[]).includes(led.colour)
      ? [
          {
            path: pathOf(pathOf("leds", index), "colour"),
            message: `is \`${led.colour}\`, a light that needs about 3 V itself, which the 3 V supply cannot light through a resistor: take \`volts: 4.5\`, or a red, amber, orange or yellow light (ADR 0033)`,
          },
        ]
      : [],
  );
}

/** Every text a circuit has, by its path. */
export function textsOf(circuit: Circuit): [string, Text][] {
  const names = (list: string, parts: readonly { readonly name: Text }[] = []) =>
    parts.map((part, index): [string, Text] => [pathOf(pathOf(list, index), "name"), part.name]);
  return [
    ["name", circuit.name],
    ["description", circuit.description],
    ...(circuit.credit ? [["credit", circuit.credit] as [string, Text]] : []),
    ...names("leds", circuit.leds),
    ...names("buttons", circuit.buttons),
    ...(isSupplied(circuit) ? [] : names("buzzers", circuit.buzzers)),
    ...circuit.steps.flatMap((step, index): [string, Text][] => [
      [pathOf(pathOf("steps", index), "title"), step.title],
      ...(step.note ? [[pathOf(pathOf("steps", index), "note"), step.note] as [string, Text]] : []),
    ]),
    ...(isSupplied(circuit) ? [] : [["script", circuit.script] as [string, Text]]),
    ["test", circuit.test],
  ];
}

/** A circuit's languages: the languages of its name (ADR 0010), in the engine's order. */
export const languagesOf = (circuit: Circuit): Language[] =>
  LANGUAGES.filter((language) => circuit.name[language] !== undefined);

/** Every text not in exactly the circuit's languages (ADR 0010). */
export function languageProblems(circuit: Circuit): FieldProblem[] {
  const languages = languagesOf(circuit);
  const problems: FieldProblem[] = [];
  for (const [path, text] of textsOf(circuit)) {
    for (const language of languages) {
      if (text[language] === undefined) {
        problems.push({ path, message: `has no \`${language}\`, which the circuit's name has` });
      }
    }
    for (const language of LANGUAGES) {
      if (text[language] !== undefined && !languages.includes(language)) {
        problems.push({
          path: pathOf(path, language),
          message: `is in a language the circuit's name is not: a circuit's languages are its name's`,
        });
      }
    }
  }
  return problems;
}

/**
 * The Cyrillic letters Unicode's list of confusables pairs with a Latin one, folded to it before a hole
 * or a pin is looked for (ADR 0011): in Russian, `а21` with a Cyrillic `а` is a whole Cyrillic word,
 * and reads as the hole `a21`.
 */
const LOOK_ALIKES: Readonly<Record<string, string>> = {
  а: "a",
  в: "b",
  с: "c",
  ԁ: "d",
  е: "e",
  һ: "h",
  і: "i",
  ј: "j",
  к: "k",
  м: "m",
  н: "h",
  о: "o",
  р: "p",
  т: "t",
  у: "y",
  х: "x",
  ԍ: "g",
  А: "A",
  В: "B",
  С: "C",
  Е: "E",
  Ԍ: "G",
  Н: "H",
  І: "I",
  Ј: "J",
  К: "K",
  М: "M",
  О: "O",
  Р: "P",
  Т: "T",
  Х: "X",
  У: "Y",
};

/** A text with every Cyrillic look-alike folded to its Latin letter. */
export const folded = (text: string): string =>
  [...text].map((character) => LOOK_ALIKES[character] ?? character).join("");

/** A hole's name as a word: `a21`, `top-19`, `2:f5`. */
const HOLE_NAME =
  /(?<![\p{L}\p{N}])(?:2:)?(?:[a-j]\d{1,2}|(?:top|bottom)[+-]\d{1,2})(?![\p{L}\p{N}])/u;

/**
 * What a step's words may not say (ADR 0006): a hole, which the engine names from the parts so that
 * a page never names one the drawing does not show, or a GPIO no part of the circuit is on.
 */
export function wordProblems(circuit: Circuit): FieldProblem[] {
  // A circuit with a supply has no pin, so every GPIO its words name is one no part is on. On a Pico,
  // a part is on the pins its components name, and on those its layout wires it to, which a part with
  // no name of its own, a ceramic capacitor's resistor, has only so (ADR 0051).
  const used = new Set(
    isSupplied(circuit)
      ? []
      : [
          ...(circuit.leds ?? []).map((led) => led.pin.gpio),
          ...(circuit.buttons ?? []).map((button) => button.pin.gpio),
          ...(circuit.buzzers ?? []).map((buzzer) => buzzer.pin.gpio),
          ...circuit.steps.flatMap((step) =>
            step.parts.flatMap((part) =>
              legsOf(part as Placed).flatMap((hole) => {
                const pin = pinOfStrip(hole);
                return HEADER_PINS.find((header) => header.number === pin)?.gpio ?? [];
              }),
            ),
          ),
        ],
  );
  const problems: FieldProblem[] = [];
  circuit.steps.forEach((step, index) => {
    for (const [key, text] of [
      ["title", step.title],
      ["note", step.note],
    ] as const) {
      for (const [language, words] of Object.entries(text ?? {})) {
        const path = pathOf(pathOf(pathOf("steps", index), key), language);
        const hole = HOLE_NAME.exec(folded(words ?? ""));
        if (hole) {
          problems.push({
            path,
            message: `names a hole, \`${hole[0]}\`: the engine names holes from the parts, so a step's words never do (ADR 0006)`,
          });
        }
        for (const [, gpio] of folded(words ?? "").matchAll(/\bGP(\d+)\b/g)) {
          if (!used.has(Number(gpio))) {
            problems.push({ path, message: `names GP${gpio}, which no part of the circuit is on` });
          }
        }
      }
    }
  });
  return problems;
}

/**
 * A number followed by a unit, which a circuit's own words never write: the engine writes every value,
 * in the page's language (ADR 0011). `3V3`, a pin's name, has no space and a digit after, and passes.
 */
const VALUE =
  /(?<![\p{L}\d])\d+(?:[.,]\d+)?\s?(?:k?Ω|к?Ом|[mм]?[AА]|[VВ]|[µμnp]F|мкФ|нФ|пФ|mm|мм|cm|см|kHz|Hz|кГц|Гц|ms|мс)(?![\p{L}\d])/u;

/** What each language's typography asks of the punctuation in a text (ADR 0011). */
function typographyProblems(language: string, words: string): string[] {
  const problems: string[] = [];
  const punctuation = /[:;?!]/g;
  for (const match of words.matchAll(punctuation)) {
    const at = match.index ?? 0;
    const before = words[at - 1] ?? "";
    const after = words[at + 1] ?? "";
    // A colon between two digits, as in a time, is not punctuation after a word.
    if (/\d/.test(before) && /\d/.test(after)) continue;
    if (language === "fr" && before !== "\u202F") {
      problems.push(
        `puts no narrow no-break space (U+202F) before \`${match[0]}\`, as French does`,
      );
    }
    if (language !== "fr" && /\s/.test(before)) {
      problems.push(
        `puts a space before \`${match[0]}\`, which ${language === "ru" ? "Russian" : "English"} does not`,
      );
    }
  }
  if (language === "fr") {
    if (/«(?!\u202F)/.test(words) || /(?<!\u202F)»/.test(words)) {
      problems.push("puts no narrow no-break space (U+202F) inside `« »`, as French does");
    }
  }
  if ((language === "fr" || language === "ru") && words.includes('"')) {
    problems.push("writes straight quotes, where it writes `« »`");
  }
  return [...new Set(problems)];
}

/**
 * Every rule ADR 0011 holds a circuit's words to that a test can check: NFC, one script to a word, no
 * value written out, and each language's typography. The script is code, and only NFC applies to it.
 */
export function writingProblems(circuit: Circuit): FieldProblem[] {
  const problems: FieldProblem[] = [];
  for (const [path, text] of textsOf(circuit)) {
    for (const [language, words] of Object.entries(text)) {
      if (words === undefined) continue;
      const at = pathOf(path, language);
      if (words.normalize("NFC") !== words) {
        problems.push({
          path: at,
          message:
            "is not written in Unicode's NFC form: write each letter composed, and the ohm sign as Ω (U+03A9) (ADR 0011)",
        });
      }
      if (path === "script") continue;
      const said = (message: string) =>
        problems.push({ path: at, message: `${message} (ADR 0011)` });
      if (language === "ru") {
        const mixed = words.match(
          /\p{L}*(?:\p{Script=Latin}\p{L}*\p{Script=Cyrillic}|\p{Script=Cyrillic}\p{L}*\p{Script=Latin})\p{L}*/u,
        );
        if (mixed) said(`mixes Latin and Cyrillic letters in one word, \`${mixed[0]}\``);
      } else {
        const cyrillic = words.match(/\p{Script=Cyrillic}/u);
        if (cyrillic)
          said(
            `has a Cyrillic letter, \`${cyrillic[0]}\`, in ${language === "fr" ? "French" : "English"}`,
          );
      }
      const value = VALUE.exec(words);
      if (value)
        said(
          `writes a value, \`${value[0]}\`: the engine writes every value, in the page's language`,
        );
      for (const message of typographyProblems(language, words)) said(message);
    }
  }
  return problems;
}

/** A character as a person can find it: itself, and its code point. */
const named = (character: string): string =>
  `\`${character}\` (U+${(character.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")})`;

/**
 * Every character a circuit's words hold that Nunito's files lack (ADR 0012), which the page would
 * draw in another font, at another width. The script is left out: it is code, in the device's own
 * monospace. The narrow no-break space is let through, since the engine writes it as Nunito's thin
 * space.
 */
export function characterProblems(circuit: Circuit): FieldProblem[] {
  const problems: FieldProblem[] = [];
  for (const [path, text] of textsOf(circuit)) {
    if (path === "script") continue;
    for (const [language, words] of Object.entries(text)) {
      const lacking = [...new Set(words ?? "")].filter(
        (character) => character !== "\u202F" && character !== "\n" && !fileOf(character),
      );
      if (lacking.length > 0) {
        problems.push({
          path: pathOf(path, language),
          message: `has ${lacking.map(named).join(", ")}, which the page's font, Nunito, lacks: write it another way (ADR 0012)`,
        });
      }
    }
  }
  return problems;
}

/**
 * Every problem with a circuit's data but its wiring, in the order a person would fix them: its
 * format alone if that is not this engine's, then its shape, then its languages and words.
 */
export function fieldProblems(data: unknown): FieldProblem[] {
  const format = formatProblem(data);
  if (format) return [format];
  const shape = shapeProblems(data);
  if (shape.length > 0) return shape;
  const circuit = data as Circuit;
  return [
    ...(isSupplied(circuit) ? supplyLightProblems(circuit) : []),
    ...languageProblems(circuit),
    ...wordProblems(circuit),
    ...writingProblems(circuit),
    ...characterProblems(circuit),
  ];
}
