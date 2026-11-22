import { FORMAT } from "./fields";
import { printCircuit } from "./print";
import { readCircuit } from "./read";

/**
 * Migrations: each takes a circuit's object from one format to the next, and nothing else (ADR 0015).
 * `ratsnest update` runs them on every circuit file, one format at a time, and writes each file back
 * with its comments. A migration that cannot decide something leaves the file as it was and names
 * what a person has to choose.
 *
 * Format 1 is the first, so there is none yet: the first change that breaks the format ships the first,
 * with a test that runs it on files of format 1, ratsnest's examples among them, kept as they were.
 */

type Data = Record<string, unknown>;

/** What a migration did: the next format's object, and where it moved any field, for its comments. */
export type Migrated =
  | { readonly data: Data; readonly moved?: ReadonlyMap<string, string> }
  | { readonly undecided: readonly string[] };

export interface Migration {
  /** The format it reads; it writes the one after. */
  readonly from: number;
  /** What it changes, said to the person whose files it changes. */
  readonly says: string;
  readonly migrate: (data: Data) => Migrated;
}

/** Every migration ratsnest ships, in order. */
export const MIGRATIONS: readonly Migration[] = [];

/** What became of a file. */
export type Outcome =
  | { readonly kind: "current" }
  | { readonly kind: "migrated"; readonly source: string; readonly says: readonly string[] }
  | { readonly kind: "undecided"; readonly choices: readonly string[] }
  | { readonly kind: "refused"; readonly why: string };

/** A comment's path once a migration has moved the field it stood before, or beneath. */
const movedPath = (path: string, moved: ReadonlyMap<string, string>): string => {
  for (const [from, to] of moved) {
    if (
      path === from ||
      path.startsWith(`${from}.`) ||
      path.startsWith(`${from}[`) ||
      path.startsWith(`${from}/`)
    ) {
      return `${to}${path.slice(from.length)}`;
    }
  }
  return path;
};

/** A circuit file's source taken to the current format, or what stops it. */
export function migrateSource(
  source: string,
  file: string,
  migrations: readonly Migration[] = MIGRATIONS,
  to: number = FORMAT,
): Outcome {
  const read = readCircuit(source, file);
  if (read.problems.length > 0 || typeof read.data !== "object" || read.data === null) {
    return { kind: "refused", why: "it does more than declare, which `ratsnest check` says where" };
  }
  let data = read.data as Data;
  const format = data.format;
  if (typeof format !== "number" || !Number.isInteger(format)) {
    return { kind: "refused", why: "it says no format" };
  }
  if (format === to) return { kind: "current" };
  if (format > to) return { kind: "refused", why: `it is in format ${format}, newer than ${to}` };
  let comments = new Map(read.comments);
  const says: string[] = [];
  for (let at = format; at < to; at++) {
    const migration = migrations.find((each) => each.from === at);
    if (!migration) return { kind: "refused", why: `ratsnest has no migration from format ${at}` };
    const migrated = migration.migrate(data);
    if ("undecided" in migrated) return { kind: "undecided", choices: migrated.undecided };
    data = { ...migrated.data, format: at + 1 };
    if (migrated.moved) {
      const moved = migrated.moved;
      comments = new Map([...comments].map(([path, written]) => [movedPath(path, moved), written]));
    }
    says.push(migration.says);
  }
  return { kind: "migrated", source: printCircuit(data, comments), says };
}
