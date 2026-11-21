/**
 * The two themes a page is drawn in, as one of its inputs (ADR 0005): the page around the drawing
 * changes with it, and the board and its parts do not.
 */
export const THEMES = ["dark", "light"] as const;

export type Theme = (typeof THEMES)[number];

/** The theme a page is made in when none is asked for. */
export const DEFAULT_THEME: Theme = "dark";
