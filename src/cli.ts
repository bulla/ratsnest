import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { version } from "../package.json";
import { type Checked, checkFile, problemLine } from "./check";
import { FORMAT, languagesOf } from "./fields";
import { LANGUAGES, type Language } from "./language";
import { PAGE_FILES } from "./page/files";
import { wiringPage } from "./page/page";
import { shownIn } from "./shown";

/**
 * ratsnest's command-line tool (ADR 0014): `check` and `generate` for now, `init` and `update` to
 * come. Written as a function of its arguments, its folder and where it prints, so that the tests
 * run it as a person would.
 */

/** Where the command prints: what it made, and what went wrong. */
export interface Io {
  readonly out: (line: string) => void;
  readonly err: (line: string) => void;
}

/** The orientations ADR 0003 names, and the ones the engine draws so far. */
const ORIENTATIONS = ["0", "90", "180", "270"];
const DRAWN_ORIENTATIONS = ["0"];

/** The themes ADR 0005 names, and the ones the engine draws so far. */
const THEMES = ["dark", "light"];
const DRAWN_THEMES = ["dark"];

/** Where a project keeps its circuits, and where `generate` writes a page (ADR 0023). */
const CIRCUITS = "circuits";
const PAGES = "pages";

const HELP = `ratsnest ${version}: graphical wiring for breadboards.

Usage:
  ratsnest check [<file or folder> ...]
      Checks circuit files: each file named, and every .ts file in each folder.
      With none, every circuit in ${CIRCUITS}/.

  ratsnest generate <file> [--orientation 0] [--theme dark] [--language <language>] [--out <file>]
      Checks a circuit, then makes its page, written to
      ${PAGES}/<circuit>.<orientation>.<theme>.<language>.html unless --out says where.
      --orientation  0, 90, 180 or 270 degrees clockwise: the USB left, top, right or bottom
      --theme        dark or light
      --language     one of the circuit's languages; needed when it has more than one

  ratsnest --version
  ratsnest --help

A circuit file is written in format ${FORMAT}. Exit status: 0 when all is well, 1 when a circuit has a
problem, 2 when the command is used wrongly.`;

/** A usage mistake: what was wrong, said once, with exit status 2. */
class Usage extends Error {}

/** The options after a command: `--name value` pairs, and the rest in order. */
function optionsOf(
  args: readonly string[],
  names: readonly string[],
): { values: Map<string, string>; rest: string[] } {
  const values = new Map<string, string>();
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] ?? "";
    if (!arg.startsWith("--")) {
      rest.push(arg);
      continue;
    }
    const [name, inline] = arg.slice(2).split(/=(.*)/s, 2);
    if (!name || !names.includes(name)) {
      throw new Usage(
        `\`${arg}\` is not an option here: ${names.map((each) => `--${each}`).join(", ")}`,
      );
    }
    const value = inline ?? args[++i];
    if (value === undefined || value.startsWith("--")) throw new Usage(`--${name} needs a value`);
    if (values.has(name)) throw new Usage(`--${name} is given twice`);
    values.set(name, value);
  }
  return { values, rest };
}

/** The circuit files a path names, as given: itself, or every `.ts` file in it, in order. */
function filesIn(path: string, cwd: string): string[] {
  const stat = statSync(resolve(cwd, path), { throwIfNoEntry: false });
  if (!stat) throw new Usage(`${path} does not exist`);
  if (!stat.isDirectory()) return [path];
  return readdirSync(resolve(cwd, path))
    .filter((name) => name.endsWith(".ts") && !name.endsWith(".d.ts"))
    .sort()
    .map((name) => join(path, name));
}

/** Prints a file's problems, if it has any. */
function report(checked: Checked, io: Io): void {
  for (const problem of checked.problems) io.err(problemLine(problem));
}

function check(args: readonly string[], cwd: string, io: Io): number {
  const { rest } = optionsOf(args, []);
  const paths = rest.length > 0 ? rest : [CIRCUITS];
  const files = paths.flatMap((path) => {
    const files = filesIn(path, cwd);
    if (files.length === 0) throw new Usage(`${path} holds no circuit file`);
    return files;
  });
  let failed = 0;
  for (const file of files) {
    const checked = checkFile(resolve(cwd, file), file);
    report(checked, io);
    if (checked.problems.length > 0) failed += 1;
  }
  const count = (n: number) => `${n} circuit${n === 1 ? "" : "s"}`;
  if (failed > 0) {
    io.err(`${count(failed)} of ${files.length} with problems.`);
    return 1;
  }
  io.out(`${count(files.length)} checked: all well.`);
  return 0;
}

/** An option's value, from the values it may take and the ones drawn so far. */
function choice(
  given: string | undefined,
  fallback: string,
  option: string,
  values: readonly string[],
  drawn: readonly string[],
): string {
  const value = given ?? fallback;
  if (!values.includes(value)) {
    throw new Usage(
      `--${option} is ${values.map((each) => `\`${each}\``).join(", ")}, not \`${value}\``,
    );
  }
  if (!drawn.includes(value)) {
    throw new Usage(
      `--${option} \`${value}\` is not drawn yet: so far ratsnest draws ${drawn.map((each) => `\`${each}\``).join(", ")}`,
    );
  }
  return value;
}

function generate(args: readonly string[], cwd: string, io: Io): number {
  const { values, rest } = optionsOf(args, ["orientation", "theme", "language", "out"]);
  const [file, ...more] = rest;
  if (!file) throw new Usage("generate needs the circuit file to make a page of");
  if (more.length > 0) throw new Usage("generate makes one page at a time, from one circuit file");
  const orientation = choice(
    values.get("orientation"),
    "0",
    "orientation",
    ORIENTATIONS,
    DRAWN_ORIENTATIONS,
  );
  const theme = choice(values.get("theme"), "dark", "theme", THEMES, DRAWN_THEMES);

  // The circuit is checked before anything is drawn, and refused whole if anything is wrong.
  const checked = checkFile(resolve(cwd, file), file);
  report(checked, io);
  const circuit = checked.circuit;
  if (!circuit) return 1;

  // A page is made only in a language its circuit has (ADR 0010).
  const has = languagesOf(circuit);
  const asked = values.get("language");
  const written = has.map((each) => `\`${each}\``).join(" and ");
  if (asked !== undefined && !(LANGUAGES as readonly string[]).includes(asked)) {
    throw new Usage(
      `--language is a language ratsnest writes, ${LANGUAGES.map((each) => `\`${each}\``).join(" or ")}, not \`${asked}\``,
    );
  }
  if (asked !== undefined && !has.includes(asked as Language)) {
    io.err(
      `${file} is written in ${written}, not \`${asked}\`: its page is made only in one of those`,
    );
    return 1;
  }
  const language = (asked as Language | undefined) ?? (has.length === 1 ? has[0] : undefined);
  if (!language) throw new Usage(`${file} is written in ${written}: say which with --language`);

  const shown = shownIn(circuit, language);
  const html = wiringPage(shown.circuit, shown.layout, PAGE_FILES, language);
  const name = basename(file).replace(/\.ts$/, "");
  const out = resolve(
    cwd,
    values.get("out") ?? join(PAGES, `${name}.${orientation}.${theme}.${language}.html`),
  );
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  io.out(relative(cwd, out));
  return 0;
}

/** Runs the command with its arguments, from a folder, and says how it went as an exit status. */
export function main(args: readonly string[], cwd: string, io: Io): number {
  const [command, ...rest] = args;
  try {
    switch (command) {
      case "check":
        return check(rest, cwd, io);
      case "generate":
        return generate(rest, cwd, io);
      case "--version":
      case "-v":
        io.out(version);
        return 0;
      case "--help":
      case "-h":
      case "help":
        io.out(HELP);
        return 0;
      case undefined:
        io.err(HELP);
        return 2;
      default:
        throw new Usage(`\`${command}\` is not a command: check, generate, --version or --help`);
    }
  } catch (error) {
    if (!(error instanceof Usage)) throw error;
    io.err(`ratsnest: ${error.message}`);
    return 2;
  }
}

if (import.meta.main) {
  process.exitCode = main(process.argv.slice(2), process.cwd(), {
    out: (line) => console.log(line),
    err: (line) => console.error(line),
  });
}
