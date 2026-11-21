import { describe, expect, it } from "bun:test";
import { FIXTURES } from "./__fixtures__/circuits";
import { fileOf, sourceOf } from "./__fixtures__/files";
import { readCircuit } from "./read";

const HEAD = 'import type { Circuit } from "ratsnest";\n\n';

/** A file whose default export is the object written, after the usual import. */
const declaring = (object: string) => `${HEAD}export default ${object} satisfies Circuit;\n`;

/** What the reader says of a file, as `line: message` for each problem. */
const said = (source: string) =>
  readCircuit(source, "circuit.ts").problems.map(
    ({ at, message }) => `${at ? `${at.line}: ` : ""}${message}`,
  );

describe("a circuit file that only declares (ADR 0007)", () => {
  it("is read as the object it declares, and nothing in it is run", () => {
    const data = fileOf(FIXTURES["two-lights"]);
    const read = readCircuit(sourceOf(data), "two-lights.ts");
    expect(read.problems).toEqual([]);
    expect(read.data).toEqual(data);
  });

  it("may say its values every way TypeScript writes them, with comments", () => {
    const read = readCircuit(
      declaring(`{
  // Why this pin, for whoever reads the file next.
  format: 1,
  "name": { en: \`A plain template\` },
  /* A negative number, which nothing in a circuit needs, is still a number. */
  offset: -2,
  list: [true, false, 0.5],
}`),
      "circuit.ts",
    );
    expect(read.problems).toEqual([]);
    expect(read.data).toEqual({
      format: 1,
      name: { en: "A plain template" },
      offset: -2,
      list: [true, false, 0.5],
    });
  });

  it("says where each value is written, by its path", () => {
    const read = readCircuit(sourceOf(fileOf(FIXTURES["two-lights"])), "two-lights.ts");
    const name = read.at("name.en");
    const hole = read.at("steps[0].parts[0].from");
    expect(name?.line).toBeGreaterThan(2);
    expect(hole?.line).toBeGreaterThan(name?.line ?? 0);
    expect(read.at("steps[99]")).toBeUndefined();
  });
});

describe("a circuit file that does more than declare", () => {
  it.each([
    ["a function", "{ name: () => 1 }", "a function"],
    ["a method", "{ name() { return 1; } }", "a function"],
    ["a call", '{ name: String("x") }', "a call"],
    ["a variable", "{ name: somewhere }", "a name, `somewhere`"],
    ["undefined", "{ name: undefined }", "a name, `undefined`"],
    ["a spread", "{ ...others }", "a spread"],
    ["a spread in a list", "{ list: [...others] }", "a spread"],
    ["a condition", "{ name: a ? 1 : 2 }", "a condition"],
    ["a sum", "{ ohms: 100 + 230 }", "an operation"],
    ["a computed key", '{ ["name"]: 1 }', "a computed key"],
    ["a shorthand", "{ name }", "a shorthand property"],
    // biome-ignore lint/suspicious/noTemplateCurlyInString: the file under test is text, and holds a template
    ["a template that puts a value in", "{ name: `GP${15}` }", "a template string"],
    ["null", "{ name: null }", "`null`"],
    ["a type assertion", '{ name: "x" as const }', "a type assertion"],
    ["an empty slot", "{ list: [1, , 2] }", "an empty slot"],
    ["a key written twice", "{ name: 1, name: 2 }", "`name` is written twice"],
  ])("refuses %s, on its line", (_, object, words) => {
    const problems = said(declaring(object));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toStartWith("3: ");
    expect(problems[0]).toContain(words);
  });

  it("refuses an import that brings a value, or types from anywhere but ratsnest", () => {
    expect(
      said(`import { Circuit } from "ratsnest";\nexport default {} satisfies Circuit;\n`),
    ).toEqual(["1: an import that brings a value: write `import type` (ADR 0007)"]);
    expect(
      said(
        `import type { Circuit } from "./elsewhere";\nexport default {} satisfies Circuit;\n`,
      )[0],
    ).toStartWith("1: types imported from `./elsewhere`");
  });

  it("refuses anything beside its imports and its one default export", () => {
    expect(said(`${HEAD}const red = 15;\nexport default {} satisfies Circuit;\n`)[0]).toStartWith(
      "3: a variable: a circuit file holds",
    );
    expect(
      said(`${HEAD}export const red = 15;\nexport default {} satisfies Circuit;\n`)[0],
    ).toStartWith("3: a named export");
    expect(
      said(`${HEAD}export default {} satisfies Circuit;\nexport default {} satisfies Circuit;\n`),
    ).toEqual(["4: a second default export"]);
  });

  it("refuses a default export that is not an object satisfying Circuit", () => {
    for (const declared of ["{}", "{} as Circuit", "{} satisfies Other", "[] satisfies Circuit"]) {
      expect(said(`${HEAD}export default ${declared};\n`)).toEqual([
        "3: the default export is not `{ … } satisfies Circuit`",
      ]);
    }
  });

  it("refuses a file with no default export, and one TypeScript cannot read", () => {
    expect(said(HEAD)).toEqual(["has no `export default { … } satisfies Circuit`"]);
    const broken = said(`${HEAD}export default { name: } satisfies Circuit;\n`);
    expect(broken).toHaveLength(1);
    expect(broken[0]).toStartWith("3: is not TypeScript the engine can read");
  });

  it("gives no data for a file it refused, so nothing after it can use half of one", () => {
    expect(readCircuit(declaring("{ format: 1, name: f() }"), "circuit.ts").data).toBeUndefined();
  });
});
