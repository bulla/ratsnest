/**
 * The four ways a drawing is turned, in degrees clockwise from the copied one (ADR 0003): the USB
 * on the left, at the top, on the right or at the bottom. Never mirrored, and never any other angle.
 */
export const ORIENTATIONS = [0, 90, 180, 270] as const;

export type Orientation = (typeof ORIENTATIONS)[number];

/** Whether the board stands up, its long side running down the page. */
export const isStanding = (orientation: Orientation): boolean => orientation % 180 !== 0;

/** A point of the board's own drawing, where it lands once the board is turned. */
export function turned(
  point: { readonly x: number; readonly y: number },
  orientation: Orientation,
): { x: number; y: number } {
  switch (orientation) {
    case 0:
      return { x: point.x, y: point.y };
    case 90:
      return { x: -point.y, y: point.x };
    case 180:
      return { x: -point.x, y: -point.y };
    case 270:
      return { x: point.y, y: -point.x };
  }
}

/** A point on the page, back in the board's own drawing: what `turned` undoes. */
export function unturned(
  point: { readonly x: number; readonly y: number },
  orientation: Orientation,
): { x: number; y: number } {
  return turned(point, ((360 - orientation) % 360) as Orientation);
}
