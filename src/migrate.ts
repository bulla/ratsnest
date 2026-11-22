import { FORMAT } from "./fields";
import { printCircuit } from "./print";
import { readCircuit } from "./read";

/**
 * Migrations: each takes a circuit's object from one format to the next, and nothing else (ADR 0015).
 * `ratsnest update` runs them on every circuit file, one format at a time, and writes each file back
 * with its comments. A migration that cannot decide something leaves the file as it was and names
 * what a person has to choose.
 *
 * Each is tested on files of the format it reads, kept as they were: ratsnest's examples in format 1
 * are in `examples/format-1/`.
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

/**
 * ratsnest's credit as format 2 was made with it (ADR 0032), in each language ratsnest writes: what
 * the migration from format 1 gives every circuit. It is fixed with the migration, as every
 * migration is; the `circuit` skill's default, for new circuits, may change after it.
 */
export const FORMAT_2_CREDIT: Readonly<Record<string, string>> = {
  en: "The Pico 2 W is drawn from its datasheet, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). This drawing is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
  fr: "Le Pico 2 W est dessiné d’après sa fiche technique, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Ce dessin est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  ru: "Pico 2 W нарисован по его спецификации, на основе распиновки Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, по лицензии CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Этот рисунок распространяется по той же лицензии. Шрифт Nunito, по лицензии SIL Open Font License 1.1.",
};

/**
 * Format 1 to 2 (ADR 0032): every circuit says its drawing's credit, after its description, in each of
 * its languages, which are its name's (ADR 0010). It is given ratsnest's, which its author may reword.
 */
const addCredit: Migration = {
  from: 1,
  says: "it has a `credit` now, ratsnest's in each of its languages, for its page's footer and its drawing's edge: reword it as you like",
  migrate: (data) => {
    const languages = data.name && typeof data.name === "object" ? Object.keys(data.name) : [];
    const lacking = languages.filter((language) => !(language in FORMAT_2_CREDIT));
    if (lacking.length > 0) {
      return { undecided: lacking.map((language) => `its \`credit\` in \`${language}\``) };
    }
    const credit = Object.fromEntries(
      languages.map((language) => [language, FORMAT_2_CREDIT[language]]),
    );
    const entries = Object.entries(data);
    const after = entries.findIndex(([key]) => key === "description") + 1;
    return {
      data: Object.fromEntries([
        ...entries.slice(0, after),
        ["credit", credit],
        ...entries.slice(after),
      ]),
    };
  },
};

/** Every migration ratsnest ships, in order. */
export const MIGRATIONS: readonly Migration[] = [addCredit];

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
