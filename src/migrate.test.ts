import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FORMAT } from "./fields";
import { LANGUAGES } from "./language";
import { FORMAT_2_CREDIT, MIGRATIONS, type Migration, migrateSource } from "./migrate";
import { printCircuit } from "./print";
import { readCircuit } from "./read";

/**
 * The migrations (ADR 0015): the harness, proven on migrations made for the purpose, and each one
 * ratsnest ships, run on files of the format it reads, kept as they were.
 */
const EXAMPLES = join(import.meta.dir, "..", "examples");
const sourcesIn = (folder: string) =>
  readdirSync(folder)
    .filter((name) => name.endsWith(".ts"))
    .map((name) => ({ name, source: readFileSync(join(folder, name), "utf8") }));
const examples = sourcesIn(EXAMPLES);
/**
 * ratsnest's examples as they were in format 1, before ADR 0036, kept for the migration's test. An
 * example written since, in format 2, has none: it never was in format 1.
 */
const formatOne = sourcesIn(join(EXAMPLES, "format-1"));
/** The examples written since, in format 2, which have no copy in format 1. */
const BORN_IN_FORMAT_2 = [
  "capacitor-tester.ts",
  "capacitor-timer.ts",
  "colours-on-a-slider.ts",
  "counting-screen.ts",
  "fading-light.ts",
  "five-switches.ts",
  "high-side-switch.ts",
  "level-meter.ts",
  "motion-light.ts",
  "one-light-or-the-other.ts",
  "transistor-switch.ts",
  "two-buttons-three-lights.ts",
];

const NEXT = FORMAT + 1;
type Data = Record<string, unknown>;

/** A migration to a format after this one, made for the test: `test` renamed `testSays`. */
const renaming: Migration = {
  from: FORMAT,
  says: "`test` is now `testSays`",
  migrate: ({ test, ...rest }) => ({
    data: { ...rest, testSays: test },
    moved: new Map([["test", "testSays"]]),
  }),
};

describe("the printer (ADR 0015)", () => {
  it.each([...examples, ...formatOne])(
    "writes $name back as the same data, its comments kept, the same every time",
    ({ name, source }) => {
      const read = readCircuit(source, name);
      const printed = printCircuit(read.data, read.comments);
      const again = readCircuit(printed, name);
      expect(again.problems).toEqual([]);
      expect(again.data).toEqual(read.data);
      expect([...again.comments]).toEqual([...read.comments]);
      expect(printCircuit(again.data, again.comments)).toBe(printed);
    },
  );
});

describe("the migrations' runner (ADR 0015)", () => {
  it("ships one migration from each format before this one, in order", () => {
    expect(MIGRATIONS.map((migration) => migration.from)).toEqual(
      Array.from({ length: FORMAT - 1 }, (_, index) => index + 1),
    );
  });

  it("leaves a file of the current format as it is", () => {
    for (const { name, source } of examples)
      expect(migrateSource(source, name)).toEqual({ kind: "current" });
  });

  it.each(examples)(
    "takes $name to the next format, its comments following what moved",
    ({ name, source }) => {
      const commented = source.replace("  test: {", "  // What the reader sees happen.\n  test: {");
      const outcome = migrateSource(commented, name, [renaming], NEXT);
      if (outcome.kind !== "migrated") throw new Error(`${name}: ${JSON.stringify(outcome)}`);
      expect(outcome.says).toEqual(["`test` is now `testSays`"]);
      const after = readCircuit(outcome.source, name);
      const data = after.data as Data;
      expect(data.format).toBe(NEXT);
      expect(data.test).toBeUndefined();
      expect(data.testSays).toEqual((readCircuit(source, name).data as Data).test);
      expect(after.comments.get("testSays")).toEqual(["// What the reader sees happen."]);
      expect(after.comments.get("")).toEqual(readCircuit(source, name).comments.get(""));
    },
  );

  it("leaves a file as it was when a migration cannot decide, and names the choice", () => {
    const asking: Migration = {
      from: FORMAT,
      says: "",
      migrate: () => ({ undecided: ["which colour the new cap is"] }),
    };
    const [first] = examples;
    expect(migrateSource(first?.source ?? "", "x.ts", [asking], NEXT)).toEqual({
      kind: "undecided",
      choices: ["which colour the new cap is"],
    });
  });

  it("refuses a format it has no migration from, and one newer than it reads", () => {
    const [first] = examples;
    expect(migrateSource(first?.source ?? "", "x.ts", [], NEXT)).toEqual({
      kind: "refused",
      why: `ratsnest has no migration from format ${FORMAT}`,
    });
    const newer = (first?.source ?? "").replace(`format: ${FORMAT},`, `format: ${NEXT},`);
    expect(migrateSource(newer, "x.ts")).toEqual({
      kind: "refused",
      why: `it is in format ${NEXT}, newer than ${FORMAT}`,
    });
  });
});

describe("format 1 to 2: a `setup`, one `test`, and a credit for a circuit that had none (ADR 0036, ADR 0037)", () => {
  it("has ratsnest's examples in format 1 to be tested on, one for each example that was", () => {
    expect(formatOne.map(({ name }) => name)).toEqual(
      examples.map(({ name }) => name).filter((name) => !BORN_IN_FORMAT_2.includes(name)),
    );
    for (const { source } of formatOne) expect(source).toContain("  format: 1,\n");
  });

  it.each(formatOne)(
    "takes $name to the example as it is now, its comments kept, but for the credit it is given",
    ({ name, source }) => {
      const outcome = migrateSource(source, name);
      if (outcome.kind !== "migrated") throw new Error(`${name}: ${JSON.stringify(outcome)}`);
      expect(outcome.says).toHaveLength(1);
      const { credit, ...migrated } = readCircuit(outcome.source, name).data as Data;
      const now = examples.find((example) => example.name === name)?.source ?? "";
      const { credit: _, ...example } = readCircuit(now, name).data as Data;
      expect(Object.keys(migrated)).toEqual(Object.keys(example));
      expect(migrated).toEqual(example);
      // The credit is the migration's own, fixed with it, whatever the skill's becomes.
      const kind = (migrated.setup as Data).kind === "supply" ? "supply" : "pico";
      const languages = Object.keys(migrated.name as Data);
      expect(credit).toEqual(
        Object.fromEntries(
          languages.map((language) => [language, FORMAT_2_CREDIT[kind][language]]),
        ),
      );
      const comments = [...readCircuit(outcome.source, name).comments.values()];
      expect(comments).toEqual([...readCircuit(source, name).comments.values()]);
    },
  );

  it("puts the `setup` after the format, `test` where `scriptDoes` stood, and the credit after the description", () => {
    const pico = formatOne.find(({ source }) => source.includes("  scriptDoes: {"));
    const outcome = migrateSource(pico?.source ?? "", "x.ts");
    if (outcome.kind !== "migrated") throw new Error(JSON.stringify(outcome));
    const data = readCircuit(outcome.source, "x.ts").data as Data;
    const keys = Object.keys(data);
    const before = Object.keys(readCircuit(pico?.source ?? "", "x.ts").data as Data);
    expect(keys[keys.indexOf("format") + 1]).toBe("setup");
    expect(data.setup).toEqual({ kind: "pico" });
    expect(keys.filter((key) => key !== "setup" && key !== "credit").indexOf("test")).toBe(
      before.indexOf("scriptDoes"),
    );
    expect(keys[keys.indexOf("description") + 1]).toBe("credit");
    expect(keys).not.toContain("scriptDoes");
  });

  it("moves a circuit's `supply` into its `setup`, after the format, its comments with it", () => {
    const supplied = formatOne.find(({ source }) => source.includes("  supply: {"));
    const source = (supplied?.source ?? "").replace(
      "  supply: {",
      "  // Three AA batteries, in a holder.\n  supply: {",
    );
    const outcome = migrateSource(source, "x.ts");
    if (outcome.kind !== "migrated") throw new Error(JSON.stringify(outcome));
    const after = readCircuit(outcome.source, "x.ts");
    const data = after.data as Data;
    const before = readCircuit(source, "x.ts").data as Data;
    expect(data.setup).toEqual({ kind: "supply", ...(before.supply as Data) });
    expect(Object.keys(data)[Object.keys(data).indexOf("format") + 1]).toBe("setup");
    expect(data).not.toHaveProperty("supply");
    expect(after.comments.get("setup")).toEqual(["// Three AA batteries, in a holder."]);
  });

  it("keeps a credit the circuit already has", () => {
    const [first] = formatOne;
    const credited = (first?.source ?? "").replace(
      "  description: {",
      '  credit: { en: "Drawn after Raspberry Pi.", fr: "Dessiné d’après Raspberry Pi." },\n  description: {',
    );
    const outcome = migrateSource(credited, "x.ts");
    if (outcome.kind !== "migrated") throw new Error(JSON.stringify(outcome));
    expect((readCircuit(outcome.source, "x.ts").data as Data).credit).toEqual({
      en: "Drawn after Raspberry Pi.",
      fr: "Dessiné d’après Raspberry Pi.",
    });
  });

  it("asks rather than guess a credit in a language ratsnest has none in", () => {
    const [first] = formatOne;
    const source = (first?.source ?? "").replace("  name: {", '  name: { de: "Knopf",');
    expect(migrateSource(source, "x.ts")).toEqual({
      kind: "undecided",
      choices: ["its `credit` in `de`"],
    });
  });

  it("gives credits that name the licence and write its address out, in every language", () => {
    for (const kind of ["pico", "supply"] as const) {
      for (const language of LANGUAGES) {
        const credit = FORMAT_2_CREDIT[kind][language] ?? "";
        expect(credit).toContain("Raspberry Pi Ltd");
        expect(credit).toContain("CC BY-SA 4.0");
        expect(credit).toContain("creativecommons.org/licenses/by-sa/4.0");
        expect(credit).toContain("Nunito");
      }
    }
  });
});
