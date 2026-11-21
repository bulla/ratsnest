import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import skill from "../.claude/skills/circuit/SKILL.md" with { type: "text" };
// @ts-expect-error: imported as its text, which TypeScript cannot see of a `.ts` file. Imported rather
// than read from disk, so that a compiled ratsnest carries it (ADR 0016).
import formatSource from "./format.ts" with { type: "text" };
import { PROJECT_FILE } from "./project";

/**
 * `ratsnest init`: a circuits project in a folder (ADR 0014, ADR 0016, ADR 0019, ADR 0025). It holds
 * `ratsnest.json` naming this ratsnest's version, the `Circuit` type in `.ratsnest/`, a
 * `tsconfig.json` that points `ratsnest` at it, `circuits/`, the `circuit` skill, a tracked
 * `ARTIFACTS.md`, and a `.gitignore` holding `pages/`. Nothing is overwritten but `.gitignore`, which
 * gains its line.
 */

/** The `Circuit` type, as `.ratsnest/` holds it: `src/format.ts`, which imports nothing (ADR 0022). */
export const FORMAT_SOURCE: string = formatSource as string;

/** The `circuit` skill's one copy, which `init` puts in a project and `update` replaces (ADR 0014). */
export const CIRCUIT_SKILL: string = skill;

const TSCONFIG = `${JSON.stringify(
  {
    compilerOptions: {
      strict: true,
      noEmit: true,
      module: "preserve",
      moduleResolution: "bundler",
      verbatimModuleSyntax: true,
      types: [],
      paths: { ratsnest: ["./.ratsnest/ratsnest.d.ts"] },
    },
    include: ["circuits"],
  },
  null,
  2,
)}\n`;

const ARTIFACTS = `# Artifacts

Every page of this project published as an Artifact, one row per set of four inputs (ratsnest's
ADR 0013). The \`circuit\` skill writes a row when it publishes, and finds a page again by its
\`<meta name="ratsnest">\` where this file has no row.

| Circuit | Orientation | Theme | Language | Link | Made from | Published |
| --- | --- | --- | --- | --- | --- | --- |
`;

/** Makes a circuits project in a folder, and says which files it wrote. */
export function init(folder: string, version: string): string[] {
  if (existsSync(join(folder, PROJECT_FILE))) {
    throw new Error(`${folder} is a circuits project already: it has a ${PROJECT_FILE}`);
  }
  const written: string[] = [];
  const write = (path: string, text: string) => {
    const file = join(folder, path);
    if (existsSync(file)) return;
    mkdirSync(join(file, ".."), { recursive: true });
    writeFileSync(file, text);
    written.push(path);
  };
  write(PROJECT_FILE, `${JSON.stringify({ ratsnest: version }, null, 2)}\n`);
  write(".ratsnest/ratsnest.d.ts", FORMAT_SOURCE);
  write("tsconfig.json", TSCONFIG);
  write(".claude/skills/circuit/SKILL.md", CIRCUIT_SKILL);
  write("ARTIFACTS.md", ARTIFACTS);
  mkdirSync(join(folder, "circuits"), { recursive: true });
  const ignore = join(folder, ".gitignore");
  const ignored = existsSync(ignore) ? readFileSync(ignore, "utf8") : "";
  if (!ignored.split(/\r?\n/).includes("pages/")) {
    writeFileSync(
      ignore,
      `${ignored}${ignored && !ignored.endsWith("\n") ? "\n" : ""}# What \`ratsnest generate\` writes, made again from the circuits.\npages/\n`,
    );
    written.push(".gitignore");
  }
  return written;
}
