import { afterAll, describe, expect, it } from "bun:test";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SKILL_CREDIT, SKILL_SUPPLY_CREDIT } from "../src/__fixtures__/credit";
import { checkFile } from "../src/check";
import { isSupplied } from "../src/circuit";
import { main } from "../src/cli";
import { languagesOf } from "../src/fields";
import type { Circuit } from "../src/format";

/**
 * ratsnest's own circuits, its examples, checked by the same `ratsnest check` as anyone's
 * (ADR 0014), and the rule that nothing in `src/` names one of them, tests included (ADR 0007).
 */

const ROOT = join(import.meta.dir, "..");
const EXAMPLES = readdirSync(join(ROOT, "examples"))
  .filter((name) => name.endsWith(".ts"))
  .sort();

const circuitOf = (name: string): Circuit => {
  const checked = checkFile(join(ROOT, "examples", name), `examples/${name}`);
  if (!checked.circuit) throw new Error(`examples/${name} does not pass its checks`);
  return checked.circuit;
};

const quiet = { out: () => {}, err: () => {} };
const pages = mkdtempSync(join(tmpdir(), "ratsnest-examples-"));

afterAll(() => rmSync(pages, { recursive: true, force: true }));

describe("the examples", () => {
  it("are scratchpi's seven circuits, two with a supply in the Pico's place, and one with a transistor (ADR 0032, ADR 0042, ADR 0043)", () => {
    expect(EXAMPLES).toHaveLength(10);
    expect(EXAMPLES.filter((name) => isSupplied(circuitOf(name)))).toEqual([
      "battery-button.ts",
      "fading-light.ts",
    ]);
  });

  it("pass `ratsnest check`, as anyone's circuits do", () => {
    const said: string[] = [];
    const status = main(["check", "examples"], ROOT, {
      out: (line) => said.push(line),
      err: (line) => said.push(line),
    });
    expect(said).toEqual(["10 circuits checked: all well."]);
    expect(status).toBe(0);
  });

  it.each(EXAMPLES)(
    "carry the credit the circuit skill gives their kind, in each language: %s",
    (name) => {
      const circuit = circuitOf(name);
      const credit = isSupplied(circuit) ? SKILL_SUPPLY_CREDIT : SKILL_CREDIT;
      for (const language of languagesOf(circuit)) {
        expect(circuit.credit?.[language]).toBe(credit[language]);
      }
    },
  );

  it.each(EXAMPLES)("make a page in each of their languages: %s", (name) => {
    const languages = languagesOf(circuitOf(name));
    expect(languages.length).toBeGreaterThan(0);
    for (const language of languages) {
      const out = join(pages, `${name}.${language}.html`);
      const args = ["generate", `examples/${name}`, "--language", language, "--out", out];
      expect(main(args, ROOT, quiet)).toBe(0);
      expect(readFileSync(out, "utf8")).toContain(`<html lang="${language}"`);
    }
  });
});

describe("the engine (ADR 0007)", () => {
  /** Every file in `src/`, its tests and fixtures included. */
  const sources = (folder: string): string[] =>
    readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? sources(join(folder, entry.name))
        : /\.(ts|js|css)$/.test(entry.name)
          ? [join(folder, entry.name)]
          : [],
    );

  it("names no example, by its name in any language or by its file", () => {
    const names = EXAMPLES.flatMap((name) => {
      const circuit = circuitOf(name);
      const stem = name.replace(/\.ts$/, "");
      // A name that is also one of the circuit's own parts, as RGB LED's is, names the part as often
      // as the circuit, so it cannot tell the two apart.
      const parts = new Set(
        [
          ...(circuit.leds ?? []),
          ...(circuit.buttons ?? []),
          ...("buzzers" in circuit ? (circuit.buzzers ?? []) : []),
        ].flatMap((part) => Object.values(part.name)),
      );
      return [
        ...Object.values(circuit.name)
          .filter((words) => !parts.has(words))
          .flatMap((words) => [`"${words}"`, `'${words}'`, `\`${words}\``]),
        `examples/${stem}`,
      ];
    });
    const files = sources(join(ROOT, "src"));
    expect(files.length).toBeGreaterThan(20);
    const naming = files.flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return names.filter((name) => text.includes(name)).map((name) => `${file} names ${name}`);
    });
    expect(naming).toEqual([]);
  });
});
