/**
 * The circuit format, format 2: what a circuit file declares (ADR 0006, ADR 0007, ADR 0022).
 *
 * A circuit file is `import type { Circuit } from "ratsnest"` and one
 * `export default { … } satisfies Circuit`, every value a string, a number, `true` or `false`, or an
 * array or object of those. This file is that type, and only that: it imports nothing and exports
 * only types, because `ratsnest init` copies it into a project's `.ratsnest/` as it is.
 *
 * The engine reads a file as data and checks every field itself (ADR 0016), so these types are for
 * an editor's sake. What they cannot say, such as which pins a Pico breaks out or whether two legs
 * share a hole, the checks say.
 */

/** A language ratsnest writes a page in: English, French or Russian (ADR 0010). */
export type Language = "en" | "fr" | "ru";

/**
 * Words a reader sees, in each language the circuit is written in: one at least, and the same
 * languages as the circuit's name (ADR 0010).
 *
 * ```ts
 * title: { en: "Green LED on GP16", fr: "LED verte sur GP16" },
 * ```
 */
export type Text = { readonly [language in Language]?: string };

/** A row of a half-size breadboard's main area, as it prints them. */
export type Row = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j";

/** A hole on one breadboard: a row and a column, `a21`, or a rail and a column, `top-19`. */
export type BoardHole = `${Row}${number}` | `${"top" | "bottom"}${"+" | "-"}${number}`;

/**
 * A hole, written as the breadboard prints it: `a21`, or a rail and a column, `top-19`. A hole on a
 * second breadboard, snapped onto the first one's top edge, says so first: `2:f5`.
 */
export type Hole = BoardHole | `2:${BoardHole}`;

/** A GPIO, by its number as the Pico prints it: 15 for GP15. */
export type GpioPin = { readonly kind: "gpio"; readonly gpio: number };

/**
 * An addressable RGB LED's data pin. The LED takes its colour as data down it, so the pin is never a
 * level a light is at. `count` is how many LEDs are chained on it: 1 for one LED, 12 for a ring.
 */
export type RgbPin = { readonly kind: "rgb"; readonly gpio: number; readonly count: number };

/** The colours a light can be, each one a colour the page knows how to draw. */
export type LedColour =
  | "red"
  | "green"
  | "amber"
  | "blue"
  | "yellow"
  | "pink"
  | "purple"
  | "orange"
  | "aqua"
  | "white";

/** The colours a button's cap can be. */
export type ButtonColour = "red" | "green" | "blue" | "yellow";

/** A light of one colour, on a pin it drives high or low. */
export interface PlainLed {
  /** How the steps refer to it: `red`. */
  readonly id: string;
  /** What the page calls it: `red LED`, never `GP15`. */
  readonly name: Text;
  readonly pin: GpioPin;
  readonly colour: LedColour;
}

/** An addressable RGB LED, or a chain of them on one pin, such as a ring. */
export interface RgbLed {
  readonly id: string;
  readonly name: Text;
  readonly pin: RgbPin;
  readonly colour: "rgb";
}

export type Led = PlainLed | RgbLed;

/** A push button, on the pin it pulls up to 3V3 while it is held. */
export interface Button {
  readonly id: string;
  /** Its name, `BTN1`, which takes no article. */
  readonly name: Text;
  readonly pin: GpioPin;
  readonly colour: ButtonColour;
}

/** A passive buzzer, on the pin that drives it. */
export interface Buzzer {
  readonly id: string;
  readonly name: Text;
  readonly pin: GpioPin;
}

/** What a jumper is for, which is also its colour: black, red or yellow. */
export type WireRole = "ground" | "power" | "signal";

/** The rows a button's legs are in when it sits on one half of the board, not across the channel. */
export type ButtonRows =
  | readonly ["a", "d"]
  | readonly ["b", "e"]
  | readonly ["f", "i"]
  | readonly ["g", "j"];

/** A jumper wire between two holes. */
export interface Wire {
  readonly kind: "wire";
  readonly from: Hole;
  readonly to: Hole;
  readonly role: WireRole;
  /**
   * A long flexible jumper that arches over the board rather than lying on it, for a hole no flat
   * jumper can reach without lying over a hole in use.
   */
  readonly arch?: true;
}

/** A resistor between two holes, its value in ohms. */
export interface Resistor {
  readonly kind: "resistor";
  readonly ohms: number;
  readonly from: Hole;
  readonly to: Hole;
}

/** A 5 mm LED, standing up. `led` is the light's id. */
export interface LedPart {
  readonly kind: "led";
  readonly led: string;
  readonly anode: Hole;
  readonly cathode: Hole;
}

/**
 * A four-legged 6 mm tactile button, its legs in two columns two apart. Across the channel, in rows
 * e and f, unless `rows` puts it on one half of the board. `button` is the button's id.
 */
export interface ButtonPart {
  readonly kind: "button";
  readonly button: string;
  readonly columns: readonly [number, number];
  readonly rows?: ButtonRows;
  /** `2` puts it on the second breadboard, snapped onto the first one's top edge. */
  readonly board?: 2;
}

/** A passive buzzer, standing up. `buzzer` is the buzzer's id. */
export interface BuzzerPart {
  readonly kind: "buzzer";
  readonly buzzer: string;
  readonly plus: Hole;
  readonly minus: Hole;
}

/** A 10 mm addressable RGB LED, standing up, its four legs side by side. `led` is the light's id. */
export interface RgbLedPart {
  readonly kind: "rgbLed";
  readonly led: string;
  readonly power: Hole;
  readonly dataOut: Hole;
  readonly ground: Hole;
  readonly dataIn: Hole;
}

/** A ring of addressable RGB LEDs, standing up by its four-pin header. `led` is the ring's id. */
export interface RingPart {
  readonly kind: "ring";
  readonly led: string;
  readonly dataIn: Hole;
  readonly power: Hole;
  readonly ground: Hole;
  readonly dataOut: Hole;
}

/** Anything plugged into the breadboard. */
export type Part = Wire | Resistor | LedPart | ButtonPart | BuzzerPart | RgbLedPart | RingPart;

/**
 * One step of building the circuit: a title, perhaps a note, and the parts it places. Neither the
 * title nor the note names a hole: the engine writes the sentences that do, from the parts.
 */
export interface Step {
  readonly title: Text;
  readonly note?: Text;
  readonly parts: readonly Part[];
}

/** A Pico 2 W across the middle of the breadboard, which the page puts in first (ADR 0002, ADR 0037). */
export interface PicoSetup {
  readonly kind: "pico";
}

/**
 * A supply in the Pico's place, which the page connects last (ADR 0032, ADR 0037): its red lead goes
 * in the + rail and its black lead in the − rail, both in column 1, on the side it names. The engine
 * places it and draws it, so a circuit names no hole for it.
 *
 * - `3`: two AA batteries, in a holder with a red and a black lead
 * - `3.7`: one protected Li-Po cell, with an adapter from its plug to two pins
 * - `4.5`: three AA batteries, in a holder with a red and a black lead
 * - `5`: a USB charger, into a USB-C breakout board for breadboards
 */
export interface SupplySetup {
  readonly kind: "supply";
  readonly volts: 3 | 3.7 | 4.5 | 5;
  /** The pair of rails its leads go in. */
  readonly rails: "top" | "bottom";
}

/**
 * What a circuit's breadboard is set up with, which every part is placed around (ADR 0037): its
 * `kind` names it, as a part's and a pin's does, and whatever it needs goes beside it.
 *
 * ```ts
 * setup: { kind: "pico" },
 * setup: { kind: "supply", volts: 4.5, rails: "bottom" },
 * ```
 */
export type Setup = PicoSetup | SupplySetup;

/** A light of one colour, lit from a supply through its resistor: it names no pin (ADR 0032). */
export interface SupplyLed {
  readonly id: string;
  readonly name: Text;
  readonly colour: LedColour;
}

/** A push button that switches a supply's current itself: it names no pin (ADR 0032). */
export interface SupplyButton {
  readonly id: string;
  /** Its name, `BTN1`, which takes no article. */
  readonly name: Text;
  readonly colour: ButtonColour;
}

/**
 * What every circuit has, on a Pico or with a supply in its place, written once (ADR 0036): what it
 * is, how it is credited, how to build it, and what its last step tells the reader.
 */
export interface CircuitBase {
  /** The circuit format the file is written in (ADR 0015). */
  readonly format: 2;
  /** What the breadboard starts with: a Pico, or a supply in its place (ADR 0037). */
  readonly setup: Setup;
  /** Its name. The languages it has are the circuit's languages (ADR 0010). */
  readonly name: Text;
  /** A sentence saying what it is. */
  readonly description: Text;
  /**
   * Where the drawing and the font come from, and under which licences: the page's footer, and the
   * line along the drawing alone's bottom edge (ADR 0035). The `circuit` skill writes ratsnest's
   * credit here, which its author may reword, or take out to credit the drawing elsewhere, as a
   * tutorial of several drawings would once. Without it, the page has no footer and the drawing alone
   * no credit line. The drawing is CC BY-SA 4.0, and crediting it is its author's to answer for.
   */
  readonly credit?: Text;
  /**
   * How to build it, in order. On a Pico, the Pico goes in first; with a supply, the supply goes in
   * last. The test comes last, without a step.
   */
  readonly steps: readonly Step[];
  /**
   * What the reader does in the last step, and what a working circuit then does: on a Pico, what its
   * script does, said to the person watching the board; with a supply, what to do once it is
   * connected (ADR 0036).
   */
  readonly test: Text;
}

/** A circuit on a Pico: its parts on the Pico's pins, and the script that tests them. */
export interface PicoCircuit extends CircuitBase {
  readonly setup: PicoSetup;
  readonly leds?: readonly Led[];
  readonly buttons?: readonly Button[];
  readonly buzzers?: readonly Buzzer[];
  /** A MicroPython script for Thonny that exercises every part, in each language's own names. */
  readonly script: Text;
}

/**
 * A circuit with no Pico, powered by a supply on one pair of rails (ADR 0032): plain lights and
 * buttons, and nothing to program.
 */
export interface SupplyCircuit extends CircuitBase {
  /** What powers it, in the Pico's place. */
  readonly setup: SupplySetup;
  readonly leds?: readonly SupplyLed[];
  readonly buttons?: readonly SupplyButton[];
}

/**
 * A circuit: on a Pico, or powered by a supply in its place (ADR 0034). Its `setup` says which
 * (ADR 0037), and every circuit file ends `satisfies Circuit`.
 */
export type Circuit = PicoCircuit | SupplyCircuit;
