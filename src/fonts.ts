import { readFileSync } from "node:fs";
import { create, type Font } from "fontkit";
import cyrillicPath from "../fonts/nunito-cyrillic.woff2" with { type: "file" };
import latinPath from "../fonts/nunito-latin.woff2" with { type: "file" };

/**
 * Nunito, as every page carries it and as the engine measures every word it draws (ADR 0012): two
 * variable WOFF2 files cut to ratsnest's characters, Latin and Cyrillic. Imported as files, so that a
 * compiled ratsnest carries them too.
 */

/** The family the page names, its own rather than `Nunito`, so that a Nunito the device has is never used. */
export const FONT_FAMILY = "ratsnest Nunito";

/** One of the two files: its bytes, the font in it, and what it covers, for `unicode-range`. */
export interface FontFile {
  readonly bytes: Uint8Array;
  readonly font: Font;
}

const load = (path: string): FontFile => {
  const bytes = new Uint8Array(readFileSync(path));
  return { bytes, font: create(bytes) };
};

export const LATIN: FontFile = load(latinPath);
export const CYRILLIC: FontFile = load(cyrillicPath);

/** The file a character is drawn from, or undefined for one neither has. */
export function fileOf(character: string): FontFile | undefined {
  const point = character.codePointAt(0) ?? 0;
  if (LATIN.font.hasGlyphForCodePoint(point)) return LATIN;
  if (CYRILLIC.font.hasGlyphForCodePoint(point)) return CYRILLIC;
  return undefined;
}

/** Whether a character is Cyrillic, and so needs the Cyrillic file on the page. */
export const isCyrillic = (character: string): boolean => /\p{Script=Cyrillic}/u.test(character);

const instances = new Map<string, Font>();

/** A file's font at a weight, from 200 to 1000, made once. */
function atWeight(file: FontFile, weight: number): Font {
  const key = `${file === LATIN ? "latin" : "cyrillic"} ${weight}`;
  let font = instances.get(key);
  if (!font) {
    font = file.font.getVariation({ wght: weight });
    instances.set(key, font);
  }
  return font;
}

/**
 * How wide a word is drawn, in the units of its size: its advance at that size and weight, each run
 * of characters measured in the file the browser draws it from. A character neither file has fails
 * loudly, since the page would draw it in another font, at another width (ADR 0012).
 */
export function widthOf(text: string, size: number, weight: number): number {
  let width = 0;
  let run = "";
  let runFile: FontFile | undefined;
  const flush = () => {
    if (run && runFile) {
      const font = atWeight(runFile, weight);
      width += (font.layout(run).advanceWidth / font.unitsPerEm) * size;
    }
    run = "";
  };
  for (const character of text) {
    const file = fileOf(character);
    if (!file) {
      throw new Error(
        `Nunito's files have no U+${(character.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}, in "${text}": add it to scripts/fonts.ts and fetch them again`,
      );
    }
    if (file !== runFile) {
      flush();
      runFile = file;
    }
    run += character;
  }
  flush();
  return width;
}
