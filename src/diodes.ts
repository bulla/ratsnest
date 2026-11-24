/**
 * The diodes ratsnest knows, by model (ADR 0039, ADR 0049): what each one's case looks like, and what
 * it is sold as. Every one lets current through from its anode to its cathode, the end its band is at,
 * and takes about 0.7 V doing so. A circuit names the model, and everything else follows from it. A
 * model is added here when a circuit needs it, or a reader holds one the list lacks.
 */

/**
 * What a diode's case is: a small orange glass one with a black band, as a signal diode's is, or a
 * larger black one with a grey band, as a rectifier's is.
 */
export type DiodeCase = "glass" | "black";

/** What a diode is sold as, which the parts list says. */
export type DiodeUse = "signal" | "rectifier";

export interface DiodeModel {
  readonly case: DiodeCase;
  readonly use: DiodeUse;
}

export const DIODES = {
  /** The usual small signal diode, in an orange glass case with a black band (ADR 0049). */
  "1N4148": { case: "glass", use: "signal" },
  /** The smallest of the 1N4001 to 1N4007 rectifiers, alike but for the voltage each blocks. */
  "1N4001": { case: "black", use: "rectifier" },
  /** The largest of the same series, and the one kits most often hold. */
  "1N4007": { case: "black", use: "rectifier" },
} as const satisfies Record<string, DiodeModel>;

export type DiodeName = keyof typeof DIODES;

export const DIODE_NAMES = Object.keys(DIODES) as DiodeName[];

/** What a diode takes from a light's way, the right way round, at a light's few milliamperes. */
export const DIODE_VOLTS = 0.7;
