/**
 * `bun run build`: one executable per platform, and the `NOTICES` file every release carries
 * (ADR 0016, ADR 0018). Each is compiled with `--conditions=browser`, without which fontkit's Unicode
 * data is read from a folder an executable does not have. `bun run build linux-x64` makes one target
 * alone, as the pull request workflow does.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");

/** The five platforms ratsnest ships for, by Bun's name for each (ADR 0016). */
export const TARGETS = [
  "linux-x64",
  "linux-arm64",
  "darwin-arm64",
  "darwin-x64",
  "windows-x64",
] as const;

export type Target = (typeof TARGETS)[number];

/** An executable's file name: `ratsnest-linux-x64`, and `.exe` on Windows. */
export const executableOf = (target: Target): string =>
  `ratsnest-${target}${target.startsWith("windows") ? ".exe" : ""}`;

/** The Bun every executable is, as `packageManager` pins it: `1.4.5`. */
const pinnedBun = (): string => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const [, version] = String(manifest.packageManager ?? "").split("@");
  if (!version) throw new Error("package.json pins no Bun in packageManager");
  return version;
};

/** Every package an executable carries: the runtime dependencies, and theirs, by name. */
function carried(): string[] {
  const seen = new Set<string>();
  const visit = (name: string) => {
    if (seen.has(name)) return;
    const folder = join(ROOT, "node_modules", name);
    if (!existsSync(folder)) return;
    seen.add(name);
    const manifest = JSON.parse(readFileSync(join(folder, "package.json"), "utf8"));
    for (const dependency of Object.keys(manifest.dependencies ?? {})) visit(dependency);
  };
  const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  for (const name of Object.keys(manifest.dependencies ?? {})) visit(name);
  return [...seen].sort();
}

/** A package's licence: its own file, or the name its manifest gives when it ships none. */
function licenceOf(name: string): { version: string; licence: string; text: string } {
  const folder = join(ROOT, "node_modules", name);
  const manifest = JSON.parse(readFileSync(join(folder, "package.json"), "utf8"));
  const file = readdirSync(folder).find((each) => /^(?:licen[cs]e|copying)(?:\.|$)/i.test(each));
  return {
    version: manifest.version,
    licence: typeof manifest.license === "string" ? manifest.license : "see its licence",
    text: file
      ? readFileSync(join(folder, file), "utf8").trim()
      : `Licensed under ${manifest.license}.`,
  };
}

/** The NOTICES file: what an executable contains, and under which licence each part is (ADR 0018). */
export async function notices(): Promise<string> {
  const bun = pinnedBun();
  const bunLicence = await (
    await fetch(`https://raw.githubusercontent.com/oven-sh/bun/bun-v${bun}/LICENSE.md`)
  ).text();
  const section = (title: string, body: string) =>
    `${title}\n${"=".repeat(title.length)}\n\n${body.trim()}\n`;
  return [
    section(
      "ratsnest",
      `ratsnest is under the MIT licence, held by bulla, but for the drawing and the font below.\n\n${readFileSync(join(ROOT, "LICENSE"), "utf8")}`,
    ),
    section(
      "The drawing",
      "The Raspberry Pi Pico 2 W and breadboard drawing is an adaptation of Figure 2 of the Raspberry Pi Pico 2 W Datasheet, © Raspberry Pi Ltd, under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/), and is shared under the same licence. ATTRIBUTION.md, in ratsnest's repository, says what was changed.",
    ),
    section(
      "Nunito",
      `Every page is set in Nunito 3.602, cut to ratsnest's characters, under the SIL Open Font License 1.1.\n\n${readFileSync(join(ROOT, "fonts", "OFL.txt"), "utf8")}`,
    ),
    section(
      `Bun ${bun}`,
      `Every executable is Bun, which statically links JavaScriptCore and WebKit under the LGPL-2, with ratsnest inside it. Bun's source, and so theirs, is at https://github.com/oven-sh/bun/tree/bun-v${bun}.\n\n${bunLicence}`,
    ),
    ...carried().map((name) => {
      const { version, licence, text } = licenceOf(name);
      return section(`${name} ${version} (${licence})`, text);
    }),
  ].join("\n");
}

/** Compiles one platform's executable into `dist/`. */
export async function build(target: Target): Promise<string> {
  const out = join(DIST, executableOf(target));
  await $`bun build --compile --conditions=browser --target=bun-${target} ${join(ROOT, "src", "cli.ts")} --outfile ${out}`.quiet();
  return out;
}

if (import.meta.main) {
  const asked = process.argv.slice(2);
  const targets = asked.length > 0 ? asked : [...TARGETS];
  for (const target of targets) {
    if (!(TARGETS as readonly string[]).includes(target)) {
      console.error(`ratsnest builds for ${TARGETS.join(", ")}, not ${target}`);
      process.exit(2);
    }
  }
  mkdirSync(DIST, { recursive: true });
  for (const target of targets as Target[]) {
    await build(target);
    console.log(`dist/${executableOf(target)}`);
  }
  writeFileSync(join(DIST, "NOTICES"), await notices());
  console.log("dist/NOTICES");
}
