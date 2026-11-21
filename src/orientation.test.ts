import { describe, expect, it } from "bun:test";
import { isStanding, ORIENTATIONS, turned, unturned } from "./orientation";

describe("a turn (ADR 0003)", () => {
  it("is a quarter turn clockwise at a time, as SVG's rotate turns, and never a mirror", () => {
    // The USB, on the left at 0°, goes to the top, the right, then the bottom.
    const usb = { x: -10, y: 0 };
    expect(ORIENTATIONS.map((each) => turned(usb, each))).toEqual([
      { x: -10, y: 0 },
      { x: -0, y: -10 },
      { x: 10, y: -0 },
      { x: 0, y: 10 },
    ]);
    // Turning keeps a shape's handedness: clockwise stays clockwise.
    for (const each of ORIENTATIONS) {
      const [a, b, c] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ].map((p) => turned(p, each));
      const cross =
        ((b?.x ?? 0) - (a?.x ?? 0)) * ((c?.y ?? 0) - (a?.y ?? 0)) -
        ((b?.y ?? 0) - (a?.y ?? 0)) * ((c?.x ?? 0) - (a?.x ?? 0));
      expect(cross).toBe(1);
    }
  });

  it("is undone by unturned", () => {
    const point = { x: 3, y: -7 };
    for (const each of ORIENTATIONS) expect(unturned(turned(point, each), each)).toEqual(point);
  });

  it("stands the board up at 90° and 270° only", () => {
    expect(ORIENTATIONS.filter(isStanding)).toEqual([90, 270]);
  });
});
