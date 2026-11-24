import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BUTTON_COLOURS, LED_COLOURS } from "../circuit";
import {
  BREADBOARD_TOKENS,
  CERAMIC_TOKENS,
  DIODE_TOKENS,
  ELECTROLYTIC_TOKENS,
  SLIDE_POTENTIOMETER_TOKENS,
  SLIDE_SWITCH_TOKENS,
  SUPPLY_TOKENS,
  TRANSISTOR_TOKENS,
} from "../drawing/breadboard-svg";
import { CHIP_STYLES } from "../drawing/chips";
import { contrastRatio } from "./contrast";

/**
 * The page's palette, measured. What must be read is held to WCAG, and what the drawing draws is
 * held the same in both scales, because a drawing of an object does not repaint itself when the
 * room does.
 */
const SRC = join(import.meta.dir, "..");
const TOKENS = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

type Scope = "light" | "dark";
const SCOPES: Scope[] = ["light", "dark"];
const OPENER: Record<Scope, string> = { light: ":root {", dark: ':root[data-theme="dark"] {' };

/** The body of one braced block, matched rather than guessed at, so nesting cannot fool it. */
function blockBody(opener: string): string {
  const start = TOKENS.indexOf(opener);
  if (start < 0) throw new Error(`No ${opener} block in tokens.css`);
  const open = TOKENS.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < TOKENS.length; i++) {
    if (TOKENS[i] === "{") depth += 1;
    else if (TOKENS[i] === "}") {
      depth -= 1;
      if (depth === 0) return TOKENS.slice(open + 1, i);
    }
  }
  throw new Error(`Unclosed ${opener} block in tokens.css`);
}

const declaredIn = (body: string): Map<string, string> =>
  new Map(
    [...body.matchAll(/--color-([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name ?? "",
      (value ?? "").trim(),
    ]),
  );

/**
 * The `--color-*` tokens in force under a scale. The two are read apart, because one map of the
 * whole file would let the dark block win every name it redeclares, and every measurement would
 * then be of one scale twice while seeming to cover both. The dark one is read as a layer over the
 * light one, which is how a browser resolves it.
 */
function palette(scope: Scope): Map<string, string> {
  const light = declaredIn(blockBody(OPENER.light));
  if (scope === "light") return light;
  return new Map([...light, ...declaredIn(blockBody(OPENER.dark))]);
}

const colour = (name: string, scope: Scope = "light"): string => {
  const value = palette(scope).get(name);
  if (!value) throw new Error(`No --color-${name} under ${scope} in tokens.css`);
  return value;
};

/**
 * Every file of the engine's own, tokens.css and the tests left out. Walked as paths, never as a
 * URL's `pathname`, which on Windows is `/D:/…` and opens nothing.
 */
function sources(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "__fixtures__") continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(ts|js|css)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name)) {
        found.push(path);
      }
    }
  };
  walk(SRC);
  return found.filter((path) => path !== join(SRC, "page", "tokens.css"));
}

const COLOUR_LITERAL =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-fA-F])|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(/;

describe("the colour literal rule", () => {
  it("is looking at the engine and the drawing", () => {
    const files = sources();
    expect(files).toContain(join(SRC, "drawing", "breadboard-svg.ts"));
    expect(files).toContain(join(SRC, "page", "page.css"));
    expect(files).toContain(join(SRC, "page", "drawing.css"));
  });

  it("finds a colour written anywhere but tokens.css nowhere", () => {
    const found = sources().filter((path) => COLOUR_LITERAL.test(readFileSync(path, "utf8")));
    expect(found).toEqual([]);
  });
});

describe("the contrast maths", () => {
  // Published WCAG ratios, from WCAG 2.1 and the WebAIM contrast checker, as an independent check.
  const cases = [
    { a: "#000000", b: "#ffffff", ratio: 21 },
    { a: "#ffffff", b: "#ffffff", ratio: 1 },
    { a: "#767676", b: "#ffffff", ratio: 4.54 },
    { a: "#808080", b: "#ffffff", ratio: 3.95 },
    { a: "#0000ff", b: "#ffffff", ratio: 8.59 },
    { a: "#ff0000", b: "#ffffff", ratio: 3.99 },
    { a: "#000000", b: "#0000ff", ratio: 2.44 },
  ];

  it.each(cases)("matches the published ratio for $a on $b", ({ a, b, ratio }) => {
    expect(contrastRatio(a, b)).toBeCloseTo(ratio, 1);
  });

  it("does not care which colour comes first", () => {
    expect(contrastRatio("#10182b", "#ffffff")).toBeCloseTo(
      contrastRatio("#ffffff", "#10182b"),
      10,
    );
  });
});

describe("the dark scale", () => {
  it("only redeclares names the light scale already has", () => {
    // A browser ignores an unknown custom property, so a typo here keeps the light value and the
    // page looks almost right. This is the only thing that catches it.
    const light = palette("light");
    expect([...palette("dark").keys()].filter((name) => !light.has(name))).toEqual([]);
  });

  it("changes something, so the scale is not decorative", () => {
    expect(colour("surface", "dark")).not.toBe(colour("surface", "light"));
  });

  it("leaves the drawing alone, because an object's colour is not a theme", () => {
    for (const name of [
      "board",
      "board-pad",
      "board-metal",
      "board-chip",
      "board-silk",
      "board-blue",
      ...Object.values(CHIP_STYLES).flatMap((style) => [style.fill, style.ink]),
      ...LED_COLOURS.map((led) => `led-${led}`),
      ...BREADBOARD_TOKENS,
      // The step picked out is lit, which means the same in a dark room.
      "picked",
      "on-picked",
      "picked-edge",
    ]) {
      expect(colour(name, "dark")).toBe(colour(name, "light"));
    }
  });
});

describe.each(SCOPES)("the %s scale", (scope) => {
  const surfaces = ["surface", "canvas"];

  it("is written as plain sRGB hex, so it can be measured", () => {
    for (const value of palette(scope).values()) expect(value).toMatch(/^#[0-9a-f]{6}$/);
  });

  it.each(surfaces)("puts text on %s at WCAG AAA", (surface) => {
    for (const ink of ["ink", "ink-muted"]) {
      expect(contrastRatio(colour(ink, scope), colour(surface, scope))).toBeGreaterThanOrEqual(7);
    }
  });

  it.each(surfaces)("draws lines on %s at the 3:1 a UI component needs", (surface) => {
    expect(contrastRatio(colour("line", scope), colour(surface, scope))).toBeGreaterThanOrEqual(3);
  });

  it.each(surfaces)("keeps a link readable on %s", (surface) => {
    expect(contrastRatio(colour("accent", scope), colour(surface, scope))).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("edges the step picked out at 3:1 on its panel, and writes its number legibly", () => {
    expect(
      contrastRatio(colour("picked-edge", scope), colour("surface", scope)),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(colour("on-picked", scope), colour("picked", scope)),
    ).toBeGreaterThanOrEqual(7);
  });

  it("writes a supply's voltage legibly on its cell, and edges the cell at 3:1 on the page (ADR 0032)", () => {
    for (const ground of [SUPPLY_TOKENS.body, SUPPLY_TOKENS.panel]) {
      expect(
        contrastRatio(colour(SUPPLY_TOKENS.ink, scope), colour(ground, scope)),
      ).toBeGreaterThanOrEqual(7);
    }
    for (const surface of surfaces) {
      expect(
        contrastRatio(colour(SUPPLY_TOKENS.edge, scope), colour(surface, scope)),
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("prints a capacitor's value on its sleeve, and its minus signs on its stripe, legibly (ADR 0043)", () => {
    expect(
      contrastRatio(
        colour(ELECTROLYTIC_TOKENS.ink, scope),
        colour(ELECTROLYTIC_TOKENS.sleeve, scope),
      ),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(
        colour(ELECTROLYTIC_TOKENS.stripeInk, scope),
        colour(ELECTROLYTIC_TOKENS.stripe, scope),
      ),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("prints a transistor's type, model and legs legibly on its case (ADR 0044)", () => {
    expect(
      contrastRatio(colour(TRANSISTOR_TOKENS.ink, scope), colour(TRANSISTOR_TOKENS.body, scope)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("sets a diode's band apart from its case at 3:1, since the band says which way round it goes (ADR 0049)", () => {
    for (const [body, band] of [
      [DIODE_TOKENS.glass, DIODE_TOKENS.glassBand],
      [DIODE_TOKENS.black, DIODE_TOKENS.blackBand],
    ] as const) {
      expect(contrastRatio(colour(band, scope), colour(body, scope))).toBeGreaterThanOrEqual(3);
    }
  });

  it("prints a ceramic capacitor's code legibly on its disc (ADR 0051)", () => {
    expect(
      contrastRatio(colour(CERAMIC_TOKENS.ink, scope), colour(CERAMIC_TOKENS.body, scope)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("sets a slide potentiometer's knob apart from its body at 3:1, and prints its value legibly on it (ADR 0053)", () => {
    const body = colour(SLIDE_POTENTIOMETER_TOKENS.body, scope);
    expect(
      contrastRatio(colour(SLIDE_POTENTIOMETER_TOKENS.knob, scope), body),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(colour(SLIDE_POTENTIOMETER_TOKENS.ink, scope), body),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("sets a slide switch's slide apart from its shell at 3:1, since where it sits says which way it is set (ADR 0052)", () => {
    expect(
      contrastRatio(
        colour(SLIDE_SWITCH_TOKENS.slide, scope),
        colour(SLIDE_SWITCH_TOKENS.shell, scope),
      ),
    ).toBeGreaterThanOrEqual(3);
  });

  it.each(Object.entries(CHIP_STYLES))(
    "writes a %s pin's label legibly on its chip",
    (_, style) => {
      // Both sides are the same in both scales, which the dark scale's test enforces, so this
      // measures the same numbers twice, on purpose.
      expect(
        contrastRatio(colour(style.fill, scope), colour(style.ink, scope)),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe("the drawing", () => {
  it("has a colour for every light a circuit can name, and a button's every cap", () => {
    for (const led of LED_COLOURS) expect(() => colour(`led-${led}`)).not.toThrow();
    for (const cap of BUTTON_COLOURS) expect(() => colour(`led-${cap}`)).not.toThrow();
  });

  it("has every token the breadboard reads", () => {
    for (const name of BREADBOARD_TOKENS) expect(() => colour(name)).not.toThrow();
  });

  it("writes the board's silkscreen legibly on the board", () => {
    expect(contrastRatio(colour("board-silk"), colour("board"))).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the shield cans and mounting rings, the board's landmarks, apart from the green", () => {
    expect(contrastRatio(colour("board-metal"), colour("board"))).toBeGreaterThanOrEqual(3);
  });

  it("prints the breadboard's row letters and column numbers legibly on its plastic", () => {
    // A reader matches holes by these, so they are text rather than decoration.
    expect(contrastRatio(colour("breadboard-print"), colour("breadboard"))).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("writes a resistor's value legibly on the tag beside it", () => {
    expect(contrastRatio(colour("on-pale-chip"), colour("board-silk"))).toBeGreaterThanOrEqual(7);
  });

  it("tells a hole from the plastic it is in", () => {
    expect(contrastRatio(colour("breadboard-hole"), colour("breadboard"))).toBeGreaterThanOrEqual(
      3,
    );
  });

  it("keeps a lit light from reading as a link", () => {
    for (const scope of SCOPES) {
      expect(LED_COLOURS.map((led) => colour(`led-${led}`, scope))).not.toContain(
        colour("accent", scope),
      );
    }
  });
});
