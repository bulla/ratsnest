import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { parse } from "@babel/parser";
import type { BUTTON_COLOURS, LED_COLOURS } from "./circuit";
import type { Hole as EngineHole, Part as EnginePart } from "./drawing/breadboard";
import type { ButtonColour, Hole, Language, LedColour, Part } from "./format";
import type { LANGUAGES } from "./language";

const SOURCE = readFileSync(new URL("./format.ts", import.meta.url), "utf8");

describe("the circuit format's file (ADR 0022)", () => {
  const program = parse(SOURCE, { sourceType: "module", plugins: ["typescript"] }).program;

  it("imports nothing, so that init can copy it alone", () => {
    expect(program.body.filter((node) => node.type === "ImportDeclaration")).toEqual([]);
  });

  it("exports only types", () => {
    const exported = program.body.filter((node) => node.type.startsWith("Export"));
    expect(exported.length).toBeGreaterThan(10);
    for (const node of exported) {
      if (node.type !== "ExportNamedDeclaration") throw new Error(`${node.type} in format.ts`);
      expect(["TSTypeAliasDeclaration", "TSInterfaceDeclaration"]).toContain(
        node.declaration?.type ?? "",
      );
    }
  });
});

describe("the engine's lists, held to the format", () => {
  it("has every light's colour the format has", () => {
    const every: Exclude<LedColour, (typeof LED_COLOURS)[number]> extends never ? true : never =
      true;
    expect(every).toBe(true);
  });

  it("has every cap's colour the format has", () => {
    const every: Exclude<ButtonColour, (typeof BUTTON_COLOURS)[number]> extends never
      ? true
      : never = true;
    expect(every).toBe(true);
  });

  it("writes in every language the format has, and no other", () => {
    const every: Exclude<Language, (typeof LANGUAGES)[number]> extends never ? true : never = true;
    const no: (typeof LANGUAGES)[number] extends Language ? true : never = true;
    expect([every, no]).toEqual([true, true]);
  });

  it("takes every part and hole a file can declare into its model as they are", () => {
    // The format is stricter than the model, and never looser: a part a file declares is a part
    // the drawing can draw (ADR 0022).
    const part: Part = { kind: "wire", from: "a19", to: "top-19", role: "ground" };
    const hole: Hole = "2:f5";
    const drawn: EnginePart = part;
    const named: EngineHole = hole;
    expect([drawn, named]).toEqual([part, hole]);
  });
});
