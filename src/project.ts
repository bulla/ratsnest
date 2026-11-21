import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * A circuits project: any folder with a `ratsnest.json`, naming the version of ratsnest it expects
 * (ADR 0014, ADR 0016). An executable older or newer than that says so, and runs nothing.
 */

/** The file that makes a folder a circuits project. */
export const PROJECT_FILE = "ratsnest.json";

export interface Project {
  /** The folder holding `ratsnest.json`. */
  readonly root: string;
  /** The version of ratsnest it expects. */
  readonly version: string;
}

/** The project a folder is in: the nearest `ratsnest.json` at or above it, or none. */
export function findProject(from: string): Project | undefined {
  for (let folder = from; ; folder = dirname(folder)) {
    const file = join(folder, PROJECT_FILE);
    if (existsSync(file)) {
      const version = JSON.parse(readFileSync(file, "utf8")).ratsnest;
      if (typeof version !== "string") throw new Error(`${file} names no version of ratsnest`);
      return { root: folder, version };
    }
    if (dirname(folder) === folder) return undefined;
  }
}

/**
 * What a running ratsnest says to a project expecting another version (ADR 0016): an older one
 * cannot read what the project may hold, and a newer one has not yet moved the project on.
 */
export function versionProblem(running: string, expected: string): string | undefined {
  const order = Bun.semver.order(running, expected);
  if (order < 0) {
    return `this ratsnest is ${running}, older than the ${expected} the project expects: run \`ratsnest update\``;
  }
  if (order > 0) {
    return `this ratsnest is ${running}, newer than the ${expected} the project expects: run \`ratsnest update\` to move the project on`;
  }
  return undefined;
}
