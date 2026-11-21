import { describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { FIXTURE_IDS, FIXTURES, type FixtureId } from "../__fixtures__/circuits";
import { TRILINGUAL } from "../__fixtures__/trilingual";
import { ORIENTATIONS, type Orientation } from "../orientation";
import { shownIn } from "../shown";
import { PAGE_FILES } from "./files";
import { wiringPage } from "./page";

/**
 * Every test circuit's page at each quarter turn (ADR 0003): every word upright and inside the
 * picture, the labels past the board's far end (ADR 0024), and the page arranged around a standing
 * board.
 */

const page = (id: FixtureId, orientation: Orientation, language: "en" | "fr" = "en") =>
  wiringPage(FIXTURES[id].circuit, FIXTURES[id].layout, PAGE_FILES, { language, orientation });

/** A 2D affine transform, as SVG's matrix(a b c d e f). */
type Matrix = readonly [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

const times = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

/** An element's own `transform`, of the two kinds the drawing writes: translate and rotate. */
function ownTransform(element: Element): Matrix {
  let matrix = IDENTITY;
  for (const [, kind, args] of (element.getAttribute("transform") ?? "").matchAll(
    /(translate|rotate)\(([^)]*)\)/g,
  )) {
    const [a = 0, b = 0, c = 0] = (args ?? "").split(/[\s,]+/).map(Number);
    if (kind === "translate") matrix = times(matrix, [1, 0, 0, 1, a, b]);
    else {
      const r = (a * Math.PI) / 180;
      const turn: Matrix = [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0];
      matrix = times(matrix, times([1, 0, 0, 1, b, c], times(turn, [1, 0, 0, 1, -b, -c])));
    }
  }
  return matrix;
}

/** Where an element's own point lands in the picture, and how much it is turned there. */
function placed(element: Element): { x: number; y: number; degrees: number } {
  let matrix = IDENTITY;
  for (let at: Element | null = element; at && at.tagName !== "svg"; at = at.parentElement) {
    matrix = times(ownTransform(at), matrix);
  }
  const x = Number(element.getAttribute("x") ?? 0);
  const y = Number(element.getAttribute("y") ?? 0);
  const degrees = ((((Math.atan2(matrix[1], matrix[0]) * 180) / Math.PI) % 360) + 360) % 360;
  return {
    x: matrix[0] * x + matrix[2] * y + matrix[4],
    y: matrix[1] * x + matrix[3] * y + matrix[5],
    degrees: (Math.round(degrees * 1000) / 1000) % 360,
  };
}

function drawingOf(html: string) {
  const svg = new JSDOM(html).window.document.querySelector("svg.breadboard-drawing");
  if (!svg) throw new Error("No drawing");
  const [x = 0, y = 0, w = 0, h = 0] = (svg.getAttribute("viewBox") ?? "").split(" ").map(Number);
  return { svg, view: { x, y, w, h } };
}

describe.each([...ORIENTATIONS])("every test circuit's drawing at %i°", (orientation) => {
  it.each([...FIXTURE_IDS])("writes every word upright, inside the picture: %s", (id) => {
    const { svg, view } = drawingOf(page(id, orientation));
    const words = [...svg.querySelectorAll("text")];
    expect(words.length).toBeGreaterThan(40);
    for (const word of words) {
      const at = placed(word);
      expect({ word: word.textContent, degrees: at.degrees }).toEqual({
        word: word.textContent,
        degrees: 0,
      });
      expect(at.x).toBeGreaterThanOrEqual(view.x);
      expect(at.x).toBeLessThanOrEqual(view.x + view.w);
      expect(at.y).toBeGreaterThanOrEqual(view.y);
      expect(at.y).toBeLessThanOrEqual(view.y + view.h);
    }
  });

  it("turns the board itself, never mirroring it", () => {
    const html = page("two-lights", orientation);
    expect(html.includes(`<g transform="rotate(${orientation})">`)).toBe(orientation !== 0);
    expect(html).not.toContain("scale(-1");
  });
});

describe("the labels (ADR 0024)", () => {
  /** A label's title, where it lands in the picture. */
  type Placed = { readonly x: number; readonly y: number };

  /** Where the board's picture and its labels' titles are, in the picture. */
  const layoutOf = (orientation: Orientation, id: FixtureId = "d-pad") => {
    const { svg } = drawingOf(page(id, orientation));
    const board = [...svg.querySelectorAll("text")]
      .filter((each) => /^(?:[a-j]|\d+)$/.test(each.textContent ?? ""))
      .map(placed);
    const titles = [...svg.querySelectorAll(".callout-title")].map((title) => ({
      ...placed(title),
      word: title.textContent ?? "",
    }));
    const extent = (values: number[]) => ({ min: Math.min(...values), max: Math.max(...values) });
    return {
      board: { x: extent(board.map((p) => p.x)), y: extent(board.map((p) => p.y)) },
      titles,
    };
  };

  it("stand past the board's far end, away from the USB, at every orientation", () => {
    const right = layoutOf(0);
    for (const title of right.titles) expect(title.x).toBeGreaterThan(right.board.x.max);
    const below = layoutOf(90);
    for (const title of below.titles) expect(title.y).toBeGreaterThan(below.board.y.max);
    const left = layoutOf(180);
    for (const title of left.titles) expect(title.x).toBeLessThan(left.board.x.min);
    const above = layoutOf(270);
    for (const title of above.titles) expect(title.y).toBeLessThan(above.board.y.min);
  });

  it("stand past the near end for a part on the second board's near half (ADR 0027)", () => {
    // The RGB LED is at columns 2 to 5 of the second board; the buttons are on the first.
    for (const orientation of ORIENTATIONS) {
      const { board, titles } = layoutOf(orientation, "rgb-led-and-d-pad");
      const led = titles.filter((title) => title.word === "RGB LED");
      const buttons = titles.filter((title) => title.word !== "RGB LED");
      expect(led).toHaveLength(1);
      expect(buttons).toHaveLength(4);
      const past = {
        0: { near: (t: Placed) => t.x < board.x.min, far: (t: Placed) => t.x > board.x.max },
        90: { near: (t: Placed) => t.y < board.y.min, far: (t: Placed) => t.y > board.y.max },
        180: { near: (t: Placed) => t.x > board.x.max, far: (t: Placed) => t.x < board.x.min },
        270: { near: (t: Placed) => t.y > board.y.max, far: (t: Placed) => t.y < board.y.min },
      }[orientation];
      for (const title of led) expect(past.near(title), `${orientation}°`).toBe(true);
      for (const title of buttons) expect(past.far(title), `${orientation}°`).toBe(true);
    }
  });

  it("keep apart in a row on a standing board, each as wide as its words", () => {
    const { titles } = layoutOf(90);
    expect(titles).toHaveLength(4);
    const xs = titles.map((title) => title.x).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) {
      expect((xs[i] ?? 0) - (xs[i - 1] ?? 0)).toBeGreaterThan(10);
    }
  });
});

describe("the page around a turned drawing (ADR 0003)", () => {
  it("stands a standing board in a column of its own", () => {
    for (const orientation of ORIENTATIONS) {
      const standing = orientation === 90 || orientation === 270;
      expect(page("two-lights", orientation).includes('<main class="page standing">')).toBe(
        standing,
      );
    }
  });

  it("says which way the USB points, in each language", () => {
    expect(page("two-lights", 0)).toContain("The USB goes to the left.");
    expect(page("two-lights", 90)).toContain("The USB goes to the top.");
    expect(page("two-lights", 180)).toContain("its USB to the right.");
    expect(page("two-lights", 270, "fr")).toContain("Le port USB va en bas.");
  });

  it("builds the same circuit at every orientation, step for step and hole for hole", () => {
    const holes = (html: string) => [...html.matchAll(/class="hole">([^<]+)</g)].map((m) => m[1]);
    const upright = holes(page("rgb-led-and-d-pad", 0));
    for (const orientation of ORIENTATIONS) {
      expect(holes(page("rgb-led-and-d-pad", orientation))).toEqual(upright);
    }
  });
});

describe("a value tag on a standing board", () => {
  /** Every value tag's lines, as the page writes them. */
  const tags = (html: string) => {
    const { svg } = drawingOf(html);
    return [...svg.querySelectorAll("text")]
      .filter(
        (each) =>
          each.getAttribute("font-size") === "1.6" && each.getAttribute("font-weight") === "800",
      )
      .map((each) => each.textContent);
  };

  it("is on one line wherever the board lies flat", () => {
    for (const orientation of [0, 180] as const) {
      expect(tags(page("d-pad", orientation)).every((each) => each?.includes("Ω"))).toBe(true);
    }
  });

  it("goes onto two lines, the number over its unit, where one line has no room", () => {
    const standing = tags(page("d-pad", 90));
    expect(standing).toContain("4.7");
    expect(standing).toContain("kΩ");
  });
});

describe("the engine's three-language test circuit in Russian, at every orientation (ADR 0011)", () => {
  const { circuit, layout } = shownIn(TRILINGUAL, "ru");

  it.each([...ORIENTATIONS])(
    "writes every word upright, inside the picture, at %i°",
    (orientation) => {
      const html = wiringPage(circuit, layout, PAGE_FILES, { language: "ru", orientation });
      const { svg, view } = drawingOf(html);
      for (const word of svg.querySelectorAll("text")) {
        const at = placed(word);
        expect(at.degrees).toBe(0);
        expect(at.x).toBeGreaterThanOrEqual(view.x);
        expect(at.x).toBeLessThanOrEqual(view.x + view.w);
        expect(at.y).toBeGreaterThanOrEqual(view.y);
        expect(at.y).toBeLessThanOrEqual(view.y + view.h);
      }
    },
  );
});
