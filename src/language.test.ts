import { describe, expect, it } from "bun:test";
import { LANGUAGES, PLURAL_CATEGORIES, plural } from "./language";

describe("a count in each language (ADR 0011, rule 5)", () => {
  it.each([...LANGUAGES])("has a form for every category %s's counts fall into", (language) => {
    const categories = new Intl.PluralRules(language).resolvedOptions().pluralCategories;
    expect([...PLURAL_CATEGORIES[language]].sort() as string[]).toEqual([...categories].sort());
  });

  it("takes the form Intl.PluralRules picks", () => {
    const forms = { one: "плата", few: "платы", many: "плат", other: "платы" };
    expect([1, 3, 5, 21, 1.5].map((count) => plural("ru", count, forms))).toEqual([
      "плата",
      "платы",
      "плат",
      "плата",
      "платы",
    ]);
    expect(plural("en", 1, { one: "wire", other: "wires" })).toBe("wire");
    expect(plural("fr", 0, { one: "fil", many: "fils", other: "fils" })).toBe("fil");
  });
});
