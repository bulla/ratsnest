import type { PinKind } from "./geometry";

/**
 * How a header label is drawn. Figure 2 writes white on every chip including a pale green
 * and a pale pink, which measure 2.3:1 and 1.8:1 against it. scratchpi's ADR 0015 is a project rule
 * and outranks fidelity, so the two chips that keep white labels are shaded until they
 * clear 4.5:1, and the one that stays the figure's pale colour takes dark text and a
 * border instead — a pale chip with no outline has no visible extent on a white panel.
 *
 * Neither the fill nor the ink changes with the page's theme, and the ink is the half that
 * was got wrong: it used to be `surface` and `ink`, which both flip (scratchpi's ADR 0028), so the
 * dark scale wrote near-black on the shaded chips and near-white on the pale ones —
 * inverting every pairing measured below. A chip is part of a drawing of an object, and
 * an object does not repaint itself when the room does.
 *
 * The tokens are named rather than resolved here, so `tokens.test.ts` can measure exactly
 * the pairings the drawing actually uses (scratchpi's ADR 0015).
 */
export interface ChipStyle {
  /** The `--color-*` token the chip is filled with. */
  readonly fill: string;
  /** The `--color-*` token its label is written in. */
  readonly ink: string;
  /**
   * A chip close in tone to the panel behind it needs an outline to have a shape: the
   * pale ones on the light scale, and the ground rail's near-black on the dark one.
   */
  readonly bordered: boolean;
}

/** Each kind of header pin, as the chip that names a pin a circuit uses beside its hole. */
export const CHIP_STYLES: Record<PinKind, ChipStyle> = {
  gpio: { fill: "pin-gpio", ink: "on-chip", bordered: false },
  /* Outlined for the dark scale's sake: on a dark panel a near-black chip measures 1.5:1
     and has no edge, which is the same complaint scratchpi's ADR 0015 makes about a pale chip on a
     white one. The outline costs the light scale almost nothing. */
  ground: { fill: "pin-ground", ink: "on-chip", bordered: true },
  power: { fill: "pin-power", ink: "on-chip", bordered: false },
  control: { fill: "pin-control", ink: "on-pale-chip", bordered: true },
};

export const chipFill = (style: ChipStyle): string => `var(--color-${style.fill})`;
export const chipInk = (style: ChipStyle): string => `var(--color-${style.ink})`;
