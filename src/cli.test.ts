import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { version } from "../package.json";
import { FIXTURES } from "./__fixtures__/circuits";
import { fileOf, sourceOf } from "./__fixtures__/files";
import { main } from "./cli";
import type { Circuit } from "./format";

const made: string[] = [];

afterEach(() => {
  for (const folder of made.splice(0)) rmSync(folder, { recursive: true, force: true });
});

/** A circuits project in a folder of its own, with the circuit files given in `circuits/`. */
function project(circuits: Record<string, unknown> = {}): string {
  const folder = mkdtempSync(join(tmpdir(), "ratsnest-"));
  made.push(folder);
  mkdirSync(join(folder, "circuits"));
  for (const [name, data] of Object.entries(circuits)) {
    writeFileSync(join(folder, "circuits", name), typeof data === "string" ? data : sourceOf(data));
  }
  return folder;
}

/** Runs the command in a folder, and gives back its exit status and what it printed. */
function run(cwd: string, ...args: string[]) {
  const out: string[] = [];
  const err: string[] = [];
  const status = main(args, cwd, { out: (line) => out.push(line), err: (line) => err.push(line) });
  return { status, out: out.join("\n"), err: err.join("\n") };
}

const LIGHTS = fileOf(FIXTURES["two-lights"]);

/** The test circuit in French as well as English, every text marked so it can be told apart. */
const inBoth = (circuit: Circuit): Circuit => {
  const both = (text: { en?: string }) => ({ ...text, fr: `${text.en} [fr]` });
  return {
    ...circuit,
    name: both(circuit.name),
    description: both(circuit.description),
    leds: (circuit.leds ?? []).map((led) => ({ ...led, name: both(led.name) })),
    steps: circuit.steps.map((step) => ({
      ...step,
      title: both(step.title),
      ...(step.note ? { note: both(step.note) } : {}),
    })),
    script: both(circuit.script),
    scriptDoes: both(circuit.scriptDoes),
  } as Circuit;
};

describe("ratsnest", () => {
  it("says how it is used, and its version", () => {
    const folder = project();
    expect(run(folder, "--help").out).toContain("ratsnest check");
    expect(run(folder, "--version")).toEqual({ status: 0, out: version, err: "" });
    const bare = run(folder);
    expect(bare.status).toBe(2);
    expect(bare.err).toContain("Usage:");
    expect(run(folder, "draw").err).toBe(
      "ratsnest: `draw` is not a command: check, generate, --version or --help",
    );
  });
});

describe("ratsnest check (ADR 0014)", () => {
  it("checks every circuit in circuits/, and says all is well", () => {
    const folder = project({
      "lights.ts": LIGHTS,
      "button.ts": fileOf(FIXTURES["light-and-button"]),
    });
    expect(run(folder, "check")).toEqual({
      status: 0,
      out: "2 circuits checked: all well.",
      err: "",
    });
  });

  it("checks the files and folders it is given instead", () => {
    const folder = project({ "lights.ts": LIGHTS });
    expect(run(folder, "check", "circuits/lights.ts").out).toBe("1 circuit checked: all well.");
    expect(run(folder, "check", "circuits").status).toBe(0);
  });

  it("says each problem on its line, and fails", () => {
    const folder = project({
      "lights.ts": LIGHTS,
      "broken.ts": { ...LIGHTS, description: { en: "" } },
    });
    const result = run(folder, "check");
    expect(result.status).toBe(1);
    expect(result.err).toMatch(
      /^circuits\/broken\.ts:\d+:\d+: description\.en is not a string with something in it\n1 circuit of 2 with problems\.$/,
    );
  });

  it("refuses a path that is not there, or a folder with no circuit in it", () => {
    const folder = project();
    expect(run(folder, "check", "elsewhere").err).toBe("ratsnest: elsewhere does not exist");
    expect(run(folder, "check")).toEqual({
      status: 2,
      out: "",
      err: "ratsnest: circuits holds no circuit file",
    });
  });
});

describe("ratsnest generate (ADR 0023)", () => {
  it("writes the page into pages/, named by its four inputs, and says where", () => {
    const folder = project({ "lights.ts": LIGHTS });
    const result = run(folder, "generate", "circuits/lights.ts");
    expect(result).toEqual({ status: 0, out: "pages/lights.0.dark.en.html", err: "" });
    const page = readFileSync(join(folder, "pages", "lights.0.dark.en.html"), "utf8");
    expect(page).toContain("<h1>Two lights</h1>");
    expect(page).toStartWith("<!doctype html>");
  });

  it("makes the same file from the same inputs, every time (ADR 0004)", () => {
    const folder = project({ "lights.ts": LIGHTS });
    const once = (out: string) => {
      run(folder, "generate", "circuits/lights.ts", "--out", out);
      return readFileSync(join(folder, out), "utf8");
    };
    expect(once("first.html")).toBe(once("second.html"));
  });

  it("writes it where --out says, instead", () => {
    const folder = project({ "lights.ts": LIGHTS });
    expect(run(folder, "generate", "circuits/lights.ts", "--out=guides/two.html").out).toBe(
      "guides/two.html",
    );
    expect(existsSync(join(folder, "guides", "two.html"))).toBe(true);
    expect(existsSync(join(folder, "pages"))).toBe(false);
  });

  it("makes a page only in a language its circuit has (ADR 0010)", () => {
    const folder = project({ "lights.ts": LIGHTS, "both.ts": inBoth(LIGHTS) });
    expect(run(folder, "generate", "circuits/lights.ts", "--language", "fr")).toEqual({
      status: 1,
      out: "",
      err: "circuits/lights.ts is written in `en`, not `fr`: its page is made only in one of those",
    });
    expect(run(folder, "generate", "circuits/both.ts").err).toBe(
      "ratsnest: circuits/both.ts is written in `en` and `fr`: say which with --language",
    );
    expect(run(folder, "generate", "circuits/both.ts", "--language", "fr").status).toBe(0);
    const french = readFileSync(join(folder, "pages", "both.0.dark.fr.html"), "utf8");
    expect(french).toContain('<html lang="fr"');
    expect(french).toContain("<h1>Two lights [fr]</h1>");
  });

  it("refuses a language ratsnest does not write", () => {
    const folder = project({ "lights.ts": LIGHTS });
    expect(run(folder, "generate", "circuits/lights.ts", "--language", "de")).toEqual({
      status: 2,
      out: "",
      err: "ratsnest: --language is a language ratsnest writes, `en` or `fr`, not `de`",
    });
  });

  it("draws every orientation and both themes, and refuses what does not exist", () => {
    const folder = project({ "lights.ts": LIGHTS });
    expect(run(folder, "generate", "circuits/lights.ts", "--orientation", "90").status).toBe(0);
    expect(run(folder, "generate", "circuits/lights.ts", "--theme", "light").status).toBe(0);
    expect(run(folder, "generate", "circuits/lights.ts", "--theme", "grey").err).toBe(
      "ratsnest: --theme is `dark`, `light`, not `grey`",
    );
    expect(run(folder, "generate", "circuits/lights.ts", "--orientation", "45").err).toBe(
      "ratsnest: --orientation is `0`, `90`, `180`, `270`, not `45`",
    );
  });

  it("checks the circuit first, and draws nothing when it fails", () => {
    const folder = project({ "broken.ts": { ...LIGHTS, format: 2 } });
    const result = run(folder, "generate", "circuits/broken.ts");
    expect(result.status).toBe(1);
    expect(result.err).toContain("format 2, newer than this ratsnest reads (1)");
    expect(existsSync(join(folder, "pages"))).toBe(false);
  });

  it("refuses to be used wrongly", () => {
    const folder = project({ "lights.ts": LIGHTS });
    expect(run(folder, "generate").err).toBe(
      "ratsnest: generate needs the circuit file to make a page of",
    );
    expect(run(folder, "generate", "circuits/lights.ts", "--colour", "red").status).toBe(2);
    expect(run(folder, "generate", "circuits/lights.ts", "--theme").err).toBe(
      "ratsnest: --theme needs a value",
    );
  });
});
