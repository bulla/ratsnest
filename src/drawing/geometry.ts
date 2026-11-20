/**
 * The Pico 2 W, in millimetres, from the mechanical specification in its datasheet
 * (RP-008304-DS, §2 and Figures 2 and 3) rather than from a traced diagram — scratchpi's ADR 0022,
 * which supersedes scratchpi's ADR 0011's source of geometry and leaves the rest of it standing.
 *
 * Everything here is a number a person can read and argue with, and the SVG's viewBox is
 * in these same units, so the drawing is dimensionally the board rather than a picture of
 * one. Nothing in this file is measured off an image; the positions are computed from the
 * pitch, and `geometry.test.ts` holds them against the facts — 2.54 apart, inside the
 * outline, and exactly the twenty-six GPIO scratchpi's ADR 0010 says the board breaks out.
 */

/** "a single sided 51 mm × 21 mm × 1 mm PCB", with the USB overhanging the top edge. */
export const BOARD_LENGTH_MM = 51;
export const BOARD_WIDTH_MM = 21;

/** "the 40 main user pins on a 2.54 mm (0.1″) pitch grid with 1 mm holes". */
export const PIN_PITCH_MM = 2.54;
export const PIN_HOLE_DIAMETER_MM = 1;
export const PINS_PER_SIDE = 20;

/**
 * Across the board: Figure 3 dimensions the two pad columns 17.78 mm apart and 1.61 mm
 * in from each long edge, and 1.61 + 17.78 + 1.61 = 21 exactly.
 */
export const PIN_EDGE_INSET_MM = 1.61;

/**
 * Along the board: Figure 3's chain reads 51, then 48.26 for the pad run (19 × 2.54),
 * then the pitch, then 1.6 from the top edge to the first pad. The 1.14 mm left at the
 * bottom is the antenna's, which is on that edge and wants the clearance.
 */
export const PIN_TOP_INSET_MM = 1.6;

/** 19 gaps, not 20 — the distance from pin 1's centre to pin 20's. */
export const PIN_RUN_MM = (PINS_PER_SIDE - 1) * PIN_PITCH_MM;

export type PinSide = "left" | "right";

/**
 * What a pin is, at the only resolution a reader needs. Figure 2 colours eight kinds;
 * scratchpi's ADR 0011 says the alternate functions are the noise to leave out, and these four are
 * what is left once they are gone: somewhere a light can go, the other side of the
 * circuit, something carrying volts, and something that resets the board if you touch it.
 *
 * ADC_VREF is counted as power rather than given a kind of its own. §2.1 calls it "the
 * ADC power supply (and reference) voltage", and a fifth green would be a fifth green.
 */
export type PinKind = "gpio" | "ground" | "power" | "control";

export interface HeaderPin {
  /** 1 to 40, as the board numbers them: 1–20 down the left, 21–40 up the right. */
  readonly number: number;
  /** What the board calls it: "GP15", "GND", "VSYS". */
  readonly label: string;
  /** Set only for the pins a light can be wired to. Absent on power and ground. */
  readonly gpio?: number;
  readonly kind: PinKind;
  readonly side: PinSide;
  /** Millimetres from the left edge, looking at the board with the USB at the top. */
  readonly x: number;
  /** Millimetres from the top (USB) edge. */
  readonly y: number;
}

/**
 * The forty pins in order, from Figure 2. Seven grounds and seven other pins —
 * VBUS, VSYS, 3V3_EN, 3V3(OUT), ADC_VREF, AGND and RUN — leave twenty-six GPIO, which
 * is the count scratchpi's ADR 0010 gives and the test checks against `USABLE_GPIO`.
 *
 * AGND is pin 33's own name in §2.1; Figure 2 draws it as a ground with AGND alongside.
 * It is the ground reference for GP26–29 and it is not a pin a light goes on, so it is
 * labelled the way the datasheet labels it and carries no GPIO.
 */
// biome-ignore format: ten to a row, so the table reads like the pin header it is.
const PIN_LABELS: readonly string[] = [
  // 1–10
  "GP0", "GP1", "GND", "GP2", "GP3", "GP4", "GP5", "GND", "GP6", "GP7",
  // 11–20
  "GP8", "GP9", "GND", "GP10", "GP11", "GP12", "GP13", "GND", "GP14", "GP15",
  // 21–30
  "GP16", "GP17", "GND", "GP18", "GP19", "GP20", "GP21", "GND", "GP22", "RUN",
  // 31–40
  "GP26", "GP27", "AGND", "GP28", "ADC_VREF", "3V3(OUT)", "3V3_EN", "GND", "VSYS", "VBUS",
];

/**
 * Pins 1–20 run down the left edge; 21–40 run back up the right, so pin 21 is opposite
 * pin 20 and pin 40 is opposite pin 1. That is why this is a fold and not a second row.
 */
function rowOf(number: number): number {
  return number <= PINS_PER_SIDE ? number - 1 : PINS_PER_SIDE * 2 - number;
}

/** Shorting either of these to ground does something to the board, not to a circuit. */
const CONTROL_PINS = ["RUN", "3V3_EN"];

/** AGND is a ground: §2.1 names pin 33 AGND, and Figure 2 draws it as a ground. */
function kindOf(label: string, gpio: number | undefined): PinKind {
  if (gpio !== undefined) return "gpio";
  if (label.endsWith("GND")) return "ground";
  return CONTROL_PINS.includes(label) ? "control" : "power";
}

function headerPin(number: number, label: string): HeaderPin {
  const side: PinSide = number <= PINS_PER_SIDE ? "left" : "right";
  const digits = /^GP(\d+)$/.exec(label)?.[1];
  const gpio = digits === undefined ? undefined : Number(digits);
  return {
    number,
    label,
    ...(gpio === undefined ? {} : { gpio }),
    kind: kindOf(label, gpio),
    side,
    x: side === "left" ? PIN_EDGE_INSET_MM : BOARD_WIDTH_MM - PIN_EDGE_INSET_MM,
    y: PIN_TOP_INSET_MM + rowOf(number) * PIN_PITCH_MM,
  };
}

export const HEADER_PINS: readonly HeaderPin[] = PIN_LABELS.map((label, index) =>
  headerPin(index + 1, label),
);

/** Where a light wired to this GPIO sits on the board, or undefined if it is not broken out. */
export function headerPinOfGpio(gpio: number): HeaderPin | undefined {
  return HEADER_PINS.find((pin) => pin.gpio === gpio);
}

/**
 * Everything else on the board, measured off the official pinout — the poster at
 * `datasheets.raspberrypi.com/picow/pico-2-w-pinout.pdf`, rendered at 32.59 px/mm and
 * probed for the extent of every shape on the green. The drawing is an adaptation of it
 * and carries its attribution (scratchpi's ADR 0023, ATTRIBUTION.md); none of it is traced, and the
 * board's own dimensions still come from the mechanical specification (scratchpi's ADR 0022).
 *
 * None of this is load-bearing: nothing measures from any of it, and it is here so that
 * the drawing is recognisably *this* board and not a green rectangle with pins on it.
 */

/**
 * A castellation: a copper tab running from the board's edge inwards, with the hole
 * drilled through it. It is flush with the edge rather than proud of it, which is how
 * the pinout draws it.
 */
export const PAD = { outer: 0, length: 2.09, height: 1.45 } as const;

/** The micro USB overhangs the top edge, which is how you tell which way up it is. */
export const USB = { x: 6.72, y: -2.2, width: 7.46, height: 6.2 } as const;
/**
 * The socket's opening: a bar across the connector with two tabs hanging off it, which
 * is the shape that makes a micro USB port read as one at a glance.
 */
export const USB_MOUTH = { x: 7.3, y: 2.05, width: 6.4, height: 0.95 } as const;
export const USB_TABS: readonly { x: number; width: number }[] = [
  { x: 8.3, width: 1.35 },
  { x: 11.45, width: 1.35 },
];
export const USB_TAB_BOTTOM_MM = 3.7;

/**
 * A micro-USB plug seated in the port, seen from above as the rest of the board is: the
 * metal shoulder that stops at the socket's face, the moulded body a hand holds, a strain
 * relief tapering down to the cable, and the cable itself running away from the board
 * (scratchpi's ADR 0087). Micro-USB fixes the part that goes into the socket, not the part outside it,
 * so these are a typical cable's proportions rather than a published drawing's — and the
 * shoulder, the one part that is specified, is as wide as the socket it goes into.
 */
export const USB_PLUG = {
  centreX: USB.x + USB.width / 2,
  shoulder: { width: 7.2, length: 0.6 },
  body: { width: 10.2, length: 6.5 },
  relief: { length: 3, width: 3.4 },
  cable: { width: 3.4 },
} as const;

/** Where the strain relief meets the cable: the top of everything drawn of the plug. */
export const USB_PLUG_TOP_MM =
  USB.y - USB_PLUG.shoulder.length - USB_PLUG.body.length - USB_PLUG.relief.length;

/**
 * WL_GPIO0's LED and the silkscreen "LED" under it, inside pin 1's corner. The package
 * is 1.53 x 1.01 mm on the real board and is drawn at that size; the lamp over it is a
 * little larger, because a speck is no use as the thing someone is watching.
 */
export const ONBOARD_LED = { x: 4.88, y: 4.59, width: 1.53, height: 1.01 } as const;

/** The BOOTSEL button, with its name set sideways beside it. */
export const BOOTSEL = { x: 5.55, y: 9.67, width: 3.07, height: 4.02 } as const;

/** The RP2350. Its lid carries a raspberry, which is a trademark and is left off. */
export const CHIP = { x: 7.3, y: 20.38, width: 7.06, height: 7.06 } as const;

/** The CYW43439's shield can, and the crystal above it beside the debug header. */
export const RADIO = { x: 5.16, y: 32.9, width: 10.83, height: 9.85 } as const;
export const CRYSTAL = { x: 4.97, y: 30.07, width: 3.07, height: 2.03 } as const;

/** The three-pin debug header, right of centre, inside a silkscreened box. */
export const DEBUG = { x: 9.9, y: 30.2, width: 7.5, height: 2.4 } as const;
export const DEBUG_FIRST_PIN_X_MM = 11.15;
export const DEBUG_PINS = 3;
/** The debug header's holes, as the poster draws them inside their pads. */
export const DEBUG_HOLE_RADIUS_MM = 0.4;

/**
 * Four plated mounting holes. The ring is the pad measured off the pinout; the drill is
 * the ∅2.1 mm the mechanical specification gives, which the poster draws smaller.
 */
export const MOUNTING_HOLE = { ring: 1.55, drill: 1.05, insetX: 5.01, insetY: 1.9 } as const;

/** A hole drilled right through the board, which is where the panel behind shows. */
export interface DrilledHole {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
}

/**
 * Every hole through the board: the forty header holes, the four mounting holes and the
 * three in the debug header. They are cut out of the drawing rather than painted, because
 * a hole is where you see what the board is lying on — white on a white panel, and the
 * panel's dark in the dark scale (scratchpi's ADR 0028). Painting them white kept a light hole in a
 * board on a dark panel, which no real board has.
 */
export const DRILLED_HOLES: readonly DrilledHole[] = [
  ...HEADER_PINS.map((pin) => ({ cx: pin.x, cy: pin.y, r: PIN_HOLE_DIAMETER_MM / 2 })),
  ...[
    [MOUNTING_HOLE.insetX, MOUNTING_HOLE.insetY],
    [BOARD_WIDTH_MM - MOUNTING_HOLE.insetX, MOUNTING_HOLE.insetY],
    [MOUNTING_HOLE.insetX, BOARD_LENGTH_MM - MOUNTING_HOLE.insetY],
    [BOARD_WIDTH_MM - MOUNTING_HOLE.insetX, BOARD_LENGTH_MM - MOUNTING_HOLE.insetY],
  ].map(([cx = 0, cy = 0]) => ({ cx, cy, r: MOUNTING_HOLE.drill })),
  ...Array.from({ length: DEBUG_PINS }, (_, i) => ({
    cx: DEBUG_FIRST_PIN_X_MM + i * PIN_PITCH_MM,
    cy: DEBUG.y + DEBUG.height / 2,
    r: DEBUG_HOLE_RADIUS_MM,
  })),
];

/** What a part is made of, which is the only thing the drawing needs to know about it. */
export type PartMaterial = "pad" | "chip" | "metal";

/**
 * Every other shape on the green, as a rectangle: the flash, the regulator, the passives,
 * the test points. They carry no meaning and are never referred to by anything.
 */
export const COMPONENTS: readonly {
  x: number;
  y: number;
  width: number;
  height: number;
  material: PartMaterial;
}[] = [
  { x: 15.77, y: 4.97, width: 1.5, height: 2.52, material: "chip" },
  { x: 12.15, y: 5.95, width: 2.06, height: 1.53, material: "pad" },
  { x: 8.04, y: 6.17, width: 0.74, height: 0.4, material: "chip" },
  { x: 7.52, y: 6.87, width: 0.74, height: 0.4, material: "chip" },
  { x: 4.39, y: 6.9, width: 0.86, height: 0.86, material: "pad" },
  { x: 11.42, y: 9.33, width: 3.25, height: 2.52, material: "chip" },
  { x: 15.56, y: 9.33, width: 1.87, height: 2.52, material: "chip" },
  { x: 12.03, y: 13.75, width: 2.06, height: 1.53, material: "pad" },
  { x: 16.94, y: 14.94, width: 0.49, height: 0.43, material: "chip" },
  { x: 7.55, y: 15.53, width: 0.77, height: 0.4, material: "pad" },
  { x: 12.03, y: 15.59, width: 2.06, height: 1.53, material: "pad" },
  { x: 5.58, y: 15.99, width: 3.01, height: 2.03, material: "chip" },
  { x: 16.57, y: 17.34, width: 0.86, height: 0.77, material: "chip" },
  { x: 13.07, y: 18.29, width: 0.49, height: 1.01, material: "pad" },
  { x: 14.02, y: 18.29, width: 0.52, height: 1.01, material: "pad" },
  { x: 15.56, y: 18.29, width: 0.52, height: 1.01, material: "pad" },
  { x: 10.19, y: 18.44, width: 0.4, height: 0.74, material: "pad" },
  { x: 10.92, y: 18.44, width: 0.4, height: 0.74, material: "pad" },
  { x: 11.63, y: 18.44, width: 0.43, height: 0.74, material: "chip" },
  { x: 12.34, y: 18.44, width: 0.4, height: 0.74, material: "chip" },
  { x: 6.26, y: 19.09, width: 0.77, height: 0.4, material: "chip" },
  { x: 16.57, y: 19.67, width: 0.77, height: 0.4, material: "chip" },
  { x: 5.98, y: 19.82, width: 1.01, height: 0.52, material: "pad" },
  { x: 6.26, y: 20.77, width: 0.74, height: 0.4, material: "pad" },
  { x: 14.7, y: 20.93, width: 0.77, height: 0.4, material: "pad" },
  { x: 16.54, y: 22.95, width: 0.52, height: 1.01, material: "chip" },
  { x: 17.12, y: 24.79, width: 0.31, height: 1.01, material: "chip" },
  { x: 14.88, y: 24.95, width: 0.8, height: 0.8, material: "pad" },
  { x: 6.11, y: 25.16, width: 0.77, height: 0.4, material: "pad" },
  { x: 10.22, y: 28.78, width: 0.4, height: 0.77, material: "pad" },
  { x: 10.92, y: 28.78, width: 0.4, height: 0.77, material: "pad" },
  { x: 8.13, y: 30.26, width: 0.4, height: 0.77, material: "metal" },
  { x: 8.75, y: 30.56, width: 0.52, height: 0.98, material: "chip" },
  { x: 8.13, y: 31.51, width: 0.43, height: 0.74, material: "metal" },
  { x: 8.75, y: 46.89, width: 1.01, height: 0.52, material: "metal" },
  { x: 11.29, y: 46.89, width: 1.01, height: 0.52, material: "metal" },
  { x: 8.75, y: 49.3, width: 1.01, height: 0.52, material: "metal" },
  { x: 11.29, y: 49.3, width: 1.01, height: 0.52, material: "metal" },
];

/** The two capacitors the pinout draws in blue, which is the only spot of it on the board. */
export const BLUE_PARTS: readonly { x: number; y: number; width: number; height: number }[] = [
  { x: 15.44, y: 13.81, width: 1.32, height: 0.8 },
  { x: 15.4, y: 15.25, width: 0.52, height: 0.98 },
];
