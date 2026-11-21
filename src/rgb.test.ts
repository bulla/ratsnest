import { describe, expect, it } from "bun:test";
import { LED_COLOURS } from "./circuit";
import {
  brightnessOf,
  isLit,
  nearestColour,
  PIE_WEDGES,
  RGB_COLOURS,
  RGB_LEVELS,
  RGB_OFF,
  RGB_ON,
  rgbColourOf,
  wedgePath,
} from "./rgb";

describe("an RGB LED's colours (scratchpi's ADR 0223)", () => {
  it("are red, green, blue and yellow first, in that order, then the rest", () => {
    expect(RGB_COLOURS).toEqual([
      "red",
      "green",
      "blue",
      "yellow",
      "pink",
      "purple",
      "orange",
      "aqua",
      "white",
    ]);
  });

  it("are every one a lamp colour, so the token layer has a hue for each", () => {
    for (const colour of RGB_COLOURS) expect(LED_COLOURS).toContain(colour);
  });

  it("are each sent as three parts from 0 to 255, every one of them different", () => {
    for (const colour of RGB_COLOURS) {
      for (const part of RGB_LEVELS[colour]) {
        expect(Number.isInteger(part), colour).toBe(true);
        expect(part).toBeGreaterThanOrEqual(0);
        expect(part).toBeLessThanOrEqual(255);
      }
    }
    const sent = new Set(RGB_COLOURS.map((colour) => RGB_LEVELS[colour].join(",")));
    expect(sent.size).toBe(RGB_COLOURS.length);
  });

  it("light white for on, and nothing at all for off", () => {
    expect(RGB_ON).toEqual([255, 255, 255]);
    expect(RGB_OFF).toEqual([0, 0, 0]);
    expect(isLit(RGB_ON)).toBe(true);
    expect(isLit(RGB_OFF)).toBe(false);
    for (const colour of RGB_COLOURS) expect(isLit(RGB_LEVELS[colour]), colour).toBe(true);
  });

  it("read back only a colour this build knows", () => {
    expect(rgbColourOf("aqua")).toBe("aqua");
    expect(rgbColourOf("AQUA")).toBeUndefined();
    expect(rgbColourOf(undefined)).toBeUndefined();
    expect(rgbColourOf(0)).toBeUndefined();
  });
});

describe("the colour an RGB LED is drawn in (scratchpi's ADR 0224)", () => {
  it("is each colour itself, at full brightness", () => {
    for (const colour of RGB_COLOURS) {
      expect(nearestColour(RGB_LEVELS[colour]), colour).toBe(colour);
      expect(brightnessOf(RGB_LEVELS[colour]), colour).toBe(1);
    }
  });

  it("is the colour's shape, not its strength: half a red is red, at half brightness", () => {
    expect(nearestColour([127.5, 0, 0])).toBe("red");
    expect(brightnessOf([127.5, 0, 0])).toBe(0.5);
    expect(nearestColour([90, 0, 127.5])).toBe("purple");
  });

  it("is nothing while it shows nothing", () => {
    expect(nearestColour(RGB_OFF)).toBeUndefined();
    expect(brightnessOf(RGB_OFF)).toBe(0);
  });

  it("is the nearest of the nine for a mixture of two, too fast to see", () => {
    // Red and blue in turn, as a blink on every tick would leave them.
    expect(nearestColour([127.5, 0, 127.5])).toBe("purple");
    // Green and blue: aqua.
    expect(nearestColour([0, 127.5, 127.5])).toBe("aqua");
  });
});

describe("an RGB LED's pie (scratchpi's ADR 0224)", () => {
  it("is three equal wedges of red, green and blue, all the way round", () => {
    expect(PIE_WEDGES.map((wedge) => wedge.colour)).toEqual(["red", "green", "blue"]);
    for (const wedge of PIE_WEDGES) expect(wedge.to - wedge.from).toBe(120);
    expect(PIE_WEDGES[0]?.from).toBe(0);
    expect(PIE_WEDGES[2]?.to).toBe(360);
  });

  it("draws a wedge from the centre, out to the rim, round and back", () => {
    // Red, from the top round to the lower right.
    expect(wedgePath(0, 0, 10, 0, 120)).toBe("M0 0L0 -10A10 10 0 0 1 8.66 5Z");
  });
});
