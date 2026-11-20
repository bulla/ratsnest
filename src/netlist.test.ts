import { describe, expect, it } from "bun:test";
import { FIXTURE_IDS, FIXTURES } from "./__fixtures__/circuits";
import type { Layout, Led, ShownCircuit } from "./circuit";
import type { Part } from "./drawing/breadboard";
import { wiringProblems } from "./netlist";

/** A layout with one step's parts changed, for the cases below to break on purpose. */
function edited(layout: Layout, edit: (parts: Part[]) => Part[]): Layout {
  return {
    ...layout,
    steps: [{ title: "Everything", parts: edit(layout.steps.flatMap((s) => [...s.parts])) }],
  };
}

const replace = (parts: Part[], matches: (part: Part) => boolean, next: Part | null): Part[] =>
  parts.flatMap((part) => (matches(part) ? (next ? [next] : []) : [part]));

const RED_GREEN = FIXTURES["two-lights"].circuit;
const PUSH_BUTTON = FIXTURES["light-and-button"].circuit;

describe("every circuit's breadboard", () => {
  it.each([...FIXTURE_IDS])("wires up exactly what %s says it is", (id) => {
    expect(wiringProblems(FIXTURES[id].circuit, FIXTURES[id].layout)).toEqual([]);
  });

  it.each([...FIXTURE_IDS])("places something in %s", (id) => {
    // A layout with no parts would have nothing to be wrong about.
    expect(FIXTURES[id].layout.steps.flatMap((step) => step.parts).length).toBeGreaterThan(0);
  });
});

describe("the wiring check", () => {
  it("finds a light in backwards", () => {
    const layout = edited(FIXTURES["two-lights"].layout, (parts) =>
      replace(parts, (p) => p.kind === "led" && p.led === "green", {
        kind: "led",
        led: "green",
        anode: "e27",
        cathode: "e26",
      }),
    );
    expect(wiringProblems(RED_GREEN, layout)).toContain(
      "the green LED is in backwards: its long leg must be towards GP16",
    );
  });

  it("finds a light with no resistor", () => {
    const layout = edited(FIXTURES["two-lights"].layout, (parts) =>
      replace(parts, (p) => p.kind === "resistor" && p.from === "a21", {
        kind: "wire",
        from: "a21",
        to: "a26",
        role: "signal",
      }),
    );
    expect(wiringProblems(RED_GREEN, layout)).toContain(
      "the green LED has no resistor between GP16 and ground",
    );
  });

  it("finds a resistor too small for a light", () => {
    const layout = edited(FIXTURES["two-lights"].layout, (parts) =>
      replace(parts, (p) => p.kind === "resistor" && p.from === "j21", {
        kind: "resistor",
        ohms: 100,
        from: "j21",
        to: "j26",
      }),
    );
    expect(wiringProblems(RED_GREEN, layout)).toContain(
      "the red LED's resistor is 100 Ω, outside 220 Ω to 1 kΩ",
    );
  });

  it("finds a light on a pin the circuit does not say", () => {
    const moved: ShownCircuit = {
      ...RED_GREEN,
      leds: RED_GREEN.leds.map(
        (led): Led =>
          led.id === "red" && led.colour !== "rgb"
            ? { ...led, pin: { kind: "gpio", gpio: 14 } }
            : led,
      ),
    };
    expect(wiringProblems(moved, FIXTURES["two-lights"].layout)).toContain(
      "the red LED is not wired from GP14 through one resistor to ground",
    );
  });

  it("finds a button pressing against 5 V instead of 3V3", () => {
    // Pin 40 is VBUS, and it is in c2.
    const layout = edited(FIXTURES["light-and-button"].layout, (parts) =>
      replace(parts, (p) => p.kind === "wire" && p.from === "a6", {
        kind: "wire",
        from: "a2",
        to: "top+7",
        role: "power",
      }),
    );
    const problems = wiringProblems(PUSH_BUTTON, layout);
    expect(problems).toContain("BTN1 is not between GP16 and 3V3(OUT)");
    expect(problems).toContain("the red wire from a2 to top+7 is red, but does not carry power");
  });

  it("finds a button with nothing holding its pin down", () => {
    const layout = edited(FIXTURES["light-and-button"].layout, (parts) =>
      replace(parts, (p) => p.kind === "resistor" && p.from === "b23", null),
    );
    expect(wiringProblems(PUSH_BUTTON, layout)).toContain(
      "BTN1 needs one resistor from GP16 to ground, not 0",
    );
  });

  it("finds a pull-down too weak for an RP2350 whose inputs leak (scratchpi's ADR 0159)", () => {
    // Erratum E9 wants 8.2 kΩ or less, and 10 kΩ, which every page used to name, is more.
    const layout = edited(FIXTURES["light-and-button"].layout, (parts) =>
      replace(parts, (p) => p.kind === "resistor" && p.from === "b23", {
        kind: "resistor",
        ohms: 10_000,
        from: "b23",
        to: "b27",
      }),
    );
    expect(wiringProblems(PUSH_BUTTON, layout)).toContain(
      "BTN1's pull-down is 10 kΩ, outside 1 kΩ to 8.2 kΩ",
    );
  });

  it("finds a pin joined straight to ground", () => {
    const layout = edited(FIXTURES["two-lights"].layout, (parts) => [
      ...parts,
      { kind: "wire", from: "b19", to: "b21", role: "ground" },
    ]);
    expect(wiringProblems(RED_GREEN, layout)).toContain("GP16 is joined to ground");
  });

  it("finds two legs in one hole, and a leg under the Pico", () => {
    const layout = edited(FIXTURES["two-lights"].layout, (parts) => [
      ...parts,
      { kind: "wire", from: "a27", to: "d10", role: "ground" },
    ]);
    const problems = wiringProblems(RED_GREEN, layout);
    expect(problems).toContain(
      "the black wire from a27 to d10 and the black wire from a27 to top-27 both have a leg in a27",
    );
    expect(problems).toContain("the black wire from a27 to d10 has a leg in d10, under the Pico");
  });

  it("finds a hole no breadboard has", () => {
    const layout = edited(FIXTURES["two-lights"].layout, (parts) => [
      ...parts,
      { kind: "wire", from: "a31", to: "top-6", role: "ground" },
    ]);
    expect(wiringProblems(RED_GREEN, layout)).toContain(
      "the black wire from a31 to top-6 has a leg in a31 and top-6, which is not a hole",
    );
  });

  it("finds a wire in the wrong colour", () => {
    const layout = edited(FIXTURES["two-lights"].layout, (parts) =>
      replace(parts, (p) => p.kind === "wire" && p.from === "a19", {
        kind: "wire",
        from: "a19",
        to: "top-19",
        role: "power",
      }),
    );
    expect(wiringProblems(RED_GREEN, layout)).toContain(
      "the red wire from a19 to top-19 is red, but does not carry power",
    );
  });

  it("finds a part the circuit does not have, and one it has but nobody placed", () => {
    const layout = edited(FIXTURES["two-lights"].layout, (parts) =>
      replace(parts, (p) => p.kind === "led" && p.led === "green", {
        kind: "led",
        led: "blue",
        anode: "e26",
        cathode: "e27",
      }),
    );
    const problems = wiringProblems(RED_GREEN, layout);
    expect(problems).toContain('the light "green" is placed 0 times, not once');
    expect(problems).toContain('a light "blue" is placed that Two lights does not have');
  });
});

describe("a button on one half of the board (scratchpi's ADR 0154)", () => {
  const FOUR = FIXTURES["d-pad"].circuit;

  it("finds anything plugged in under its body", () => {
    const layout = edited(FIXTURES["d-pad"].layout, (parts) =>
      replace(parts, (p) => p.kind === "wire" && p.from === "a26", {
        kind: "wire",
        from: "c26",
        to: "top+27",
        role: "power",
      }),
    );
    expect(wiringProblems(FOUR, layout)).toContain(
      "the red wire from c26 to top+27 has a leg in c26, under BTN3",
    );
  });

  it("powers BTN4, at the bottom, only through the middle of the cross (scratchpi's ADR 0166)", () => {
    // Without the jumper across the channel between BTN3 and BTN4, BTN4's column meets no 3V3
    // at all, and nor does the bottom + rail BTN2, on the left, presses against.
    const layout = edited(FIXTURES["d-pad"].layout, (parts) =>
      replace(parts, (p) => p.kind === "wire" && p.from === "e26", null),
    );
    const problems = wiringProblems(FOUR, layout);
    expect(problems).toContain("BTN4 is not between GP13 and 3V3(OUT)");
    expect(problems).toContain("BTN2 is not between GP15 and 3V3(OUT)");
  });
});

describe("an RGB LED on a second breadboard (scratchpi's ADR 0222, 0226)", () => {
  const RGB = FIXTURES["rgb-led-and-d-pad"].circuit;
  const isLed = (part: Part) => part.kind === "rgbLed";
  const led = FIXTURES["rgb-led-and-d-pad"].layout.steps
    .flatMap((step) => [...step.parts])
    .find(isLed);
  if (led?.kind !== "rgbLed") throw new Error("RGB LED's page has no LED");

  it("finds it in backwards, which would put 5 V on GP28", () => {
    const layout = edited(FIXTURES["rgb-led-and-d-pad"].layout, (parts) =>
      replace(parts, isLed, {
        ...led,
        power: led.dataIn,
        dataOut: led.ground,
        ground: led.dataOut,
        dataIn: led.power,
      }),
    );
    const problems = wiringProblems(RGB, layout);
    expect(problems).toContain("the RGB LED's +5 V leg is not on VBUS");
    expect(problems).toContain("the RGB LED's data in is not on GP28");
  });

  it("finds its data out joined to something, which it must not be", () => {
    const layout = edited(FIXTURES["rgb-led-and-d-pad"].layout, (parts) => [
      ...parts,
      { kind: "wire", from: "2:j3", to: "2:i4", role: "ground" },
    ]);
    expect(wiringProblems(RGB, layout)).toContain(
      "the RGB LED's data out is joined to something, and must join nothing",
    );
  });

  it("finds it with its legs spread, rather than side by side in one row", () => {
    const layout = edited(FIXTURES["rgb-led-and-d-pad"].layout, (parts) =>
      replace(parts, isLed, { ...led, dataIn: "2:g5" }),
    );
    expect(wiringProblems(RGB, layout)).toContain(
      "the RGB LED needs its four legs side by side in one row",
    );
  });

  it("joins the second board to the first only by its jumpers", () => {
    const layout = edited(FIXTURES["rgb-led-and-d-pad"].layout, (parts) =>
      replace(parts, (part) => part.kind === "wire" && part.to === "2:j2", null),
    );
    expect(wiringProblems(RGB, layout)).toContain("the RGB LED's +5 V leg is not on VBUS");
  });

  it("lets a red wire carry VBUS only where something takes 5 V", () => {
    expect(wiringProblems(RGB, FIXTURES["rgb-led-and-d-pad"].layout)).toEqual([]);
    // a light and a button's 3V3 jumper from VBUS instead is still a mistake, as it always was.
    const layout = edited(FIXTURES["light-and-button"].layout, (parts) =>
      replace(parts, (p) => p.kind === "wire" && p.from === "a6", {
        kind: "wire",
        from: "a2",
        to: "top+7",
        role: "power",
      }),
    );
    expect(wiringProblems(PUSH_BUTTON, layout)).toContain(
      "the red wire from a2 to top+7 is red, but does not carry power",
    );
  });
});

describe("the ring, standing in row j (scratchpi's ADR 0234, 0238)", () => {
  const RING = FIXTURES["ring-and-button"].circuit;
  const isRing = (part: Part) => part.kind === "ring";
  const ring = FIXTURES["ring-and-button"].layout.steps
    .flatMap((step) => [...step.parts])
    .find(isRing);
  if (ring?.kind !== "ring") throw new Error("Light ring's page has no ring");

  it("stands in the bottom row, data out, ground, 5 V and data in from left to right", () => {
    expect(ring).toEqual({
      kind: "ring",
      led: "ring",
      dataOut: "j26",
      ground: "j27",
      power: "j28",
      dataIn: "j29",
    });
  });

  it("finds it turned round, which would put 5 V on GP15", () => {
    const layout = edited(FIXTURES["ring-and-button"].layout, (parts) =>
      replace(parts, isRing, {
        ...ring,
        dataOut: ring.dataIn,
        ground: ring.power,
        power: ring.ground,
        dataIn: ring.dataOut,
      }),
    );
    const problems = wiringProblems(RING, layout);
    expect(problems).toContain("the LED ring's +5 V leg is not on VBUS");
    expect(problems).toContain("the LED ring's ground leg is not on ground");
    expect(problems).toContain("the LED ring's data in is not on GP15");
  });

  it("finds its data out joined to something, which it must not be", () => {
    const layout = edited(FIXTURES["ring-and-button"].layout, (parts) => [
      ...parts,
      { kind: "wire", from: "i26", to: "i19", role: "ground" },
    ]);
    expect(wiringProblems(RING, layout)).toContain(
      "the LED ring's data out is joined to something, and must join nothing",
    );
  });

  it("finds it with its pins spread, rather than side by side in one row", () => {
    const layout = edited(FIXTURES["ring-and-button"].layout, (parts) =>
      replace(parts, isRing, { ...ring, dataIn: "j30" }),
    );
    expect(wiringProblems(RING, layout)).toContain(
      "the LED ring needs its four legs side by side in one row",
    );
  });

  it("finds it without its 5 V, which only the arching jumper brings", () => {
    const layout = edited(FIXTURES["ring-and-button"].layout, (parts) =>
      replace(parts, (part) => part.kind === "wire" && Boolean(part.arch), null),
    );
    expect(wiringProblems(RING, layout)).toContain("the LED ring's +5 V leg is not on VBUS");
  });

  it("is placed once, and is not an RGB LED's part", () => {
    // In the same four holes, in an RGB LED's order of its legs.
    const layout = edited(FIXTURES["ring-and-button"].layout, (parts) =>
      replace(parts, isRing, {
        kind: "rgbLed",
        led: "ring",
        power: "j26",
        dataOut: "j27",
        ground: "j28",
        dataIn: "j29",
      }),
    );
    const problems = wiringProblems(RING, layout);
    expect(problems).toContain('the ring "ring" is placed 0 times, not once');
    expect(problems).toContain('a RGB LED "ring" is placed that A ring and a button does not have');
  });
});

describe("a jumper that arches over the board (scratchpi's ADR 0166)", () => {
  const FOUR = FIXTURES["d-pad"].circuit;
  const arches = (layout: Layout) =>
    layout.steps.flatMap((step) => step.parts).filter((p) => p.kind === "wire" && p.arch);

  it("is how a d-pad reaches BTN1 and BTN4, and a ring and a button 5 V, and nothing else", () => {
    expect(arches(FIXTURES["d-pad"].layout)).toEqual([
      { kind: "wire", from: "j18", to: "j25", role: "signal", arch: true },
      { kind: "wire", from: "b21", to: "b28", role: "signal", arch: true },
    ]);
    // RGB LED builds a d-pad' d-pad first (scratchpi's ADR 0222), arches and all.
    expect(arches(FIXTURES["rgb-led-and-d-pad"].layout)).toEqual(arches(FIXTURES["d-pad"].layout));
    // a ring and a button's 5 V, over rows a and b, which BTN1 and its pull-down take (scratchpi's ADR 0238).
    expect(arches(FIXTURES["ring-and-button"].layout)).toEqual([
      { kind: "wire", from: "a2", to: "a28", role: "power", arch: true },
    ]);
    const arching = new Set(["d-pad", "rgb-led-and-d-pad", "ring-and-button"]);
    for (const id of FIXTURE_IDS)
      if (!arching.has(id)) expect(arches(FIXTURES[id].layout)).toEqual([]);
  });

  it("joins the strips at its ends, like any jumper", () => {
    // Laid flat instead, it wires up exactly the same circuit.
    const flat = edited(FIXTURES["d-pad"].layout, (parts) =>
      parts.map(
        (p): Part =>
          p.kind === "wire" ? { kind: "wire", from: p.from, to: p.to, role: p.role } : p,
      ),
    );
    expect(wiringProblems(FOUR, flat)).toEqual([]);
    // And without one, BTN1, on the right, is on no pin at all.
    const cut = edited(FIXTURES["d-pad"].layout, (parts) =>
      replace(parts, (p) => p.kind === "wire" && p.from === "b21", null),
    );
    expect(wiringProblems(FOUR, cut)).toContain("BTN1 is not between GP16 and 3V3(OUT)");
  });
});
