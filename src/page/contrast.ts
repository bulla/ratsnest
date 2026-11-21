/**
 * WCAG 2.1 relative luminance and contrast ratio, over sRGB hex: what `tokens.test.ts` measures the
 * palette with, so that what must be read is measured rather than asserted.
 */

const CHANNEL = /^[0-9a-fA-F]{2}$/;

/** Accepts three- or six-digit hex, with or without the leading hash. Alpha is not accepted. */
export function parseHex(hex: string): [number, number, number] {
  const body = hex.trim().replace(/^#/, "");
  const expanded =
    body.length === 3
      ? body
          .split("")
          .map((c) => c + c)
          .join("")
      : body;
  if (expanded.length !== 6) throw new Error(`Not a six-digit sRGB hex colour: ${hex}`);
  const channels = [0, 2, 4].map((i) => expanded.slice(i, i + 2));
  for (const channel of channels) {
    if (!CHANNEL.test(channel)) throw new Error(`Not a six-digit sRGB hex colour: ${hex}`);
  }
  return channels.map((c) => Number.parseInt(c, 16) / 255) as [number, number, number];
}

/** WCAG 2.1 relative luminance — https://www.w3.org/TR/WCAG21/#dfn-relative-luminance */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/** 1 (identical) to 21 (black on white). AA wants 4.5 for text, AAA wants 7. */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}
