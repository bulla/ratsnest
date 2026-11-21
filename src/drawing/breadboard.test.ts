import { describe, expect, it } from "bun:test";
import { FIXTURE_IDS, FIXTURES } from "../__fixtures__/circuits";
import {
  BREADBOARD_HEIGHT_MM,
  CHANNEL_Y_MM,
  coveredBy,
  holeCentre,
  holeOfPin,
  isOnSecondBoard,
  isUnderPico,
  legsOf,
  type Part,
  PICO_ORIGIN_MM,
  parseHole,
  pinOfStrip,
  placementOf,
  printedName,
  rowY,
  stripOf,
  usesSecondBoard,
} from "./breadboard";
import {
  ARCH_LIFT_MM,
  type Breadboard,
  clearTagOf,
  drawBreadboard,
  formatOhms,
  leaderOf,
  resistorBands,
  tagOf,
  wirePath,
} from "./breadboard-svg";
import { BOARD_WIDTH_MM, HEADER_PINS } from "./geometry";

describe("a half-size breadboard's holes", () => {
  it("are the ones the board prints, and no others", () => {
    expect(parseHole("a1")).toEqual({ kind: "main", board: 1, row: "a", column: 1 });
    expect(parseHole("j30")).toEqual({ kind: "main", board: 1, row: "j", column: 30 });
    expect(parseHole("top+7")).toEqual({ kind: "rail", board: 1, rail: "top+", column: 7 });
    for (const nonsense of ["k1", "a0", "a31", "A1", "top-6", "top-30", "middle-1", "", "3:a1"]) {
      expect(parseHole(nonsense), nonsense).toBeUndefined();
    }
  });

  it("are the second board's too, the same names after `2:` (scratchpi's ADR 0226)", () => {
    expect(parseHole("2:f5")).toEqual({ kind: "main", board: 2, row: "f", column: 5 });
    expect(parseHole("2:bottom-3")).toEqual({ kind: "rail", board: 2, rail: "bottom-", column: 3 });
    expect(parseHole("2:a31")).toBeUndefined();
    expect(printedName("2:f5")).toBe("f5");
    expect(printedName("f5")).toBe("f5");
  });

  it("are a board's own: nothing joins the second to the first but a jumper", () => {
    expect(stripOf("2:f5")).toBe(stripOf("2:j5"));
    expect(stripOf("2:f5")).not.toBe(stripOf("f5"));
    expect(stripOf("2:top-1")).not.toBe(stripOf("top-1"));
  });

  it("put the second board on the first one's top edge, column over column", () => {
    expect(holeCentre("2:j5").x).toBe(holeCentre("a5").x);
    expect(holeCentre("2:j5").y).toBeCloseTo(holeCentre("j5").y - BREADBOARD_HEIGHT_MM, 6);
    expect(isUnderPico("2:e10")).toBe(false);
    expect(pinOfStrip("2:a10")).toBeUndefined();
  });

  it("join in fives on each side of the channel, and all along a rail", () => {
    expect(stripOf("a21")).toBe(stripOf("e21"));
    expect(stripOf("e21")).not.toBe(stripOf("f21"));
    expect(stripOf("a21")).not.toBe(stripOf("a22"));
    expect(stripOf("top-1")).toBe(stripOf("top-29"));
    expect(stripOf("top-1")).not.toBe(stripOf("top+1"));
    expect(stripOf("top-1")).not.toBe(stripOf("bottom-1"));
  });
});

describe("the Pico on the breadboard", () => {
  it("has pin 1 in h2 and pin 40 opposite it, the USB to the left", () => {
    expect(holeOfPin(1)).toBe("h2");
    expect(holeOfPin(20)).toBe("h21");
    expect(holeOfPin(21)).toBe("c21");
    expect(holeOfPin(40)).toBe("c2");
  });

  it("reaches every pin from the holes left free in its strip", () => {
    for (const pin of HEADER_PINS) {
      expect(pinOfStrip(holeOfPin(pin.number))).toBe(pin.number);
    }
    // GND on both sides of column 19, which is why every layout grounds its rails there.
    expect(pinOfStrip("a19")).toBe(23);
    expect(pinOfStrip("j19")).toBe(18);
    expect(pinOfStrip("a22")).toBeUndefined();
    expect(pinOfStrip("top-19")).toBeUndefined();
  });

  it("covers its own rows and everything between them, and nothing else", () => {
    expect(isUnderPico("c2")).toBe(true);
    expect(isUnderPico("e10")).toBe(true);
    expect(isUnderPico("h21")).toBe(true);
    for (const free of ["b21", "i21", "e22", "c1", "top-19"]) {
      expect(isUnderPico(free), free).toBe(false);
    }
  });

  it("is drawn with every pin over the hole it is in", () => {
    // The drawing is `geometry.ts`'s portrait board turned a quarter to the left: (x, y)
    // lands at (y, width − x). If a pin misses its hole, the picture is lying.
    for (const pin of HEADER_PINS) {
      const drawn = {
        x: PICO_ORIGIN_MM.x + pin.y,
        y: PICO_ORIGIN_MM.y + BOARD_WIDTH_MM - pin.x,
      };
      const hole = holeCentre(holeOfPin(pin.number));
      expect(drawn.x, `pin ${pin.number}`).toBeCloseTo(hole.x, 9);
      expect(drawn.y, `pin ${pin.number}`).toBeCloseTo(hole.y, 9);
    }
  });
});

describe("a resistor's value", () => {
  it("is written as the bag says it", () => {
    expect(formatOhms(330)).toBe("330 Ω");
    expect(formatOhms(10_000)).toBe("10 kΩ");
    expect(formatOhms(4700)).toBe("4.7 kΩ");
    expect(formatOhms(1_000_000)).toBe("1 MΩ");
  });

  it("is painted in the colour code, four bands and five", () => {
    // 330 Ω: orange, orange, brown, gold — or orange, orange, black, black, brown.
    expect(resistorBands(330)).toEqual({
      four: ["3", "3", "1", "gold"],
      five: ["3", "3", "0", "0", "1"],
    });
    // 10 kΩ: brown, black, orange, gold — or brown, black, black, red, brown.
    expect(resistorBands(10_000)).toEqual({
      four: ["1", "0", "3", "gold"],
      five: ["1", "0", "0", "2", "1"],
    });
  });

  it("refuses a value the bands drawn here cannot say", () => {
    expect(() => resistorBands(47)).toThrow();
    expect(() => resistorBands(4750)).toThrow();
  });
});

describe("a label's leader", () => {
  const left: Part = { kind: "button", button: "left", columns: [23, 25] };
  const right: Part = { kind: "button", button: "right", columns: [27, 29] };

  it("runs a lone button's straight out along the channel", () => {
    const leader = leaderOf(left, [left]);
    expect(leader?.run).toEqual(leader?.dot);
    expect(leader?.run.y).toBe(CHANNEL_Y_MM);
  });

  it("goes over a button further along the channel, never through it (scratchpi's ADR 0097)", () => {
    // Both on the channel, so a straight run from the first would cross the second, and the
    // two leaders would share one line to the margin.
    const lifted = leaderOf(left, [left, right]);
    expect(lifted?.run.y).toBeGreaterThan(rowY("d"));
    expect(lifted?.run.y).toBeLessThan(rowY("e"));
    // It leaves from the button itself, straight above where it runs from.
    expect(lifted?.dot.x).toBe(lifted?.run.x);
    expect(lifted?.dot.y).toBeGreaterThan(rowY("e"));

    // The one further along has nothing in its way.
    expect(leaderOf(right, [left, right])?.run.y).toBe(CHANNEL_Y_MM);
  });
});

describe("a button on one half of the board (scratchpi's ADR 0154)", () => {
  const up: Part = { kind: "button", button: "up", columns: [28, 30], rows: ["b", "e"] };
  const across: Part = { kind: "button", button: "left", columns: [22, 24] };

  it("has its legs in the rows it names, and across the channel when it names none", () => {
    expect(legsOf(up)).toEqual(["b28", "e28", "b30", "e30"]);
    expect(legsOf(across)).toEqual(["e22", "f22", "e24", "f24"]);
    expect(placementOf(up)).toBe("above");
    expect(placementOf({ ...up, rows: ["g", "j"] })).toBe("below");
    expect(placementOf(across)).toBe("across");
  });

  it("puts both legs of a column in one strip, so only a press joins anything", () => {
    expect(stripOf("b28")).toBe(stripOf("e28"));
    expect(stripOf("b28")).not.toBe(stripOf("b30"));
  });

  it("covers the rows between its legs across all three of its columns, and nothing across", () => {
    expect(coveredBy(up)).toEqual(["c28", "c29", "c30", "d28", "d29", "d30"]);
    if (across.kind === "button") expect(coveredBy(across)).toEqual([]);
  });

  it("is not in the way of a leader along the channel", () => {
    const right: Part = { kind: "button", button: "right", columns: [25, 27] };
    // Up is further along, but above the channel: the right button's leader runs under it.
    expect(leaderOf(right, [right, up])?.run.y).toBe(CHANNEL_Y_MM);
  });
});

describe("a resistor's value tag", () => {
  const everyLayout = FIXTURE_IDS.map(
    (id) => [id, FIXTURES[id].layout.steps.flatMap((s) => s.parts)] as const,
  );

  it.each(everyLayout)("finds a place clear of everything else on %s", (_, parts) => {
    for (const part of parts) {
      if (part.kind !== "resistor") continue;
      expect(clearTagOf(part, parts), `${part.from} to ${part.to}`).toBeDefined();
    }
  });

  it("stays where it always was on every page without a d-pad", () => {
    for (const [id, parts] of everyLayout) {
      if (id === "d-pad" || id === "rgb-led-and-d-pad") continue;
      for (const part of parts) {
        if (part.kind !== "resistor") continue;
        const a = holeCentre(part.from);
        const b = holeCentre(part.to);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const along = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
        const always = along
          ? { x: mid.x, y: mid.y + (mid.y < CHANNEL_Y_MM ? 2.8 : -2.8) }
          : { x: mid.x + 5, y: mid.y };
        expect(tagOf(part, parts), `${id}: ${part.from} to ${part.to}`).toEqual(always);
      }
    }
  });
});

describe("an RGB LED's page, built on a d-pad's", () => {
  const four = FIXTURES["d-pad"].layout.steps.flatMap((step) => [...step.parts]);
  const rgb = FIXTURES["rgb-led-and-d-pad"].layout.steps.flatMap((step) => [...step.parts]);

  it("starts with every one of the d-pad's parts", () => {
    expect(rgb.slice(0, four.length)).toEqual(four);
  });

  it("puts every resistor's tag where the d-pad's page has it", () => {
    for (const part of four) {
      if (part.kind !== "resistor") continue;
      expect(tagOf(part, rgb), `${part.from} to ${part.to}`).toEqual(tagOf(part, four));
    }
  });

  it("puts the LED and its own jumper on the second board", () => {
    const own = rgb.slice(four.length);
    const led = own.find((part) => part.kind === "rgbLed");
    expect(led && legsOf(led).every(isOnSecondBoard)).toBe(true);
    expect(usesSecondBoard(rgb)).toBe(true);
    expect(usesSecondBoard(four)).toBe(false);
  });
});

describe("a jumper that arches over the board (scratchpi's ADR 0166)", () => {
  const over: Part = { kind: "wire", from: "b21", to: "b28", role: "signal", arch: true };
  const under: Part = { kind: "wire", from: "j18", to: "j25", role: "signal", arch: true };
  const flat: Part = { kind: "wire", from: "a6", to: "top+7", role: "power" };
  const drawing = (parts: Part[]): Breadboard => ({
    parts: parts.map((part) => ({ part, group: "step-1" })),
    tags: [],
    ledColour: () => "red",
    buttonColour: () => "red",
    title: "A breadboard",
    description: "A breadboard.",
  });
  /** The picture's `viewBox`, as left, top, width and height. */
  const viewBox = (svg: string): [number, number, number, number] => {
    const [left = 0, top = 0, width = 0, height = 0] = (/viewBox="([^"]+)"/.exec(svg)?.[1] ?? "")
      .split(" ")
      .map(Number);
    return [left, top, width, height];
  };

  it("leaves its holes and comes back to them, past the edge it is nearer", () => {
    for (const [part, holes] of [
      [over, ["b21", "b28"]],
      [under, ["j18", "j25"]],
    ] as const) {
      if (part.kind !== "wire") continue;
      const path = wirePath(part);
      expect(path[0]).toEqual(holeCentre(holes[0]));
      expect(path.at(-1)).toEqual(holeCentre(holes[1]));
    }
    if (over.kind !== "wire" || under.kind !== "wire") return;
    expect(Math.min(...wirePath(over).map((p) => p.y))).toBeCloseTo(-ARCH_LIFT_MM, 1);
    expect(Math.max(...wirePath(under).map((p) => p.y))).toBeCloseTo(
      BREADBOARD_HEIGHT_MM + ARCH_LIFT_MM,
      1,
    );
  });

  it("is a straight line between its holes when it lies flat", () => {
    if (flat.kind !== "wire") return;
    expect(wirePath(flat)).toEqual([holeCentre("a6"), holeCentre("top+7")]);
  });

  it("grows the picture past the edge it goes over, and leaves one without as it was", () => {
    const [, top, , height] = viewBox(drawBreadboard(drawing([flat])));
    expect(top).toBe(-3);
    expect(height).toBeCloseTo(BREADBOARD_HEIGHT_MM + 6, 3);

    const [, overTop, , overHeight] = viewBox(drawBreadboard(drawing([flat, over])));
    expect(overTop).toBeLessThan(-ARCH_LIFT_MM);
    expect(overHeight).toBeCloseTo(height + (-3 - overTop), 3);

    const [, underTop, , underHeight] = viewBox(drawBreadboard(drawing([flat, under])));
    expect(underTop).toBe(-3);
    expect(underTop + underHeight).toBeGreaterThan(BREADBOARD_HEIGHT_MM + ARCH_LIFT_MM);
  });

  it("is drawn as a curve over every jumper that lies flat", () => {
    // Listed first, and drawn last: an arch is over every jumper that lies flat.
    const svg = drawBreadboard(drawing([over, flat]));
    const a6 = holeCentre("a6");
    const b21 = holeCentre("b21");
    const flatAt = svg.indexOf(`<line x1="${a6.x}" y1="${a6.y}"`);
    const archAt = svg.indexOf(`<path d="M${b21.x} ${b21.y} C`);
    expect(flatAt).toBeGreaterThan(0);
    expect(archAt).toBeGreaterThan(flatAt);
  });

  it("keeps a value tag clear of itself and of its shadow", () => {
    // Under the bottom arch, GP15's pull-down has room for its tag only inside the arch, past
    // the bottom + rail, under where the resistor ends.
    const parts = FIXTURES["d-pad"].layout.steps.flatMap((step) => step.parts);
    const pullDown = parts.find((p) => p.kind === "resistor" && p.from === "j21");
    if (pullDown?.kind !== "resistor") throw new Error("no pull-down on GP15");
    const tag = clearTagOf(pullDown, parts);
    expect(tag?.y).toBeGreaterThan(holeCentre("bottom+22").y);
    expect(Math.abs((tag?.x ?? 0) - holeCentre("bottom-22").x)).toBeLessThanOrEqual(3);
  });
});
