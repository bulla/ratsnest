import type { Part } from "./drawing/breadboard";
import type { ButtonColour, GpioPin, LedColour, RgbPin } from "./format";

/**
 * The engine's model of a circuit, shown in one language: what is on which pin, and the layout of
 * where each part goes, every text a plain string. The drawing and the page are written against it,
 * as they were in scratchpi (ADR 0001). A circuit file is in the format (`format.ts`), and is taken
 * into this model once it has passed its checks (ADR 0022).
 */

export type { ButtonColour, GpioPin, LedColour, RgbPin };

/**
 * The colours a light can be, every one of the format's. A closed set rather than any colour,
 * because each is a token in the page's stylesheet, measured against what it is drawn on.
 */
export const LED_COLOURS = [
  "red",
  "green",
  "amber",
  "blue",
  "yellow",
  "pink",
  "purple",
  "orange",
  "aqua",
  "white",
] as const satisfies readonly LedColour[];

/** A light of one colour, on a pin it drives high or low: every light but an RGB LED. */
export interface PlainLed {
  /** How the layout refers to it. */
  readonly id: string;
  /** What the page calls it: "red LED", never "GP15". */
  readonly name: string;
  readonly pin: GpioPin;
  readonly colour: LedColour;
}

/** An addressable RGB LED, or a chain of them on one pin, the ring. */
export interface RgbLed {
  readonly id: string;
  readonly name: string;
  readonly pin: RgbPin;
  readonly colour: "rgb";
}

/** Every light a circuit can wire. `colour` says which kind, so checking it narrows the type. */
export type Led = PlainLed | RgbLed;

/** Whether a light is an RGB LED, or a ring of them. */
export const isRgbLed = (led: Led): led is RgbLed => led.colour === "rgb";

/**
 * Whether a light is a ring: RGB LEDs chained on one pin, more than one. Not a type guard, since a
 * light that is not a ring may still be an RGB LED: narrow with `isRgbLed`.
 */
export const isRing = (led: Led): boolean => led.colour === "rgb" && led.pin.count > 1;

/** Whether a light is a single RGB LED. */
export const isSingleRgbLed = (led: Led): boolean => led.colour === "rgb" && led.pin.count === 1;

/** The colours a button's cap can be: four of the lights' colours, every one of the format's. */
export const BUTTON_COLOURS = [
  "blue",
  "red",
  "yellow",
  "green",
] as const satisfies readonly (ButtonColour & LedColour)[];

/** A push button, on the pin it pulls up to 3V3 while held. */
export interface Button {
  readonly id: string;
  /** Its pin's name, `BTN1` to `BTN4`, never an article before it. */
  readonly name: string;
  readonly pin: GpioPin;
  readonly colour: ButtonColour;
}

export interface Buzzer {
  readonly id: string;
  readonly name: string;
  readonly pin: GpioPin;
}

/** What a circuit is: its name, a sentence saying what it does, and what is on its pins. */
export interface ShownCircuit {
  readonly name: string;
  readonly description: string;
  /** Where the drawing and the font come from: the page's footer, and the drawing alone's edge. */
  readonly credit?: string;
  readonly leds: readonly Led[];
  readonly buttons: readonly Button[];
  readonly buzzers: readonly Buzzer[];
}

/** One step of building a circuit: a title, perhaps a note, and the parts it places. */
export interface LayoutStep {
  readonly title: string;
  /** What the parts cannot say. It never names a hole: the engine writes the sentences that do. */
  readonly note?: string;
  readonly parts: readonly Part[];
}

/** Where every part of a circuit goes on the breadboard, in the order it is put there. */
export interface Layout {
  readonly steps: readonly LayoutStep[];
  /** A MicroPython script for Thonny that exercises every part. */
  readonly script: string;
  /** What the script does, said to the person watching the board. */
  readonly scriptDoes: string;
}
