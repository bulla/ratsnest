import type { LedColour } from "../circuit";
import type { DiodeName } from "../diodes";
import type { TransistorName } from "../transistors";
import { PIN_EDGE_INSET_MM, PIN_PITCH_MM, PIN_TOP_INSET_MM, PINS_PER_SIDE } from "./geometry";

/**
 * A half-size breadboard with a Pico 2 W pushed into it (scratchpi's ADR 0082): which holes exist, which
 * of them are joined, where the Pico's pins land, and what can be plugged in. Millimetres,
 * like `geometry.ts`, because the holes are 2.54 mm apart for the same reason the Pico's
 * pins are — the one is made to take the other.
 *
 * This is the model and nothing else. `breadboard-svg.ts` draws it, and a circuit's layout
 * places parts on it (`src/circuit.ts`).
 */

export const ROWS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;
export type Row = (typeof ROWS)[number];

/** Columns 1 to 30, as a half-size board prints them. */
export const COLUMNS = 30;

/**
 * The four power rails, two along each long edge. Each one is a single strip of metal the
 * whole length of the board — a half-size board does not split them (scratchpi's ADR 0082).
 */
export const RAILS = ["top+", "top-", "bottom-", "bottom+"] as const;
export type Rail = (typeof RAILS)[number];

/**
 * Which columns a rail has holes at: groups of five with a gap between, the way the plastic
 * is moulded. The gaps are not breaks in the strip underneath.
 */
export const RAIL_COLUMNS: readonly number[] = [1, 7, 13, 19, 25].flatMap((first) =>
  Array.from({ length: 5 }, (_, i) => first + i),
);

/**
 * A hole, written as the board prints it: `a21`, or a rail and a column, `top-19`. A hole on
 * the second board, snapped onto the first one's top edge (scratchpi's ADR 0226), says so first: `2:f5`.
 */
export type Hole = string;

/** Which board a hole is on: the one the Pico is in, or the second, above it (scratchpi's ADR 0226). */
export type Board = 1 | 2;

export type HoleAt =
  | { readonly kind: "main"; readonly board: Board; readonly row: Row; readonly column: number }
  | { readonly kind: "rail"; readonly board: Board; readonly rail: Rail; readonly column: number };

const MAIN = /^([a-j])(\d{1,2})$/;
const RAIL = /^(top|bottom)([+-])(\d{1,2})$/;

/** What marks a hole as the second board's. */
const SECOND = "2:";

/** What a hole's name means, or undefined for a name no half-size board prints. */
export function parseHole(hole: Hole): HoleAt | undefined {
  const board: Board = hole.startsWith(SECOND) ? 2 : 1;
  const name = board === 2 ? hole.slice(SECOND.length) : hole;
  const main = MAIN.exec(name);
  if (main) {
    const column = Number(main[2]);
    if (column < 1 || column > COLUMNS) return undefined;
    return { kind: "main", board, row: main[1] as Row, column };
  }
  const rail = RAIL.exec(name);
  if (rail) {
    const column = Number(rail[3]);
    if (!RAIL_COLUMNS.includes(column)) return undefined;
    return { kind: "rail", board, rail: `${rail[1]}${rail[2]}` as Rail, column };
  }
  return undefined;
}

/** Whether a hole is on the second board (scratchpi's ADR 0226). */
export const isOnSecondBoard = (hole: Hole): boolean => hole.startsWith(SECOND);

/** A hole's name as its own board prints it, without saying which board: `f5` for `2:f5`. */
export const printedName = (hole: Hole): string =>
  isOnSecondBoard(hole) ? hole.slice(SECOND.length) : hole;

/** The same, for a hole that is known to exist — a layout's, once its test has passed. */
export function holeAt(hole: Hole): HoleAt {
  const at = parseHole(hole);
  if (!at) throw new Error(`No hole called ${hole} on a half-size breadboard`);
  return at;
}

/** Rows a–e are the top half and f–j the bottom; the channel runs between e and f. */
export function halfOf(row: Row): "top" | "bottom" {
  return ROWS.indexOf(row) < 5 ? "top" : "bottom";
}

/**
 * The strip of metal a hole's leg touches. Five holes of a column on one side of the
 * channel share one, and each rail is one.
 */
export function stripOf(hole: Hole): string {
  const at = holeAt(hole);
  const strip = at.kind === "rail" ? `rail ${at.rail}` : `${halfOf(at.row)} ${at.column}`;
  // The second board's strips are its own: nothing joins them to the first's but a jumper.
  return at.board === 2 ? `${SECOND}${strip}` : strip;
}

// --- Where the holes are, in millimetres from the board's top left corner. ---

const P = PIN_PITCH_MM;

/** Every row's distance from the top edge, in pitches. The channel is the gap e → f. */
const ROW_PITCHES: Record<Row, number> = {
  a: 5,
  b: 6,
  c: 7,
  d: 8,
  e: 9,
  f: 12,
  g: 13,
  h: 14,
  i: 15,
  j: 16,
};

const RAIL_PITCHES: Record<Rail, number> = {
  "top+": 1.5,
  "top-": 2.5,
  "bottom-": 18.5,
  "bottom+": 19.5,
};

export const BREADBOARD_WIDTH_MM = 33 * P;
export const BREADBOARD_HEIGHT_MM = 21 * P;
/** The middle of the channel between e and f. */
export const CHANNEL_Y_MM = 10.5 * P;

export const columnX = (column: number): number => (column + 1) * P;
export const rowY = (row: Row): number => ROW_PITCHES[row] * P;
export const railY = (rail: Rail): number => RAIL_PITCHES[rail] * P;

/**
 * Where the second board's top edge is (scratchpi's ADR 0226): a whole board above the first, whose own
 * top edge is at 0, so that its bottom edge meets the first's top edge, column over column.
 */
export const SECOND_BOARD_Y_MM = -BREADBOARD_HEIGHT_MM;

export function holeCentre(hole: Hole): { x: number; y: number } {
  const at = holeAt(hole);
  const y = at.kind === "main" ? rowY(at.row) : railY(at.rail);
  return { x: columnX(at.column), y: at.board === 2 ? SECOND_BOARD_Y_MM + y : y };
}

// --- The Pico, the same way on every circuit (scratchpi's ADR 0082). ---

/**
 * Across the channel with its USB to the left: pins 40 to 21 along row c and pins 1 to 20
 * along row h, both from column 2. The rows are seven holes apart, which is 17.78 mm —
 * exactly the distance between the Pico's two headers — and that is why a Pico fits across
 * a breadboard's channel at all. Column 2 leaves a column of holes to the left of the
 * USB end, and the right-hand end of the board free for parts.
 */
export const PICO_FIRST_COLUMN = 2;
export const PICO_ROWS = { outer: "c", inner: "h" } as const;

/** The hole a header pin is pushed into. Pin 1 is `h2`, pin 20 `h21`, pin 21 `c21`. */
export function holeOfPin(pin: number): Hole {
  if (pin < 1 || pin > PINS_PER_SIDE * 2) throw new Error(`The Pico has no pin ${pin}`);
  return pin <= PINS_PER_SIDE
    ? `h${PICO_FIRST_COLUMN + pin - 1}`
    : `c${PICO_FIRST_COLUMN + PINS_PER_SIDE * 2 - pin}`;
}

/**
 * The header pin in a hole's strip, if there is one: the pin a wire from `a19` reaches is
 * the one pushed into `c19`. Rails and the columns past the Pico have none.
 */
export function pinOfStrip(hole: Hole): number | undefined {
  const at = holeAt(hole);
  if (at.kind === "rail" || at.board === 2) return undefined;
  const offset = at.column - PICO_FIRST_COLUMN;
  if (offset < 0 || offset >= PINS_PER_SIDE) return undefined;
  return halfOf(at.row) === "bottom" ? offset + 1 : PINS_PER_SIDE * 2 - offset;
}

/**
 * Holes the Pico's own body sits over: its two rows of pins and every row between them,
 * across the twenty columns it spans. Nothing else can go in these.
 */
export function isUnderPico(hole: Hole): boolean {
  const at = holeAt(hole);
  if (at.kind === "rail" || at.board === 2) return false;
  const rows = ROWS.slice(ROWS.indexOf(PICO_ROWS.outer), ROWS.indexOf(PICO_ROWS.inner) + 1);
  return (
    rows.includes(at.row) &&
    at.column >= PICO_FIRST_COLUMN &&
    at.column < PICO_FIRST_COLUMN + PINS_PER_SIDE
  );
}

/**
 * The Pico's own drawing (`geometry.ts`) is in portrait, USB at the top. Turned a quarter
 * to the left it lies USB-left, and this is where its top left corner lands then, chosen
 * so that pin 40 is over `c2`: pin 40 is `PIN_TOP_INSET_MM` from the USB end and
 * `PIN_EDGE_INSET_MM` in from its edge.
 */
export const PICO_ORIGIN_MM = {
  x: columnX(PICO_FIRST_COLUMN) - PIN_TOP_INSET_MM,
  y: rowY(PICO_ROWS.outer) - PIN_EDGE_INSET_MM,
} as const;

/**
 * The holes a supply's leads go in, on a circuit with no Pico (ADR 0032): column 1 of the pair of
 * rails it names, at the board's near end, where the Pico's USB is. The red lead goes in the + rail
 * and the black lead in the − rail.
 */
export function supplyLeadsOf(rails: "top" | "bottom"): {
  readonly plus: Hole;
  readonly minus: Hole;
} {
  return { plus: `${rails}+1`, minus: `${rails}-1` };
}

// --- What can be plugged in. ---

/** What a jumper is for, which is also its colour: black, red and yellow. */
export type WireRole = "ground" | "power" | "signal";

export type Part =
  | {
      readonly kind: "wire";
      readonly from: Hole;
      readonly to: Hole;
      readonly role: WireRole;
      /**
       * A long flexible jumper that arches over the board rather than lying flat on it, for a
       * hole no flat jumper can reach without lying over a hole in use (scratchpi's ADR 0166). It joins the
       * same strips; only the drawing and the words differ.
       */
      readonly arch?: true;
    }
  | { readonly kind: "resistor"; readonly ohms: number; readonly from: Hole; readonly to: Hole }
  /** A 5 mm LED, standing up. `led` is the light's id in its circuit. */
  | { readonly kind: "led"; readonly led: string; readonly anode: Hole; readonly cathode: Hole }
  /**
   * A four-legged 6 mm tactile button, its legs in two columns two apart and two rows three
   * apart. Across the channel, as every button is but Four buttons' up and down (scratchpi's ADR 0154), its
   * rows are e and f, and `rows` is left out. The legs three rows apart are always joined;
   * pressing it joins one column to the other (scratchpi's ADR 0082).
   */
  | {
      readonly kind: "button";
      readonly button: string;
      readonly columns: readonly [number, number];
      /**
       * The rows its legs are in, when it sits on one half of the board rather than across the
       * channel: a and d or b and e above it, f and i or g and j below. Both legs of a column
       * are then in one strip, and the holes between them are under its body.
       */
      readonly rows?: ButtonRows;
      /** `2` when it is on the second board (ADR 0028), whose holes its legs are then in. */
      readonly board?: 2;
    }
  /** A passive buzzer, standing up, its legs three holes apart. */
  | { readonly kind: "buzzer"; readonly buzzer: string; readonly plus: Hole; readonly minus: Hole }
  /**
   * A 10 mm addressable RGB LED, standing up (scratchpi's ADR 0222), its four legs side by side in one row
   * in the order they are numbered: +5 V, data out, ground, data in. Data out is the longest leg,
   * and with one LED it joins nothing.
   */
  | {
      readonly kind: "rgbLed";
      readonly led: string;
      readonly power: Hole;
      readonly dataOut: Hole;
      readonly ground: Hole;
      readonly dataIn: Hole;
    }
  /**
   * The ring of twelve addressable RGB LEDs (scratchpi's ADR 0234), standing up by its header of four pins
   * in one row (scratchpi's ADR 0238): data in, 5 V, ground and data out, as its back names them. Data out
   * joins nothing, as the RGB LED's does.
   */
  | {
      readonly kind: "ring";
      readonly led: string;
      readonly dataIn: Hole;
      readonly power: Hole;
      readonly ground: Hole;
      readonly dataOut: Hole;
    }
  /**
   * An electrolytic capacitor, standing up, its legs side by side in one row (ADR 0043): its value in
   * microfarads, its + leg the longer, and its − leg under the stripe down its can.
   */
  | {
      readonly kind: "electrolytic";
      readonly microfarads: number;
      readonly plus: Hole;
      readonly minus: Hole;
    }
  /**
   * A transistor in a TO-92 case, standing up, its legs side by side in one row (ADR 0044): emitter,
   * base and collector, left to right, its flat face towards row j. Its model is one ratsnest knows.
   */
  | {
      readonly kind: "transistor";
      readonly model: TransistorName;
      readonly emitter: Hole;
      readonly base: Hole;
      readonly collector: Hole;
    }
  /**
   * A diode, lying flat as a resistor does (ADR 0049): its model one ratsnest knows, and its cathode
   * the end its band is at.
   */
  | {
      readonly kind: "diode";
      readonly model: DiodeName;
      readonly anode: Hole;
      readonly cathode: Hole;
    }
  /**
   * A ceramic capacitor, a disc standing on its legs, one hole apart in one row (ADR 0051): its value
   * in nanofarads, printed on it. It goes in either way round.
   */
  | {
      readonly kind: "ceramic";
      readonly nanofarads: number;
      readonly from: Hole;
      readonly to: Hole;
    }
  /**
   * An SPDT slide switch, standing on its three legs side by side in one row (ADR 0052): its middle
   * leg is joined to its left one or its right one, whichever way its slide is pushed.
   */
  | {
      readonly kind: "slideSwitch";
      readonly left: Hole;
      readonly middle: Hole;
      readonly right: Hole;
    }
  /**
   * A slide potentiometer, lying across both breadboards (ADR 0053): its value in ohms, its wiper and
   * the end beside it two holes apart in one row, and its other end in line with that end, 17 rows
   * further along it, on the other board.
   */
  | {
      readonly kind: "slidePotentiometer";
      readonly ohms: number;
      readonly wiper: Hole;
      readonly end: Hole;
      readonly otherEnd: Hole;
    }
  /**
   * A DIP switch across the channel, its legs in rows e and f (ADR 0054): `switches` of them side by
   * side, switch 1 in `column` and the rest to its right, its ON side towards row a. Each switch
   * joins its leg in row e to its leg in row f while it is on.
   */
  | {
      readonly kind: "dipSwitch";
      readonly switches: number;
      readonly column: number;
      /** `2` puts it on the second breadboard, as a button can be (ADR 0028). */
      readonly board?: 2;
    }
  /**
   * An LED bar graph across the channel, its legs in rows e and f (ADR 0058): `segments` of them side
   * by side, segment 1 in `column` and the rest to its right, each an LED of `colour`, its anode in
   * row f and its cathode in row e.
   */
  | {
      readonly kind: "barGraph";
      readonly segments: number;
      readonly colour: LedColour;
      readonly column: number;
      /** `2` puts it on the second breadboard, as a button can be (ADR 0028). */
      readonly board?: 2;
    }
  /**
   * A bussed resistor array standing in one row (ADR 0059): its common leg, marked with a dot, in
   * `common`, and one leg for each of its `resistors` to its right, a hole apart, each resistor of
   * `ohms` between its own leg and the common one.
   */
  | {
      readonly kind: "resistorArray";
      readonly ohms: number;
      readonly resistors: number;
      readonly common: Hole;
    }
  /**
   * A PIR motion sensor module (ADR 0055), lying beside the board and joined to it by three
   * female-to-male jumpers on its VCC, OUT and GND pins: these are the holes their other ends go
   * in, all on one side of the channel, past which it is drawn (ADR 0056).
   */
  | {
      readonly kind: "pir";
      /** What the page calls it, in its language: every part outside the board is named (ADR 0057). */
      readonly name: string;
      readonly power: Hole;
      readonly output: Hole;
      readonly ground: Hole;
    };

/** The rows a button's legs can be in: across the channel, or on one half of the board. */
export type ButtonRows =
  | readonly ["e", "f"]
  | readonly ["a", "d"]
  | readonly ["b", "e"]
  | readonly ["f", "i"]
  | readonly ["g", "j"];

/** Across the channel, as a button is unless it says otherwise. */
export const ACROSS_THE_CHANNEL: ButtonRows = ["e", "f"];

/** A button's rows. */
export const rowsOf = (part: { readonly rows?: ButtonRows }): ButtonRows =>
  part.rows ?? ACROSS_THE_CHANNEL;

/** Where a button sits: across the channel, or above or below it on one half of the board. */
export function placementOf(part: { readonly rows?: ButtonRows }): "across" | "above" | "below" {
  const [first, second] = rowsOf(part);
  if (halfOf(first) !== halfOf(second)) return "across";
  return halfOf(first) === "top" ? "above" : "below";
}

/**
 * The hole of a button's at a row and a column, on the board it is on (ADR 0028): every hole a button
 * has is made here.
 */
export const buttonHole = (part: { readonly board?: 2 }, row: Row, column: number): Hole =>
  `${part.board === 2 ? SECOND : ""}${row}${column}`;

/**
 * The holes under a button's body, which nothing else can go in: every row between its legs,
 * across its three columns. None, across the channel, where the channel is what is between.
 */
export function coveredBy(part: Extract<Part, { kind: "button" }>): Hole[] {
  const [first, second] = rowsOf(part);
  const between = ROWS.slice(ROWS.indexOf(first) + 1, ROWS.indexOf(second));
  const [left] = part.columns;
  return between.flatMap((row) =>
    [left, left + 1, left + 2].map((column) => buttonHole(part, row, column)),
  );
}

/** Every hole a part has a leg (or a wire an end) in. */
export function legsOf(part: Part): readonly Hole[] {
  switch (part.kind) {
    case "wire":
    case "resistor":
    case "ceramic":
      return [part.from, part.to];
    case "led":
    case "diode":
      return [part.anode, part.cathode];
    case "button": {
      const rows = rowsOf(part);
      return part.columns.flatMap((column) => rows.map((row) => buttonHole(part, row, column)));
    }
    case "buzzer":
    case "electrolytic":
      return [part.plus, part.minus];
    case "rgbLed":
      return [part.power, part.dataOut, part.ground, part.dataIn];
    case "transistor":
      return [part.emitter, part.base, part.collector];
    case "slideSwitch":
      return [part.left, part.middle, part.right];
    case "slidePotentiometer":
      return [part.wiper, part.end, part.otherEnd];
    case "dipSwitch":
      return dipLegsOf(part).flat();
    case "barGraph":
      return barGraphLegsOf(part).flat();
    case "resistorArray":
      return resistorArrayLegsOf(part);
    case "ring":
      return [part.dataIn, part.power, part.ground, part.dataOut];
    case "pir":
      return [part.power, part.output, part.ground];
  }
}

/**
 * The side of the channel a hole is on: rows a to e and the top rails, or rows f to j and the bottom
 * rails. A part on jumpers lies past that side's edge (ADR 0056).
 */
export function sideOf(hole: Hole): "top" | "bottom" {
  const at = holeAt(hole);
  return at.kind === "rail" ? (at.rail.startsWith("top") ? "top" : "bottom") : halfOf(at.row);
}

/** The fewest and the most switches a DIP switch can have side by side (ADR 0054). */
export const DIP_SWITCHES = [2, 8] as const;

/**
 * A DIP switch's legs, switch by switch from switch 1: each switch's leg in row e, above the
 * channel, and its leg in row f, below it, on the board it is on.
 */
export function dipLegsOf(part: {
  readonly switches: number;
  readonly column: number;
  readonly board?: 2;
}): [Hole, Hole][] {
  return Array.from({ length: part.switches }, (_, k) => [
    buttonHole(part, "e", part.column + k),
    buttonHole(part, "f", part.column + k),
  ]);
}

/** The fewest and the most segments an LED bar graph can have side by side (ADR 0058). */
export const BAR_GRAPH_SEGMENTS = [2, 10] as const;

/**
 * A bar graph's legs, segment by segment from segment 1: each segment's anode in row f, below the
 * channel, and its cathode in row e, above it, on the board it is on.
 */
export function barGraphLegsOf(part: {
  readonly segments: number;
  readonly column: number;
  readonly board?: 2;
}): [Hole, Hole][] {
  return Array.from({ length: part.segments }, (_, k) => [
    buttonHole(part, "f", part.column + k),
    buttonHole(part, "e", part.column + k),
  ]);
}

/** The fewest and the most resistors a resistor array can have (ADR 0059). */
export const RESISTOR_ARRAY_RESISTORS = [2, 10] as const;

/**
 * A resistor array's legs, its common leg first and then each resistor's, a hole apart to its right,
 * in its common leg's row. A common leg in no row has no others.
 */
export function resistorArrayLegsOf(part: {
  readonly resistors: number;
  readonly common: Hole;
}): Hole[] {
  const at = parseHole(part.common);
  if (at?.kind !== "main") return [part.common];
  const board = at.board === 2 ? SECOND : "";
  return Array.from({ length: part.resistors + 1 }, (_, k) => `${board}${at.row}${at.column + k}`);
}

/**
 * How far a slide potentiometer's legs are apart along it, from the end beside its wiper to its other
 * end (ADR 0053): 17 rows, 43.18 mm, which no one board's rows reach, so it lies across both.
 */
export const SLIDE_POTENTIOMETER_LENGTH_MM = 17 * P;

/** How far a slide potentiometer's body reaches past its legs' columns, and short of their rows. */
export const SLIDE_POTENTIOMETER_BODY_MM = { side: 1.7, inset: 1.3 } as const;

/**
 * The box a slide potentiometer's body lies over, between its legs: from the end beside its wiper to
 * its other end, across the columns of its end and its wiper.
 */
export function slidePotentiometerBoxOf(part: Extract<Part, { kind: "slidePotentiometer" }>): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const [wiper, end, other] = [part.wiper, part.end, part.otherEnd].map(holeCentre) as [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
  ];
  const left = Math.min(wiper.x, end.x) - SLIDE_POTENTIOMETER_BODY_MM.side;
  const right = Math.max(wiper.x, end.x) + SLIDE_POTENTIOMETER_BODY_MM.side;
  const top = Math.min(end.y, other.y) + SLIDE_POTENTIOMETER_BODY_MM.inset;
  const bottom = Math.max(end.y, other.y) - SLIDE_POTENTIOMETER_BODY_MM.inset;
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/**
 * The holes a slide potentiometer's body lies over, which nothing else can go in: every hole of
 * either board, rails among them, whose middle is under it.
 */
export function coveredBySlidePotentiometer(
  part: Extract<Part, { kind: "slidePotentiometer" }>,
): Hole[] {
  const box = slidePotentiometerBoxOf(part);
  const holes: Hole[] = [];
  for (const board of ["", SECOND]) {
    for (let column = 1; column <= COLUMNS; column++) {
      const names = [
        ...ROWS.map((row) => `${row}${column}`),
        ...(RAIL_COLUMNS.includes(column)
          ? ["top+", "top-", "bottom-", "bottom+"].map((rail) => `${rail}${column}`)
          : []),
      ];
      for (const name of names) {
        const { x, y } = holeCentre(`${board}${name}`);
        if (x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h) {
          holes.push(`${board}${name}`);
        }
      }
    }
  }
  return holes;
}

/** Whether anything in a layout is on the second board, which the drawing then draws too. */
export const usesSecondBoard = (parts: readonly Part[]): boolean =>
  parts.some((part) => legsOf(part).some(isOnSecondBoard));
