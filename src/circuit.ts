import type { Part } from "./drawing/breadboard";

/**
 * What a circuit is, as the copy of scratchpi's pages knows it (ADR 0001): the record of what is
 * on which pin, and the layout of where each part goes. They are two types here, as they were in
 * scratchpi; M3 makes them one declarative file, every text keyed by language (ADR 0006, ADR 0007,
 * ADR 0010), and this is what it reshapes.
 */

/** A pin an adult wired: a GPIO, by its number as the board prints it. */
export type GpioPin = { readonly kind: "gpio"; readonly gpio: number };

/**
 * An addressable RGB LED's data pin. The LED takes its colour as data down it, as a NeoPixel
 * does, so the pin is never a level a light is at. `count` is how many LEDs are chained on it:
 * 1 for an RGB LED, 12 for the ring.
 */
export type RgbPin = { readonly kind: "rgb"; readonly gpio: number; readonly count: number };

/**
 * The colours a light can be. A closed set rather than any colour, because each is a token in
 * the page's stylesheet, measured against what it is drawn on.
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
] as const;

export type LedColour = (typeof LED_COLOURS)[number];

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

/** The colours a button's cap can be: four of the lights' colours. */
export const BUTTON_COLOURS = [
  "blue",
  "red",
  "yellow",
  "green",
] as const satisfies readonly LedColour[];

export type ButtonColour = (typeof BUTTON_COLOURS)[number];

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
export interface Circuit {
  readonly name: string;
  readonly description: string;
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
