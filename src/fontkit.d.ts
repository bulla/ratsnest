/**
 * The little of `fontkit` the engine uses (ADR 0012). fontkit ships no types, and declaring these
 * few members costs less than another dependency.
 */
declare module "fontkit" {
  export interface GlyphRun {
    readonly advanceWidth: number;
  }

  export interface Font {
    readonly unitsPerEm: number;
    /** Every code point the font has a glyph for. */
    readonly characterSet: readonly number[];
    readonly version: string;
    readonly variationAxes: Readonly<Record<string, { min: number; max: number }>>;
    hasGlyphForCodePoint(codePoint: number): boolean;
    layout(text: string): GlyphRun;
    getVariation(settings: Readonly<Record<string, number>>): Font;
  }

  export function create(buffer: Uint8Array): Font;
}
