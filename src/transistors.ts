/**
 * The transistors ratsnest knows, by model (ADR 0039): each one's type and its legs in order, read
 * with its flat face towards you and its legs down. A circuit names the model, and everything else
 * follows from it. A model is added here, with its pinout, when a circuit needs it.
 */

/** NPN or PNP, which the drawing prints large on the part's flat face (ADR 0040). */
export type TransistorType = "NPN" | "PNP";

/** A transistor's three legs, by what they are. */
export type TransistorLeg = "emitter" | "base" | "collector";

export interface TransistorModel {
  readonly type: TransistorType;
  /** Its legs, left to right, with its flat face towards you and its legs down. */
  readonly legs: readonly [TransistorLeg, TransistorLeg, TransistorLeg];
}

export const TRANSISTORS = {
  /** The most widely sold small NPN transistor, in a TO-92 case (ADR 0044). */
  "2N3904": { type: "NPN", legs: ["emitter", "base", "collector"] },
} as const satisfies Record<string, TransistorModel>;

export type TransistorName = keyof typeof TRANSISTORS;

export const TRANSISTOR_NAMES = Object.keys(TRANSISTORS) as TransistorName[];
