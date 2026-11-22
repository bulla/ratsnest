import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FORMAT } from "./fields";
import { MIGRATIONS, type Migration, migrateSource } from "./migrate";
import { printCircuit } from "./print";
import { readCircuit } from "./read";

/**
 * The migrations' harness (ADR 0015), proven on migrations made for the purpose, since format 1 is
 * the first and ratsnest ships none yet.
 */
const EXAMPLES = join(import.meta.dir, "..", "examples");
const examples = readdirSync(EXAMPLES)
  .filter((name) => name.endsWith(".ts"))
  .map((name) => ({ name, source: readFileSync(join(EXAMPLES, name), "utf8") }));

/** A migration to a format 2 made for the test: `scriptDoes` renamed `scriptSays`. */
const renaming: Migration = {
  from: 1,
  says: "`scriptDoes` is now `scriptSays`",
  migrate: ({ scriptDoes, ...rest }) => ({
    data: { ...rest, scriptSays: scriptDoes },
    moved: new Map([["scriptDoes", "scriptSays"]]),
  }),
};

describe("the printer (ADR 0015)", () => {
  it.each(examples)(
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
  it("ships no migration while format 1 is the only one", () => {
    expect(FORMAT).toBe(1);
    expect(MIGRATIONS).toEqual([]);
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
      const outcome = migrateSource(commented, name, [renaming], 2);
      if (outcome.kind !== "migrated") throw new Error(`${name}: ${JSON.stringify(outcome)}`);
      expect(outcome.says).toEqual(["`scriptDoes` is now `scriptSays`"]);
      const after = readCircuit(outcome.source, name);
      const data = after.data as Record<string, unknown>;
      expect(data.format).toBe(2);
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
      from: 1,
      says: "",
      migrate: () => ({ undecided: ["which colour the new cap is"] }),
    };
    const [first] = examples;
    expect(migrateSource(first?.source ?? "", "x.ts", [asking], 2)).toEqual({
      kind: "undecided",
      choices: ["which colour the new cap is"],
    });
  });

  it("refuses a format it has no migration from, and one newer than it reads", () => {
    const [first] = examples;
    expect(migrateSource(first?.source ?? "", "x.ts", [], 2)).toEqual({
      kind: "refused",
      why: "ratsnest has no migration from format 1",
    });
    expect(migrateSource((first?.source ?? "").replace("format: 1", "format: 3"), "x.ts")).toEqual({
      kind: "refused",
      why: "it is in format 3, newer than 1",
    });
  });
});
