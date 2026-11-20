/**
 * The pull request check of ADR 0017 and ADR 0020: a change users get needs its line under
 * *Unreleased* in `CHANGELOG.md`. Continuous integration runs it as `bun scripts/changelog.ts <base>`,
 * against the branch the pull request goes into, and does not run it at all for a pull request
 * labelled `no changelog`.
 */
import { $ } from "bun";

/** What users get: `src/` but its tests, the font, the `circuit` skill and the installer. */
export function reachesUsers(path: string): boolean {
  if (path.startsWith("src/")) {
    return !/\.test\.tsx?$/.test(path) && !path.includes("/__fixtures__/");
  }
  return (
    path.startsWith("fonts/") || path.startsWith(".claude/skills/circuit/") || path === "install.sh"
  );
}

/** The entries under `## [Unreleased]`, up to the next release's heading: its list items only. */
export function unreleased(changelog: string): string[] {
  const lines = changelog.split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith("## [Unreleased]"));
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return (end === -1 ? rest : rest.slice(0, end))
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- ") || line.startsWith("* "));
}

/** Whether `after` says something under *Unreleased* that `before` did not. */
export function gainedAnEntry(before: string, after: string): boolean {
  const had = new Set(unreleased(before));
  return unreleased(after).some((entry) => !had.has(entry));
}

if (import.meta.main) {
  const base = process.argv[2];
  if (!base) {
    console.error("Usage: bun scripts/changelog.ts <base>, the branch the pull request goes into");
    process.exit(2);
  }
  const changed = (await $`git diff --name-only ${base}...HEAD`.text()).split("\n").filter(Boolean);
  const reaching = changed.filter(reachesUsers);
  if (reaching.length === 0) {
    console.log("Nothing users get has changed, so no changelog entry is needed.");
    process.exit(0);
  }
  const before = await $`git show ${`${base}:CHANGELOG.md`}`.nothrow().quiet().text();
  const after = await Bun.file("CHANGELOG.md").text();
  if (gainedAnEntry(before, after)) {
    console.log("CHANGELOG.md has a new entry under Unreleased.");
    process.exit(0);
  }
  console.error(
    [
      "These change what users get, and CHANGELOG.md has no new entry under Unreleased:",
      ...reaching.map((path) => `  ${path}`),
      "Add one, or label the pull request `no changelog` if no user can see the change.",
    ].join("\n"),
  );
  process.exit(1);
}
