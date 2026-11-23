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
 * ratsnest's credit as format 2 was made with it (ADR 0035, ADR 0036), for a circuit on a Pico and for
 * one with a supply, in each language ratsnest writes: what the migration from format 1 gives a
 * circuit that has none. It is fixed with the migration, as every migration is; the `circuit` skill's,
 * for new circuits, may change after it.
 */
export const FORMAT_2_CREDIT: Readonly<
  Record<"pico" | "supply", Readonly<Record<string, string>>>
> = {
  pico: {
    en: "The Pico 2 W is drawn from its datasheet, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). This drawing is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Le Pico 2 W est dessiné d’après sa fiche technique, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Ce dessin est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
    ru: "Pico 2 W нарисован по его спецификации, на основе распиновки Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, по лицензии CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Этот рисунок распространяется по той же лицензии. Шрифт Nunito, по лицензии SIL Open Font License 1.1.",
  },
  supply: {
    en: "This drawing comes from the one ratsnest makes of the Pico 2 W, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), and is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Ce dessin vient de celui que ratsnest fait du Pico 2 W, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), et il est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
    ru: "Этот рисунок основан на рисунке Pico 2 W, который делает ratsnest, на основе распиновки Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, по лицензии CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), и распространяется по той же лицензии. Шрифт Nunito, по лицензии SIL Open Font License 1.1.",
  },
};

/**
 * Format 1 to 2 (ADR 0036, ADR 0037): every circuit says what its breadboard is set up with, after its
 * format, a circuit's `supply` moving into its `setup`; a Pico circuit's `scriptDoes` is its `test`,
 * as a supply circuit's is; and a circuit with no `credit` is given ratsnest's for its kind, in each
 * of its languages, after its description, so that its pages keep the footer the engine used to write.
 */
const formatTwo: Migration = {
  from: 1,
  says: "every circuit says what its breadboard is set up with, in its `setup`, a Pico circuit's `scriptDoes` is its `test` now, and a circuit with no `credit` has ratsnest's, which you may reword or take out",
  migrate: (data) => {
    const supply = data.supply;
    const supplied = typeof supply === "object" && supply !== null && !Array.isArray(supply);
    const defaults = FORMAT_2_CREDIT[supplied ? "supply" : "pico"];
    const languages = data.name && typeof data.name === "object" ? Object.keys(data.name) : [];
    const credited = Object.hasOwn(data, "credit");
    const lacking = credited ? [] : languages.filter((language) => !(language in defaults));
    if (lacking.length > 0) {
      return { undecided: lacking.map((language) => `its \`credit\` in \`${language}\``) };
    }
    const credit = Object.fromEntries(languages.map((language) => [language, defaults[language]]));
    const setup = supplied ? { type: "supply", ...supply } : { type: "pico" };
    const entries = Object.entries(data).flatMap(([key, value]): [string, unknown][] => {
      if (key === "format")
        return [
          [key, value],
          ["setup", setup],
        ];
      if (key === "supply" && supplied) return [];
      if (key === "scriptDoes") return [["test", value]];
      if (key === "description" && !credited)
        return [
          [key, value],
          ["credit", credit],
        ];
      return [[key, value]];
    });
    return {
      data: Object.fromEntries(entries),
      moved: new Map([
        ["scriptDoes", "test"],
        ["supply", "setup"],
      ]),
    };
  },
};

/** Every migration ratsnest ships, in order. */
export const MIGRATIONS: readonly Migration[] = [formatTwo];

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
