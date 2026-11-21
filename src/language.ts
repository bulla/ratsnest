import type { Language } from "./format";

/**
 * The languages the engine writes a page in (ADR 0010). English and French for now, the two the
 * page's sentences came in; Russian joins them with its rules (ADR 0011).
 */
export const LANGUAGES = ["en", "fr"] as const satisfies readonly Language[];

export type { Language };

/** The language a page is made in when none is asked for. */
export const DEFAULT_LANGUAGE: Language = "en";
