/**
 * The ring of twelve RGB LEDs (scratchpi's ADR 0234), as the owner's photo has it: what the circuit's page
 * draws at its size (scratchpi's ADR 0238) and the board's column draws smaller (scratchpi's ADR 0236). Millimetres,
 * like `geometry.ts`. No DOM.
 *
 * Both drawings hang the ring with its header at the top, towards the board, so LED 0, the one
 * by the header (scratchpi's ADR 0235), is at the top of each.
 */

/**
 * The ring at its size, measured off the photo against its LEDs, which are 5 mm 5050 packages:
 * the board's outer and inner radius, each LED's side and its lens's radius, and the four
 * mounting holes between the LEDs, close to the outer edge.
 */
export const RING_MM = {
  outer: 24,
  inner: 16.5,
  led: 5,
  lens: 1.8,
  hole: 0.9,
  holeRadius: 22.3,
} as const;

/** The mounting holes, in degrees clockwise from the header: between LEDs, a quarter apart. */
export const RING_HOLE_ANGLES: readonly number[] = [45, 135, 225, 315];

/**
 * Which way round the LEDs count from LED 0, seen from the front: 1 clockwise, -1 the other
 * way. Clockwise is a guess (scratchpi's ADR 0235): the owner's ring has it on its back, and the field test
 * sets this one constant, which turns both drawings round.
 */
export const RING_TURNS: 1 | -1 = 1;

/**
 * Where an LED of the ring is, by its index, in degrees clockwise from the header, seen from the
 * front: LED 0 at 0, and each next one a twelfth of a turn on, the way `RING_TURNS` says.
 */
export function ringAngleOf(index: number, count: number): number {
  return ((((RING_TURNS * index * 360) / count) % 360) + 360) % 360;
}

/** A point on a circle about a centre, at an angle in degrees clockwise from the top. */
export function onCircle(
  cx: number,
  cy: number,
  r: number,
  degrees: number,
): { x: number; y: number } {
  const radians = (degrees * Math.PI) / 180;
  return { x: cx + r * Math.sin(radians), y: cy - r * Math.cos(radians) };
}

/** A circle as a path's `d`, to cut holes in a shape drawn `evenodd`. */
export function circlePath(cx: number, cy: number, r: number): string {
  const round = (value: number) => Math.round(value * 1000) / 1000;
  return `M${round(cx - r)} ${round(cy)}a${round(r)} ${round(r)} 0 1 0 ${round(2 * r)} 0a${round(r)} ${round(r)} 0 1 0 ${round(-2 * r)} 0Z`;
}

/** What a drawing of the ring's board needs: its two edges, and where its holes are. */
export interface RingBoard {
  readonly outer: number;
  readonly inner: number;
  readonly hole: number;
  readonly holeRadius: number;
}

/**
 * The ring's board, as a path's `d` drawn `evenodd`: its outer edge, its middle cut out, and its
 * four mounting holes, about a centre, at its size or as the column draws it.
 */
export function ringBoardPath(cx: number, cy: number, board: RingBoard = RING_MM): string {
  return [
    circlePath(cx, cy, board.outer),
    circlePath(cx, cy, board.inner),
    ...RING_HOLE_ANGLES.map((angle) => {
      const at = onCircle(cx, cy, board.holeRadius, angle);
      return circlePath(at.x, at.y, board.hole);
    }),
  ].join("");
}

/**
 * The ring as the board's column draws it (scratchpi's ADR 0236): under the board, not to scale. Half as
 * wide again as the board, its LEDs larger on it than they are on the ring, and its band wider,
 * so that the numbers fit on the board inside the LEDs. Millimetres, in the board's own drawing.
 */
export const RING_DRAWN = {
  outer: 15,
  inner: 7.8,
  /** How far from the middle each LED is centred. */
  band: 12.35,
  led: 3.7,
  lens: 1.35,
  /** How far from the middle each LED's number stands, and how tall it is. */
  number: 9.2,
  numberSize: 1.7,
  hole: 0.6,
  holeRadius: 14.05,
  /** The header: its pins' pitch, how far they stick up past it, and its plastic's height. */
  headerPitch: 1.6,
  pinLength: 1,
  headerHeight: 1.4,
} as const;
