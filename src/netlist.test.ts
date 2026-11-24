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

describe("a circuit with a supply (ADR 0033)", () => {
  const { circuit, layout } = FIXTURES["two-lights-on-a-supply"];
  const problems = (edit: (parts: Part[]) => Part[]) =>
    wiringProblems(circuit, edited(layout, edit));
  const add = (part: Part) => (parts: Part[]) => [...parts, part];

  it("lets a part stand where the Pico would be, since there is none", () => {
    expect(wiringProblems(circuit, layout)).toEqual([]);
  });

  it("keeps the holes its supply's leads are in", () => {
    expect(problems(add({ kind: "wire", from: "a1", to: "top+1", role: "power" }))).toContain(
      "the red wire from a1 to top+1 and the supply's red lead both have a leg in top+1",
    );
  });

  it("finds a light in backwards", () => {
    const turned = problems((parts) =>
      replace(parts, (p) => p.kind === "led" && p.led === "red", {
        kind: "led",
        led: "red",
        anode: "c10",
        cathode: "c9",
      }),
    );
    expect(turned).toContain("the red LED is in backwards: its long leg must be towards +");
  });

  it("finds a light with no resistor, or one outside the range", () => {
    const bare = problems((parts) =>
      replace(parts, (p) => p.kind === "resistor" && p.from === "b5", {
        kind: "wire",
        from: "b5",
        to: "b9",
        role: "power",
      }),
    );
    expect(bare).toContain("the red LED has no resistor between + and −");
    const low = problems((parts) =>
      replace(parts, (p) => p.kind === "resistor" && p.from === "b5", {
        kind: "resistor",
        ohms: 100,
        from: "b5",
        to: "b9",
      }),
    );
    expect(low).toContain("the red LED's resistor is 100 Ω, outside 220 Ω to 1 kΩ");
  });

  it("finds a button that switches no light", () => {
    // Joined to + on both sides, it lights nothing that was not lit already.
    const spare = problems(add({ kind: "wire", from: "a16", to: "top+16", role: "power" }));
    expect(spare).toContain(
      "BTN1 switches no light: it goes on a light's way, between + and the light or between the light and −",
    );
  });

  it("finds a short across the supply, with nothing held and with every button held", () => {
    expect(problems(add({ kind: "wire", from: "top+3", to: "top-3", role: "power" }))).toEqual([
      "the supply's + and − are joined: a short across it",
    ]);
    expect(problems(add({ kind: "wire", from: "a16", to: "top-16", role: "ground" }))).toEqual([
      "the supply's + and − are joined while every button is held: a short",
    ]);
  });

  it("finds a wire not in the colour of what it carries", () => {
    const yellow = problems((parts) =>
      replace(parts, (p) => p.kind === "wire" && p.from === "a5", {
        kind: "wire",
        from: "a5",
        to: "top+5",
        role: "signal",
      }),
    );
    expect(yellow).toContain(
      "the yellow wire from a5 to top+5 is yellow, but carries +: red is for +, black for −, yellow for anything else",
    );
  });

  it("finds a resistor that is no light's", () => {
    expect(problems(add({ kind: "resistor", ohms: 330, from: "g25", to: "g28" }))).toContain(
      "the 330 Ω resistor from g25 to g28 is not a light's resistor, or a flasher's base resistor",
    );
  });
});

describe("an electrolytic capacitor keeping a light lit (ADR 0043)", () => {
  const { circuit, layout } = FIXTURES["light-kept-lit-by-a-capacitor"];
  const problems = (edit: (parts: Part[]) => Part[]) =>
    wiringProblems(circuit, edited(layout, edit));
  const capacitor = (next: Part | null) => (parts: Part[]) =>
    replace(parts, (p) => p.kind === "electrolytic", next);
  const NAME = "the 1000 µF capacitor with its + leg in i15";

  it("takes one between a button and a light's resistor, its − leg on −", () => {
    expect(wiringProblems(circuit, layout)).toEqual([]);
  });

  it("finds one in backwards", () => {
    const turned = problems(
      capacitor({ kind: "electrolytic", microfarads: 1000, plus: "i14", minus: "i15" }),
    );
    expect(turned).toContain(
      "the 1000 µF capacitor with its + leg in i14 is in backwards: its − leg, under the stripe, goes towards −, and its + leg towards +",
    );
  });

  it("finds its legs anywhere but side by side in one row", () => {
    expect(
      problems(capacitor({ kind: "electrolytic", microfarads: 1000, plus: "i15", minus: "h14" })),
    ).toContain(`${NAME} needs its legs in one row, one hole apart`);
  });

  it("finds its − leg off −", () => {
    const off = problems((parts) =>
      replace(parts, (p) => p.kind === "wire" && p.from === "j14", {
        kind: "wire",
        from: "j14",
        to: "j17",
        role: "signal",
      }),
    );
    expect(off).toContain(`${NAME} has its − leg, under the stripe, off −: it goes straight to −`);
  });

  it("finds one across the supply, before any button", () => {
    const across = problems(
      capacitor({ kind: "electrolytic", microfarads: 1000, plus: "i13", minus: "i14" }),
    );
    expect(across).toContain(
      "the 1000 µF capacitor with its + leg in i13 is across the supply, where it keeps no light lit: its + leg goes between a button and a light's resistor",
    );
  });

  it("finds one that keeps no light lit, across the light itself", () => {
    const after = problems((parts) => [
      ...capacitor({ kind: "electrolytic", microfarads: 1000, plus: "i20", minus: "i19" })(parts),
      { kind: "wire", from: "j19", to: "bottom-19", role: "ground" },
    ]);
    expect(after).toContain(
      "the 1000 µF capacitor with its + leg in i20 keeps no light lit: its + leg goes between a button and a light's resistor, and its − leg to −",
    );
  });

  it("finds one that empties too fast to see its light fade", () => {
    const small = problems(
      capacitor({ kind: "electrolytic", microfarads: 100, plus: "i15", minus: "i14" }),
    );
    expect(small).toContain(
      "the 100 µF capacitor with its + leg in i15 empties through the 470 Ω resistor in about 0.05 s, too fast to see its light fade: with that resistor it needs 426 µF or more",
    );
  });

  it("finds one on a Pico, where it has no use yet", () => {
    const { circuit: pico, layout: picoLayout } = FIXTURES["two-lights"];
    const found = wiringProblems(
      pico,
      edited(picoLayout, (parts) => [
        ...parts,
        { kind: "electrolytic", microfarads: 470, plus: "g28", minus: "g29" },
      ]),
    );
    expect(found).toContain(
      "the 470 µF capacitor with its + leg in g28 has no use ratsnest knows on a Pico: an electrolytic capacitor keeps a light lit on a supply (ADR 0043)",
    );
  });
});

describe("a transistor switching a light (ADR 0044)", () => {
  const { circuit, layout } = FIXTURES["light-on-a-transistor"];
  const problems = (edit: (parts: Part[]) => Part[]) =>
    wiringProblems(circuit, edited(layout, edit));
  const NAME = "the 2N3904 with its emitter in e24";

  it("takes one with its emitter on ground, its base on the pin through a resistor, and the light on its collector", () => {
    expect(wiringProblems(circuit, layout)).toEqual([]);
  });

  it("finds its legs out of order, its flat face turned away", () => {
    const turned = problems((parts) =>
      replace(parts, (p) => p.kind === "transistor", {
        kind: "transistor",
        model: "2N3904",
        emitter: "e26",
        base: "e25",
        collector: "e24",
      }),
    );
    expect(turned).toContain(
      "the 2N3904 with its emitter in e26 needs its legs side by side in one row: emitter, base, collector, left to right, its flat face towards row j",
    );
  });

  it("finds its light in backwards", () => {
    const turned = problems((parts) =>
      replace(parts, (p) => p.kind === "led", {
        kind: "led",
        led: "green",
        anode: "e29",
        cathode: "e30",
      }),
    );
    expect(turned).toContain(
      "the green LED is in backwards: its long leg must be towards 3V3(OUT), and its short leg towards the 2N3904's collector",
    );
  });

  it("finds its emitter off ground", () => {
    const off = problems((parts) =>
      replace(parts, (p) => p.kind === "wire" && p.from === "a24", null),
    );
    expect(off).toContain(`${NAME} has its emitter off ground`);
  });

  it("finds its base straight on the pin, or through a resistor out of range", () => {
    const base = (next: Part) => (parts: Part[]) =>
      replace(parts, (p) => p.kind === "resistor" && p.from === "b20", next);
    expect(problems(base({ kind: "wire", from: "b20", to: "b25", role: "signal" }))).toContain(
      `${NAME} has its base straight on GP17: a resistor of 1 kΩ to 10 kΩ goes between them`,
    );
    expect(problems(base({ kind: "resistor", ohms: 100000, from: "b20", to: "b25" }))).toContain(
      `${NAME}'s base resistor is 100 kΩ, outside 1 kΩ to 10 kΩ`,
    );
  });

  it("finds its light with no resistor of its own", () => {
    const bare = problems((parts) =>
      replace(parts, (p) => p.kind === "resistor" && p.from === "a26", {
        kind: "wire",
        from: "a26",
        to: "a29",
        role: "signal",
      }),
    );
    expect(bare).toContain(
      "the green LED is not wired from 3V3(OUT) through one resistor to the 2N3904's collector",
    );
  });

  it("finds one that switches no light", () => {
    const spare = problems((parts) => [
      ...parts,
      { kind: "transistor", model: "2N3904", emitter: "h23", base: "h24", collector: "h25" },
    ]);
    expect(spare).toContain(
      "the 2N3904 with its emitter in h23 switches no light: its emitter goes on ground, its base through a resistor from a light's pin, and its collector under the light",
    );
  });
});

describe("a PNP transistor switching a light on the high side (ADR 0045)", () => {
  const { circuit, layout } = FIXTURES["light-under-a-pnp-transistor"];
  const problems = (edit: (parts: Part[]) => Part[]) =>
    wiringProblems(circuit, edited(layout, edit));
  const NAME = "the 2N3906 with its emitter in e24";

  it("takes one with its emitter on 3V3, its base on the pin through a resistor, and the light from its collector to ground", () => {
    expect(wiringProblems(circuit, layout)).toEqual([]);
  });

  it("finds its light in backwards", () => {
    const turned = problems((parts) =>
      replace(parts, (p) => p.kind === "led", {
        kind: "led",
        led: "yellow",
        anode: "e30",
        cathode: "e29",
      }),
    );
    expect(turned).toContain(
      "the yellow LED is in backwards: its long leg must be towards the 2N3906's collector, and its short leg towards ground",
    );
  });

  it("finds its emitter off 3V3, on ground as an NPN's would be", () => {
    const grounded = problems((parts) =>
      replace(parts, (p) => p.kind === "wire" && p.from === "a24", {
        kind: "wire",
        from: "a24",
        to: "top-25",
        role: "ground",
      }),
    );
    expect(grounded).toContain(`${NAME} has its emitter off 3V3(OUT)`);
  });

  it("finds its light with no resistor of its own", () => {
    const bare = problems((parts) =>
      replace(parts, (p) => p.kind === "resistor" && p.from === "a26", {
        kind: "wire",
        from: "a26",
        to: "a29",
        role: "signal",
      }),
    );
    expect(bare).toContain(
      "the yellow LED is not wired from the 2N3906's collector through one resistor to ground",
    );
  });

  it("finds one that switches no light", () => {
    const spare = problems((parts) => [
      ...parts,
      { kind: "transistor", model: "2N3906", emitter: "h23", base: "h24", collector: "h25" },
    ]);
    expect(spare).toContain(
      "the 2N3906 with its emitter in h23 switches no light: its emitter goes on 3V3(OUT), its base through a resistor from a light's pin, and its collector over the light",
    );
  });
});

describe("two transistors flashing two lights, on a supply (ADR 0046)", () => {
  const { circuit, layout } = FIXTURES["two-lights-flashing"];
  const problems = (edit: (parts: Part[]) => Part[]) =>
    wiringProblems(circuit, edited(layout, edit));
  const LEFT = "the 2N3904 with its emitter in f9";
  const RIGHT = "the 2N3904 with its emitter in f20";
  const capacitor = (microfarads: number, next: Part) => (parts: Part[]) =>
    replace(parts, (p) => p.kind === "electrolytic" && p.microfarads === microfarads, next);

  it("takes two crosswise, each with its light, its base resistor and its capacitor", () => {
    expect(wiringProblems(circuit, layout)).toEqual([]);
  });

  it("finds a light in backwards", () => {
    const turned = problems((parts) =>
      replace(parts, (p) => p.kind === "led" && p.led === "green", {
        kind: "led",
        led: "green",
        anode: "f6",
        cathode: "f5",
      }),
    );
    expect(turned).toContain(
      "the green LED is in backwards: its long leg must be towards +, and its short leg towards the 2N3904's collector",
    );
  });

  it("finds an emitter off −", () => {
    const off = problems((parts) =>
      replace(parts, (p) => p.kind === "wire" && p.from === "j9", null),
    );
    expect(off).toContain(`${LEFT} has its emitter off −`);
  });

  it("finds a base resistor out of its range", () => {
    const low = problems((parts) =>
      replace(parts, (p) => p.kind === "resistor" && p.from === "j10", {
        kind: "resistor",
        ohms: 1000,
        from: "j10",
        to: "bottom+10",
      }),
    );
    expect(low).toContain(`${LEFT}'s base resistor is 1 kΩ, outside 10 kΩ to 100 kΩ`);
  });

  it("finds a capacitor in backwards, its stripe towards the collector", () => {
    const turned = problems(
      capacitor(47, { kind: "electrolytic", microfarads: 47, plus: "f15", minus: "f14" }),
    );
    expect(turned).toContain(
      "the 47 µF capacitor with its + leg in f15 is in backwards: its + leg goes towards the collector, and its − leg, under the stripe, towards the base",
    );
  });

  it("finds a transistor with no capacitor to its base", () => {
    const lone = problems((parts) =>
      parts.filter(
        (p) =>
          !(p.kind === "electrolytic" && p.microfarads === 47) &&
          !(p.kind === "wire" && (p.from === "g11" || p.from === "h15")),
      ),
    );
    expect(lone).toContain(
      `${RIGHT} needs one capacitor from the other transistor's collector to its base: two transistors, each with one, make a flasher`,
    );
  });

  it("finds a beat too fast to see", () => {
    const fast = problems(
      capacitor(4.7, { kind: "electrolytic", microfarads: 1, plus: "f18", minus: "f17" }),
    );
    expect(fast).toContain(
      `the 33 kΩ resistor and the 1 µF capacitor with its + leg in f18 hold ${LEFT} off for about 0.02 s at a time, too fast to see the lights flash: 0.1 s at least`,
    );
  });

  it("finds a PNP transistor, which has no use on a supply", () => {
    const pnp = problems((parts) =>
      replace(parts, (p) => p.kind === "transistor" && p.emitter === "f20", {
        kind: "transistor",
        model: "2N3906",
        emitter: "f20",
        base: "f21",
        collector: "f22",
      }),
    );
    expect(pnp).toContain(
      "the 2N3906 with its emitter in f20 has no use ratsnest knows on a supply: two NPN transistors make a flasher (ADR 0046)",
    );
  });
});

describe("a diode on a light's way (ADR 0049)", () => {
  const { circuit, layout } = FIXTURES["lights-kept-apart-by-diodes"];
  const problems = (edit: (parts: Part[]) => Part[], on: ShownCircuit = circuit) =>
    wiringProblems(on, edited(layout, edit));
  const diode = (anode: string, next: Part | null) => (parts: Part[]) =>
    replace(parts, (p) => p.kind === "diode" && p.anode === anode, next);

  it("takes two that keep each button from the other's own light", () => {
    expect(wiringProblems(circuit, layout)).toEqual([]);
  });

  it("finds one in backwards, its band towards its button", () => {
    const turned = problems(
      diode("i14", { kind: "diode", model: "1N4007", anode: "i18", cathode: "i14" }),
    );
    expect(turned).toEqual([
      "the 1N4007 with its anode in i18 is in backwards: its band, at its cathode, goes towards −, the way its light's current runs",
    ]);
  });

  it("finds its legs too close together for its body", () => {
    expect(
      problems(diode("i14", { kind: "diode", model: "1N4007", anode: "i14", cathode: "i16" })),
    ).toContain(
      "the 1N4007 with its anode in i14 needs its legs three holes apart or more, for its body to lie between them",
    );
  });

  it("finds one beside a light's resistor, which it takes the light's current round", () => {
    const beside = problems((parts) => [
      ...parts,
      { kind: "diode", model: "1N4148", anode: "g14", cathode: "g8" },
    ]);
    expect(beside).toContain("the red LED has no resistor between + and −");
    expect(beside).toContain(
      "the 1N4148 with its anode in g14 is on no light's way: it goes between + and a light's resistor, or between a light and −, its band towards −",
    );
  });

  it("finds one from + straight to −, a short", () => {
    expect(
      problems((parts) => [
        ...parts,
        { kind: "diode", model: "1N4148", anode: "g16", cathode: "g7" },
      ]),
    ).toEqual([
      "the 1N4148 with its anode in g16 lets the supply's current straight from + to −, with nothing to hold it back: a short",
    ]);
  });

  it("finds too little of the 3 V supply left for a light once a diode has taken its own", () => {
    const three: ShownCircuit = { ...circuit, supply: { volts: 3, rails: "bottom" } };
    expect(problems((parts) => parts, three)).toEqual([
      "the orange LED has a diode on its way, each taking about 0.7 V, which leaves too little of the 3 V supply to light it: take `volts: 3.7`",
    ]);
  });

  it("finds one on a Pico, where it has no use yet", () => {
    const { circuit: pico, layout: picoLayout } = FIXTURES["two-lights"];
    const found = wiringProblems(
      pico,
      edited(picoLayout, (parts) => [
        ...parts,
        { kind: "diode", model: "1N4148", anode: "g28", cathode: "g24" },
      ]),
    );
    expect(found).toContain(
      "the 1N4148 with its anode in g28 has no use ratsnest knows on a Pico: a diode keeps a light's current one way on a supply (ADR 0049)",
    );
  });

  describe("anywhere on a light's way", () => {
    const { circuit: two, layout: twoLayout } = FIXTURES["two-lights-on-a-supply"];
    const supplied: ShownCircuit = { ...two, supply: { volts: 4.5, rails: "top" } };
    const red = (next: Part[]) => (parts: Part[]) => [
      ...parts.filter(
        (p) => !(p.kind === "led" && p.led === "red") && !(p.kind === "wire" && p.from === "a10"),
      ),
      ...next,
    ];

    it("takes one between a light's resistor and its long leg", () => {
      const between = wiringProblems(
        supplied,
        edited(
          twoLayout,
          red([
            { kind: "diode", model: "1N4148", anode: "d9", cathode: "d12" },
            { kind: "led", led: "red", anode: "c12", cathode: "c13" },
            { kind: "wire", from: "a13", to: "top-13", role: "ground" },
          ]),
        ),
      );
      expect(between).toEqual([]);
    });

    it("takes one between a light's short leg and −, and finds it in backwards there", () => {
      const below = (anode: string, cathode: string) =>
        wiringProblems(
          supplied,
          edited(
            twoLayout,
            red([
              { kind: "led", led: "red", anode: "c9", cathode: "c10" },
              { kind: "diode", model: "1N4148", anode, cathode },
              { kind: "wire", from: "a13", to: "top-13", role: "ground" },
            ]),
          ),
        );
      expect(below("d10", "d13")).toEqual([]);
      expect(below("d13", "d10")).toContain(
        "the 1N4148 with its anode in d13 is in backwards: its band, at its cathode, goes towards −, the way its light's current runs",
      );
    });
  });
});

describe("a ceramic capacitor timed by two pins (ADR 0051)", () => {
  const { circuit, layout } = FIXTURES["capacitor-timed-by-two-pins"];
  const problems = (edit: (parts: Part[]) => Part[]) =>
    wiringProblems(circuit, edited(layout, edit));
  const NAME = "the 47 nF capacitor with its legs in f26 and f27";
  const swap = (matches: (part: Part) => boolean, next: Part | null) => (parts: Part[]) =>
    replace(parts, matches, next);
  const resistor = (p: Part) => p.kind === "resistor";
  const reader = (p: Part) => p.kind === "wire" && p.from === "j18";

  it("takes one with a leg on ground, the other on a pin, and a resistor to it from a second pin", () => {
    expect(wiringProblems(circuit, layout)).toEqual([]);
  });

  it("finds its legs anywhere but side by side in one row", () => {
    expect(
      problems(
        swap((p) => p.kind === "ceramic", {
          kind: "ceramic",
          nanofarads: 47,
          from: "f26",
          to: "f28",
        }),
      ),
    ).toContain(
      "the 47 nF capacitor with its legs in f26 and f28 needs its legs in one row, one hole apart",
    );
  });

  it("finds neither leg on ground", () => {
    const off = problems(
      swap((p) => p.kind === "wire" && p.from === "j27", {
        kind: "wire",
        from: "j27",
        to: "j29",
        role: "signal",
      }),
    );
    expect(off).toContain(`${NAME} has neither leg on ground: one goes straight to ground`);
  });

  it("finds its other leg on no pin, or on both", () => {
    expect(problems(swap(reader, null))).toContain(
      `${NAME} has its other leg on no pin: a pin goes straight to it, to read it`,
    );
    const both = problems(swap(resistor, { kind: "wire", from: "i20", to: "i26", role: "signal" }));
    expect(both).toContain(
      `${NAME} has its other leg on GP13 and GP14: one pin reads it, and another charges it through a resistor`,
    );
  });

  it("finds it charged by no pin", () => {
    expect(
      problems(swap(resistor, { kind: "resistor", ohms: 6800, from: "i23", to: "i26" })),
    ).toContain(
      `${NAME} is charged by no pin: one resistor goes to its other leg from a second pin`,
    );
  });

  it("finds something else on its other leg", () => {
    expect(
      problems((parts) => [
        ...parts,
        { kind: "resistor", ohms: 1000, from: "h26", to: "bottom-28" },
      ]),
    ).toContain(
      `${NAME} has something else on its other leg: only its resistor and the pin that reads it go there`,
    );
  });

  it("finds a resistor too weak to empty it past an input that leaks (erratum E9)", () => {
    expect(
      problems(swap(resistor, { kind: "resistor", ohms: 10000, from: "i20", to: "i26" })),
    ).toContain(`${NAME}'s resistor is 10 kΩ, outside 1 kΩ to 8.2 kΩ`);
  });

  it("finds one that charges too fast for the script to time", () => {
    expect(
      problems(
        swap((p) => p.kind === "ceramic", {
          kind: "ceramic",
          nanofarads: 4.7,
          from: "f26",
          to: "f27",
        }),
      ),
    ).toContain(
      "the 4.7 nF capacitor with its legs in f26 and f27 charges through the 6.8 kΩ resistor in about 32 µs, too fast for the script to time: with that resistor it needs 15 nF or more",
    );
  });

  it("finds one on a supply, where it has no use yet", () => {
    const { circuit: supplied, layout: suppliedLayout } = FIXTURES["two-lights-on-a-supply"];
    const found = wiringProblems(
      supplied,
      edited(suppliedLayout, (parts) => [
        ...parts,
        { kind: "ceramic", nanofarads: 100, from: "h28", to: "h29" },
      ]),
    );
    expect(found).toContain(
      "the 100 nF capacitor with its legs in h28 and h29 has no use ratsnest knows on a supply: a ceramic capacitor is timed by a Pico's pins (ADR 0051)",
    );
  });
});

describe("a slide switch lighting one light or the other (ADR 0052)", () => {
  const { circuit, layout } = FIXTURES["lights-chosen-by-a-slide-switch"];
  const problems = (edit: (parts: Part[]) => Part[]) =>
    wiringProblems(circuit, edited(layout, edit));
  const slide = (next: Part | null) => (parts: Part[]) =>
    replace(parts, (p) => p.kind === "slideSwitch", next);

  it("takes one with its middle leg on +, and a light on each outer leg's way", () => {
    expect(wiringProblems(circuit, layout)).toEqual([]);
  });

  it("finds its legs not side by side, its middle leg between the other two", () => {
    expect(
      problems(slide({ kind: "slideSwitch", left: "f19", middle: "f21", right: "f20" })),
    ).toContain(
      "the slide switch with its middle leg in f21 needs its three legs side by side in one row: left, middle and right, left to right",
    );
  });

  it("finds an outer leg that lights no light of its own", () => {
    // Both lights on its left leg, and its right leg on + too: slid right, it lights nothing.
    const found = problems((parts) => [
      ...replace(parts, (p) => p.kind === "resistor" && p.from === "h21", {
        kind: "resistor",
        ohms: 220,
        from: "h19",
        to: "h26",
      }),
      { kind: "wire", from: "j21", to: "bottom+21", role: "power" },
    ]);
    expect(found).toEqual([
      "the slide switch with its middle leg in f20 lights no light of its own when slid towards f21: each outer leg goes on a light's way, so that it lights one light or the other",
    ]);
  });

  it("finds a short across the supply one way it can be slid", () => {
    expect(
      problems((parts) => [
        ...parts,
        { kind: "wire", from: "j21", to: "bottom-21", role: "ground" },
      ]),
    ).toEqual([
      "the supply's + and − are joined while the slide switch with its middle leg in f20 is slid towards f21: a short across it",
    ]);
  });

  it("takes one resistor on its middle leg, shared by the light each way lights", () => {
    const shared = problems((parts) => [
      ...parts.filter((p) => p.kind !== "resistor" && !(p.kind === "wire" && p.from === "j20")),
      { kind: "wire", from: "j17", to: "bottom+17", role: "power" },
      { kind: "resistor", ohms: 220, from: "h17", to: "h20" },
      { kind: "wire", from: "i19", to: "i14", role: "signal" },
      { kind: "wire", from: "h21", to: "h26", role: "signal" },
    ]);
    expect(shared).toEqual([]);
  });

  it("finds a light in backwards on either outer leg's way", () => {
    expect(
      problems((parts) =>
        replace(parts, (p) => p.kind === "led" && p.led === "yellow", {
          kind: "led",
          led: "yellow",
          anode: "g13",
          cathode: "g14",
        }),
      ),
    ).toContain("the yellow LED is in backwards: its long leg must be towards +");
  });

  it("finds one on a Pico, where it has no use yet", () => {
    const { circuit: pico, layout: picoLayout } = FIXTURES["two-lights"];
    const found = wiringProblems(
      pico,
      edited(picoLayout, (parts) => [
        ...parts,
        { kind: "slideSwitch", left: "g26", middle: "g27", right: "g28" },
      ]),
    );
    expect(found).toContain(
      "the slide switch with its middle leg in g27 has no use ratsnest knows on a Pico: a slide switch lights one light or the other on a supply (ADR 0052)",
    );
  });
});
