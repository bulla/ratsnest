/**
 * `bun run release [patch|minor|major]`: the only way to make a release (ADR 0017). It computes the
 * version against the last release's snapshot in `api/`, which a higher bump may be asked for but
 * never a lower one, moves the changelog's _Unreleased_ under it with the date, sets the version,
 * writes the new snapshot, commits and tags. It refuses with uncommitted changes, anywhere but on
 * `develop`, or with nothing under _Unreleased_. Pushing the commit and its tag is the owner's.
 *
 * `bun scripts/release.ts --check v0.1.0` is what continuous integration runs on a pushed tag: the
 * tag is the version, the snapshot is the surface, and the version is one the rule allows after the
 * previous release (ADR 0020).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";
import {
  allowedVersions,
  atLeast,
  type Bump,
  bumpOf,
  FIRST_VERSION,
  nextVersion,
  type Surface,
  surfaceOf,
} from "./surface";

const ROOT = join(import.meta.dir, "..");
const SNAPSHOT = join(ROOT, "api", "surface.json");
const UNRELEASED = "## [Unreleased]";

/** The changelog with its _Unreleased_ section moved under a version and a date, which it must have. */
export function moveUnreleased(changelog: string, version: string, date: string): string {
  const start = changelog.indexOf(UNRELEASED);
  if (start < 0) throw new Error("CHANGELOG.md has no Unreleased section");
  const body = changelog.indexOf("\n", start) + 1;
  const next = changelog.indexOf("\n## [", body);
  const end = next < 0 ? changelog.length : next + 1;
  const entries = changelog.slice(body, end).trim();
  if (!entries)
    throw new Error("nothing is under Unreleased in CHANGELOG.md: there is nothing to release");
  return `${changelog.slice(0, start)}${UNRELEASED}\n\n## [${version}] - ${date}\n\n${entries}\n${next < 0 ? "" : "\n"}${changelog.slice(end)}`;
}

/** A version's own section of the changelog, for its GitHub Release. */
export function sectionOf(changelog: string, version: string): string {
  const header = `## [${version}]`;
  const start = changelog.indexOf(header);
  if (start < 0) throw new Error(`CHANGELOG.md has no section for ${version}`);
  const body = changelog.indexOf("\n", start) + 1;
  const next = changelog.indexOf("\n## [", body);
  return changelog.slice(body, next < 0 ? changelog.length : next).trim();
}

/**
 * Whether a tagged version meets the rule (ADR 0017): the first release is 0.1.0 (ADR 0021), and any
 * other is one of the versions right after the previous, for a bump at least the least one.
 */
export function tagProblem(input: {
  tag: string;
  version: string;
  snapshot: Surface;
  surface: Surface;
  previous?: { version: string; snapshot: Surface };
}): string | undefined {
  if (input.tag !== `v${input.version}`) {
    return `the tag ${input.tag} is not the version, ${input.version}`;
  }
  if (JSON.stringify(input.snapshot) !== JSON.stringify(input.surface)) {
    return "api/surface.json is not the surface this commit has: a release is made by `bun run release` alone";
  }
  if (!input.previous) {
    return input.version === FIRST_VERSION
      ? undefined
      : `the first release is ${FIRST_VERSION}, not ${input.version}`;
  }
  const least = bumpOf(input.previous.snapshot, input.surface);
  const allowed = allowedVersions(input.previous.version, least);
  return allowed.includes(input.version)
    ? undefined
    : `after ${input.previous.version}, whose surface this one changes by at least a ${least} bump, the release is ${allowed.join(" or ")}, not ${input.version}`;
}

const manifestOf = () => JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const fail = (message: string): never => {
  console.error(`release: ${message}`);
  process.exit(1);
};

async function release(asked: Bump | undefined): Promise<void> {
  if ((await $`git status --porcelain`.cwd(ROOT).text()).trim())
    fail("there are uncommitted changes");
  const branch = (await $`git rev-parse --abbrev-ref HEAD`.cwd(ROOT).text()).trim();
  if (branch !== "develop") fail(`a release is made on develop, not ${branch}`);

  const manifest = manifestOf();
  const surface = surfaceOf();
  let version: string;
  if (!existsSync(SNAPSHOT)) {
    version = FIRST_VERSION;
  } else {
    const least = bumpOf(JSON.parse(readFileSync(SNAPSHOT, "utf8")), surface);
    const bump = asked ?? least;
    if (!atLeast(bump, least))
      fail(`the surface changed by at least a ${least} bump, more than a ${bump}`);
    version = nextVersion(manifest.version, bump);
  }

  const changelog = join(ROOT, "CHANGELOG.md");
  const date = new Date().toISOString().slice(0, 10);
  let moved = "";
  try {
    moved = moveUnreleased(readFileSync(changelog, "utf8"), version, date);
  } catch (error) {
    fail((error as Error).message);
  }
  writeFileSync(changelog, moved);
  writeFileSync(
    join(ROOT, "package.json"),
    `${JSON.stringify({ ...manifest, version }, null, 2)}\n`,
  );
  mkdirSync(join(ROOT, "api"), { recursive: true });
  writeFileSync(SNAPSHOT, `${JSON.stringify(surface, null, 2)}\n`);
  await $`git add CHANGELOG.md package.json api/surface.json`.cwd(ROOT);
  await $`git commit -m ${`Release ${version}`}`.cwd(ROOT).quiet();
  await $`git tag -a ${`v${version}`} -m ${`ratsnest ${version}`}`.cwd(ROOT);
  console.log(
    `ratsnest ${version}, committed and tagged v${version}. Push both: git push origin develop v${version}`,
  );
}

async function check(tag: string): Promise<void> {
  const version = manifestOf().version;
  if (!existsSync(SNAPSHOT))
    fail("there is no api/surface.json: a release is made by `bun run release` alone");
  const snapshot = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  const before = await $`git describe --tags --abbrev=0 --match ${"v*"} ${`${tag}^`}`
    .cwd(ROOT)
    .nothrow()
    .quiet();
  let previous: { version: string; snapshot: Surface } | undefined;
  if (before.exitCode === 0) {
    const previousTag = before.text().trim();
    const old = await $`git show ${`${previousTag}:api/surface.json`}`.cwd(ROOT).text();
    previous = { version: previousTag.slice(1), snapshot: JSON.parse(old) };
  }
  const problem = tagProblem({ tag, version, snapshot, surface: surfaceOf(), previous });
  if (problem) fail(problem);
  // The version's section of the changelog, which its GitHub Release is written with.
  mkdirSync(join(ROOT, "dist"), { recursive: true });
  writeFileSync(
    join(ROOT, "dist", "notes.md"),
    `${sectionOf(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8"), version)}\n`,
  );
  console.log(`${tag} meets the rule.`);
}

if (import.meta.main) {
  const [first, second] = process.argv.slice(2);
  if (first === "--check") await check(second ?? fail("--check needs the tag"));
  else if (first === undefined || first === "patch" || first === "minor" || first === "major")
    await release(first);
  else fail(`a release is a patch, a minor or a major one, not ${first}`);
}
