import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { FIXTURE_IDS, FIXTURES } from "../__fixtures__/circuits";
import { TRILINGUAL } from "../__fixtures__/trilingual";
import type { Layout, ShownCircuit } from "../circuit";
import { CYRILLIC, fileOf, LATIN, widthOf } from "../fonts";
import { LANGUAGES, type Language } from "../language";
import { ORIENTATIONS } from "../orientation";
import { shownIn } from "../shown";
import { PAGE_FILES } from "./files";
import { CREDIT, drawingFile, PAGE_WORDS, PX_PER_MM, wiringPage } from "./page";

/**
 * The drawing alone, as an SVG file to embed in other pages by `<img>` (ADR 0031): a document of its
 * own that needs nothing else, the same drawing as the page's, credited along its bottom edge.
 */

const SVG = "http://www.w3.org/2000/svg";

interface Drawn {
  readonly circuit: ShownCircuit;
  readonly layout: Layout;
  readonly language: Language;
}

/** Every test circuit in English, and the one in three languages in each of them. */
const DRAWN: readonly Drawn[] = [
  ...FIXTURE_IDS.map((id) => ({ ...FIXTURES[id], language: "en" as const })),
  ...LANGUAGES.map((language) => ({ ...shownIn(TRILINGUAL, language), language })),
];

const fileOfDrawn = (drawn: Drawn, orientation: (typeof ORIENTATIONS)[number] = 0) =>
  drawingFile(drawn.circuit, drawn.layout, PAGE_FILES, {
    language: drawn.language,
    orientation,
  });

/** The file as an XML parser reads it, which refuses one that is not well formed. */
const parsed = (svg: string) =>
  new JSDOM(svg, { contentType: "image/svg+xml" }).window.document.documentElement;

const numbers = (value: string | null) => (value ?? "").split(" ").map(Number);

describe("the drawing alone, as an SVG file (ADR 0031)", () => {
  const english = DRAWN[0] as Drawn;

  it("is an SVG document of its own, well formed at every orientation and in every language", () => {
    for (const drawn of DRAWN) {
      for (const orientation of ORIENTATIONS) {
        const root = parsed(fileOfDrawn(drawn, orientation));
        expect(root.namespaceURI).toBe(SVG);
        expect(root.localName).toBe("svg");
      }
    }
  });

  it("makes the same file from the same inputs", () => {
    expect(fileOfDrawn(english, 90)).toBe(fileOfDrawn(english, 90));
  });

  it("carries everything it needs, and reaches for nothing outside itself", () => {
    const svg = fileOfDrawn(english);
    expect(svg).toContain(PAGE_FILES.tokens);
    expect(svg).toContain(PAGE_FILES.drawing);
    expect(svg).not.toContain(PAGE_FILES.css);
    expect(svg).not.toContain("<script");
    // Its gradients are its own, and Nunito is a data address: nothing is fetched.
    expect(svg).not.toMatch(/href=|url\((?!data:|#)/);
    expect(svg.match(/@font-face/g)).toHaveLength(1);
    expect(svg).toContain(Buffer.from(LATIN.bytes).toString("base64").slice(0, 64));
  });

  it("carries the Cyrillic file only when it writes Cyrillic", () => {
    const russian = DRAWN.find((drawn) => drawn.language === "ru") as Drawn;
    const svg = fileOfDrawn(russian);
    expect(svg.match(/@font-face/g)).toHaveLength(2);
    expect(svg).toContain(Buffer.from(CYRILLIC.bytes).toString("base64").slice(0, 64));
  });

  it("is in one theme, and paints its own background in it", () => {
    for (const theme of ["dark", "light"] as const) {
      const root = parsed(
        drawingFile(english.circuit, english.layout, PAGE_FILES, { language: "en", theme }),
      );
      expect(root.getAttribute("data-theme")).toBe(theme);
      const background = root.querySelector(":scope > rect");
      expect(background?.getAttribute("fill")).toBe("var(--color-surface)");
      expect(numbers(root.getAttribute("viewBox"))).toEqual(
        ["x", "y", "width", "height"].map((name) => Number(background?.getAttribute(name))),
      );
    }
  });

  it("says its size in pixels, at 6 px to the millimetre", () => {
    for (const orientation of ORIENTATIONS) {
      const root = parsed(fileOfDrawn(english, orientation));
      const [, , w = 0, h = 0] = numbers(root.getAttribute("viewBox"));
      expect(Number(root.getAttribute("width"))).toBeCloseTo(w * PX_PER_MM, 2);
      expect(Number(root.getAttribute("height"))).toBeCloseTo(h * PX_PER_MM, 2);
    }
  });

  it("holds the page's own drawing, unchanged but for where it sits", () => {
    for (const orientation of ORIENTATIONS) {
      const page = wiringPage(english.circuit, english.layout, PAGE_FILES, {
        language: "en",
        orientation,
      });
      const drawing = page.slice(page.indexOf('<svg class="breadboard-drawing"'));
      const ofPage = drawing.slice(0, drawing.indexOf("</svg>"));
      const svg = fileOfDrawn(english, orientation).replace(
        / x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*" viewBox=/,
        " viewBox=",
      );
      expect(svg).toContain(ofPage);
    }
  });

  it("has no caption: neither the page's script nor the key to the rails", () => {
    for (const drawn of DRAWN) {
      const svg = fileOfDrawn(drawn);
      const words = PAGE_WORDS[drawn.language];
      expect(svg).not.toContain(words.tapStep);
      expect(svg).not.toContain(words.railMinus);
    }
  });

  it("credits the drawing along its bottom edge, in its circuit's words, every line fitting", () => {
    for (const drawn of DRAWN) {
      for (const orientation of ORIENTATIONS) {
        const root = parsed(fileOfDrawn(drawn, orientation));
        const [x = 0, , w = 0] = numbers(root.getAttribute("viewBox"));
        const lines = [...root.querySelectorAll(":scope > text.drawing-credit")];
        const said = lines.map((line) => line.textContent ?? "");
        expect(said.join(" ")).toBe((drawn.circuit.credit ?? "").replaceAll(" ", " "));
        for (const line of said) {
          expect(widthOf(line, CREDIT.size, CREDIT.weight)).toBeLessThanOrEqual(
            w - 2 * CREDIT.margin,
          );
        }
        for (const line of lines) {
          expect(Number(line.getAttribute("x"))).toBeCloseTo(x + CREDIT.margin, 3);
        }
      }
    }
  });

  it("has no credit line, nor room kept for one, when its circuit leaves its credit out", () => {
    const { credit: _, ...uncredited } = english.circuit;
    for (const orientation of ORIENTATIONS) {
      const root = parsed(
        drawingFile(uncredited, english.layout, PAGE_FILES, { language: "en", orientation }),
      );
      expect(root.querySelectorAll("text.drawing-credit")).toHaveLength(0);
      const drawing = root.querySelector(":scope > svg.breadboard-drawing");
      expect(numbers(root.getAttribute("viewBox"))[3]).toBeCloseTo(
        Number(drawing?.getAttribute("height")),
        3,
      );
    }
  });

  it("writes the credit its circuit says, and none of the engine's own (ADR 0035)", () => {
    const credit = "Drawn after the Pico 2 W's datasheet, © Raspberry Pi Ltd, CC BY-SA 4.0.";
    const circuit = { ...english.circuit, credit };
    const svg = drawingFile(circuit, english.layout, PAGE_FILES, { language: "en" });
    const said = [...parsed(svg).querySelectorAll(":scope > text.drawing-credit")];
    expect(said.map((line) => line.textContent).join(" ")).toBe(credit);
    const page = wiringPage(circuit, english.layout, PAGE_FILES, { language: "en" });
    expect(page).toContain(`<footer>\n    ${credit}\n  </footer>`);
  });

  it("draws its credit at the size and weight drawing.css gives it, which it was measured at", () => {
    const css = readFileSync(new URL("./drawing.css", import.meta.url), "utf8");
    const rule = [...css.matchAll(/\.drawing-credit \{([^}]*)\}/g)]
      .map((found) => found[1])
      .join("");
    expect(rule).toContain(`font-size: ${CREDIT.size}px;`);
    expect(rule).toContain(`font-weight: ${CREDIT.weight};`);
  });

  it("writes every character in the files it carries, and no narrow no-break space", () => {
    for (const drawn of DRAWN) {
      const root = parsed(fileOfDrawn(drawn));
      const text = [...root.querySelectorAll("text, title, desc")]
        .map((node) => node.textContent ?? "")
        .join("");
      expect([...new Set([...text].filter((c) => !fileOf(c)))]).toEqual([]);
      expect(fileOfDrawn(drawn)).not.toContain(" ");
    }
  });
});
