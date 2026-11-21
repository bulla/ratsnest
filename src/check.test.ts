import { describe, expect, it } from "bun:test";
import { FIXTURE_IDS, FIXTURES } from "./__fixtures__/circuits";
import { fileOf, sourceOf } from "./__fixtures__/files";
import { checkSource, problemLine } from "./check";
import type { Circuit, LedPart } from "./format";

describe("every check, over a circuit file", () => {
  it.each([...FIXTURE_IDS])(
    "passes every test circuit, and hands back what it declares: %s",
    (id) => {
      const data = fileOf(FIXTURES[id]);
      const checked = checkSource(sourceOf(data), `${id}.ts`);
      expect(checked.problems.map(problemLine)).toEqual([]);
      expect(checked.circuit).toEqual(data);
    },
  );

  it("stops at the declarative check, and says where", () => {
    const source = sourceOf(fileOf(FIXTURES["two-lights"])).replace(
      '"format": 1',
      '"format": Number("1")',
    );
    const checked = checkSource(source, "circuits/two-lights.ts");
    expect(checked.circuit).toBeUndefined();
    expect(checked.problems.map(problemLine)).toEqual([
      "circuits/two-lights.ts:4:13: a call: a circuit file only declares (ADR 0007)",
    ]);
  });

  it("points a field's problem at the line it is written on", () => {
    const data = fileOf(FIXTURES["two-lights"]);
    const broken = { ...data, description: { en: "" } };
    const [problem] = checkSource(sourceOf(broken), "two-lights.ts").problems;
    const line = sourceOf(broken)
      .split("\n")
      .findIndex((each) => each.includes('"en": ""'));
    expect(problem?.at?.line).toBe(line + 1);
    expect(problem?.message).toBe("description.en is not a string with something in it");
  });

  it("points a missing field at the object that lacks it", () => {
    const { description: _, ...data } = fileOf(FIXTURES["two-lights"]);
    const [problem] = checkSource(sourceOf(data), "two-lights.ts").problems;
    expect(problem?.at?.line).toBe(3);
    expect(problem?.message).toBe("the circuit has no `description`, a text");
  });

  it("checks the wiring once every field is right, and refuses a light put in backwards", () => {
    const data = fileOf(FIXTURES["two-lights"]);
    const backwards: Circuit = {
      ...data,
      steps: data.steps.map((step) => ({
        ...step,
        parts: step.parts.map((part) =>
          part.kind === "led" && part.led === "red"
            ? ({ ...part, anode: part.cathode, cathode: part.anode } satisfies LedPart)
            : part,
        ),
      })),
    };
    const checked = checkSource(sourceOf(backwards), "two-lights.ts");
    expect(checked.circuit).toBeUndefined();
    expect(checked.problems.map(problemLine)).toContain(
      "two-lights.ts: the red LED is in backwards: its long leg must be towards GP15",
    );
  });
});

describe("what crowds at a quarter turn (ADR 0003, ADR 0007)", () => {
  it("refuses a value tag with nowhere clear, at the orientation where it has none", () => {
    // Before M5, this pull-down lay in row i between the two buttons: tidy at 0° and 180°, with no
    // room for its upright value on a standing board.
    const data = fileOf(FIXTURES["button-each-side"]);
    const crowded: Circuit = {
      ...data,
      steps: data.steps.map((step) => ({
        ...step,
        parts: step.parts.flatMap((part) =>
          part.kind === "resistor" && part.from === "i23"
            ? [
                { ...part, to: "i26" as const },
                {
                  kind: "wire" as const,
                  from: "j26" as const,
                  to: "bottom-26" as const,
                  role: "ground" as const,
                },
              ]
            : [part],
        ),
      })),
    };
    expect(checkSource(sourceOf(crowded), "crowded.ts").problems.map(problemLine)).toEqual([
      "crowded.ts: at 90°, the 4.7 kΩ resistor from i23 to i26 has nowhere clear for its value tag",
      "crowded.ts: at 270°, the 4.7 kΩ resistor from i23 to i26 has nowhere clear for its value tag",
    ]);
  });
});
