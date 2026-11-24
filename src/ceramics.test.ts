import { describe, expect, it } from "bun:test";
import { ceramicCode, formatNanofarads } from "./ceramics";

describe("a ceramic capacitor's code (ADR 0051)", () => {
  it("is two figures and how many zeros follow them, in picofarads, as the real ones print it", () => {
    expect(ceramicCode(100)).toBe("104");
    expect(ceramicCode(4.7)).toBe("472");
    expect(ceramicCode(47)).toBe("473");
    expect(ceramicCode(1)).toBe("102");
    expect(ceramicCode(1000)).toBe("105");
    expect(ceramicCode(0.022)).toBe("220");
    expect(ceramicCode(0.01)).toBe("100");
  });

  it("has no code for a value below 10 pF, or with a third figure", () => {
    for (const nanofarads of [0.0047, 0.001, 123, 4.75, 0, -100, Number.NaN]) {
      expect(ceramicCode(nanofarads)).toBeUndefined();
    }
  });

  it("goes with the value written as a bag of them says it", () => {
    expect(formatNanofarads(100)).toBe("100 nF");
    expect(formatNanofarads(4.7)).toBe("4.7 nF");
  });
});
