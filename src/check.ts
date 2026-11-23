import { readFileSync } from "node:fs";
import { isSupplied } from "./circuit";
import { crowdingProblems } from "./drawing/breadboard-svg";
import { fieldProblems, languagesOf } from "./fields";
import type { Circuit } from "./format";
import { wiringProblems } from "./netlist";
import { ORIENTATIONS } from "./orientation";
import { PAGE_WORDS } from "./page/page";
import { type Problem, readCircuit } from "./read";
import { shownIn } from "./shown";

/**
 * Every check a circuit file is held to, in order, each only once the one before has passed: the
 * declarative check as it is read (ADR 0007), its format, fields, languages and words (ADR 0015,
 * ADR 0016, ADR 0010, ADR 0006), then its wiring and what crowds at any quarter turn (ADR 0003,
 * ADR 0007). What `ratsnest check` runs, and what
 * `ratsnest generate` runs before it draws anything.
 */

/** A file checked: the circuit it declares when every check passed, and what is wrong otherwise. */
export interface Checked {
  readonly circuit?: Circuit;
  readonly problems: readonly Problem[];
}

/** Checks a circuit file's source, named `file` in what it says. */
export function checkSource(source: string, file: string): Checked {
  const read = readCircuit(source, file);
  if (read.problems.length > 0) return { problems: read.problems };

  const fields = fieldProblems(read.data);
  if (fields.length > 0) {
    return {
      problems: fields.map(({ path, message }) => {
        const at = read.at(path);
        const said = `${path || "the circuit"} ${message}`;
        return at ? { file, at, message: said } : { file, message: said };
      }),
    };
  }

  // The wiring means the same in every language, so it is checked in the circuit's first.
  const circuit = read.data as Circuit;
  const [language] = languagesOf(circuit);
  if (!language) throw new Error("A circuit with no language passed the checks");
  const shown = shownIn(circuit, language);
  const wiring = wiringProblems(shown.circuit, shown.layout);
  if (wiring.length > 0) return { problems: wiring.map((message) => ({ file, message })) };

  // Every word the engine places, clear at every quarter turn the page can be drawn at (ADR 0003),
  // in every language the circuit has, since a value is as wide as its language writes it (ADR 0011).
  const parts = circuit.steps.flatMap((step) => step.parts);
  // A problem met in some of the circuit's languages only says which.
  const languages = languagesOf(circuit);
  const met = new Map<string, Set<string>>();
  for (const each of languages) {
    for (const orientation of ORIENTATIONS) {
      for (const problem of crowdingProblems(
        parts,
        orientation,
        PAGE_WORDS[each].ohms,
        !isSupplied(circuit),
      )) {
        const key = `${orientation}°|${problem}`;
        met.set(key, (met.get(key) ?? new Set()).add(each));
      }
    }
  }
  const crowding = [...met].map(([key, inWhich]) => {
    const [orientation, problem] = key.split("|");
    const where =
      inWhich.size === languages.length
        ? ""
        : ` in ${[...inWhich].map((each) => `\`${each}\``).join(" and ")}`;
    return `at ${orientation}${where}, ${problem}`;
  });
  if (crowding.length > 0) return { problems: crowding.map((message) => ({ file, message })) };

  return { circuit, problems: [] };
}

/** Checks a circuit file on disk, named `file` in what it says: the path as a person gave it. */
export function checkFile(path: string, file = path): Checked {
  let source: string;
  try {
    source = readFileSync(path, "utf8");
  } catch {
    return { problems: [{ file, message: "cannot be read" }] };
  }
  return checkSource(source, file);
}

/** A problem as a line, the way a compiler says one: `file:line:column: message`. */
export const problemLine = ({ file, at, message }: Problem): string =>
  `${file}${at ? `:${at.line}:${at.column}` : ""}: ${message}`;
