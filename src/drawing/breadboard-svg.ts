import type { ButtonColour, LedColour } from "../circuit";
import { DIODES } from "../diodes";
import { widthOf } from "../fonts";
import { isStanding, type Orientation, turned } from "../orientation";
import { PIE_WEDGES, wedgePath } from "../rgb";
import { TRANSISTORS, type TransistorLeg } from "../transistors";
import {
  BREADBOARD_HEIGHT_MM,
  BREADBOARD_WIDTH_MM,
  buttonHole,
  CHANNEL_Y_MM,
  COLUMNS,
  columnX,
  type Hole,
  holeAt,
  holeCentre,
  holeOfPin,
  isOnSecondBoard,
  legsOf,
  type Part,
  PICO_ORIGIN_MM,
  pinOfStrip,
  printedName,
  RAIL_COLUMNS,
  RAILS,
  type Rail,
  ROWS,
  type Row,
  railY,
  rowsOf,
  rowY,
  SECOND_BOARD_Y_MM,
  supplyLeadsOf,
  usesSecondBoard,
  type WireRole,
} from "./breadboard";
import { CHIP_STYLES, chipFill, chipInk } from "./chips";
import {
  BLUE_PARTS,
  BOARD_LENGTH_MM,
  BOARD_WIDTH_MM,
  BOOTSEL,
  CHIP,
  COMPONENTS,
  CRYSTAL,
  DEBUG,
  DEBUG_FIRST_PIN_X_MM,
  DEBUG_HOLE_RADIUS_MM,
  DEBUG_PINS,
  HEADER_PINS,
  MOUNTING_HOLE,
  ONBOARD_LED,
  PAD,
  PIN_PITCH_MM,
  RADIO,
  USB,
  USB_MOUTH,
} from "./geometry";
import { onCircle, RING_MM, ringAngleOf, ringBoardPath } from "./ring";

/**
 * A circuit on a breadboard, drawn the way Fritzing's breadboard view draws one (scratchpi's ADR 0082):
 * the board seen from above, parts standing up out of it, jumpers laid across it. It is
 * markup rather than a component because it is drawn once, at build time, into a static
 * page (scratchpi's ADR 0081) — there is nothing reactive about a wiring diagram.
 *
 * Everything here is an object, so every colour is one of the pinned tokens and none of
 * them is `surface` or `ink`. The labels beside the board are the one thing that belongs to
 * the page rather than to the objects, so they carry classes and no colour, and the page
 * colours them in its own scale.
 */

export interface DrawnPart {
  readonly part: Part;
  /** Which of the page's steps it belongs to, so a step can pick out its own parts. */
  readonly group: string;
  /** A label in the margin, for the parts an adult has to tell apart. */
  readonly label?: { readonly title: string; readonly detail: string };
}

/**
 * What powers a circuit with no Pico (ADR 0032), drawn as one small cell beside the board's near end,
 * its leads in column 1 of the rails it names.
 */
export interface DrawnSupply {
  readonly rails: "top" | "bottom";
  /** Its voltage, as the page's language writes it: `4.5 V`, `4,5 V`, `4,5 В`. */
  readonly label: string;
  /** Which of the page's steps it belongs to. */
  readonly group: string;
}

/** A header pin's name, printed on the Pico beside it, for a pin the circuit uses. */
export interface PinTag {
  readonly pin: number;
  readonly group: string;
}

export interface Breadboard {
  /** The quarter turn it is drawn at, 0 by default: the USB on the left (ADR 0003). */
  readonly orientation?: Orientation;
  /** How a value in ohms is said in the page's language, English by default (ADR 0011). */
  readonly ohms?: (value: number) => string;
  readonly parts: readonly DrawnPart[];
  readonly tags: readonly PinTag[];
  /** The supply a circuit has in the Pico's place, which is then not drawn (ADR 0032). */
  readonly supply?: DrawnSupply;
  /** The colour of a circuit's light, by its id. */
  readonly ledColour: (led: string) => LedColour;
  /** The colour of a button's cap, by its id (scratchpi's ADR 0174). */
  readonly buttonColour: (button: string) => ButtonColour;
  /** What a screen reader says the picture is. */
  readonly title: string;
  readonly description: string;
}

/** The group the Pico and its cable are drawn in. */
export const PICO_GROUP = "pico";

const token = (name: string) => `var(--color-${name})`;

/** The colours of a supply's cell (ADR 0032): a silver pouch, its edge, its ink and its tape. */
export const SUPPLY_TOKENS = {
  body: "cell",
  panel: "cell-panel",
  edge: "cell-edge",
  ink: "cell-ink",
  tape: "cell-tape",
} as const;

/**
 * The colours of an electrolytic capacitor (ADR 0043): its can's sleeve, the pale stripe down its −
 * side, the value printed on the sleeve, and the minus signs printed on the stripe.
 */
export const ELECTROLYTIC_TOKENS = {
  sleeve: "capacitor",
  stripe: "capacitor-stripe",
  ink: "capacitor-ink",
  stripeInk: "capacitor-stripe-ink",
} as const;

/** The colours of a transistor's TO-92 case, and of what is printed on its flat face (ADR 0044). */
export const TRANSISTOR_TOKENS = { body: "transistor", ink: "transistor-ink" } as const;

/**
 * The colours of a diode's case and of the band at its cathode (ADR 0049): orange glass with a black
 * band, as a signal diode's is, and black with a grey band, as a rectifier's is.
 */
export const DIODE_TOKENS = {
  glass: "diode-glass",
  glassBand: "diode-glass-band",
  black: "diode-black",
  blackBand: "diode-black-band",
} as const;

/** Every `--color-*` the drawing reads, so the token tests can hold them still. */
export const BREADBOARD_TOKENS: readonly string[] = [
  ...Object.values(SUPPLY_TOKENS),
  ...Object.values(ELECTROLYTIC_TOKENS),
  ...Object.values(TRANSISTOR_TOKENS),
  ...Object.values(DIODE_TOKENS),
  "breadboard",
  "breadboard-edge",
  "breadboard-hole",
  "breadboard-groove",
  "breadboard-print",
  "rail-plus",
  "rail-minus",
  "lead",
  "wire-ground",
  "wire-power",
  "wire-signal",
  "resistor",
  "resistor-edge",
  ...Array.from({ length: 10 }, (_, digit) => `band-${digit}`),
  "band-gold",
  "shine",
  "shade",
];

const WIRE_TOKEN: Record<WireRole, string> = {
  ground: "wire-ground",
  power: "wire-power",
  signal: "wire-signal",
};

const RAIL_TOKEN: Record<Rail, string> = {
  "top+": "rail-plus",
  "top-": "rail-minus",
  "bottom-": "rail-minus",
  "bottom+": "rail-plus",
};

/** Three decimals is a micrometre, which is finer than anything here is measured to. */
const n = (value: number): number => Math.round(value * 1000) / 1000;

const escaped = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function rect(x: number, y: number, w: number, h: number, attributes: string): string {
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" ${attributes}/>`;
}

function circle(cx: number, cy: number, r: number, attributes: string): string {
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" ${attributes}/>`;
}

function line(x1: number, y1: number, x2: number, y2: number, attributes: string): string {
  return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${attributes}/>`;
}

function text(x: number, y: number, body: string, attributes: string): string {
  return `<text x="${n(x)}" y="${n(y)}" text-anchor="middle" dominant-baseline="central" ${attributes}>${escaped(body)}</text>`;
}

/**
 * The quarter turn the drawing is being made at (ADR 0003). Everything is drawn in the board's own
 * millimetres, as at 0°, inside one group turned by it; each word is turned back about its own point,
 * so that it stays upright. Set for the length of `drawBreadboard`, and 0 otherwise.
 */
let turn: Orientation = 0;

/**
 * How the page says a value in ohms, in its own language (ADR 0011): `4.7 kΩ`, `4,7 kΩ`, `4,7 кОм`.
 * Set for the length of `drawBreadboard` and `crowdingProblems`, and English otherwise.
 */
let sayOhms: (value: number) => string = (value) => formatOhms(value);

/**
 * Whether the Pico is on the board, as it is unless a circuit has a supply in its place (ADR 0032):
 * a value tag keeps off it only when it is there. Set for the length of `drawBreadboard` and
 * `crowdingProblems`, and true otherwise.
 */
let pico = true;

/** What turns an element back about a point, so that it stands upright on the page. */
const upright = (x: number, y: number): string =>
  turn === 0 ? "" : ` transform="rotate(${-turn} ${n(x)} ${n(y)})"`;

/** A word on its own, drawn upright whichever way the board is turned. */
function word(x: number, y: number, body: string, attributes: string): string {
  return turn === 0
    ? text(x, y, body, attributes)
    : `<g${upright(x, y)}>${text(x, y, body, attributes)}</g>`;
}

// --- The resistor colour code, which the parts list prints as well as the drawing. ---

/** The names of the colour code's ten digits, black for 0 to white for 9. */
export const BAND_NAMES = [
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

/** A band, as its token's suffix: a digit, or the gold tolerance band. */
export type Band = `${number}` | "gold";

export const bandName = (band: Band): string =>
  band === "gold" ? "gold" : (BAND_NAMES[Number(band)] ?? band);

/**
 * A value's bands. Four-band is digit, digit, how many zeros, and gold for 5% — which is
 * what most kits' beige resistors are. Five-band is three digits, the zeros, and brown for
 * 1% — the blue metal-film ones. Two significant digits, which is every value in the E12
 * series a kit's resistors come from, and whole ohms from 100 up: below that the
 * multiplier band goes gold or silver and is not drawn.
 */
export function resistorBands(ohms: number): { four: Band[]; five: Band[] } {
  if (!Number.isInteger(ohms) || ohms < 100) {
    throw new Error(`${ohms} Ω needs a fractional multiplier band, which is not drawn`);
  }
  const digits = String(ohms);
  const [first = "0", second = "0", third = "0"] = digits;
  if (/[1-9]/.test(digits.slice(2))) throw new Error(`${ohms} Ω has a third significant digit`);
  return {
    four: [first, second, String(digits.length - 2), "gold"] as Band[],
    five: [first, second, third, String(digits.length - 3), "1"] as Band[],
  };
}

/** `330 Ω`, `10 kΩ`, `4.7 kΩ` — the way the value is printed on the bag it came in. */
export function formatOhms(ohms: number): string {
  if (ohms >= 1_000_000) return `${ohms / 1_000_000} MΩ`;
  if (ohms >= 1000) return `${ohms / 1000} kΩ`;
  return `${ohms} Ω`;
}

/**
 * `470 µF`, `0.47 µF`: a capacitor's value as its can prints it, which the drawing prints the same in
 * every language (ADR 0040).
 */
export function formatMicrofarads(microfarads: number): string {
  return `${microfarads} µF`;
}

// --- The board itself. ---

function holeSquare(x: number, y: number): string {
  return rect(x - 0.52, y - 0.52, 1.04, 1.04, `rx="0.16" fill="${token("breadboard-hole")}"`);
}

/**
 * One half-size board, its top edge `top` down the drawing: 0 for the board the Pico is in,
 * and `SECOND_BOARD_Y_MM` for the second, snapped onto the first one's top edge (scratchpi's ADR 0226).
 */
function drawPlastic(top = 0): string {
  const out: string[] = [];
  const w = BREADBOARD_WIDTH_MM;
  out.push(
    rect(
      0,
      0,
      w,
      BREADBOARD_HEIGHT_MM,
      `rx="1.4" fill="${token("breadboard")}" stroke="${token("breadboard-edge")}" stroke-width="0.35"`,
    ),
  );
  out.push(
    rect(0.8, CHANNEL_Y_MM - 0.85, w - 1.6, 1.7, `rx="0.5" fill="${token("breadboard-groove")}"`),
  );

  // The coloured strip runs along the outside of each pair of rails.
  const strip = (y: number, rail: Rail) =>
    line(
      1.4 * PIN_PITCH_MM,
      y,
      31.6 * PIN_PITCH_MM,
      y,
      `stroke="${token(RAIL_TOKEN[rail])}" stroke-width="0.4"`,
    );
  out.push(
    strip(railY("top+") - 1.65, "top+"),
    strip(railY("top-") + 1.65, "top-"),
    strip(railY("bottom-") - 1.65, "bottom-"),
    strip(railY("bottom+") + 1.65, "bottom+"),
  );

  for (const row of ROWS)
    for (let column = 1; column <= COLUMNS; column++)
      out.push(holeSquare(columnX(column), rowY(row)));
  for (const rail of RAILS)
    for (const column of RAIL_COLUMNS) out.push(holeSquare(columnX(column), railY(rail)));

  const print = `font-size="1.5" fill="${token("breadboard-print")}"`;
  const leftX = 0.85 * PIN_PITCH_MM;
  const rightX = w - leftX;
  for (const row of ROWS) {
    out.push(word(leftX, rowY(row), row, print), word(rightX, rowY(row), row, print));
  }
  for (const column of NUMBERED_COLUMNS) {
    out.push(word(columnX(column), NUMBER_Y_TOP, String(column), print));
    out.push(word(columnX(column), NUMBER_Y_BOTTOM, String(column), print));
  }
  for (const rail of RAILS) {
    const sign = rail.endsWith("+") ? "+" : "−";
    const attributes = `font-size="2" font-weight="700" fill="${token(RAIL_TOKEN[rail])}"`;
    out.push(
      word(leftX, railY(rail), sign, attributes),
      word(rightX, railY(rail), sign, attributes),
    );
  }
  const placed = top === 0 ? "" : ` transform="translate(0 ${n(top)})"`;
  return `<g class="breadboard"${placed}>${out.join("")}</g>`;
}

// --- The Pico, from the datasheet's measurements, as scratchpi's simulator drew it. ---

const MATERIAL_TOKEN = { pad: "board-pad", chip: "board-chip", metal: "board-metal" } as const;

function drawPico(): string {
  const { x: ox, y: oy } = PICO_ORIGIN_MM;
  const out: string[] = [];

  // The cable, leaving to the left, and its plug in the socket.
  const usbY = oy + BOARD_WIDTH_MM - (USB.x + USB.width / 2);
  out.push(line(-20, usbY, ox - 12, usbY, `stroke="${token("board-chip")}" stroke-width="2.6"`));
  out.push(rect(ox - 13, usbY - 2.9, 10.2, 5.8, `rx="1" fill="${token("board-chip")}"`));
  out.push(rect(ox - 3.2, usbY - 2.1, 1.6, 4.2, `fill="${token("board-metal")}"`));
  out.push(
    word(ox - 7.9, usbY, "USB", `font-size="1.6" font-weight="700" fill="${token("board-silk")}"`),
  );

  // Everything else is in the portrait millimetres of `geometry.ts`, turned a quarter to
  // the left: (x, y) lands at (y, BOARD_WIDTH_MM − x).
  const board: string[] = [];
  board.push(rect(0, 0, BOARD_WIDTH_MM, BOARD_LENGTH_MM, `rx="0.7" fill="${token("board")}"`));
  board.push(
    rect(
      USB.x,
      USB.y,
      USB.width,
      USB.height,
      `rx="0.35" fill="${token("board-metal")}" stroke="${token("lead")}" stroke-width="0.2"`,
    ),
  );
  board.push(
    rect(
      USB_MOUTH.x,
      USB_MOUTH.y,
      USB_MOUTH.width,
      USB_MOUTH.height,
      `fill="${token("board-chip")}"`,
    ),
  );
  for (const part of COMPONENTS) {
    board.push(
      rect(
        part.x,
        part.y,
        part.width,
        part.height,
        `rx="0.08" fill="${token(MATERIAL_TOKEN[part.material])}"`,
      ),
    );
  }
  for (const part of BLUE_PARTS) {
    board.push(rect(part.x, part.y, part.width, part.height, `fill="${token("board-blue")}"`));
  }
  board.push(
    rect(
      ONBOARD_LED.x,
      ONBOARD_LED.y,
      ONBOARD_LED.width,
      ONBOARD_LED.height,
      `rx="0.1" fill="${token("board-silk")}"`,
    ),
  );
  board.push(
    rect(
      BOOTSEL.x,
      BOOTSEL.y,
      BOOTSEL.width,
      BOOTSEL.height,
      `rx="0.25" fill="${token("board-metal")}"`,
    ),
    circle(
      BOOTSEL.x + BOOTSEL.width / 2,
      BOOTSEL.y + BOOTSEL.height / 2,
      1.05,
      `fill="${token("board-silk")}" stroke="${token("lead")}" stroke-width="0.15"`,
    ),
  );
  board.push(
    rect(CHIP.x, CHIP.y, CHIP.width, CHIP.height, `rx="0.35" fill="${token("board-chip")}"`),
  );
  board.push(
    rect(
      RADIO.x,
      RADIO.y,
      RADIO.width,
      RADIO.height,
      `rx="0.45" fill="${token("board-metal")}" stroke="${token("lead")}" stroke-width="0.2"`,
    ),
  );
  board.push(
    rect(
      CRYSTAL.x,
      CRYSTAL.y,
      CRYSTAL.width,
      CRYSTAL.height,
      `rx="0.2" fill="${token("board-metal")}"`,
    ),
  );
  board.push(
    rect(
      DEBUG.x,
      DEBUG.y,
      DEBUG.width,
      DEBUG.height,
      `rx="0.2" fill="none" stroke="${token("board-silk")}" stroke-width="0.18"`,
    ),
  );
  for (let i = 0; i < DEBUG_PINS; i++) {
    const cx = DEBUG_FIRST_PIN_X_MM + i * PIN_PITCH_MM;
    const cy = DEBUG.y + DEBUG.height / 2;
    board.push(circle(cx, cy, 0.72, `fill="${token("board-pad")}"`));
    board.push(circle(cx, cy, DEBUG_HOLE_RADIUS_MM, `fill="${token("breadboard")}"`));
  }
  // Holes right through the board show the breadboard it is lying on.
  for (const [cx, cy] of [
    [MOUNTING_HOLE.insetX, MOUNTING_HOLE.insetY],
    [BOARD_WIDTH_MM - MOUNTING_HOLE.insetX, MOUNTING_HOLE.insetY],
    [MOUNTING_HOLE.insetX, BOARD_LENGTH_MM - MOUNTING_HOLE.insetY],
    [BOARD_WIDTH_MM - MOUNTING_HOLE.insetX, BOARD_LENGTH_MM - MOUNTING_HOLE.insetY],
  ] as const) {
    board.push(circle(cx, cy, MOUNTING_HOLE.ring, `fill="${token("board-pad")}"`));
    board.push(circle(cx, cy, MOUNTING_HOLE.drill, `fill="${token("breadboard")}"`));
  }
  // The castellated pads, and the header pin soldered through each one.
  for (const pin of HEADER_PINS) {
    const padX = pin.side === "left" ? PAD.outer : BOARD_WIDTH_MM - PAD.outer - PAD.length;
    board.push(
      rect(
        padX,
        pin.y - PAD.height / 2,
        PAD.length,
        PAD.height,
        `rx="0.2" fill="${token("board-pad")}"`,
      ),
    );
    board.push(
      circle(
        pin.x,
        pin.y,
        0.8,
        `fill="${token("board-metal")}" stroke="${token("lead")}" stroke-width="0.12"`,
      ),
    );
    board.push(circle(pin.x, pin.y, 0.3, `fill="${token("lead")}"`));
  }
  out.push(
    `<g transform="translate(${n(ox)} ${n(oy + BOARD_WIDTH_MM)}) rotate(-90)">${board.join("")}</g>`,
  );

  // Silkscreen is set upright, so it is drawn after the turn rather than inside it: below the
  // button, or, on a standing board, where the upright word clears it, past it along the board.
  const bootsel = isStanding(turn)
    ? {
        x: ox + BOOTSEL.y + BOOTSEL.height + 1.25,
        y: oy + BOARD_WIDTH_MM - BOOTSEL.x - BOOTSEL.width / 2,
      }
    : { x: ox + BOOTSEL.y + BOOTSEL.height / 2, y: oy + BOARD_WIDTH_MM - BOOTSEL.x + 1.25 };
  out.push(
    word(
      bootsel.x,
      bootsel.y,
      "BOOTSEL",
      `font-size="1.05" font-weight="700" letter-spacing="0.08" fill="${token("board-silk")}"`,
    ),
  );
  return `<g class="part" data-g="${PICO_GROUP}">${out.join("")}</g>`;
}

// --- A supply, in the Pico's place (ADR 0032). ---

/** The cell's size, square enough that its voltage stands upright in it at any quarter turn. */
const CELL = { x: -12.6, w: 7.4, h: 6.4 } as const;

/**
 * A supply, drawn as one small silver pouch cell beside the board's near end, whatever gives the
 * voltage: its tape at the end its tabs are on, both leads leaving that end, the side nearer the
 * board, red into column 1 of the + rail and black into column 1 of the − rail. The cell and its
 * leads are edged, so that they read on either theme.
 */
function drawSupply(supply: DrawnSupply): string {
  const leads = supplyLeadsOf(supply.rails);
  const plus = holeCentre(leads.plus);
  const minus = holeCentre(leads.minus);
  const middle = (plus.y + minus.y) / 2;
  const y = middle - CELL.h / 2;
  const right = CELL.x + CELL.w;
  const colour = (key: keyof typeof SUPPLY_TOKENS) => token(SUPPLY_TOKENS[key]);
  const out: string[] = [
    rect(
      CELL.x,
      y,
      CELL.w,
      CELL.h,
      `rx="0.6" fill="${colour("body")}" stroke="${colour("edge")}" stroke-width="0.25"`,
    ),
    rect(
      CELL.x + 0.55,
      y + 0.55,
      CELL.w - 2.1,
      CELL.h - 1.1,
      `rx="0.35" fill="${colour("panel")}"`,
    ),
    line(
      CELL.x + 1,
      y + 0.95,
      right - 2.2,
      y + 0.95,
      `stroke="${token("shine")}" stroke-opacity="0.7" stroke-width="0.3" stroke-linecap="round"`,
    ),
    rect(right - 1.15, y + 0.12, 0.5, CELL.h - 0.24, `fill="${colour("tape")}"`),
  ];
  // Each lead leaves its tab on the side of the rail it goes to, so the two never cross.
  const toward = Math.sign(plus.y - minus.y);
  for (const [hole, role, at] of [
    [minus, "ground", middle - toward * 0.95],
    [plus, "power", middle + toward * 0.95],
  ] as const) {
    out.push(rect(right - 0.1, at - 0.45, 0.75, 0.9, `rx="0.1" fill="${token("board-metal")}"`));
    const path = `M${n(right + 0.6)} ${n(at)}C${n(right + 3.6)} ${n(at)} ${n(hole.x - 3.4)} ${n(hole.y)} ${n(hole.x)} ${n(hole.y)}`;
    out.push(
      `<path d="${path}" fill="none" stroke="${colour("edge")}" stroke-width="0.95" stroke-linecap="round"/>`,
      `<path d="${path}" fill="none" stroke="${token(WIRE_TOKEN[role])}" stroke-width="0.7" stroke-linecap="round"/>`,
      circle(hole.x, hole.y, 0.42, `fill="${token("lead")}"`),
    );
  }
  out.push(
    word(
      CELL.x + 0.55 + (CELL.w - 2.1) / 2,
      middle,
      supply.label,
      `font-size="1.75" font-weight="800" fill="${colour("ink")}"`,
    ),
  );
  return `<g class="part" data-g="${supply.group}" data-kind="supply">${out.join("")}</g>`;
}

/** How tall a pin's tag is, and how far a second row of them sits from the first. */
const TAG_CHIP_HEIGHT_MM = 1.95;
const TAG_ROW_MM = TAG_CHIP_HEIGHT_MM + 0.3;

/** A pin's tag's width: its label's as Nunito draws it, and a little either side (ADR 0012). */
const tagChipWidthOf = (label: string): number => widthOf(label, 1.35, 800) + 1.2;

/**
 * Which row each tag goes in: the first, against its header, unless that would put it on a
 * neighbour's, in which case the next one in. RGB LED's page is the first to tag three pins
 * so close that two would meet, VBUS, GND and 3V3(OUT) at the top left (scratchpi's ADR 0226); every
 * earlier page's tags are all in the first row.
 */
export function tagRows(tags: readonly PinTag[]): Map<PinTag, number> {
  const rows = new Map<PinTag, number>();
  const ends = new Map<string, number>();
  const placed = tags
    .map((tag) => {
      const pin = HEADER_PINS.find((header) => header.number === tag.pin);
      if (!pin) throw new Error(`The Pico has no pin ${tag.pin}`);
      const { x } = holeCentre(holeOfPin(pin.number));
      // Along the header, an upright chip on a standing board is as long as it is tall.
      const along = isStanding(turn) ? TAG_CHIP_HEIGHT_MM : tagChipWidthOf(pin.label);
      return { tag, side: pin.side, x, half: along / 2 };
    })
    .sort((a, b) => a.x - b.x);
  for (const { tag, side, x, half } of placed) {
    let row = 0;
    while ((ends.get(`${side} ${row}`) ?? Number.NEGATIVE_INFINITY) > x - half - 0.2) row += 1;
    ends.set(`${side} ${row}`, x + half);
    rows.set(tag, row);
  }
  return rows;
}

/** A pin's name on a chip beside it, in the header's own colour coding (`chips.ts`). */
/**
 * Where a pin's chip goes, in the board's own drawing: its centre, and the box it covers there, which
 * on a standing board is as deep as the upright chip is wide.
 */
function chipOf(pin: number, row: number): { x: number; centre: number; width: number; box: Box } {
  const header = HEADER_PINS.find((each) => each.number === pin);
  if (!header) throw new Error(`The Pico has no pin ${pin}`);
  const { x, y } = holeCentre(holeOfPin(header.number));
  const width = tagChipWidthOf(header.label);
  const height = TAG_CHIP_HEIGHT_MM;
  // Inside the board, just past the pads: below the top row, above the bottom one, and a row
  // further in for one that would sit on its neighbour's. On a standing board the chip, upright,
  // reaches in by its width rather than its height.
  const reach = isStanding(turn) ? width : height;
  const across = isStanding(turn) ? height : width;
  const inward = row * TAG_ROW_MM;
  const top = header.side === "right" ? y + 0.95 + inward : y - 0.95 - reach - inward;
  return {
    x,
    centre: top + reach / 2,
    width,
    box: { x: x - across / 2, y: top, w: across, h: reach },
  };
}

function drawTag(tag: PinTag, row: number): string {
  const pin = HEADER_PINS.find((header) => header.number === tag.pin);
  if (!pin) throw new Error(`The Pico has no pin ${tag.pin}`);
  const style = CHIP_STYLES[pin.kind];
  const { x, centre, width } = chipOf(tag.pin, row);
  const height = TAG_CHIP_HEIGHT_MM;
  const edge = style.bordered ? `stroke="${chipInk(style)}" stroke-width="0.14"` : "";
  return (
    `<g class="part" data-g="${tag.group}"${upright(x, centre)}>` +
    rect(
      x - width / 2,
      centre - height / 2,
      width,
      height,
      `rx="0.45" fill="${chipFill(style)}" ${edge}`,
    ) +
    text(
      x,
      centre + 0.05,
      pin.label,
      `font-size="1.35" font-weight="800" fill="${chipInk(style)}"`,
    ) +
    "</g>"
  );
}

// --- The parts. ---

/** The leg of a part going into its hole: a dark dot where the metal disappears. */
const legEnd = (x: number, y: number) => circle(x, y, 0.45, `fill="${token("breadboard-hole")}"`);

/** How far past the board's edge an arching jumper rises (scratchpi's ADR 0166). */
export const ARCH_LIFT_MM = 3.5;

/** Whether a jumper arches over the top edge of the board, rather than under the bottom one. */
const archesOverTop = (part: { readonly from: Hole; readonly to: Hole }): boolean =>
  (holeCentre(part.from).y + holeCentre(part.to).y) / 2 < CHANNEL_Y_MM;

/**
 * An arching jumper as a cubic curve: it leaves its holes away from the channel, peaks
 * `ARCH_LIFT_MM` past the nearer edge of the board, and comes back. A symmetric cubic peaks at
 * a quarter of its ends' height and three quarters of its controls', which places the controls.
 */
function archCurve(part: { readonly from: Hole; readonly to: Hole }): [Point, Point, Point, Point] {
  const a = holeCentre(part.from);
  const b = holeCentre(part.to);
  const peak = archesOverTop(part) ? -ARCH_LIFT_MM : BREADBOARD_HEIGHT_MM + ARCH_LIFT_MM;
  const ends = (a.y + b.y) / 2;
  const control = ends + (peak - ends) / 0.75;
  const dx = b.x - a.x;
  return [a, { x: a.x + dx * 0.1, y: control }, { x: b.x - dx * 0.1, y: control }, b];
}

/** The line a jumper is drawn along: two points when it lies flat, many when it arches. */
export function wirePath(part: Extract<Part, { kind: "wire" }>): Point[] {
  if (!part.arch) return [holeCentre(part.from), holeCentre(part.to)];
  const [p0, p1, p2, p3] = archCurve(part);
  return Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    const u = 1 - t;
    const at = (k: "x" | "y") =>
      u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k];
    return { x: at("x"), y: at("y") };
  });
}

function drawWire(part: Extract<Part, { kind: "wire" }>): string {
  const a = holeCentre(part.from);
  const b = holeCentre(part.to);
  const colour = token(WIRE_TOKEN[part.role]);
  const ends = [a, b]
    .map(
      (end) =>
        circle(end.x, end.y, 0.72, `fill="${colour}"`) +
        circle(end.x, end.y, 0.32, `fill="${token("lead")}"`),
    )
    .join("");
  if (part.arch) {
    // Lifted off the board: its shadow falls a little down and to the right of it, and the
    // lighter line runs along the side away from the board.
    const [p0, p1, p2, p3] = archCurve(part);
    const d = `M${n(p0.x)} ${n(p0.y)} C${n(p1.x)} ${n(p1.y)} ${n(p2.x)} ${n(p2.y)} ${n(p3.x)} ${n(p3.y)}`;
    const shine = archesOverTop(part) ? -0.22 : 0.22;
    return (
      `<path d="${d}" transform="translate(${ARCH_SHADOW_MM.x} ${ARCH_SHADOW_MM.y})" fill="none" stroke="${token("shade")}" stroke-opacity="0.28" stroke-width="1.6" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="${colour}" stroke-width="1.15" stroke-linecap="round"/>` +
      `<path d="${d}" transform="translate(0 ${shine})" fill="none" stroke="${token("shine")}" stroke-opacity="0.3" stroke-width="0.28" stroke-dasharray="0 1.2 1000"/>` +
      ends
    );
  }
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  // A lighter line down one side of the insulation, which is what makes it read as round.
  const nx = (-(b.y - a.y) / length) * 0.22;
  const ny = ((b.x - a.x) / length) * 0.22;
  const tx = ((b.x - a.x) / length) * 0.4;
  const ty = ((b.y - a.y) / length) * 0.4;
  return (
    line(a.x, a.y, b.x, b.y, `stroke="${colour}" stroke-width="1.15" stroke-linecap="round"`) +
    line(
      a.x + nx + tx,
      a.y + ny + ty,
      b.x + nx - tx,
      b.y + ny - ty,
      `stroke="${token("shine")}" stroke-opacity="0.22" stroke-width="0.28"`,
    ) +
    ends
  );
}

/** Where an arching jumper's shadow falls, from the jumper. */
const ARCH_SHADOW_MM = { x: 0.6, y: 0.9 } as const;

/** The columns the board prints a number over, above row a and below row j. */
const NUMBERED_COLUMNS = [1, 5, 10, 15, 20, 25, 30] as const;
const NUMBER_Y_TOP = rowY("a") - 1.5 * PIN_PITCH_MM + 0.5;
const NUMBER_Y_BOTTOM = rowY("j") + 1.5 * PIN_PITCH_MM - 0.5;
const PRINTED_NUMBERS: readonly Point[] = NUMBERED_COLUMNS.flatMap((column) => [
  { x: columnX(column), y: NUMBER_Y_TOP },
  { x: columnX(column), y: NUMBER_Y_BOTTOM },
]);

/**
 * A resistor's value tag, in millimetres: its height, and its width for a label, as Nunito draws it
 * at the tag's 1.6 mm bold (ADR 0012). scratchpi counted characters, a full stop as little more than
 * half of one, because counted whole, `4.7 kΩ` had no room between Four buttons' jumpers
 * (scratchpi's ADR 0159); measuring says the same of every character.
 */
const TAG_HEIGHT_MM = 2.3;
const tagWidthOf = (label: string): number => widthOf(label, 1.6, 800) + 1.8;

/**
 * A value tag on a standing board, where it is upright and so as deep across the rows as it is wide:
 * the value on two lines, the number over its unit, `4.7` over `kΩ`, so that it is deep by its longer
 * line rather than by both. Its box, as the page shows it: across, then down.
 */
const STANDING_LINE_MM = 1.95;
const standingTagOf = (label: string): { lines: string[]; w: number; h: number } => {
  const lines = label.split(" ");
  const w = Math.max(...lines.map((line) => widthOf(line, 1.6, 800))) + 1.6;
  return { lines, w, h: lines.length * STANDING_LINE_MM + 0.5 };
};

/**
 * A value tag's footprint on the board's own drawing, on one line or two: what the page shows, turned
 * back. A tag on a board that lies flat is always on one line.
 */
const tagFootprintOf = (label: string, lines = 1): { w: number; h: number } => {
  const standing = isStanding(turn);
  if (lines === 1) {
    return standing
      ? { w: TAG_HEIGHT_MM, h: tagWidthOf(label) }
      : { w: tagWidthOf(label), h: TAG_HEIGHT_MM };
  }
  const { w, h } = standingTagOf(label);
  return standing ? { w: h, h: w } : { w, h };
};

/** Whether a segment, widened by `reach` either side, touches a rectangle. */
function segmentTouches(
  a: Point,
  b: Point,
  reach: number,
  box: { x: number; y: number; w: number; h: number },
): boolean {
  // Sample the segment finely: tags are small and nothing here needs exact geometry.
  const steps = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.25));
  for (let i = 0; i <= steps; i += 1) {
    const x = a.x + ((b.x - a.x) * i) / steps;
    const y = a.y + ((b.y - a.y) * i) / steps;
    const nx = Math.max(box.x, Math.min(x, box.x + box.w));
    const ny = Math.max(box.y, Math.min(y, box.y + box.h));
    if (Math.hypot(x - nx, y - ny) < reach) return true;
  }
  return false;
}

/**
 * A part that lies flat between two holes and has a tag beside it: a resistor, its value on the tag,
 * or a diode, its model (ADR 0040, ADR 0049).
 */
export type Lying = Extract<Part, { kind: "resistor" }> | Extract<Part, { kind: "diode" }>;

/** A lying part's two ends: a resistor's either way, and a diode's anode, then its cathode. */
const endsOf = (part: Lying): readonly [Hole, Hole] =>
  part.kind === "resistor" ? [part.from, part.to] : [part.anode, part.cathode];

/** What a lying part's tag says: a resistor's value in the page's language, or a diode's model. */
const tagLabelOf = (part: Lying): string =>
  part.kind === "resistor" ? sayOhms(part.ohms) : part.model;

/** How far either side of its line a lying part's body reaches: a diode's black case is the thickest. */
const LYING_REACH_MM = 1.2;

/**
 * Where a resistor's value tag goes, or a diode's model tag, given everything else on the board
 * (scratchpi's ADR 0154). Towards the channel for a part lying along a row, and to its right for one
 * that is not, as every layout before Four buttons had it — unless something is there, in which case
 * the first of a few other places that is clear: the other side, or the other end. Four buttons is
 * the first layout crowded enough to need them.
 */
export function clearTagOf(part: Lying, others: readonly Part[]): Point | undefined {
  return placeTag(part, others)?.at;
}

/**
 * Where a value tag goes and on how many lines: the first place that is clear, nearest first, and on a
 * standing board on one line if that is clear there, or else on two.
 */
function placeTag(part: Lying, others: readonly Part[]): { at: Point; lines: number } | undefined {
  const [from, to] = endsOf(part);
  const a = holeCentre(from);
  const b = holeCentre(to);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const horizontal = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  const along = (t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  // The tag's footprint on the board's own drawing: upright on a standing board, it is as wide
  // there as it is tall on the page. At 0° the distances are the ones it has always had.
  const label = tagLabelOf(part);
  const standing = isStanding(turn);
  // On a flat board, the places a tag on one line has always had, then the same for two lines, as
  // far out as their depth needs: a value written wider, as Russian writes it, may need them.
  const flatOut = (lines: number) => (lines === 1 ? 2.8 : tagFootprintOf(label, 2).h / 2 + 1.65);
  const flatAside = (lines: number) => {
    if (lines === 1) return [5, -5, 6.5, -6.5];
    const side = tagFootprintOf(label, 2).w / 2 + 1.6;
    return [side, -side, side + 1.5, -side - 1.5];
  };
  const out = standing ? tagFootprintOf(label).h / 2 + 1.65 : flatOut(1);
  const aside = standing ? [2.8, -2.8, 3.9, -3.9] : flatAside(1);
  const towards = mid.y < CHANNEL_Y_MM ? out : -out;
  // Where it has always gone first, then the other side, then further along and further out.
  // On a standing board, everywhere within three holes of the resistor's middle, nearest first, on
  // the board's own plastic: any further, and a tag no longer reads as its resistor's.
  const steps = [-3, -2, -1, 0, 1, 2, 3];
  const around: Point[] = steps
    .flatMap((i) => steps.map((j) => ({ dx: i * 2.54, dy: j * 2.54 })))
    .filter(({ dx, dy }) => dx !== 0 || dy !== 0)
    .sort((p, q) => Math.hypot(p.dx, p.dy) - Math.hypot(q.dx, q.dy))
    .map(({ dx, dy }) => ({ x: mid.x + dx, y: mid.y + dy }));
  const candidates: Point[] = standing
    ? around
    : horizontal
      ? [0.5, 0.35, 0.65].flatMap((t) =>
          [towards, -towards, towards * 1.4, -towards * 1.4].map((dy) => ({
            x: along(t).x,
            y: along(t).y + dy,
          })),
        )
      : [0.5, 0.35, 0.65, 0.2, 0.8].flatMap((t) =>
          aside.map((dx) => ({ x: along(t).x + dx, y: along(t).y })),
        );
  // Last of all, for a resistor down to a rail: past the outer rail on that side, between it and
  // the board's edge, under where the resistor ends. Four buttons' GP15 pull-down needs it, between
  // an arching jumper's legs (scratchpi's ADR 0166); everything before it was placed without.
  const rail = [a, b].find((end) => end.y < railY("top-") + 0.1 || end.y > railY("bottom-") - 0.1);
  if (rail) {
    const y = rail.y < CHANNEL_Y_MM ? railY("top+") - 2.4 : railY("bottom+") + 2.4;
    candidates.push(...[0, -1, 1, -2, 2, -3, 3].map((dx) => ({ x: rail.x + dx, y })));
  }
  const clear = (tag: Point, width: number, height: number): boolean => {
    const box = {
      x: tag.x - width / 2 - 0.3,
      y: tag.y - height / 2 - 0.3,
      w: width + 0.6,
      h: height + 0.6,
    };
    const inside = (p: Point, reach: number) => segmentTouches(p, p, reach, box);
    if (standing) {
      const second = isOnSecondBoard(from) || isOnSecondBoard(to);
      const plastic = { top: second ? SECOND_BOARD_Y_MM : 0, bottom: BREADBOARD_HEIGHT_MM };
      if (box.x < 0 || box.x + box.w > BREADBOARD_WIDTH_MM) return false;
      if (box.y < plastic.top || box.y + box.h > plastic.bottom) return false;
    }
    // Its own body, the rails, and the column numbers, which a tag has never sat over.
    if (segmentTouches(a, b, part.kind === "diode" ? LYING_REACH_MM : 1.15, box)) return false;
    for (const rail of RAILS) {
      if (box.y < railY(rail) + 0.9 && box.y + box.h > railY(rail) - 0.9) return false;
    }
    for (const at of PRINTED_NUMBERS) {
      if (inside(at, 1.3)) return false;
    }
    // The Pico, turned on its side, where there is one.
    const outline = {
      x: PICO_ORIGIN_MM.x,
      y: PICO_ORIGIN_MM.y,
      w: BOARD_LENGTH_MM,
      h: BOARD_WIDTH_MM,
    };
    if (
      pico &&
      box.x < outline.x + outline.w &&
      box.x + box.w > outline.x &&
      box.y < outline.y + outline.h &&
      box.y + box.h > outline.y
    )
      return false;
    for (const other of others) {
      if (other === part) continue;
      if (other.kind === "resistor") {
        if (segmentTouches(holeCentre(other.from), holeCentre(other.to), 1.15, box)) return false;
      }
      if (other.kind === "diode") {
        const [anode, cathode] = [holeCentre(other.anode), holeCentre(other.cathode)];
        if (segmentTouches(anode, cathode, LYING_REACH_MM, box)) return false;
      }
      if (other.kind === "wire") {
        // An arch's shadow is part of it too, a little down and to the right of it.
        const path = wirePath(other);
        const shadow = other.arch
          ? path.map((p) => ({ x: p.x + ARCH_SHADOW_MM.x, y: p.y + ARCH_SHADOW_MM.y }))
          : [];
        for (const [line, reach] of [
          [path, 0.6],
          [shadow, 0.8],
        ] as const) {
          for (let i = 1; i < line.length; i++) {
            if (segmentTouches(line[i - 1] as Point, line[i] as Point, reach, box)) return false;
          }
        }
      }
      if (other.kind === "button") {
        const centre = buttonCentre(other);
        if (inside(centre, BUTTON_BODY_MM / 2 + 0.4)) return false;
      }
      if (other.kind === "electrolytic" && overlap(box, canBoxOf(other))) return false;
      if (other.kind === "transistor" && overlap(box, to92BoxOf(other))) return false;
      for (const hole of legsOf(other)) if (inside(holeCentre(hole), 0.8)) return false;
    }
    return true;
  };
  if (standing) {
    for (const at of candidates) {
      for (const lines of [1, 2]) {
        const { w, h } = tagFootprintOf(label, lines);
        if (clear(at, w, h)) return { at, lines };
      }
    }
    return undefined;
  }
  const one = tagFootprintOf(label, 1);
  for (const at of candidates) if (clear(at, one.w, one.h)) return { at, lines: 1 };
  const two = tagFootprintOf(label, 2);
  const deeper = mid.y < CHANNEL_Y_MM ? flatOut(2) : -flatOut(2);
  const twoLine: Point[] = horizontal
    ? [0.5, 0.35, 0.65].flatMap((t) =>
        [deeper, -deeper, deeper * 1.3, -deeper * 1.3].map((dy) => ({
          x: along(t).x,
          y: along(t).y + dy,
        })),
      )
    : [0.5, 0.35, 0.65, 0.2, 0.8].flatMap((t) =>
        flatAside(2).map((dx) => ({ x: along(t).x + dx, y: along(t).y })),
      );
  for (const at of twoLine) if (clear(at, two.w, two.h)) return { at, lines: 2 };
  return undefined;
}

/** The same, falling back to where a tag has always gone if nowhere is clear. */
export function tagOf(part: Lying, others: readonly Part[]): Point {
  return clearTagOf(part, others) ?? defaultTagOf(part);
}

/** Towards the channel along a row, and to the right otherwise: before `clearTagOf` looked. */
function defaultTagOf(part: Lying): Point {
  const [from, to] = endsOf(part);
  const a = holeCentre(from);
  const b = holeCentre(to);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const horizontal = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  return horizontal
    ? { x: mid.x, y: mid.y + (mid.y < CHANNEL_Y_MM ? 2.8 : -2.8) }
    : { x: mid.x + 5, y: mid.y };
}

function drawResistor(from: Hole, to: Hole, ohms: number, tag: Point, lines = 1): string {
  const a = holeCentre(from);
  const b = holeCentre(to);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  const body = Math.min(6.4, length - 1.2);
  const height = 2.3;
  const half = body / 2;

  // Drawn along +x around its middle, then turned to lie between its two holes.
  const local: string[] = [
    line(
      -length / 2,
      0,
      length / 2,
      0,
      `stroke="${token("lead")}" stroke-width="0.5" stroke-linecap="round"`,
    ),
    rect(
      -half,
      -height / 2,
      body,
      height,
      `rx="1.1" fill="${token("resistor")}" stroke="${token("resistor-edge")}" stroke-width="0.18"`,
    ),
  ];
  const bands = resistorBands(ohms).four;
  // Three bands bunched at one end and the tolerance band apart at the other, which is
  // how a reader knows which end to start from.
  const at = [-0.61, -0.34, -0.08, 0.55];
  bands.forEach((band, i) => {
    local.push(
      rect(
        (at[i] ?? 0) * half - 0.26,
        -height / 2 + 0.09,
        0.52,
        height - 0.18,
        `fill="${token(`band-${band}`)}"`,
      ),
    );
  });
  local.push(
    line(
      -half + 1,
      -0.62,
      half - 1,
      -0.62,
      `stroke="${token("shine")}" stroke-opacity="0.35" stroke-width="0.3" stroke-linecap="round"`,
    ),
  );

  // The value, on a tag where `tagOf` found room for it: never over a rail.
  const label = sayOhms(ohms);
  const tagWidth = tagWidthOf(label);

  return (
    `<g transform="translate(${n(mid.x)} ${n(mid.y)}) rotate(${n(angle)})">${local.join("")}</g>` +
    legEnd(a.x, a.y) +
    legEnd(b.x, b.y) +
    (turn === 0 ? "" : `<g${upright(tag.x, tag.y)}>`) +
    (lines === 1 ? oneLineTag(tag, label, tagWidth) : twoLineTag(tag, label)) +
    (turn === 0 ? "" : "</g>")
  );
}

const TAG_FRAME = `fill="${token("board-silk")}" stroke="${token("breadboard-print")}" stroke-width="0.15"`;
const TAG_INK = `font-size="1.6" font-weight="800" fill="${token("on-pale-chip")}"`;

/** A value tag on one line, as it has always been. */
function oneLineTag(tag: Point, label: string, width: number): string {
  return (
    rect(
      tag.x - width / 2,
      tag.y - TAG_HEIGHT_MM / 2,
      width,
      TAG_HEIGHT_MM,
      `rx="1.15" ${TAG_FRAME}`,
    ) + text(tag.x, tag.y + 0.05, label, TAG_INK)
  );
}

/** A value tag on two lines, the number over its unit: on a standing board, where one line is too deep. */
function twoLineTag(tag: Point, label: string): string {
  const { lines, w, h } = standingTagOf(label);
  const first = tag.y - ((lines.length - 1) * STANDING_LINE_MM) / 2 + 0.05;
  return (
    rect(tag.x - w / 2, tag.y - h / 2, w, h, `rx="1.15" ${TAG_FRAME}`) +
    lines.map((line, i) => text(tag.x, first + i * STANDING_LINE_MM, line, TAG_INK)).join("")
  );
}

/**
 * A diode, lying flat between its holes as a resistor does (ADR 0040, ADR 0049): a small orange glass
 * case with a black band, or a larger black one with a grey band, as its model's is, the band at its
 * cathode. Its lead shows through the glass. Its model is on a tag beside it, placed as a resistor's
 * value is: lying, its case is too thin to hold an upright word at a quarter turn.
 */
export const DIODE_MM = {
  glass: { length: 4.4, height: 1.9 },
  black: { length: 5.4, height: 2.4 },
  band: 0.8,
} as const;

function drawDiode(part: Extract<Part, { kind: "diode" }>, tag: Point, lines = 1): string {
  const a = holeCentre(part.anode);
  const k = holeCentre(part.cathode);
  const mid = { x: (a.x + k.x) / 2, y: (a.y + k.y) / 2 };
  const length = Math.hypot(k.x - a.x, k.y - a.y);
  const angle = (Math.atan2(k.y - a.y, k.x - a.x) * 180) / Math.PI;
  const glass = DIODES[part.model].case === "glass";
  const shape = glass ? DIODE_MM.glass : DIODE_MM.black;
  const body = Math.min(shape.length, length - 1.2);
  const half = body / 2;
  const height = shape.height;
  const [fill, band] = glass
    ? [DIODE_TOKENS.glass, DIODE_TOKENS.glassBand]
    : [DIODE_TOKENS.black, DIODE_TOKENS.blackBand];
  // Drawn along +x from its anode to its cathode, around its middle, then turned to lie between them.
  const local =
    line(
      -length / 2,
      0,
      length / 2,
      0,
      `stroke="${token("lead")}" stroke-width="0.5" stroke-linecap="round"`,
    ) +
    rect(
      -half,
      -height / 2,
      body,
      height,
      `rx="${glass ? height / 2 : 0.45}" fill="${token(fill)}"${glass ? ` fill-opacity="0.88"` : ""} stroke="${token("shade")}" stroke-opacity="0.35" stroke-width="0.16"`,
    ) +
    rect(
      half - (glass ? 0.55 : 0.45) - DIODE_MM.band,
      -height / 2 + 0.06,
      DIODE_MM.band,
      height - 0.12,
      `fill="${token(band)}"`,
    ) +
    line(
      -half + 0.7,
      -height / 2 + 0.5,
      half - DIODE_MM.band - 0.8,
      -height / 2 + 0.5,
      `stroke="${token("shine")}" stroke-opacity="${glass ? 0.55 : 0.2}" stroke-width="0.3" stroke-linecap="round"`,
    );
  return (
    `<g transform="translate(${n(mid.x)} ${n(mid.y)}) rotate(${n(angle)})">${local}</g>` +
    legEnd(a.x, a.y) +
    legEnd(k.x, k.y) +
    (turn === 0 ? "" : `<g${upright(tag.x, tag.y)}>`) +
    (lines === 1
      ? oneLineTag(tag, part.model, tagWidthOf(part.model))
      : twoLineTag(tag, part.model)) +
    (turn === 0 ? "" : "</g>")
  );
}

/** How far above its holes an LED's lens is centred, and its radius. */
const LENS_RISE_MM = 5.6;
const LENS_RADIUS_MM = 2.45;

function drawLed(anode: Hole, cathode: Hole, colour: LedColour): string {
  const a = holeCentre(anode);
  const k = holeCentre(cathode);
  const y = a.y;
  const mid = (a.x + k.x) / 2;
  // +1 when the short leg is to the right: the kink goes on the long leg, away from it,
  // and the flat on the rim is on the short leg's side.
  const towardCathode = Math.sign(k.x - a.x) || 1;
  const fill = token(`led-${colour}`);
  const r = LENS_RADIUS_MM;
  const lens = `M${n(mid - r)} ${n(y - 3.7)}V${n(y - LENS_RISE_MM)}A${r} ${r} 0 0 1 ${n(mid + r)} ${n(y - LENS_RISE_MM)}V${n(y - 3.7)}Z`;
  const rimLeft = towardCathode > 0 ? mid - 2.85 : mid - 2.4;
  const rimRight = towardCathode > 0 ? mid + 2.4 : mid + 2.85;
  const kink = -0.75 * towardCathode;

  return (
    circle(mid, y - LENS_RISE_MM, 5.6, `class="glow" fill="url(#glow-${colour})"`) +
    line(k.x, y - 3, k.x, y, `stroke="${token("lead")}" stroke-width="0.45"`) +
    `<path d="M${n(a.x)} ${n(y - 3)}V${n(y - 2.15)}L${n(a.x + kink)} ${n(y - 1.5)}L${n(a.x)} ${n(y - 0.85)}V${n(y)}" fill="none" stroke="${token("lead")}" stroke-width="0.45" stroke-linejoin="round"/>` +
    legEnd(a.x, y) +
    legEnd(k.x, y) +
    rect(rimLeft, y - 3.7, rimRight - rimLeft, 0.7, `fill="${fill}"`) +
    rect(
      rimLeft,
      y - 3.7,
      rimRight - rimLeft,
      0.7,
      `fill="${token("shade")}" fill-opacity="0.25"`,
    ) +
    `<path d="${lens}" fill="${fill}" fill-opacity="0.9" stroke="${token("shade")}" stroke-opacity="0.3" stroke-width="0.16"/>` +
    `<path class="lit" d="${lens}" fill="${token("shine")}"/>` +
    // The leads inside the lens: the thin post of the long leg and the anvil of the short.
    `<path d="M${n(a.x)} ${n(y - 3.7)}V${n(y - 5.3)}M${n(k.x)} ${n(y - 3.7)}V${n(y - 4.9)}L${n(mid + 0.2 * towardCathode)} ${n(y - 5.5)}H${n(k.x)}" fill="none" stroke="${token("shade")}" stroke-opacity="0.35" stroke-width="0.3"/>` +
    `<ellipse cx="${n(mid - 1.3)}" cy="${n(y - 5.9)}" rx="0.42" ry="1.25" fill="${token("shine")}" fill-opacity="0.5"/>`
  );
}

/**
 * The side of a tactile button's square body. A real one is 6 mm and its legs come out just
 * past it; drawn a little smaller, the legs show where they go in.
 */
const BUTTON_BODY_MM = 5.6;

/** Where a button's body is centred: between its legs' rows, the channel's middle across it. */
function buttonCentre(part: Extract<Part, { kind: "button" }>): { x: number; y: number } {
  const [first, second] = rowsOf(part);
  return {
    x: (columnX(part.columns[0]) + columnX(part.columns[1])) / 2,
    y: (rowY(first) + rowY(second)) / 2 + (part.board === 2 ? SECOND_BOARD_Y_MM : 0),
  };
}

function drawButton(part: Extract<Part, { kind: "button" }>, cap: ButtonColour): string {
  const { x: mid, y: cy } = buttonCentre(part);
  const half = BUTTON_BODY_MM / 2;
  const out: string[] = [];
  for (const column of part.columns) {
    for (const row of rowsOf(part)) {
      const y = holeCentre(buttonHole(part, row, column)).y;
      const edge = y < cy ? cy - half : cy + half;
      out.push(
        line(
          columnX(column),
          y,
          columnX(column),
          edge,
          `stroke="${token("lead")}" stroke-width="0.8"`,
        ),
      );
      out.push(legEnd(columnX(column), y));
    }
  }
  out.push(
    rect(
      mid - half,
      cy - half,
      BUTTON_BODY_MM,
      BUTTON_BODY_MM,
      `rx="0.5" fill="${token("board-chip")}"`,
    ),
  );
  out.push(
    rect(
      mid - half + 0.5,
      cy - half + 0.5,
      BUTTON_BODY_MM - 1,
      BUTTON_BODY_MM - 1,
      `rx="0.35" fill="${token("board-metal")}"`,
    ),
  );
  // The cap, in the colour its circuit gives the button (scratchpi's ADR 0174), so the reader fits
  // the one the steps and the parts list name.
  out.push(
    circle(
      mid,
      cy,
      1.85,
      `fill="${token(`led-${cap}`)}" stroke="${token("shade")}" stroke-width="0.2"`,
    ),
  );
  out.push(circle(mid - 0.5, cy - 0.55, 0.55, `fill="${token("shine")}" fill-opacity="0.25"`));
  return out.join("");
}

/** A passive buzzer, seen from the side: a short black cylinder standing on two legs. */
const BUZZER_RADIUS_MM = 5.5;
const BUZZER_HEIGHT_MM = 6;
/** How far its body stands off the board: enough that its legs show under the rim. */
const BUZZER_LIFT_MM = 2.6;

function drawBuzzer(plus: Hole, minus: Hole): string {
  const p = holeCentre(plus);
  const m = holeCentre(minus);
  const y = p.y;
  const mid = (p.x + m.x) / 2;
  const r = BUZZER_RADIUS_MM;
  const bottom = y - BUZZER_LIFT_MM;
  const top = bottom - BUZZER_HEIGHT_MM;
  const ry = 1.3;
  return (
    line(p.x, y, p.x, bottom, `stroke="${token("lead")}" stroke-width="0.5"`) +
    line(m.x, y, m.x, bottom, `stroke="${token("lead")}" stroke-width="0.5"`) +
    legEnd(p.x, y) +
    legEnd(m.x, y) +
    `<path d="M${n(mid - r)} ${n(top)}V${n(bottom)}A${r} ${ry} 0 0 0 ${n(mid + r)} ${n(bottom)}V${n(top)}Z" fill="${token("board-chip")}"/>` +
    rect(mid - r + 0.9, top, 0.9, BUZZER_HEIGHT_MM, `fill="${token("shine")}" fill-opacity="0.1"`) +
    `<ellipse cx="${n(mid)}" cy="${n(top)}" rx="${r}" ry="${ry}" fill="${token("board-chip")}" stroke="${token("shine")}" stroke-opacity="0.18" stroke-width="0.2"/>` +
    `<ellipse cx="${n(mid)}" cy="${n(top)}" rx="1.1" ry="0.42" fill="${token("shade")}" fill-opacity="0.7"/>` +
    word(p.x, bottom - 2.2, "+", `font-size="2.4" font-weight="800" fill="${token("board-silk")}"`)
  );
}

/**
 * An electrolytic capacitor, standing on its two legs and seen from the side, as a light is (ADR 0040,
 * ADR 0043): a can in its sleeve, a pale stripe down the side its − leg is on, with minus signs on it,
 * an aluminium top, and its value printed on the sleeve, the number over its unit, upright at every
 * quarter turn. Its + leg is kinked, as a light's long leg is. It is drawn the same size whatever its
 * value, and short, so that it stands over no more than the three rows above its legs.
 */
export const CAN_MM = { width: 5.4, height: 4.6, lift: 2, top: 0.55, stripe: 1.25 } as const;

/** Where a can's value is printed: the middle of its sleeve, beside the stripe. */
function canPrintOf(part: Extract<Part, { kind: "electrolytic" }>): {
  x: number;
  y: number;
  towardMinus: number;
} {
  const p = holeCentre(part.plus);
  const m = holeCentre(part.minus);
  const towardMinus = Math.sign(m.x - p.x) || 1;
  const mid = (p.x + m.x) / 2;
  return {
    x: mid - (towardMinus * CAN_MM.stripe) / 2,
    y: p.y - CAN_MM.lift - CAN_MM.height / 2,
    towardMinus,
  };
}

/** The box a can stands over on the board's own drawing, its top included. */
export function canBoxOf(part: Extract<Part, { kind: "electrolytic" }>): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const p = holeCentre(part.plus);
  const m = holeCentre(part.minus);
  const mid = (p.x + m.x) / 2;
  const bottom = p.y - CAN_MM.lift;
  const top = bottom - CAN_MM.height - CAN_MM.top;
  return { x: mid - CAN_MM.width / 2, y: top, w: CAN_MM.width, h: bottom - top };
}

function drawElectrolytic(part: Extract<Part, { kind: "electrolytic" }>): string {
  const p = holeCentre(part.plus);
  const m = holeCentre(part.minus);
  const y = p.y;
  const mid = (p.x + m.x) / 2;
  const half = CAN_MM.width / 2;
  const bottom = y - CAN_MM.lift;
  const top = bottom - CAN_MM.height;
  const ry = CAN_MM.top;
  const print = canPrintOf(part);
  const toward = print.towardMinus;
  // The stripe runs down the side the − leg is on, the whole height of the sleeve.
  const stripeInner = mid + toward * (half - CAN_MM.stripe);
  const stripeOuter = mid + toward * half;
  const stripeX = Math.min(stripeInner, stripeOuter);
  const stripeMid = (stripeInner + stripeOuter) / 2;
  const sleeve = `M${n(mid - half)} ${n(top)}V${n(bottom)}A${half} ${ry} 0 0 0 ${n(mid + half)} ${n(bottom)}V${n(top)}Z`;
  const stripe = `M${n(stripeX)} ${n(top)}V${n(bottom + ry)}H${n(stripeX + CAN_MM.stripe)}V${n(top)}Z`;
  const kink = 0.6 * -toward;
  const [number, unit] = formatMicrofarads(part.microfarads).split(" ");
  const ink = `font-weight="800" fill="${token(ELECTROLYTIC_TOKENS.ink)}"`;
  const lines =
    text(print.x, print.y - 0.85, number ?? "", `font-size="1.55" ${ink}`) +
    text(print.x, print.y + 0.85, unit ?? "", `font-size="1.25" ${ink}`);
  return (
    // The − leg straight, and the + leg kinked, as a light's long leg is.
    line(m.x, y, m.x, bottom, `stroke="${token("lead")}" stroke-width="0.45"`) +
    `<path d="M${n(p.x)} ${n(bottom)}V${n(y - 1.55)}L${n(p.x + kink)} ${n(y - 1.05)}L${n(p.x)} ${n(y - 0.55)}V${n(y)}" fill="none" stroke="${token("lead")}" stroke-width="0.45" stroke-linejoin="round"/>` +
    legEnd(p.x, y) +
    legEnd(m.x, y) +
    `<path d="${sleeve}" fill="${token(ELECTROLYTIC_TOKENS.sleeve)}" stroke="${token("shade")}" stroke-opacity="0.35" stroke-width="0.16"/>` +
    `<clipPath id="can-${n(mid * 1000)}-${n(y * 1000)}"><path d="${sleeve}"/></clipPath>` +
    `<path d="${stripe}" clip-path="url(#can-${n(mid * 1000)}-${n(y * 1000)})" fill="${token(ELECTROLYTIC_TOKENS.stripe)}"/>` +
    // A sheen down the sleeve, on the side away from the stripe.
    rect(
      mid - toward * (half - 0.75) - 0.35,
      top,
      0.7,
      CAN_MM.height,
      `fill="${token("shine")}" fill-opacity="0.16"`,
    ) +
    `<ellipse cx="${n(mid)}" cy="${n(top)}" rx="${half}" ry="${ry}" fill="${token("board-metal")}" stroke="${token("shade")}" stroke-opacity="0.35" stroke-width="0.16"/>` +
    `<path d="M${n(mid - 1)} ${n(top - 0.12)}L${n(mid + 1)} ${n(top + 0.12)}M${n(mid - 1)} ${n(top + 0.12)}L${n(mid + 1)} ${n(top - 0.12)}" stroke="${token("shade")}" stroke-opacity="0.3" stroke-width="0.14"/>` +
    [0.25, 0.5, 0.75]
      .map((at) =>
        word(
          stripeMid,
          top + CAN_MM.height * at,
          "−",
          `font-size="1.3" font-weight="900" fill="${token(ELECTROLYTIC_TOKENS.stripeInk)}"`,
        ),
      )
      .join("") +
    (turn === 0 ? lines : `<g${upright(print.x, print.y)}>${lines}</g>`)
  );
}

/**
 * A transistor in its TO-92 case, standing on its three legs with its flat face towards the viewer,
 * as a datasheet draws it (ADR 0040, ADR 0044): a black case, larger than life so that what is printed
 * on it reads, its type large, `NPN`, its model small beneath, and the letter of each leg above it,
 * every word upright at every quarter turn and the same in every language. Its legs leave the case
 * 1.27 mm apart, as a TO-92's do, and bend out to the holes, a pitch apart.
 */
export const TO92_MM = { width: 6.6, height: 5, lift: 2 } as const;

/** The box a transistor's case stands over on the board's own drawing. */
export function to92BoxOf(part: Extract<Part, { kind: "transistor" }>): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const b = holeCentre(part.base);
  return {
    x: b.x - TO92_MM.width / 2,
    y: b.y - TO92_MM.lift - TO92_MM.height,
    w: TO92_MM.width,
    h: TO92_MM.height,
  };
}

const TO92_LEG_LETTER: Record<TransistorLeg, string> = {
  emitter: "E",
  base: "B",
  collector: "C",
};

function drawTransistor(part: Extract<Part, { kind: "transistor" }>): string {
  const model = TRANSISTORS[part.model];
  const mid = holeCentre(part.base).x;
  const y = holeCentre(part.base).y;
  const half = TO92_MM.width / 2;
  const bottom = y - TO92_MM.lift;
  const top = bottom - TO92_MM.height;
  const lead = `fill="none" stroke="${token("lead")}" stroke-width="0.45" stroke-linejoin="round"`;
  const legs = model.legs.map((leg) => {
    const hole = holeCentre(part[leg]);
    const out = mid + (hole.x - mid) / 2;
    return {
      leg,
      out,
      path: `<path d="M${n(hole.x)} ${n(y)}V${n(y - 0.6)}L${n(out)} ${n(y - 1.4)}V${n(bottom)}" ${lead}/>`,
      end: legEnd(hole.x, y),
    };
  });
  const ink = `fill="${token(TRANSISTOR_TOKENS.ink)}"`;
  const centre = { x: mid, y: top + 1.825 };
  const print =
    text(centre.x, top + 1.35, model.type, `font-size="1.5" font-weight="900" ${ink}`) +
    text(centre.x, top + 2.6, part.model, `font-size="0.9" font-weight="800" ${ink}`);
  return (
    legs.map((leg) => leg.path + leg.end).join("") +
    `<path d="M${n(mid - half)} ${n(bottom)}V${n(top + 0.9)}Q${n(mid - half)} ${n(top)} ${n(mid - half + 0.9)} ${n(top)}H${n(mid + half - 0.9)}Q${n(mid + half)} ${n(top)} ${n(mid + half)} ${n(top + 0.9)}V${n(bottom)}Z" fill="${token(TRANSISTOR_TOKENS.body)}" stroke="${token("shade")}" stroke-opacity="0.35" stroke-width="0.16"/>` +
    // The rounded back shows past the flat face at either side, and catches the light.
    rect(
      mid - half + 0.35,
      top + 0.7,
      0.45,
      TO92_MM.height - 1,
      `rx="0.2" fill="${token("shine")}" fill-opacity="0.14"`,
    ) +
    rect(
      mid + half - 0.8,
      top + 0.7,
      0.45,
      TO92_MM.height - 1,
      `rx="0.2" fill="${token("shine")}" fill-opacity="0.08"`,
    ) +
    (turn === 0 ? print : `<g${upright(centre.x, centre.y)}>${print}</g>`) +
    legs
      .map((leg) =>
        word(
          leg.out,
          bottom - 0.75,
          TO92_LEG_LETTER[leg.leg],
          `font-size="0.85" font-weight="800" ${ink}`,
        ),
      )
      .join("")
  );
}

/**
 * A 10 mm addressable RGB LED (scratchpi's ADR 0222), standing up: four leads, data out's kinked as the
 * longest, a frosted lens over them, and its pie of red, green and blue showing through
 * (scratchpi's ADR 0224). Its glow is white, all three at once, when the step that tests it is picked.
 */
const RGB_LENS_RISE_MM = 6.6;
const RGB_LENS_RADIUS_MM = 4.8;

function drawRgbLed(part: Extract<Part, { kind: "rgbLed" }>): string {
  const legs = legsOf(part).map(holeCentre);
  const y = legs[0]?.y ?? 0;
  const xs = legs.map((leg) => leg.x);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  const r = RGB_LENS_RADIUS_MM;
  const rim = y - 3.7;
  const centre = y - RGB_LENS_RISE_MM;
  const out = holeCentre(part.dataOut).x;
  const lens = `M${n(mid - r)} ${n(rim)}V${n(centre)}A${r} ${r} 0 0 1 ${n(mid + r)} ${n(centre)}V${n(rim)}Z`;
  return (
    circle(mid, centre, 9, `class="glow" fill="url(#glow-white)"`) +
    legs
      .filter((leg) => leg.x !== out)
      .map((leg) => line(leg.x, rim, leg.x, y, `stroke="${token("lead")}" stroke-width="0.45"`))
      .join("") +
    `<path d="M${n(out)} ${n(rim)}V${n(y - 2.15)}L${n(out - 0.75)} ${n(y - 1.5)}L${n(out)} ${n(y - 0.85)}V${n(y)}" fill="none" stroke="${token("lead")}" stroke-width="0.45" stroke-linejoin="round"/>` +
    legs.map((leg) => legEnd(leg.x, leg.y)).join("") +
    rect(mid - r - 0.5, rim, 2 * r + 1, 0.8, `fill="${token("led-white")}"`) +
    rect(mid - r - 0.5, rim, 2 * r + 1, 0.8, `fill="${token("shade")}" fill-opacity="0.25"`) +
    `<path d="${lens}" fill="${token("led-white")}" fill-opacity="0.92" stroke="${token("shade")}" stroke-opacity="0.35" stroke-width="0.16"/>` +
    PIE_WEDGES.map(
      (wedge) =>
        `<path d="${wedgePath(mid, centre, 2.6, wedge.from, wedge.to)}" fill="${token(`led-${wedge.colour}`)}" fill-opacity="0.85"/>`,
    ).join("") +
    `<path class="lit" d="${lens}" fill="${token("shine")}"/>` +
    `<ellipse cx="${n(mid - 2.4)}" cy="${n(centre - 1.2)}" rx="0.5" ry="1.6" fill="${token("shine")}" fill-opacity="0.5"/>`
  );
}

/**
 * Where the ring's header sits under its holes (scratchpi's ADR 0238): the pins' short run from the holes,
 * then the black plastic, 2.5 mm, which the ring's board starts at.
 */
const RING_HEADER_MM = { gap: 0.9, height: 2.5 } as const;

/** How long the test's red light takes to go once round the ring: the script's 0.2 s an LED. */
const RING_ROUND_SECONDS = 2.4;

/** The middle of the ring, as it is laid out below its holes. */
export function ringCentreOf(part: Extract<Part, { kind: "ring" }>): Point {
  const legs = legsOf(part).map(holeCentre);
  const xs = legs.map((leg) => leg.x);
  const y = legs[0]?.y ?? 0;
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: y + RING_HEADER_MM.gap + RING_HEADER_MM.height + RING_MM.outer,
  };
}

/**
 * The ring of twelve RGB LEDs (scratchpi's ADR 0234), laid out below the board at its size, its header up in
 * its four holes, after the owner's photo (scratchpi's ADR 0238): the black board with its four mounting
 * holes, and each LED a white 5050 package turned to face along the ring, with its round lens,
 * its four pads and the capacitor beside it. LED 0 is the one by the header.
 *
 * When the step that tests it is picked, a red light goes round it from LED 0, as the script's
 * does: each LED's glow and lens wait their turn, a twelfth of the way round.
 */
function drawRing(part: Extract<Part, { kind: "ring" }>): string {
  const legs = legsOf(part).map(holeCentre);
  const xs = legs.map((leg) => leg.x);
  const y = legs[0]?.y ?? 0;
  const left = Math.min(...xs) - PIN_PITCH_MM / 2;
  const width = Math.max(...xs) - Math.min(...xs) + PIN_PITCH_MM;
  const plastic = y + RING_HEADER_MM.gap;
  const centre = ringCentreOf(part);
  const band = (RING_MM.outer + RING_MM.inner) / 2;
  const half = RING_MM.led / 2;
  const lens = RING_MM.lens;
  const divider = (degrees: number) => {
    const end = onCircle(0, 0, lens, degrees);
    return line(0, 0, end.x, end.y, `stroke="${token("lead")}" stroke-width="0.16"`);
  };
  const pads = [-1, 1].flatMap((side) =>
    [-1.55, 1.55].map((at) =>
      rect(
        side * (half + 0.1) - 0.4,
        at - 0.45,
        0.8,
        0.9,
        `rx="0.12" fill="${token("board-metal")}"`,
      ),
    ),
  );
  const leds = Array.from({ length: 12 }, (_, index) => {
    const angle = ringAngleOf(index, 12);
    const at = onCircle(centre.x, centre.y, band, angle);
    const delay = `style="animation-delay: ${n((index * RING_ROUND_SECONDS) / 12 - RING_ROUND_SECONDS)}s"`;
    return (
      `<g data-led="${index}" transform="translate(${n(at.x)} ${n(at.y)}) rotate(${n(angle)})">` +
      circle(0, 0, 4.4, `class="glow" fill="url(#glow-red)" ${delay}`) +
      pads.join("") +
      rect(-1.6, -half - 1.1, 1.1, 0.6, `rx="0.1" fill="${token("board-pad")}"`) +
      rect(
        -half,
        -half,
        RING_MM.led,
        RING_MM.led,
        `rx="0.3" fill="${token("led-white")}" stroke="${token("shade")}" stroke-opacity="0.25" stroke-width="0.12"`,
      ) +
      circle(
        0,
        0,
        lens,
        `fill="${token("board-metal")}" stroke="${token("lead")}" stroke-width="0.16"`,
      ) +
      divider(0) +
      divider(120) +
      divider(240) +
      circle(0, 0, lens, `class="lit" fill="${token("led-red")}" ${delay}`) +
      "</g>"
    );
  });
  return (
    `<path d="${ringBoardPath(centre.x, centre.y)}" fill-rule="evenodd" fill="${token("board-chip")}" stroke="${token("breadboard-edge")}" stroke-width="0.3"/>` +
    legs
      .map((leg) =>
        line(leg.x, leg.y, leg.x, plastic, `stroke="${token("lead")}" stroke-width="0.6"`),
      )
      .join("") +
    legs.map((leg) => legEnd(leg.x, leg.y)).join("") +
    rect(left, plastic, width, RING_HEADER_MM.height, `rx="0.3" fill="${token("board-chip")}"`) +
    rect(left, plastic, width, 0.5, `fill="${token("shine")}" fill-opacity="0.12"`) +
    leds.join("")
  );
}

// --- Labels in the margin. ---

/**
 * The rows' midpoints, which is where a leader can run without crossing a letter: on the first
 * board, and on the second, above it (scratchpi's ADR 0226).
 */
const BETWEEN_ROWS: readonly number[] = ROWS.slice(0, -1)
  .map((row, i) => (rowY(row) + rowY(ROWS[i + 1] as Row)) / 2)
  .flatMap((y) => [y, SECOND_BOARD_Y_MM + y]);

const nearestBetweenRows = (y: number): number =>
  BETWEEN_ROWS.reduce((best, candidate) =>
    Math.abs(candidate - y) < Math.abs(best - y) ? candidate : best,
  );

/** A point on the drawing, in millimetres. */
interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Which end of the board a part's label goes past (ADR 0024, ADR 0027): the far end, away from the
 * USB, for every part on the first board, whose near end is the Pico's; and for a part on the
 * second board, whichever end is nearer, by its middle column.
 */
export type LabelEnd = "far" | "near";

/** The middle column of the second board, at or before which a part's label goes past the near end. */
const SECOND_BOARD_NEAR_HALF = (COLUMNS + 1) / 2;

export function labelEndOf(part: Part): LabelEnd {
  const legs = legsOf(part);
  if (!legs.some(isOnSecondBoard)) return "far";
  const columns = legs.map((leg) => holeAt(leg).column);
  const middle = (Math.min(...columns) + Math.max(...columns)) / 2;
  return middle <= SECOND_BOARD_NEAR_HALF ? "near" : "far";
}

/**
 * A part's leader: the dot on the part, and where the run out to the margin starts, and the end of
 * the board its label is past. The dot and the run are the same point unless something is in the way.
 */
export interface Leader {
  readonly dot: Point;
  readonly run: Point;
  readonly end: LabelEnd;
}

/**
 * Where a part's leader leaves it, given every other part that has a label.
 *
 * Buttons all sit on the channel, so a button with another labelled button further along it
 * would run its leader straight through that one, and the two leaders would share a line to
 * the margin — nobody could tell whose label was whose (scratchpi's ADR 0097). So each blocked
 * button takes a lane of its own (ADR 0026), from the one nearest the end to the one furthest from
 * it: between rows d and e from the top of its body, then between f and g from the bottom, then a
 * row further out on each side in turn.
 */
export function leaderOf(
  part: Part,
  labelled: readonly Part[],
  standing: readonly Part[] = [],
): Leader | undefined {
  const end = labelEndOf(part);
  const edges = anchorOf(part);
  if (!edges) return undefined;
  const anchor = { x: end === "far" ? edges.right : edges.left, y: edges.y };
  if (part.kind === "led") {
    const lifted = liftedOverStanding(part, anchor, end, standing, labelled);
    if (lifted) return lifted;
  }
  if (part.kind === "button") {
    const { x: mid, y: cy } = buttonCentre(part);
    // How far along towards its label's end a button is: larger is nearer that end.
    const along = (button: Extract<Part, { kind: "button" }>) =>
      end === "far" ? buttonCentre(button).x : -buttonCentre(button).x;
    // Only a button at the same height, going the same way, is in the line: one above or below
    // the channel leaves a leader along it room to pass (scratchpi's ADR 0154).
    const line = labelled.flatMap((other) =>
      other.kind === "button" &&
      labelEndOf(other) === end &&
      Math.abs(buttonCentre(other).y - cy) < BUTTON_BODY_MM
        ? [other]
        : [],
    );
    const isBlocked = (button: Extract<Part, { kind: "button" }>) =>
      line.some((other) => other !== button && along(other) - along(button) > BUTTON_BODY_MM);
    if (isBlocked(part)) {
      const blocked = line.filter(isBlocked).sort((a, b) => along(b) - along(a));
      const index = blocked.indexOf(part);
      const above = index % 2 === 0;
      const further = Math.floor(index / 2) * PIN_PITCH_MM;
      const edge = above ? cy - BUTTON_BODY_MM / 2 : cy + BUTTON_BODY_MM / 2;
      const lane = above
        ? nearestBetweenRows(edge - 1) - further
        : nearestBetweenRows(edge + 1) + further;
      return { dot: { x: mid, y: edge }, run: { x: mid, y: lane }, end };
    }
  }
  return { dot: anchor, run: anchor, end };
}

/**
 * The box a standing part takes on the board's own drawing, which a light's leader rises over rather
 * than run behind (ADR 0047, ADR 0050): a transistor's case, a capacitor's can, a light's lens down to
 * its legs' holes, and a button's body with its legs.
 */
function standingBoxOf(part: Part): Box | undefined {
  switch (part.kind) {
    case "transistor":
      return to92BoxOf(part);
    case "electrolytic":
      return canBoxOf(part);
    case "led": {
      const a = holeCentre(part.anode);
      const mid = (a.x + holeCentre(part.cathode).x) / 2;
      const top = a.y - LENS_RISE_MM - LENS_RADIUS_MM;
      const half = LENS_RADIUS_MM + 0.4;
      return { x: mid - half, y: top, w: 2 * half, h: a.y - top };
    }
    case "button": {
      const { x, y } = buttonCentre(part);
      const legs = legsOf(part).map((hole) => holeCentre(hole).y);
      const top = Math.min(y - BUTTON_BODY_MM / 2, ...legs) - 0.52;
      const bottom = Math.max(y + BUTTON_BODY_MM / 2, ...legs) + 0.52;
      return { x: x - BUTTON_BODY_MM / 2, y: top, w: BUTTON_BODY_MM, h: bottom - top };
    }
    default:
      return undefined;
  }
}

/**
 * A light's leader lifted over the standing parts in its way to its label's end of the board
 * (ADR 0047, ADR 0050): from the top of its lens, up to the first lane between rows above every one of
 * them that nothing standing crosses and no other leader runs along. A leader run straight would pass
 * behind them, and read as running into them. The lights nearer the end choose first, so that a
 * light further from it rises higher, and its leader crosses none of theirs.
 */
function liftedOverStanding(
  part: Extract<Part, { kind: "led" }>,
  anchor: Point,
  end: LabelEnd,
  standing: readonly Part[],
  labelled: readonly Part[],
): Leader | undefined {
  const [from, to] = end === "far" ? [anchor.x, BREADBOARD_WIDTH_MM] : [0, anchor.x];
  const boxes = standing.flatMap((other) => {
    const box = other === part ? undefined : standingBoxOf(other);
    return box && box.x < to && box.x + box.w > from ? [box] : [];
  });
  const across = (y: number) => boxes.filter((box) => box.y < y && box.y + box.h > y);
  const blocking = across(anchor.y);
  if (blocking.length === 0) return undefined;
  const a = holeCentre(part.anode);
  const mid = (a.x + holeCentre(part.cathode).x) / 2;
  const top = a.y - LENS_RISE_MM - LENS_RADIUS_MM;
  const highest = Math.min(top, ...blocking.map((box) => box.y));
  // The lanes other leaders run along to the same end: every part's but a light's further from it,
  // which keeps clear of this one's in turn.
  const nearer = (other: Part) => {
    const edges = anchorOf(other);
    return edges !== undefined && (end === "far" ? edges.right > anchor.x : edges.left < anchor.x);
  };
  const taken = labelled.flatMap((other) =>
    other !== part && labelEndOf(other) === end && (other.kind !== "led" || nearer(other))
      ? [leaderOf(other, labelled, standing)?.run.y ?? Number.NaN]
      : [],
  );
  const floor = isOnSecondBoard(part.anode) ? SECOND_BOARD_Y_MM : 0;
  const lane = BETWEEN_ROWS.filter((y) => y > floor && y < highest - 0.5)
    .sort((p, q) => q - p)
    .find((y) => across(y).length === 0 && !taken.some((t) => Math.abs(t - y) < 0.01));
  if (lane === undefined) return undefined;
  return { dot: { x: mid, y: top }, run: { x: mid, y: lane }, end };
}

/**
 * Where a part's leader can start: its left-hand and right-hand edges, at a height between two rows.
 * It leaves from the side that faces its label's end.
 */
function anchorOf(part: Part): { left: number; right: number; y: number } | undefined {
  switch (part.kind) {
    case "led": {
      const a = holeCentre(part.anode);
      const k = holeCentre(part.cathode);
      const mid = (a.x + k.x) / 2;
      const centre = a.y - LENS_RISE_MM;
      const y = nearestBetweenRows(centre);
      const dy = Math.min(Math.abs(y - centre), LENS_RADIUS_MM);
      const reach = y > centre ? LENS_RADIUS_MM : Math.sqrt(LENS_RADIUS_MM ** 2 - dy ** 2);
      return { left: mid - reach - 0.2, right: mid + reach + 0.2, y };
    }
    case "button": {
      const { x: mid, y } = buttonCentre(part);
      return { left: mid - BUTTON_BODY_MM / 2 - 0.2, right: mid + BUTTON_BODY_MM / 2 + 0.2, y };
    }
    case "buzzer": {
      const p = holeCentre(part.plus);
      const m = holeCentre(part.minus);
      const mid = (p.x + m.x) / 2;
      const centre = p.y - BUZZER_LIFT_MM - BUZZER_HEIGHT_MM / 2;
      return {
        left: mid - BUZZER_RADIUS_MM - 0.2,
        right: mid + BUZZER_RADIUS_MM + 0.2,
        y: nearestBetweenRows(centre),
      };
    }
    case "rgbLed": {
      const xs = legsOf(part).map((leg) => holeCentre(leg).x);
      const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
      const centre = holeCentre(part.power).y - RGB_LENS_RISE_MM;
      return {
        left: mid - RGB_LENS_RADIUS_MM - 0.2,
        right: mid + RGB_LENS_RADIUS_MM + 0.2,
        y: nearestBetweenRows(centre),
      };
    }
    case "ring": {
      // The header's ends: the ring itself hangs below the board, past the margin.
      const xs = legsOf(part).map((leg) => holeCentre(leg).x);
      return {
        left: Math.min(...xs) - PIN_PITCH_MM / 2 - 0.2,
        right: Math.max(...xs) + PIN_PITCH_MM / 2 + 0.2,
        y: holeCentre(part.dataIn).y + RING_HEADER_MM.gap + RING_HEADER_MM.height / 2,
      };
    }
    default:
      return undefined;
  }
}

/** Where the labels start: a little past the board's right-hand edge. */
const MARGIN_X = BREADBOARD_WIDTH_MM + 3;
/** A label's title and the line under it, as `drawing.css` sets them: their size in millimetres, and weight. */
export const CALLOUT_TITLE = { size: 2.5, weight: 900 } as const;
export const CALLOUT_DETAIL = { size: 1.85, weight: 600 } as const;

/** A label is a title and a line under it; the next one starts at least this far down. */
const LABEL_PITCH_MM = 5.8;

/**
 * Where each label goes: level with its part, unless that would put it on top of the one
 * above, in which case it moves down and its leader bends in the margin to reach it.
 */
function labelHeights(
  parts: readonly DrawnPart[],
  leaders: ReadonlyMap<DrawnPart, Leader>,
): Map<DrawnPart, number> {
  const labelled = parts
    .flatMap((drawn) => {
      const leader = leaders.get(drawn);
      return leader?.end === "far" ? [{ drawn, y: leader.run.y }] : [];
    })
    .sort((a, b) => a.y - b.y);
  const heights = new Map<DrawnPart, number>();
  let previous = Number.NEGATIVE_INFINITY;
  for (const { drawn, y } of labelled) {
    const at = Math.max(y, previous + LABEL_PITCH_MM);
    heights.set(drawn, at);
    previous = at;
  }
  return heights;
}

/** Where a label stands on the page once the board is turned, and how its words are anchored. */
interface LabelPlace {
  /** The leader's last point. */
  readonly end: Point;
  readonly title: Point;
  readonly detail: Point;
  readonly anchor: "start" | "middle" | "end";
  /** The box its words take, to size the picture by. */
  readonly box: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
}

/** How wide a label's words are drawn: its title's or its line's, whichever is wider (ADR 0012). */
const labelWidthOf = (label: { title: string; detail: string }): number =>
  Math.max(
    widthOf(label.title, CALLOUT_TITLE.size, CALLOUT_TITLE.weight),
    widthOf(label.detail, CALLOUT_DETAIL.size, CALLOUT_DETAIL.weight),
  );

/**
 * Where a leader leaves the board: just past the end its label is past, level with where it ran
 * along the rows.
 */
const bendOf = (leader: Leader): Point => ({
  x: leader.end === "far" ? BREADBOARD_WIDTH_MM + 0.8 : -0.8,
  y: leader.run.y,
});

/**
 * Where each label past one end of the board stands, once the board is turned (ADR 0024, ADR 0027):
 * in a column beside that end when the board lies flat, and in a row above or below it when it
 * stands, each kept in its part's order and moved along only as far as the one before it needs. At
 * 0°, the far end's labels are `labelHeights`', as they have always been.
 */
function labelPlaces(
  parts: readonly DrawnPart[],
  leaders: ReadonlyMap<DrawnPart, Leader>,
  end: LabelEnd,
): Map<DrawnPart, LabelPlace> {
  const labelled = parts.flatMap((drawn) => {
    const leader = leaders.get(drawn);
    return leader?.end === end && drawn.label
      ? [{ drawn, bend: turned(bendOf(leader), turn), width: labelWidthOf(drawn.label) }]
      : [];
  });
  // That end of the board on the page, and the way out past it.
  const corner = turned({ x: end === "far" ? BREADBOARD_WIDTH_MM : 0, y: 0 }, turn);
  const out = turned({ x: end === "far" ? 1 : -1, y: 0 }, turn);
  const places = new Map<DrawnPart, LabelPlace>();
  if (!isStanding(turn)) {
    const x = corner.x + 3 * out.x;
    const anchor = out.x > 0 ? "start" : "end";
    let previous = Number.NEGATIVE_INFINITY;
    for (const { drawn, bend, width } of labelled.sort((a, b) => a.bend.y - b.bend.y)) {
      const y = Math.max(bend.y, previous + LABEL_PITCH_MM);
      previous = y;
      places.set(drawn, {
        end: { x: x - 0.8 * out.x, y },
        title: { x, y: y - 0.3 },
        detail: { x, y: y + 2.4 },
        anchor,
        box: { x: anchor === "end" ? x - width : x, y: y - 2.6, w: width, h: 5.6 },
      });
    }
    return places;
  }
  const below = out.y > 0;
  const edge = corner.y + 3 * out.y;
  let right = Number.NEGATIVE_INFINITY;
  for (const { drawn, bend, width } of labelled.sort((a, b) => a.bend.x - b.bend.x)) {
    const x = Math.max(bend.x, right + 1.5 + width / 2);
    right = x + width / 2;
    // Below the board the title comes first, as everywhere; above it, the line is nearer the board.
    places.set(drawn, {
      end: { x, y: below ? edge - 0.6 : edge + 0.6 },
      title: { x, y: below ? edge + 2.2 : edge - 3.1 },
      detail: { x, y: below ? edge + 4.7 : edge - 0.6 },
      anchor: "middle",
      box: { x: x - width / 2, y: below ? edge : edge - 5, w: width, h: 5 },
    });
  }
  return places;
}

/**
 * The picture's box on a turned board: the board's own box turned, and every label's beside it, with
 * the same 3 mm to spare the board has at 0°.
 */
function turnedView(
  board: { x: number; y: number; w: number; h: number },
  places: readonly LabelPlace[],
): { x: number; y: number; w: number; h: number } {
  const corners = [
    { x: board.x, y: board.y },
    { x: board.x + board.w, y: board.y },
    { x: board.x, y: board.y + board.h },
    { x: board.x + board.w, y: board.y + board.h },
  ].map((corner) => turned(corner, turn));
  const boxes = places.map((place) => place.box);
  const xs = [...corners.map((c) => c.x), ...boxes.flatMap((b) => [b.x - 1, b.x + b.w + 1])];
  const ys = [...corners.map((c) => c.y), ...boxes.flatMap((b) => [b.y - 1, b.y + b.h + 1])];
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** A label on a turned board: its leader along the board as at 0°, then to its place on the page. */
function drawTurnedLabel(
  leader: Leader,
  label: { title: string; detail: string },
  place: LabelPlace,
): string {
  const { dot, run } = leader;
  const bend = bendOf(leader);
  const along = [dot, ...(run.x === dot.x && run.y === dot.y ? [] : [run]), bend]
    .map((point) => `${n(point.x)},${n(point.y)}`)
    .join(" ");
  const from = turned(bend, turn);
  const anchor = place.anchor === "start" ? "" : ` text-anchor="${place.anchor}"`;
  return (
    circle(dot.x, dot.y, 0.4, `class="callout-dot"`) +
    `<polyline points="${along}" fill="none" class="callout-leader"/>` +
    `<g transform="rotate(${-turn})">` +
    `<polyline points="${n(from.x)},${n(from.y)} ${n(place.end.x)},${n(place.end.y)}" fill="none" class="callout-leader"/>` +
    `<text x="${n(place.title.x)}" y="${n(place.title.y)}"${anchor} class="callout-title">${escaped(label.title)}</text>` +
    `<text x="${n(place.detail.x)}" y="${n(place.detail.y)}"${anchor} class="callout-detail">${escaped(label.detail)}</text>` +
    "</g>"
  );
}

function drawLabel(leader: Leader, label: { title: string; detail: string }, y: number): string {
  const { dot, run } = leader;
  const bend = BREADBOARD_WIDTH_MM + 0.8;
  const points = [dot, ...(run.x === dot.x && run.y === dot.y ? [] : [run])]
    .map((point) => `${n(point.x)},${n(point.y)}`)
    .join(" ");
  return (
    circle(dot.x, dot.y, 0.4, `class="callout-dot"`) +
    `<polyline points="${points} ${n(bend)},${n(run.y)} ${n(MARGIN_X - 0.8)},${n(y)}" fill="none" class="callout-leader"/>` +
    `<text x="${n(MARGIN_X)}" y="${n(y - 0.3)}" class="callout-title">${escaped(label.title)}</text>` +
    `<text x="${n(MARGIN_X)}" y="${n(y + 2.4)}" class="callout-detail">${escaped(label.detail)}</text>`
  );
}

function drawPart(
  drawn: DrawnPart,
  colours: Pick<Breadboard, "ledColour" | "buttonColour">,
  leader: Leader | undefined,
  labelY: number | undefined,
  place: LabelPlace | undefined,
  others: readonly Part[],
): string {
  const { part } = drawn;
  let body: string;
  switch (part.kind) {
    case "wire":
      body = drawWire(part);
      break;
    case "resistor":
      body = drawResistor(
        part.from,
        part.to,
        part.ohms,
        tagOf(part, others),
        placeTag(part, others)?.lines ?? 1,
      );
      break;
    case "led":
      body = drawLed(part.anode, part.cathode, colours.ledColour(part.led));
      break;
    case "button":
      body = drawButton(part, colours.buttonColour(part.button));
      break;
    case "buzzer":
      body = drawBuzzer(part.plus, part.minus);
      break;
    case "rgbLed":
      body = drawRgbLed(part);
      break;
    case "ring":
      body = drawRing(part);
      break;
    case "electrolytic":
      body = drawElectrolytic(part);
      break;
    case "transistor":
      body = drawTransistor(part);
      break;
    case "diode":
      body = drawDiode(part, tagOf(part, others), placeTag(part, others)?.lines ?? 1);
      break;
  }
  const label =
    drawn.label && leader && place
      ? drawTurnedLabel(leader, drawn.label, place)
      : drawn.label && leader && labelY !== undefined
        ? drawLabel(leader, drawn.label, labelY)
        : "";
  return `<g class="part" data-g="${drawn.group}" data-kind="${part.kind}">${body}${label}</g>`;
}

/** The glow a lit lens gives off, one gradient per colour the circuit has. */
function glowGradient(colour: LedColour): string {
  const fill = token(`led-${colour}`);
  return (
    `<radialGradient id="glow-${colour}">` +
    `<stop offset="0" stop-color="${fill}" stop-opacity="0.9"/>` +
    `<stop offset="0.45" stop-color="${fill}" stop-opacity="0.35"/>` +
    `<stop offset="1" stop-color="${fill}" stop-opacity="0"/>` +
    "</radialGradient>"
  );
}

/** The whole picture, as one `<svg>` element, at the quarter turn it asks for (ADR 0003). */
export function drawBreadboard(drawing: Breadboard): string {
  turn = drawing.orientation ?? 0;
  sayOhms = drawing.ohms ?? formatOhms;
  pico = !drawing.supply;
  try {
    return drawTurned(drawing);
  } finally {
    turn = 0;
    sayOhms = formatOhms;
    pico = true;
  }
}

function drawTurned(drawing: Breadboard): string {
  const colours = [
    ...new Set(
      drawing.parts.flatMap(({ part }): LedColour[] =>
        part.kind === "led"
          ? [drawing.ledColour(part.led)]
          : part.kind === "rgbLed"
            ? ["white"]
            : part.kind === "ring"
              ? ["red"]
              : [],
      ),
    ),
  ];
  const second = usesSecondBoard(drawing.parts.map(({ part }) => part));
  const rows = tagRows(drawing.tags);
  const left = -14;
  // The margin is as wide as it always was, or as its widest label measures, whichever is wider.
  const widest = Math.max(
    0,
    ...drawing.parts.flatMap(({ label }) =>
      label
        ? [
            widthOf(label.title, CALLOUT_TITLE.size, CALLOUT_TITLE.weight),
            widthOf(label.detail, CALLOUT_DETAIL.size, CALLOUT_DETAIL.weight),
          ]
        : [],
    ),
  );
  const width = Math.max(BREADBOARD_WIDTH_MM + 26, MARGIN_X + widest + 2) - left;
  // Room past an edge an arching jumper rises over, and the same margin as ever where none does.
  const arches = drawing.parts.flatMap(({ part }) =>
    part.kind === "wire" && part.arch ? [part] : [],
  );
  const over = (top: boolean) =>
    arches.some((part) => archesOverTop(part) === top) ? ARCH_LIFT_MM + 1.5 : 0;
  // A second board above the first (scratchpi's ADR 0226) is room enough for an arch over the top edge.
  const top = second ? SECOND_BOARD_Y_MM - 3 : -3 - over(true);
  // A ring laid out below the board (scratchpi's ADR 0238) is room enough for an arch under it.
  const rings = drawing.parts.flatMap(({ part }) => (part.kind === "ring" ? [part] : []));
  const bottom = Math.max(
    BREADBOARD_HEIGHT_MM + 3 + over(false),
    ...rings.map((ring) => ringCentreOf(ring).y + RING_MM.outer + 3),
  );
  const height = bottom - top;
  const labelled = drawing.parts.filter((drawn) => drawn.label).map((drawn) => drawn.part);
  const leaders = new Map(
    drawing.parts.flatMap((drawn) => {
      const leader = drawn.label
        ? leaderOf(
            drawn.part,
            labelled,
            drawing.parts.map(({ part }) => part),
          )
        : undefined;
      return leader ? [[drawn, leader] as const] : [];
    }),
  );
  const labels = labelHeights(drawing.parts, leaders);
  // At 0° the far end's labels stand where they always have, by `labelHeights`; every other label is
  // placed past its end of the board (ADR 0027).
  const places = new Map([
    ...labelPlaces(drawing.parts, leaders, "near"),
    ...(turn === 0 ? [] : labelPlaces(drawing.parts, leaders, "far")),
  ]);
  // At 0° the labels past the near end widen the picture to the left, and may reach past its top.
  const nearBoxes = turn === 0 ? [...places.values()].map((place) => place.box) : [];
  const flatLeft = Math.min(left, ...nearBoxes.map((box) => box.x - 2));
  const flatTop = Math.min(top, ...nearBoxes.map((box) => box.y - 1));
  const flatBottom = Math.max(bottom, ...nearBoxes.map((box) => box.y + box.h + 1));
  // Turned, the picture is the board's own box turned, reaching its far end or a ring's, which hangs
  // past it (scratchpi's ADR 0238), and its labels' boxes beside it.
  const far = Math.max(
    BREADBOARD_WIDTH_MM + 1.5,
    ...rings.map((ring) => ringCentreOf(ring).x + RING_MM.outer + 3),
  );
  const view =
    turn === 0
      ? { x: flatLeft, y: flatTop, w: width + left - flatLeft, h: flatBottom - flatTop }
      : turnedView({ x: left, y: top, w: far - left, h: height }, [...places.values()]);
  // Wires are laid over everything else, the way they are on the bench, and an arching one is
  // over them too.
  const ordered = [
    ...drawing.parts.filter(({ part }) => part.kind !== "wire"),
    ...drawing.parts.filter(({ part }) => part.kind === "wire" && !part.arch),
    ...drawing.parts.filter(({ part }) => part.kind === "wire" && part.arch),
  ];
  return (
    `<svg class="breadboard-drawing" viewBox="${n(view.x)} ${n(view.y)} ${n(view.w)} ${n(view.h)}" role="img" aria-labelledby="breadboard-title breadboard-description">` +
    `<title id="breadboard-title">${escaped(drawing.title)}</title>` +
    `<desc id="breadboard-description">${escaped(drawing.description)}</desc>` +
    `<defs>${colours.map(glowGradient).join("")}</defs>` +
    (turn === 0 ? "" : `<g transform="rotate(${turn})">`) +
    (second ? drawPlastic(SECOND_BOARD_Y_MM) : "") +
    drawPlastic() +
    (drawing.supply
      ? drawSupply(drawing.supply)
      : drawPico() + drawing.tags.map((tag) => drawTag(tag, rows.get(tag) ?? 0)).join("")) +
    ordered
      .map((part) =>
        drawPart(
          part,
          drawing,
          leaders.get(part),
          labels.get(part),
          places.get(part),
          drawing.parts.map((drawn) => drawn.part),
        ),
      )
      .join("") +
    (turn === 0 ? "" : "</g>") +
    "</svg>"
  );
}

// --- What crowds. ---

/** A box in the board's own drawing. */
interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

const overlap = (a: Box, b: Box): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** A lying part as a person finds it on the page: a resistor's value or a diode's model, and its holes. */
const lyingName = (part: Lying): string =>
  part.kind === "resistor"
    ? `the ${formatOhms(part.ohms)} resistor from ${printedName(part.from)} to ${printedName(part.to)}`
    : `the ${part.model} diode from ${printedName(part.anode)} to ${printedName(part.cathode)}`;

/**
 * Every word the engine places that crowds something at a quarter turn (ADR 0003, ADR 0007): a value
 * tag with nowhere clear of the wires, the parts, the Pico and the print, two tags on each other, or a
 * tag or a chip on a chip. The words printed on the board itself and the labels in the margin are
 * placed where nothing else is, and are not asked about.
 */
export function crowdingProblems(
  parts: readonly Part[],
  orientation: Orientation,
  ohms: (value: number) => string = formatOhms,
  onPico = true,
): string[] {
  turn = orientation;
  sayOhms = ohms;
  pico = onPico;
  try {
    const problems: string[] = [];
    const lying = parts.flatMap((part) =>
      part.kind === "resistor" || part.kind === "diode" ? [part] : [],
    );
    const tags: { name: string; box: Box }[] = [];
    for (const part of lying) {
      const what = part.kind === "resistor" ? "value tag" : "model tag";
      const placed = placeTag(part, parts);
      if (!placed) {
        problems.push(`${lyingName(part)} has nowhere clear for its ${what}`);
        continue;
      }
      const clear = placed.at;
      const { w, h } = tagFootprintOf(tagLabelOf(part), placed.lines);
      tags.push({
        name: `${lyingName(part)}'s ${what}`,
        box: { x: clear.x - w / 2, y: clear.y - h / 2, w, h },
      });
    }
    // A circuit with a supply has no Pico, and so no pin's chip (ADR 0032).
    const pins = pico
      ? [
          ...new Set(
            parts.flatMap((part) => legsOf(part).flatMap((hole) => pinOfStrip(hole) ?? [])),
          ),
        ]
      : [];
    const pinTags = pins.map((pin) => ({ pin, group: "" }));
    const rows = tagRows(pinTags);
    const chips = pinTags.map((tag) => {
      const label = HEADER_PINS.find((header) => header.number === tag.pin)?.label ?? "";
      return { name: `${label}'s chip`, box: chipOf(tag.pin, rows.get(tag) ?? 0).box };
    });
    const words = [...tags, ...chips];
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const [a, b] = [words[i], words[j]];
        if (a && b && overlap(a.box, b.box)) problems.push(`${a.name} is on ${b.name}`);
      }
    }
    return problems;
  } finally {
    turn = 0;
    sayOhms = formatOhms;
    pico = true;
  }
}
