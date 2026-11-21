import { describe, expect, it } from "bun:test";
import { CYRILLIC, FONT_FAMILY, fileOf, LATIN, widthOf } from "./fonts";

describe("Nunito's two files (ADR 0012)", () => {
  it.each([
    ["Latin", LATIN],
    ["Cyrillic", CYRILLIC],
  ] as const)("hold Nunito 3.602's %s, with every weight from 200 to 1000", (_, file) => {
    expect(file.font.version).toBe("Version 3.602");
    expect(file.font.variationAxes.wght).toMatchObject({ min: 200, max: 1000 });
  });

  it("go by a family name of ratsnest's own, never a Nunito the device has", () => {
    expect(FONT_FAMILY).not.toBe("Nunito");
  });

  it("have what every page writes beyond ASCII, and the thin space for the narrow one", () => {
    for (const character of "àéèêçœŒ«»’“”…–−Ω·°×  ") expect(fileOf(character)).toBe(LATIN);
    expect(fileOf("Ж")).toBe(CYRILLIC);
  });

  it("lack the narrow no-break space and the arrows, as ADR 0012 found", () => {
    for (const character of " ←→") expect(fileOf(character)).toBeUndefined();
  });
});

describe("a drawn word's width", () => {
  it("is measured at its size, and grows with its weight", () => {
    expect(widthOf("GP16", 2, 800)).toBeCloseTo(2 * widthOf("GP16", 1, 800), 10);
    expect(widthOf("GP16", 1, 900)).toBeGreaterThan(widthOf("GP16", 1, 400));
  });

  it("is a narrow full stop, so 4.7 kΩ fits where it is counted to", () => {
    expect(widthOf(".", 1, 800)).toBeLessThan(widthOf("4", 1, 800) * 0.6);
  });

  it("measures Cyrillic in the Cyrillic file, beside Latin in the Latin one", () => {
    const both = widthOf("GP15 Светодиод", 1, 700);
    expect(both).toBeCloseTo(widthOf("GP15 ", 1, 700) + widthOf("Светодиод", 1, 700), 10);
  });

  it("refuses a character neither file has, rather than guess at its width", () => {
    expect(() => widthOf("a → b", 1, 400)).toThrow("Nunito's files have no U+2192");
  });
});
