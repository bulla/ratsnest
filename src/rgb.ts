import type { LedColour } from "./circuit";

/**
 * The colours an RGB LED can be lit in (scratchpi's ADR 0223), in the order its menu offers them: red,
 * green, blue and yellow first, as the owner asked, then the rest. Each is a lamp colour too, so
 * the drawing lights it in a token already measured (scratchpi's ADR 0015).
 */
export const RGB_COLOURS = [
  "red",
  "green",
  "blue",
  "yellow",
  "pink",
  "purple",
  "orange",
  "aqua",
  "white",
] as const satisfies readonly LedColour[];

export type RgbColour = (typeof RGB_COLOURS)[number];

/** A colour as an addressable LED takes it: red, green and blue, each from 0 to 255. */
export type Rgb = readonly [red: number, green: number, blue: number];

/**
 * What each colour is sent to the LED as (scratchpi's ADR 0223). The mixed ones are tuned for an LED,
 * after Adafruit's LED Animation library, rather than taken from a screen: an LED's green is
 * far brighter than its red, and a screen's yellow, 255, 255, 0, comes out greenish on one.
 */
export const RGB_LEVELS: Readonly<Record<RgbColour, Rgb>> = {
  red: [255, 0, 0],
  green: [0, 255, 0],
  blue: [0, 0, 255],
  yellow: [255, 150, 0],
  pink: [255, 100, 120],
  purple: [180, 0, 255],
  orange: [255, 40, 0],
  aqua: [50, 255, 255],
  white: [255, 255, 255],
};

/** Every part out: what `turn off` sends, and what an LED nobody has sent anything shows. */
export const RGB_OFF: Rgb = [0, 0, 0];

/** What `turn on` lights an RGB LED in, the one colour that needs no choosing (scratchpi's ADR 0223). */
export const RGB_ON: Rgb = RGB_LEVELS.white;

/** The colour the palette's own blocks arrive holding: the first the owner named. */
export const DEFAULT_RGB_COLOUR: RgbColour = "red";

/** A stored colour read back, or undefined for one this build does not know. */
export function rgbColourOf(value: unknown): RgbColour | undefined {
  return RGB_COLOURS.find((colour) => colour === value);
}

/**
 * Which of a chain's LEDs a program's number names (scratchpi's ADR 0235): its index, counted from 0 as
 * MicroPython counts them, 0 being the one by the ring's pins. Past the last it goes round, so 12
 * is 0 again and -1 the last, as Python's `%` goes round. A fraction is cut towards 0 first, as
 * Python's `int` cuts it, which is what the code does with the same number (scratchpi's ADR 0237).
 */
export function chainIndexOf(number: number, count: number): number {
  return ((Math.trunc(number) % count) + count) % count;
}

/** Whether an RGB LED shows anything at all: what `is ( ) on?` asks of one (scratchpi's ADR 0223). */
export const isLit = (rgb: Rgb): boolean => rgb.some((part) => part > 0);

/** How bright it shows, from 0 to 1: its brightest part. */
export const brightnessOf = (rgb: Rgb): number => Math.max(...rgb) / 255;

/**
 * Which of the nine colours a colour is nearest, by its shape rather than its strength: red at
 * half brightness is red. Undefined for one that is out. scratchpi's simulator drew an RGB LED in
 * it (scratchpi's ADR 0224), so a blink too fast to see showed as the nearest of the nine.
 */
export function nearestColour(rgb: Rgb): RgbColour | undefined {
  const top = Math.max(...rgb);
  if (top <= 0) return undefined;
  const shape = rgb.map((part) => part / top);
  let best: RgbColour = RGB_COLOURS[0];
  let distance = Number.POSITIVE_INFINITY;
  for (const colour of RGB_COLOURS) {
    const levels = RGB_LEVELS[colour];
    const peak = Math.max(...levels);
    const away = levels.reduce((sum, part, i) => sum + (part / peak - (shape[i] ?? 0)) ** 2, 0);
    if (away < distance) {
      best = colour;
      distance = away;
    }
  }
  return best;
}

/**
 * An RGB LED's picture (scratchpi's ADR 0224): a disc cut in three equal wedges, red from the top round to
 * the lower right, green across the bottom, and blue up the left. Angles in degrees, clockwise
 * from the top.
 */
export const PIE_WEDGES = [
  { colour: "red", from: 0, to: 120 },
  { colour: "green", from: 120, to: 240 },
  { colour: "blue", from: 240, to: 360 },
] as const satisfies readonly { colour: RgbColour; from: number; to: number }[];

/** One wedge of the pie, as an SVG path's `d`, about a centre and with a radius. */
export function wedgePath(cx: number, cy: number, r: number, from: number, to: number): string {
  const round = (value: number) => Math.round(value * 1000) / 1000;
  const at = (degrees: number) => {
    const radians = (degrees * Math.PI) / 180;
    return `${round(cx + r * Math.sin(radians))} ${round(cy - r * Math.cos(radians))}`;
  };
  return `M${round(cx)} ${round(cy)}L${at(from)}A${round(r)} ${round(r)} 0 0 1 ${at(to)}Z`;
}

/**
 * One wedge of a ring rather than a pie, between two radii, as an SVG path's `d`: the ring's
 * swatch (scratchpi's ADR 0236). Angles in degrees, clockwise from the top, as the pie's are.
 */
export function arcPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  from: number,
  to: number,
): string {
  const round = (value: number) => Math.round(value * 1000) / 1000;
  const at = (r: number, degrees: number) => {
    const radians = (degrees * Math.PI) / 180;
    return `${round(cx + r * Math.sin(radians))} ${round(cy - r * Math.cos(radians))}`;
  };
  const large = to - from > 180 ? 1 : 0;
  return (
    `M${at(outer, from)}A${round(outer)} ${round(outer)} 0 ${large} 1 ${at(outer, to)}` +
    `L${at(inner, to)}A${round(inner)} ${round(inner)} 0 ${large} 0 ${at(inner, from)}Z`
  );
}
