import { describe, expect, it } from "bun:test";
import { inflateSync } from "node:zlib";
import { FIXTURES } from "../__fixtures__/circuits";
import type { Theme } from "../theme";
import { PAGE_FILES } from "./files";
import { drawingFile } from "./page";
import { PICTURE_PX_PER_MM, type Picture, pictureOf, sized } from "./picture";

/**
 * The drawing as a PNG or a WebP (ADR 0038): the SVG drawn by a browser, so these tests need one
 * where they run, a Chrome, Chromium, Edge or Brave, or on macOS its own WebKit.
 */

/** A browser starts in about a second, and draws each picture in about another. */
const SLOW = 30_000;

const { circuit, layout } = FIXTURES["two-lights"];
const svgOf = (theme: Theme) =>
  drawingFile(circuit, layout, PAGE_FILES, { circuit: "two-lights", theme });

/** Each picture drawn once and shared by the tests that read it, since each takes a second. */
const drawn = new Map<string, Promise<Uint8Array>>();
const pictureIn = (theme: Theme, kind: Picture): Promise<Uint8Array> => {
  const key = `${theme}.${kind}`;
  if (!drawn.has(key)) drawn.set(key, pictureOf(svgOf(theme), kind));
  return drawn.get(key) as Promise<Uint8Array>;
};

/** The size an SVG says it is, in its own pixels. */
const svgSize = (svg: string): [number, number] => {
  const found = /^<svg [^>]*?width="([\d.]+)" height="([\d.]+)"/.exec(svg);
  if (!found) throw new Error("The SVG no longer says its size on its root");
  return [Number(found[1]), Number(found[2])];
};

interface Pixels {
  readonly width: number;
  readonly height: number;
  /** Each pixel's red, green, blue and alpha, row by row. */
  readonly rgba: Uint8Array;
}

/**
 * A PNG's pixels, read here rather than by a library: eight bits a channel, RGB or RGBA, not
 * interlaced, which is what `Bun.Image` writes. Anything else is refused, not misread.
 */
function pixelsOf(png: Uint8Array): Pixels {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const chunks: Uint8Array[] = [];
  let header: Uint8Array | undefined;
  for (let at = 8; at < png.length; ) {
    const length = view.getUint32(at);
    const type = new TextDecoder().decode(png.subarray(at + 4, at + 8));
    const data = png.subarray(at + 8, at + 8 + length);
    if (type === "IHDR") header = data;
    if (type === "IDAT") chunks.push(data);
    at += 12 + length;
  }
  if (!header) throw new Error("No IHDR in the PNG");
  const head = new DataView(header.buffer, header.byteOffset, header.byteLength);
  const [width, height] = [head.getUint32(0), head.getUint32(4)];
  const [depth, colour, , , interlace] = header.subarray(8);
  if (depth !== 8 || (colour !== 2 && colour !== 6) || interlace !== 0) {
    throw new Error(`A PNG of depth ${depth}, colour type ${colour}, interlace ${interlace}`);
  }
  const channels = colour === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(chunks));
  const rgba = new Uint8Array(width * height * 4);
  let above = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1);
    const filter = raw[start];
    const row = Uint8Array.from(raw.subarray(start + 1, start + 1 + stride));
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? (row[i - channels] as number) : 0;
      const up = above[i] as number;
      const corner = i >= channels ? (above[i - channels] as number) : 0;
      const guess = left + up - corner;
      const [toLeft, toUp, toCorner] = [guess - left, guess - up, guess - corner].map(Math.abs);
      const paeth =
        (toLeft as number) <= (toUp as number) && (toLeft as number) <= (toCorner as number)
          ? left
          : (toUp as number) <= (toCorner as number)
            ? up
            : corner;
      const add = [0, left, up, (left + up) >> 1, paeth][filter as number];
      if (add === undefined) throw new Error(`An unknown PNG filter, ${filter}`);
      row[i] = ((row[i] as number) + add) & 0xff;
    }
    for (let x = 0; x < width; x++) {
      rgba.set(row.subarray(x * channels, x * channels + 3), (y * width + x) * 4);
      rgba[(y * width + x) * 4 + 3] = channels === 4 ? (row[x * channels + 3] as number) : 255;
    }
    above = row;
  }
  return { width, height, rgba };
}

const hexAt = ({ width, rgba }: Pixels, x: number, y: number): string =>
  `#${[...rgba.subarray((y * width + x) * 4, (y * width + x) * 4 + 3)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;

/** `--color-surface` as a theme sets it, the background the SVG paints (ADR 0031). */
function surfaceOf(theme: Theme): string {
  const opener = theme === "dark" ? ':root[data-theme="dark"] {' : ":root {";
  const block = PAGE_FILES.tokens.slice(PAGE_FILES.tokens.indexOf(opener)).split("\n}")[0] ?? "";
  const found = /--color-surface:\s*(#[0-9a-f]{6});/.exec(block);
  if (!found) throw new Error(`No --color-surface under ${theme}`);
  return found[1] as string;
}

describe("the drawing as a picture, a PNG or a WebP (ADR 0038)", () => {
  it(
    "is a PNG of the SVG at 12 px per millimetre, twice the SVG's size",
    async () => {
      const png = await pictureIn("dark", "png");
      expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const [width, height] = svgSize(svgOf("dark"));
      expect(PICTURE_PX_PER_MM).toBe(12);
      const pixels = pixelsOf(png);
      expect([pixels.width, pixels.height]).toEqual([
        Math.round(width * 2),
        Math.round(height * 2),
      ]);
    },
    SLOW,
  );

  it(
    "paints its theme's own background, the SVG's, out to every edge",
    async () => {
      for (const theme of ["dark", "light"] as const) {
        const pixels = pixelsOf(await pictureIn(theme, "png"));
        const surface = surfaceOf(theme);
        for (const [x, y] of [
          [0, 0],
          [pixels.width - 1, 0],
          [0, pixels.height - 1],
          [pixels.width - 1, pixels.height - 1],
        ] as const) {
          expect(hexAt(pixels, x, y)).toBe(surface);
        }
      }
    },
    SLOW,
  );

  it(
    "is a lossless WebP, every pixel the PNG's",
    async () => {
      const webp = await pictureIn("dark", "webp");
      const text = new TextDecoder().decode(webp.subarray(0, 16));
      expect(text.slice(0, 4)).toBe("RIFF");
      // VP8L is WebP's lossless chunk; a lossy one is VP8 and a space.
      expect(text.slice(8, 16)).toBe("WEBPVP8L");
      const fromWebp = pixelsOf(await new Bun.Image(webp).png().bytes());
      const fromPng = pixelsOf(await pictureIn("dark", "png"));
      expect([fromWebp.width, fromWebp.height]).toEqual([fromPng.width, fromPng.height]);
      expect(Buffer.compare(fromWebp.rgba, fromPng.rgba)).toBe(0);
    },
    SLOW,
  );

  it(
    "makes the same file from the same inputs, on one machine",
    async () => {
      const again = await pictureOf(svgOf("light"), "png");
      expect(Buffer.compare(again, await pictureIn("light", "png"))).toBe(0);
    },
    SLOW,
  );

  it(
    "brings a picture taken at a whole multiple back to its size, and refuses any other",
    async () => {
      const png = await pictureIn("dark", "png");
      const pixels = pixelsOf(png);
      const { width, height } = pixels;
      const same = pixelsOf(await (await sized(png, width, height)).png().bytes());
      expect(Buffer.compare(same.rgba, pixels.rgba)).toBe(0);
      const doubled = await new Bun.Image(png)
        .resize(width * 2, height * 2)
        .png()
        .bytes();
      const back = pixelsOf(await (await sized(doubled, width, height)).png().bytes());
      expect([back.width, back.height]).toEqual([width, height]);
      await expect(sized(png, width + 1, height)).rejects.toThrow(
        `The browser drew the drawing ${width} by ${height} pixels, not ${width + 1} by ${height}`,
      );
    },
    SLOW,
  );
});
