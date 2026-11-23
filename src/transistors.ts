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
  /**
   * A model of the same type that looks the same and has its legs in another order, which the page's
   * note on its legs names (ADR 0045).
   */
  readonly unlike: string;
}

export const TRANSISTORS = {
  /** The most widely sold small NPN transistor, in a TO-92 case (ADR 0044). */
  "2N3904": { type: "NPN", legs: ["emitter", "base", "collector"], unlike: "BC547" },
  /** The 2N3904's PNP complement, in the same case, with its legs in the same order (ADR 0045). */
  "2N3906": { type: "PNP", legs: ["emitter", "base", "collector"], unlike: "BC557" },
} as const satisfies Record<string, TransistorModel>;

export type TransistorName = keyof typeof TRANSISTORS;

export const TRANSISTOR_NAMES = Object.keys(TRANSISTORS) as TransistorName[];
