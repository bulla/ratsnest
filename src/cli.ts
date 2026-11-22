import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { version } from "../package.json";
import { type Checked, checkFile, problemLine } from "./check";
import { FORMAT, languagesOf } from "./fields";
import { init } from "./init";
import { LANGUAGES, type Language } from "./language";
import type { Orientation } from "./orientation";
import { PAGE_FILES } from "./page/files";
import { drawingFile, wiringPage } from "./page/page";
import { findProject, PROJECT_FILE, versionProblem } from "./project";
import { shownIn } from "./shown";
import { THEMES, type Theme } from "./theme";
import {
  assetOf,
  clearOld,
  fetchExecutable,
  install,
  isCompiled,
  latestVersion,
  stage,
  updateProject,
} from "./update";

/**
 * ratsnest's command-line tool (ADR 0014): `init`, `check`, `generate` and `update`. Written as a
 * function of its arguments, its folder and where it prints, so that the tests run it as a person
 * would.
 */

/** Where the command prints: what it made, and what went wrong. */
export interface Io {
  readonly out: (line: string) => void;
  readonly err: (line: string) => void;
}

/** The orientations ADR 0003 names, and the ones the engine draws so far. */
const ORIENTATIONS = ["0", "90", "180", "270"];

/** What `generate` makes (ADR 0031): the whole page, or the drawing alone. Each is its file's extension. */
const FORMATS = ["html", "svg"];

/**
 * The commands and the options each takes, with the values an option allows: part of ratsnest's
 * public surface, which every release snapshots (ADR 0017). A command or an option is read from here,
 * so the snapshot is what the command does.
 */
export const COMMANDS = {
  init: { arguments: "[<folder>]", options: {} },
  check: { arguments: "[<file or folder> ...]", options: {} },
  generate: {
    arguments: "<file>",
    options: {
      orientation: ORIENTATIONS,
      theme: [...THEMES],
      language: [...LANGUAGES],
      format: FORMATS,
      out: "<file>",
    },
  },
  update: { arguments: "", options: { version: "<version>", from: "<file>" } },
} as const;

const optionNames = (command: keyof typeof COMMANDS): string[] =>
  Object.keys(COMMANDS[command].options);

const DRAWN_ORIENTATIONS = ORIENTATIONS;

/** The themes ADR 0005 names, and the ones the engine draws so far. */

const DRAWN_THEMES = THEMES;

/** Where a project keeps its circuits, and where `generate` writes a page (ADR 0023). */
const CIRCUITS = "circuits";
const PAGES = "pages";

const HELP = `ratsnest ${version}: graphical wiring for breadboards.

Usage:
  ratsnest init [<folder>]
      Makes a circuits project in a folder, the current one by default: ${PROJECT_FILE}, the Circuit
      type in .ratsnest/, a tsconfig.json, circuits/, the circuit skill and ARTIFACTS.md.

  ratsnest check [<file or folder> ...]
      Checks circuit files: each file named, and every .ts file in each folder.
      With none, every circuit in the project's ${CIRCUITS}/.

  ratsnest generate <file> [--orientation 0] [--theme dark] [--language <language>] [--format html]
                  [--out <file>]
      Checks a circuit, then makes its page, or its drawing alone, written to
      ${PAGES}/<circuit>.<orientation>.<theme>.<language>.<format> unless --out says where.
      --orientation  0, 90, 180 or 270 degrees clockwise: the USB left, top, right or bottom
      --theme        dark or light
      --language     one of the circuit's languages; needed when it has more than one
      --format       html, the whole page, or svg, the drawing alone, to embed in other pages

  ratsnest update [--version <version>] [--from <file>]
      Moves the project to a newer ratsnest, the latest release by default: puts that version's
      executable in place of this one, then migrates every circuit to its format, replaces the
      Circuit type and the circuit skill, sets ${PROJECT_FILE}, and checks every circuit.
      --version  the release to move to
      --from     that release's executable, already fetched, rather than fetching it

  ratsnest --version
  ratsnest --help

A circuit file is written in format ${FORMAT}. Exit status: 0 when all is well, 1 when a circuit has a
problem, 2 when the command is used wrongly.`;

/**
 * A path as the command says it, with forward slashes on every system, as a person types it and as
 * Windows reads it too, so that a project's output reads the same wherever it is made.
 */
const slashed = (path: string): string => path.split(sep).join("/");

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
    .map((name) => `${path.replace(/[\\/]+$/, "")}/${name}`);
}

/** Prints a file's problems, if it has any. */
function report(checked: Checked, io: Io): void {
  for (const problem of checked.problems) io.err(problemLine(problem));
}

function check(args: readonly string[], cwd: string, io: Io): number {
  const { rest } = optionsOf(args, []);
  const project = findProject(cwd);
  const home = project ? relative(cwd, join(project.root, CIRCUITS)) || "." : CIRCUITS;
  const paths = rest.length > 0 ? rest : [home.split(sep).join("/")];
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
  const { values, rest } = optionsOf(args, optionNames("generate"));
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
  const format = choice(values.get("format"), "html", "format", FORMATS, FORMATS);

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
      `--language is a language ratsnest writes, ${LANGUAGES.slice(0, -1)
        .map((each) => `\`${each}\``)
        .join(", ")} or \`${LANGUAGES.at(-1)}\`, not \`${asked}\``,
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
  const name = basename(file).replace(/\.ts$/, "");
  const inputs = {
    circuit: name,
    language,
    orientation: Number(orientation) as Orientation,
    theme: theme as Theme,
  };
  // The page, or the drawing alone (ADR 0031), from the same four inputs.
  const made =
    format === "svg"
      ? drawingFile(shown.circuit, shown.layout, PAGE_FILES, inputs)
      : wiringPage(shown.circuit, shown.layout, PAGE_FILES, inputs);
  const out = resolve(
    cwd,
    values.get("out") ?? join(PAGES, `${name}.${orientation}.${theme}.${language}.${format}`),
  );
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, made);
  io.out(slashed(relative(cwd, out)));
  return 0;
}

function initialise(args: readonly string[], cwd: string, io: Io): number {
  const { rest } = optionsOf(args, []);
  if (rest.length > 1) throw new Usage("init makes one project, in one folder");
  const folder = resolve(cwd, rest[0] ?? ".");
  let written: string[];
  try {
    written = init(folder, version);
  } catch (error) {
    throw new Usage((error as Error).message);
  }
  for (const file of written) io.out(slashed(relative(cwd, join(folder, file))));
  io.out(
    `A circuits project for ratsnest ${version}: write circuits in circuits/, then \`ratsnest check\`.`,
  );
  return 0;
}

/** A release's version as the command takes it, `0.2.0` or `v0.2.0`. */
const releaseOf = (given: string): string => {
  const release = given.replace(/^v/, "");
  if (!/^\d+\.\d+\.\d+$/.test(release)) {
    throw new Usage(`--version is a release's version, such as \`0.2.0\`, not \`${given}\``);
  }
  return release;
};

/** What a staged executable says its version is, or that it is no ratsnest that runs here. */
function versionOfExecutable(file: string, shown: string): string {
  let said = "";
  try {
    const ran = Bun.spawnSync({ cmd: [file, "--version"], stdout: "pipe", stderr: "pipe" });
    if (ran.exitCode === 0) said = ran.stdout.toString().trim();
  } catch {
    // Not a program this system runs at all.
  }
  if (!/^\d+\.\d+\.\d+/.test(said)) throw new Usage(`${shown} is not a ratsnest that runs here`);
  return said;
}

/**
 * `ratsnest update` (ADR 0015, ADR 0016). A compiled ratsnest asked for a newer version puts that
 * version's executable in place of itself and runs it, as `update --version <it>`; the version
 * asked moves the project on. Run from its source, ratsnest is Bun, which is never replaced, and it
 * moves the project on to its own version alone. A project is never moved back, since a migration
 * goes forward only.
 */
async function update(args: readonly string[], cwd: string, io: Io): Promise<number> {
  const { values, rest } = optionsOf(args, optionNames("update"));
  if (rest.length > 0) throw new Usage("update moves the project it is run in, and takes no file");
  const project = findProject(cwd);
  if (!project) {
    throw new Usage(
      `update moves a circuits project, and this folder is in none: \`ratsnest init\` makes one`,
    );
  }
  const asked =
    values.get("version") === undefined ? undefined : releaseOf(values.get("version") ?? "");
  const from = values.get("from");
  const forward = (target: string): void => {
    if (Bun.semver.order(project.version, target) > 0) {
      throw new Usage(
        `the project expects ratsnest ${project.version}, newer than ${target}: a project is never moved back`,
      );
    }
  };

  if (!isCompiled()) {
    if (from !== undefined || (asked !== undefined && asked !== version)) {
      throw new Usage(
        `this ratsnest is run from its source, at ${version}, and moves a project to that version alone: check out another to move to it`,
      );
    }
    forward(version);
    return updateProject(project.root, io);
  }

  const current = process.execPath;
  const windows = process.platform === "win32";
  // What the last update renamed out of the way on Windows, which may still be running.
  if (windows) clearOld(current);
  let target = asked;
  let fresh: Uint8Array | undefined;
  // The executable as the person knows it: the file they gave, or the release's file.
  let shown = from ?? "";
  if (from !== undefined) {
    if (!statSync(resolve(cwd, from), { throwIfNoEntry: false })?.isFile()) {
      throw new Usage(`${from} is not a file`);
    }
    fresh = new Uint8Array(readFileSync(resolve(cwd, from)));
  } else if (target === undefined) {
    try {
      target = await latestVersion();
    } catch (error) {
      io.err(`ratsnest: ${(error as Error).message}`);
      return 1;
    }
    if (Bun.semver.order(target, version) < 0) target = version;
  }
  if (target === version && fresh === undefined) {
    forward(version);
    return updateProject(project.root, io);
  }
  if (target !== undefined && Bun.semver.order(target, version) < 0) {
    throw new Usage(
      `this ratsnest is ${version}, and ${target} is older: ratsnest is never moved back`,
    );
  }
  if (target !== undefined) forward(target);

  if (fresh === undefined) {
    const asset = assetOf(process.platform, process.arch);
    if (!asset) {
      io.err(
        `ratsnest: no release of ratsnest is built for ${process.platform} on ${process.arch}`,
      );
      return 1;
    }
    shown = `ratsnest ${target}'s ${asset}`;
    try {
      fresh = await fetchExecutable(target ?? version, asset);
    } catch (error) {
      io.err(`ratsnest: ${(error as Error).message}`);
      return 1;
    }
  }
  // Staged beside this one and run before it takes this one's place, so that an executable that
  // does not run here, or is not the version asked, replaces nothing.
  const incoming = stage(current, fresh);
  let staged: string;
  try {
    staged = versionOfExecutable(incoming, shown);
    if (target !== undefined && staged !== target) {
      throw new Usage(`${shown} is ratsnest ${staged}, not ${target}`);
    }
    if (Bun.semver.order(staged, version) < 0) {
      throw new Usage(
        `${shown} is ratsnest ${staged}, older than this one: ratsnest is never moved back`,
      );
    }
    forward(staged);
  } catch (error) {
    rmSync(incoming, { force: true });
    throw error;
  }
  install(current, incoming, windows);
  io.out(
    staged === version
      ? `ratsnest ${version} is put in place again, at ${slashed(current)}.`
      : `ratsnest ${version} is now ratsnest ${staged}, at ${slashed(current)}.`,
  );
  const ran = Bun.spawnSync({
    cmd: [current, "update", "--version", staged],
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  for (const line of ran.stdout.toString().split("\n").filter(Boolean)) io.out(line);
  for (const line of ran.stderr.toString().split("\n").filter(Boolean)) io.err(line);
  return ran.exitCode ?? 1;
}

/** Refuses to run in a project that expects another version of ratsnest (ADR 0016). */
function sameVersion(cwd: string): void {
  const project = findProject(cwd);
  const problem = project && versionProblem(version, project.version);
  if (problem) throw new Usage(problem);
}

/**
 * Runs the command with its arguments, from a folder, and says how it went as an exit status: at
 * once, or once `update` has fetched what it needs.
 */
export function main(args: readonly string[], cwd: string, io: Io): number | Promise<number> {
  const [command, ...rest] = args;
  const failed = (error: unknown): number => {
    if (!(error instanceof Usage)) throw error;
    io.err(`ratsnest: ${error.message}`);
    return 2;
  };
  try {
    switch (command) {
      case "init":
        return initialise(rest, cwd, io);
      case "check":
        sameVersion(cwd);
        return check(rest, cwd, io);
      case "generate":
        sameVersion(cwd);
        return generate(rest, cwd, io);
      // Exempt from the version check: moving the project on is what it is for.
      case "update":
        return update(rest, cwd, io).catch(failed);
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
        throw new Usage(
          `\`${command}\` is not a command: init, check, generate, update, --version or --help`,
        );
    }
  } catch (error) {
    return failed(error);
  }
}

if (import.meta.main) {
  const io: Io = { out: (line) => console.log(line), err: (line) => console.error(line) };
  Promise.resolve(main(process.argv.slice(2), process.cwd(), io)).then((code) => {
    process.exitCode = code;
  });
}
