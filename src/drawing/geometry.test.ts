import { describe, expect, it } from "bun:test";
import { USABLE_GPIO } from "../pins";
import {
  BOARD_LENGTH_MM,
  BOARD_WIDTH_MM,
  DEBUG_PINS,
  DRILLED_HOLES,
  HEADER_PINS,
  headerPinOfGpio,
  PIN_EDGE_INSET_MM,
  PIN_PITCH_MM,
  PIN_RUN_MM,
  PIN_TOP_INSET_MM,
  PINS_PER_SIDE,
} from "./geometry";

const side = (which: "left" | "right") => HEADER_PINS.filter((pin) => pin.side === which);

describe("the header", () => {
  it("has the forty pins the datasheet says it has", () => {
    expect(HEADER_PINS).toHaveLength(PINS_PER_SIDE * 2);
    expect(HEADER_PINS.map((pin) => pin.number)).toEqual(
      Array.from({ length: 40 }, (_, i) => i + 1),
    );
  });

  it("breaks out exactly the GPIO the board has", () => {
    // The one test that holds the drawing to scratchpi's ADR 0010. If a label here is wrong, the
    // picture disagrees with the pin list the circuit is allowed to use, and the disagreement
    // would otherwise only show up as a light drawn at the wrong pin.
    const gpio = HEADER_PINS.flatMap((pin) => (pin.gpio === undefined ? [] : [pin.gpio]));
    expect([...gpio].sort((a, b) => a - b)).toEqual([...USABLE_GPIO]);
  });

  it("accounts for all forty, in the four kinds the drawing colours", () => {
    // §2.1 says "apart from GPIO and ground pins, there are seven other pins", counting
    // AGND among the seven. The drawing counts AGND as the ground it is, and splits the
    // rest into what carries volts and what resets the board — so 26 + 8 + 4 + 2 rather
    // than 26 + 7 + 7. Either way it is the arithmetic that makes the table checkable
    // without the diagram: every pin is exactly one of the kinds.
    const kinds = HEADER_PINS.map((pin) => pin.kind);
    expect(kinds.filter((kind) => kind === "gpio")).toHaveLength(26);
    expect(kinds.filter((kind) => kind === "ground")).toHaveLength(8);
    expect(kinds.filter((kind) => kind === "power")).toHaveLength(4);
    expect(kinds.filter((kind) => kind === "control")).toHaveLength(2);
    expect(kinds).toHaveLength(40);
  });

  it("marks the two pins that reset the board rather than power anything", () => {
    // Shorting either of these to ground does something to the board, which is a
    // different warning from "this carries volts" and gets its own colour.
    const control = HEADER_PINS.filter((pin) => pin.kind === "control").map((p) => p.label);
    expect(control).toEqual(["RUN", "3V3_EN"]);
    // ADC_VREF is counted with the power pins: §2.1 calls it the ADC's power supply.
    expect(HEADER_PINS[34]?.kind).toBe("power");
  });

  it("puts the named pins where §2.1 names them", () => {
    const labelAt = (number: number) => HEADER_PINS[number - 1]?.label;
    expect(labelAt(30)).toBe("RUN");
    expect(labelAt(33)).toBe("AGND");
    expect(labelAt(35)).toBe("ADC_VREF");
    expect(labelAt(36)).toBe("3V3(OUT)");
    expect(labelAt(37)).toBe("3V3_EN");
    expect(labelAt(39)).toBe("VSYS");
    expect(labelAt(40)).toBe("VBUS");
  });

  it("treats AGND as a ground rather than as somewhere a light could go", () => {
    expect(HEADER_PINS[32]?.kind).toBe("ground");
    expect(HEADER_PINS[32]?.gpio).toBeUndefined();
  });
});

describe("the pin geometry", () => {
  it("runs twenty down each side", () => {
    expect(side("left")).toHaveLength(PINS_PER_SIDE);
    expect(side("right")).toHaveLength(PINS_PER_SIDE);
  });

  it("folds, so pin 21 is opposite pin 20 and pin 40 is opposite pin 1", () => {
    const at = (number: number) => HEADER_PINS[number - 1];
    expect(at(21)?.y).toBeCloseTo(at(20)?.y ?? -1, 6);
    expect(at(40)?.y).toBeCloseTo(at(1)?.y ?? -1, 6);
    expect(at(1)?.x).not.toBeCloseTo(at(40)?.x ?? -1, 6);
  });

  it("spaces them 2.54 mm apart, which is what makes it breadboard-compatible", () => {
    for (const pins of [side("left"), side("right")]) {
      const ys = pins.map((pin) => pin.y).sort((a, b) => a - b);
      for (let i = 1; i < ys.length; i++) {
        expect((ys[i] ?? 0) - (ys[i - 1] ?? 0)).toBeCloseTo(PIN_PITCH_MM, 6);
      }
    }
  });

  it("spans 48.26 mm, which is 19 gaps and not 20", () => {
    expect(PIN_RUN_MM).toBeCloseTo(48.26, 6);
    expect(PIN_TOP_INSET_MM + PIN_RUN_MM).toBeLessThan(BOARD_LENGTH_MM);
  });

  it("puts the two columns 17.78 mm apart", () => {
    // Figure 3 dimensions this directly, and 1.61 + 17.78 + 1.61 is 21 exactly.
    const [left] = side("left");
    const [right] = side("right");
    expect((right?.x ?? 0) - (left?.x ?? 0)).toBeCloseTo(17.78, 6);
    expect(PIN_EDGE_INSET_MM * 2 + 17.78).toBeCloseTo(BOARD_WIDTH_MM, 6);
  });

  it("keeps every pad on the board", () => {
    for (const pin of HEADER_PINS) {
      expect(pin.x).toBeGreaterThan(0);
      expect(pin.x).toBeLessThan(BOARD_WIDTH_MM);
      expect(pin.y).toBeGreaterThan(0);
      expect(pin.y).toBeLessThan(BOARD_LENGTH_MM);
    }
  });
});

describe("the holes through the board", () => {
  it("drills one for every header pin, four to mount it by, and three for the debug header", () => {
    expect(DRILLED_HOLES).toHaveLength(HEADER_PINS.length + 4 + DEBUG_PINS);
  });

  it("puts every one of them on the board", () => {
    for (const { cx, cy, r } of DRILLED_HOLES) {
      expect(cx - r).toBeGreaterThan(0);
      expect(cx + r).toBeLessThan(BOARD_WIDTH_MM);
      expect(cy - r).toBeGreaterThan(0);
      expect(cy + r).toBeLessThan(BOARD_LENGTH_MM);
    }
  });

  it("drills a header hole through the middle of its pin", () => {
    for (const pin of HEADER_PINS) {
      expect(DRILLED_HOLES).toContainEqual(expect.objectContaining({ cx: pin.x, cy: pin.y }));
    }
  });
});

describe("finding a light's pin", () => {
  it("finds the pins the shipped circuit uses", () => {
    expect(headerPinOfGpio(15)?.number).toBe(20);
    expect(headerPinOfGpio(16)?.number).toBe(21);
  });

  it("does not find one the board keeps for itself", () => {
    // GP25 drives the wireless SPI chip select, and never reaches a header pin.
    expect(headerPinOfGpio(25)).toBeUndefined();
    expect(headerPinOfGpio(29)).toBeUndefined();
  });
});
