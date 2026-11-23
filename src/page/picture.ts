import { PX_PER_MM } from "./page";

/**
 * The drawing alone as a picture, a PNG or a WebP (ADR 0038): the SVG that `--format svg` writes
 * (ADR 0031), drawn into pixels by Bun's headless browser, then encoded by `Bun.Image`, so that every
 * system writes it with the same encoders.
 */

/** The kinds of picture ratsnest makes, each its file's extension. */
export const PICTURES = ["png", "webp"] as const;
export type Picture = (typeof PICTURES)[number];

export const isPicture = (format: string): format is Picture =>
  (PICTURES as readonly string[]).includes(format);

/** A picture's pixels per millimetre of the drawing: twice the SVG's (ADR 0038). */
export const PICTURE_PX_PER_MM = 12;

/** No browser drew the picture: what went wrong, and what to install. */
export class NoBrowser extends Error {}

/**
 * The browser Bun drives: the system's WebKit on macOS, and elsewhere a Chrome, Chromium, Edge or
 * Brave it finds. Always one it starts itself, never a person's own browser already running
 * (ADR 0038).
 */
const BACKEND =
  process.platform === "darwin" ? "webkit" : ({ type: "chrome", url: false } as const);

/**
 * Run in the browser once the SVG has loaded: sizes it in whole pixels, stretched by less than half
 * a pixel so that it covers every one, and waits for Nunito, which the SVG carries (ADR 0012).
 */
const SIZE_IT = (scale: number) => `(async () => {
  const svg = document.documentElement;
  const width = Math.round(Number(svg.getAttribute("width")) * ${scale});
  const height = Math.round(Number(svg.getAttribute("height")) * ${scale});
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("preserveAspectRatio", "none");
  await document.fonts.ready;
  return [width, height];
})()`;

/**
 * A browser's picture taken where the screen has more than one pixel to a CSS pixel, as a Mac's
 * may, is a whole multiple of the size asked for, and is brought back to it. Any other size is a
 * picture of something else, and refused.
 */
export async function sized(png: Uint8Array, width: number, height: number): Promise<Bun.Image> {
  const image = new Bun.Image(png);
  const { width: drawnWidth, height: drawnHeight } = await image.metadata();
  if (drawnWidth === width && drawnHeight === height) return image;
  const times = drawnWidth / width;
  if (Number.isInteger(times) && times > 1 && drawnHeight === height * times) {
    return new Bun.Image(png).resize(width, height, { filter: "box" });
  }
  throw new Error(
    `The browser drew the drawing ${drawnWidth} by ${drawnHeight} pixels, not ${width} by ${height}`,
  );
}

/** The drawing's SVG, drawn as a picture of the kind asked for. */
export async function pictureOf(svg: string, kind: Picture): Promise<Uint8Array> {
  let view: Bun.WebView | undefined;
  try {
    view = new Bun.WebView({ backend: BACKEND });
    // A document of its own, so that its `:root` is the `<svg>` and its theme holds, and UTF-8, so
    // that an `Ω` stays one (ADR 0038).
    await view.navigate(
      `data:image/svg+xml;charset=utf-8;base64,${Buffer.from(svg).toString("base64")}`,
    );
  } catch (error) {
    view?.close();
    throw new NoBrowser(
      `a PNG or a WebP is drawn by a browser, and none could be started (${(error as Error).message}): ` +
        "install Chrome, Chromium, Edge or Brave, or name one with BUN_CHROME_PATH",
    );
  }
  try {
    const [width, height] = (await view.evaluate(SIZE_IT(PICTURE_PX_PER_MM / PX_PER_MM))) as [
      number,
      number,
    ];
    await view.resize(width, height);
    const shot = await view.screenshot({ encoding: "buffer", format: "png" });
    const image = await sized(shot, width, height);
    return await (kind === "png" ? image.png() : image.webp({ lossless: true })).bytes();
  } finally {
    view.close();
  }
}
