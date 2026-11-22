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
/** ratsnest's examples as they were in format 1, before circuits carried their credit. */
const formatOne = sourcesIn(join(EXAMPLES, "format-1"));

const NEXT = FORMAT + 1;

/** A migration to a format after this one, made for the test: `scriptDoes` renamed `scriptSays`. */
const renaming: Migration = {
  from: FORMAT,
  says: "`scriptDoes` is now `scriptSays`",
  migrate: ({ scriptDoes, ...rest }) => ({
    data: { ...rest, scriptSays: scriptDoes },
    moved: new Map([["scriptDoes", "scriptSays"]]),
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
      const commented = source.replace(
        "  scriptDoes: {",
        "  // What the reader sees the script do.\n  scriptDoes: {",
      );
      const outcome = migrateSource(commented, name, [renaming], NEXT);
      if (outcome.kind !== "migrated") throw new Error(`${name}: ${JSON.stringify(outcome)}`);
      expect(outcome.says).toEqual(["`scriptDoes` is now `scriptSays`"]);
      const after = readCircuit(outcome.source, name);
      const data = after.data as Record<string, unknown>;
      expect(data.format).toBe(NEXT);
      expect(data.scriptDoes).toBeUndefined();
      expect(data.scriptSays).toEqual(
        (readCircuit(source, name).data as Record<string, unknown>).scriptDoes,
      );
      expect(after.comments.get("scriptSays")).toEqual(["// What the reader sees the script do."]);
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
    const newer = (first?.source ?? "").replace(`format: ${FORMAT}`, `format: ${NEXT}`);
    expect(migrateSource(newer, "x.ts")).toEqual({
      kind: "refused",
      why: `it is in format ${NEXT}, newer than ${FORMAT}`,
    });
  });
});

describe("format 1 to 2: every circuit carries its credit (ADR 0032)", () => {
  it("has ratsnest's examples in format 1 to be tested on, one for each example", () => {
    expect(formatOne.map(({ name }) => name)).toEqual(examples.map(({ name }) => name));
    for (const { source } of formatOne) expect(source).toContain("  format: 1,\n");
  });

  it.each(formatOne)(
    "takes $name in format 1 to the example as it is now, its comments kept",
    ({ name, source }) => {
      const outcome = migrateSource(source, name);
      if (outcome.kind !== "migrated") throw new Error(`${name}: ${JSON.stringify(outcome)}`);
      expect(outcome.says).toHaveLength(1);
      const now = examples.find((example) => example.name === name)?.source ?? "";
      const after = readCircuit(outcome.source, name);
      expect(after.data).toEqual(readCircuit(now, name).data);
      expect([...after.comments.values()]).toEqual([
        ...readCircuit(source, name).comments.values(),
      ]);
    },
  );

  it("gives the credit in each of the circuit's languages, just after its description", () => {
    const [first] = formatOne;
    const outcome = migrateSource(first?.source ?? "", "x.ts");
    if (outcome.kind !== "migrated") throw new Error(JSON.stringify(outcome));
    const data = readCircuit(outcome.source, "x.ts").data as Record<string, Record<string, string>>;
    const keys = Object.keys(data);
    expect(keys[keys.indexOf("description") + 1]).toBe("credit");
    expect(Object.keys(data.credit ?? {})).toEqual(Object.keys(data.name ?? {}));
  });

  it("asks rather than guess a credit in a language ratsnest has none in", () => {
    const [first] = formatOne;
    const source = (first?.source ?? "").replace("  name: {", '  name: { de: "Zwei Knöpfe",');
    expect(migrateSource(source, "x.ts")).toEqual({
      kind: "undecided",
      choices: ["its `credit` in `de`"],
    });
  });

  it("gives ratsnest's credit, which names the licence and writes its address out, in every language", () => {
    for (const language of LANGUAGES) {
      const credit = FORMAT_2_CREDIT[language] ?? "";
      expect(credit).toContain("Raspberry Pi Ltd");
      expect(credit).toContain("CC BY-SA 4.0");
      expect(credit).toContain("creativecommons.org/licenses/by-sa/4.0");
      expect(credit).toContain("Nunito");
    }
  });
});
