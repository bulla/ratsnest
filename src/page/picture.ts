import { PX_PER_MM } from "./page";

/**
 * The drawing alone as a picture, a PNG or a WebP (ADR 0042): the SVG that `--format svg` writes
 * (ADR 0031), drawn into pixels by Bun's headless browser, then encoded by `Bun.Image`, so that every
 * system writes it with the same encoders.
 */

/** The kinds of picture ratsnest makes, each its file's extension. */
export const PICTURES = ["png", "webp"] as const;
export type Picture = (typeof PICTURES)[number];

export const isPicture = (format: string): format is Picture =>
  (PICTURES as readonly string[]).includes(format);

/** A picture's pixels per millimetre of the drawing: twice the SVG's (ADR 0042). */
export const PICTURE_PX_PER_MM = 12;

/**
 * No picture was drawn: no browser could be started, and what to install, or one started and did
 * not finish a step in time, however many times it was asked.
 */
export class NoPicture extends Error {}

/** A step the browser did not finish in time, which a fresh view may: worth another try. */
export class Stuck extends NoPicture {}

/**
 * How long the browser has for each step. Each takes a second or two, and one that has taken this
 * long is stuck, as macOS's WebKit and Linux's Chrome both were now and then in continuous
 * integration: `generate` says which step rather than wait for ever.
 */
export const STEP_MS = 15_000;

/**
 * How many times a picture is begun again, on a view of its own, before it is given up. A view
 * sometimes waits for ever for its drawing's `load`, though the drawing is a `data:` address with
 * nothing to fetch, while the next view, in the same browser, draws at once (ADR 0048).
 */
export const TRIES = 3;

/** A step in the browser, given `ms` to finish before it is taken as stuck. */
export async function within<T>(step: string, work: Promise<T>, ms = STEP_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Stuck(
            `a PNG or a WebP is drawn by a browser, which did not ${step} within ${ms / 1000} s`,
          ),
        ),
      ms,
    );
  });
  try {
    return await Promise.race([work, late]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * `attempt` run until it does not get stuck, `times` times at most. Any other failure, such as no
 * browser at all, is not tried again: it would fail the same way.
 */
export async function tried<T>(attempt: () => Promise<T>, times = TRIES): Promise<T> {
  let stuck: Stuck | undefined;
  for (let at = 0; at < times; at++) {
    try {
      return await attempt();
    } catch (error) {
      if (!(error instanceof Stuck)) throw error;
      stuck = error;
    }
  }
  throw new NoPicture(`${stuck?.message}, in ${times} tries`);
}

/**
 * The browser Bun drives: the system's WebKit on macOS, and elsewhere a Chrome, Chromium, Edge or
 * Brave it finds. Always one it starts itself, never a person's own browser already running
 * (ADR 0042).
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

/**
 * The drawing's SVG, drawn as a picture of the kind asked for, begun again on a fresh view when the
 * browser gets stuck.
 */
export const pictureOf = (svg: string, kind: Picture): Promise<Uint8Array> =>
  tried(() => drawnOnce(svg, kind));

/** The drawing's SVG drawn once, on a view of its own, closed whatever happens. */
async function drawnOnce(svg: string, kind: Picture): Promise<Uint8Array> {
  let view: Bun.WebView | undefined;
  try {
    view = new Bun.WebView({ backend: BACKEND });
    // A document of its own, so that its `:root` is the `<svg>` and its theme holds, and UTF-8, so
    // that an `Ω` stays one (ADR 0042).
    await within(
      "load the drawing",
      view.navigate(
        `data:image/svg+xml;charset=utf-8;base64,${Buffer.from(svg).toString("base64")}`,
      ),
    );
  } catch (error) {
    view?.close();
    if (error instanceof NoPicture) throw error;
    throw new NoPicture(
      `a PNG or a WebP is drawn by a browser, and none could be started (${(error as Error).message}): ` +
        "install Chrome, Chromium, Edge or Brave, or name one with BUN_CHROME_PATH",
    );
  }
  try {
    const [width, height] = (await within(
      "size the drawing and load its font",
      view.evaluate(SIZE_IT(PICTURE_PX_PER_MM / PX_PER_MM)),
    )) as [number, number];
    await within("resize its window to the drawing", view.resize(width, height));
    const shot = await within(
      "take the picture",
      view.screenshot({ encoding: "buffer", format: "png" }),
    );
    const image = await sized(shot, width, height);
    return await (kind === "png" ? image.png() : image.webp({ lossless: true })).bytes();
  } finally {
    view.close();
  }
}
