import type { Language } from "./format";

/** The languages the engine writes a page in (ADR 0010), each held to ADR 0011's rules. */
export const LANGUAGES = ["en", "fr", "ru"] as const satisfies readonly Language[];

export type { Language };

/**
 * The plural categories each language's counts fall into, as `Intl.PluralRules` names them (ADR 0011):
 * a table gives a form for every one, so that a missing form does not compile.
 */
export interface PluralCategories {
  readonly en: "one" | "other";
  readonly fr: "one" | "many" | "other";
  readonly ru: "one" | "few" | "many" | "other";
}

/** The categories as a list, for a test to hold against `Intl.PluralRules` itself. */
export const PLURAL_CATEGORIES: { readonly [L in Language]: readonly PluralCategories[L][] } = {
  en: ["one", "other"],
  fr: ["one", "many", "other"],
  ru: ["one", "few", "many", "other"],
};

/** A word in every form its language's counts need. */
export type Forms<L extends Language> = Readonly<Record<PluralCategories[L], string>>;

/** The form a count takes in a language, chosen by `Intl.PluralRules` (ADR 0011). */
export function plural<L extends Language>(language: L, count: number, forms: Forms<L>): string {
  return forms[new Intl.PluralRules(language).select(count) as PluralCategories[L]];
}

/** The language a page is made in when none is asked for. */
export const DEFAULT_LANGUAGE: Language = "en";
