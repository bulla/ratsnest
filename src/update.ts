import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { version } from "../package.json";
import { checkFile, problemLine } from "./check";
import { FORMAT } from "./fields";
import { CIRCUIT_SKILL, FORMAT_SOURCE } from "./init";
import { MIGRATIONS, type Migration, migrateSource } from "./migrate";
import { PROJECT_FILE } from "./project";

/**
 * `ratsnest update` (ADR 0015, ADR 0016), in two steps. A ratsnest asked for another version fetches
 * that version's executable for its system and puts it in place of itself, renaming itself first on
 * Windows, where a running file cannot be replaced; then it runs the new one, which, being the version
 * asked, moves the project on: every circuit migrated to its format, the type in `.ratsnest/` and the
 * `circuit` skill replaced, `ratsnest.json` set to it, and the checks run. ratsnest run from its source
 * is Bun running a file, and moves the project on to its own version alone.
 */

/** Where ratsnest is released. */
export const REPOSITORY = "bulla/ratsnest";

/** Whether this ratsnest is a compiled executable, rather than its source run by Bun. */
export const isCompiled = (main: string = Bun.main): boolean =>
  main.startsWith("/$bunfs/") || /^[A-Za-z]:[\\/]~BUN[\\/]/.test(main);

/** A release's executable for a system, as `bun run build` names it, or none for one ratsnest lacks. */
export function assetOf(platform: string, arch: string): string | undefined {
  const system = ({ linux: "linux", darwin: "darwin", win32: "windows" } as Record<string, string>)[
    platform
  ];
  const machine = ({ x64: "x64", arm64: "arm64" } as Record<string, string>)[arch];
  if (!system || !machine || (system === "windows" && machine !== "x64")) return undefined;
  return `ratsnest-${system}-${machine}${system === "windows" ? ".exe" : ""}`;
}

/** Where a release's executable is downloaded from. */
export const downloadUrlOf = (release: string, asset: string): string =>
  `https://github.com/${REPOSITORY}/releases/download/v${release}/${asset}`;

/** The latest release's version, as GitHub's API says it. */
export async function latestVersion(fetcher: typeof fetch = fetch): Promise<string> {
  const response = await fetcher(`https://api.github.com/repos/${REPOSITORY}/releases/latest`, {
    headers: { accept: "application/vnd.github+json" },
  });
  if (response.status === 404) throw new Error("ratsnest has no release yet");
  if (!response.ok)
    throw new Error(`GitHub answered ${response.status} when asked for ratsnest's latest release`);
  const tag = (await response.json()) as { tag_name?: string };
  if (!tag.tag_name) throw new Error("GitHub's latest release of ratsnest has no tag");
  return tag.tag_name.replace(/^v/, "");
}

/** The latest release's executable for a system, fetched from GitHub. */
export async function fetchExecutable(
  release: string,
  asset: string,
  fetcher: typeof fetch = fetch,
): Promise<Uint8Array> {
  const response = await fetcher(downloadUrlOf(release, asset));
  if (response.status === 404) throw new Error(`ratsnest ${release} has no ${asset} to fetch`);
  if (!response.ok) throw new Error(`GitHub answered ${response.status} when asked for ${asset}`);
  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Where a new executable waits beside the running one, and where the running one goes on Windows:
 * `ratsnest.new` and `ratsnest.old`, or `ratsnest.new.exe` and `ratsnest.old.exe`, which Windows
 * still runs as programs.
 */
export const besideOf = (current: string, what: "new" | "old"): string =>
  /\.exe$/i.test(current) ? current.replace(/\.exe$/i, `.${what}.exe`) : `${current}.${what}`;

/** Writes a new executable beside the running one, ready to run, and says where. */
export function stage(current: string, fresh: Uint8Array): string {
  const incoming = besideOf(current, "new");
  writeFileSync(incoming, fresh);
  chmodSync(incoming, 0o755);
  return incoming;
}

/**
 * Puts a staged executable in place of the running one. On Windows the running file cannot be
 * replaced while it runs, so it is renamed out of the way first, and the next update removes it.
 */
export function install(current: string, incoming: string, windows: boolean): void {
  if (windows) {
    const old = besideOf(current, "old");
    rmSync(old, { force: true });
    renameSync(current, old);
  }
  renameSync(incoming, current);
}

/** Where `update` says what it did. */
export interface Said {
  readonly out: (line: string) => void;
  readonly err: (line: string) => void;
}

/**
 * Moves a project on to this ratsnest (ADR 0015): every circuit migrated to its format, the type and
 * the skill replaced, `ratsnest.json` set, and every circuit checked. Says what a person has to
 * decide, and gives 0 only when nothing is left to do.
 */
export function updateProject(
  root: string,
  io: Said,
  migrations: readonly Migration[] = MIGRATIONS,
): number {
  const needing = new Set<string>();
  const undecided = new Set<string>();
  const circuits = join(root, "circuits");
  const files = (existsSync(circuits) ? readdirSync(circuits, { withFileTypes: true }) : [])
    .filter(
      (entry) => entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts"),
    )
    .map((entry) => `circuits/${entry.name}`)
    .sort();
  for (const file of files) {
    const path = join(root, file);
    const outcome = migrateSource(readFileSync(path, "utf8"), file, migrations);
    if (outcome.kind === "migrated") {
      writeFileSync(path, outcome.source);
      io.out(`${file}: moved to format ${FORMAT}: ${outcome.says.join("; ")}`);
    } else if (outcome.kind === "undecided") {
      needing.add(file);
      undecided.add(file);
      io.err(`${file}: left as it was, until a person decides ${outcome.choices.join(", and ")}`);
    } else if (outcome.kind === "refused") {
      needing.add(file);
      io.err(`${file}: left as it was, since ${outcome.why}`);
    }
  }
  mkdirSync(join(root, ".ratsnest"), { recursive: true });
  writeFileSync(join(root, ".ratsnest", "ratsnest.d.ts"), FORMAT_SOURCE);
  mkdirSync(join(root, ".claude", "skills", "circuit"), { recursive: true });
  writeFileSync(join(root, ".claude", "skills", "circuit", "SKILL.md"), CIRCUIT_SKILL);
  writeFileSync(join(root, PROJECT_FILE), `${JSON.stringify({ ratsnest: version }, null, 2)}\n`);
  io.out(
    `The project expects ratsnest ${version}, and has its Circuit type and its circuit skill.`,
  );
  // A file left for a person to decide is still in its old format, which the check would only refuse.
  for (const file of files.filter((each) => !undecided.has(each))) {
    const checked = checkFile(join(root, file), file);
    for (const problem of checked.problems) io.err(problemLine(problem));
    if (checked.problems.length > 0) needing.add(file);
  }
  const count = (n: number) => `${n} circuit${n === 1 ? "" : "s"}`;
  if (needing.size > 0) {
    io.err(
      `${count(needing.size)} of ${files.length} need${needing.size === 1 ? "s" : ""} a person.`,
    );
    return 1;
  }
  io.out(`${count(files.length)} checked: all well.`);
  return 0;
}
