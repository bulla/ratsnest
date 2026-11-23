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
  type Row,
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
  labelEndOf,
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

  it("gives each of three buttons in a line a lane of its own, alternating sides (ADR 0026)", () => {
    const first: Part = { kind: "button", button: "first", columns: [22, 24] };
    const second: Part = { kind: "button", button: "second", columns: [25, 27] };
    const third: Part = { kind: "button", button: "third", columns: [28, 30] };
    const line = [first, second, third];
    const [one, two, three] = line.map((button) => leaderOf(button, line));

    // The blocked button nearest the end runs between d and e, from the top of its body...
    expect(two?.run.y).toBeGreaterThan(rowY("d"));
    expect(two?.run.y).toBeLessThan(rowY("e"));
    expect(two?.dot.y).toBeLessThan(CHANNEL_Y_MM);
    // ...the next between f and g, from the bottom of its body, on the channel's other side...
    expect(one?.run.y).toBeGreaterThan(rowY("f"));
    expect(one?.run.y).toBeLessThan(rowY("g"));
    expect(one?.dot.y).toBeGreaterThan(CHANNEL_Y_MM);
    // ...and the last one runs straight along the channel.
    expect(three?.run.y).toBe(CHANNEL_Y_MM);

    // So no two leaders share a line to the margin.
    expect(new Set([one?.run.y, two?.run.y, three?.run.y]).size).toBe(3);
  });

  it("goes a row further out on each side for a fourth and a fifth button (ADR 0026)", () => {
    const line: Part[] = [10, 13, 16, 19, 22].map((column) => ({
      kind: "button",
      button: `at ${column}`,
      columns: [column, column + 2],
    }));
    const runs = line.map((button) => leaderOf(button, line)?.run.y ?? Number.NaN);
    const between = (a: Row, b: Row) => (rowY(a) + rowY(b)) / 2;
    const expected = [
      between("g", "h"),
      between("c", "d"),
      between("f", "g"),
      between("d", "e"),
      CHANNEL_Y_MM,
    ];
    expected.forEach((y, i) => {
      expect(runs[i]).toBeCloseTo(y, 9);
    });
  });
});

describe("the end a label goes past (ADR 0024, ADR 0027)", () => {
  const rgbAt = (first: number, board: "" | "2:"): Part => ({
    kind: "rgbLed",
    led: "rgb",
    power: `${board}f${first}`,
    dataOut: `${board}f${first + 1}`,
    ground: `${board}f${first + 2}`,
    dataIn: `${board}f${first + 3}`,
  });

  it("is the far end for every part on the first board, however near the USB it is", () => {
    expect(labelEndOf(rgbAt(22, ""))).toBe("far");
    expect(labelEndOf({ kind: "led", led: "red", anode: "a1", cathode: "b1" })).toBe("far");
  });

  it("is the nearer end for a part on the second board, by its middle column", () => {
    expect(labelEndOf(rgbAt(2, "2:"))).toBe("near");
    // Columns 13 to 16: its middle, 14.5, is in the near half.
    expect(labelEndOf(rgbAt(13, "2:"))).toBe("near");
    // Columns 14 to 17: its middle, 15.5, is the board's own, which counts as near.
    expect(labelEndOf(rgbAt(14, "2:"))).toBe("near");
    expect(labelEndOf(rgbAt(15, "2:"))).toBe("far");
    expect(labelEndOf(rgbAt(27, "2:"))).toBe("far");
  });

  it("starts a leader towards the near end on the part's other side", () => {
    const near = rgbAt(2, "2:");
    const far = rgbAt(27, "2:");
    const middleOf = (part: Part) =>
      legsOf(part)
        .map((leg) => holeCentre(leg).x)
        .reduce((sum, x) => sum + x, 0) / 4;
    const towardsNear = leaderOf(near, [near]);
    expect(towardsNear?.end).toBe("near");
    expect(towardsNear?.dot.x).toBeLessThan(middleOf(near));
    const towardsFar = leaderOf(far, [far]);
    expect(towardsFar?.end).toBe("far");
    expect(towardsFar?.dot.x).toBeGreaterThan(middleOf(far));
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

describe("a button on the second board (ADR 0028)", () => {
  const second: Part = { kind: "button", button: "b", columns: [10, 12], board: 2 };
  const halfSecond: Part = { ...second, rows: ["b", "e"] } as Part;

  it("has its legs, and the holes under it, on the second board", () => {
    expect(legsOf(second)).toEqual(["2:e10", "2:f10", "2:e12", "2:f12"]);
    if (halfSecond.kind === "button") {
      expect(coveredBy(halfSecond)).toEqual(["2:c10", "2:c11", "2:c12", "2:d10", "2:d11", "2:d12"]);
    }
  });

  it("has its leader leave from where it is drawn, on the second board", () => {
    const leader = leaderOf(second, [second]);
    // Columns 10 to 12 are the second board's near half (ADR 0027).
    expect(leader?.end).toBe("near");
    expect(leader?.dot.y).toBeCloseTo(holeCentre("2:e10").y + (rowY("f") - rowY("e")) / 2, 9);
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

  it("stays where it always was on every page without a d-pad, but for one down to a rail", () => {
    // A resistor down to a rail has places of its own past the outer rail (scratchpi's ADR 0166), and
    // since M5 a pull-down goes straight to the rail where a standing board leaves no room beside it.
    let held = 0;
    for (const [id, parts] of everyLayout) {
      if (id === "d-pad" || id === "rgb-led-and-d-pad") continue;
      // With no Pico on the board (ADR 0032), a tag may stand where the Pico would be: asked here,
      // outside a drawing, the Pico is assumed.
      if (FIXTURES[id].circuit.supply) continue;
      for (const part of parts) {
        if (part.kind !== "resistor") continue;
        if ([part.from, part.to].some((hole) => /^(?:2:)?(?:top|bottom)/.test(hole))) continue;
        held += 1;
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
    expect(held).toBeGreaterThan(3);
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
