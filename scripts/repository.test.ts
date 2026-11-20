import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pkg from "../package.json" with { type: "json" };

/** SemVer 2.0.0's own regular expression, as semver.org gives it (ADR 0017). */
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const ROOT = join(import.meta.dir, "..");

describe("the repository's own rules", () => {
  test("its version is strict SemVer 2.0.0 (ADR 0017)", () => {
    expect(pkg.version).toMatch(SEMVER);
  });

  test("every dependency is pinned exactly, with no range (ADR 0009)", () => {
    const pinned = { ...pkg.dependencies, ...pkg.devDependencies };
    const loose = Object.entries(pinned).filter(([, version]) => !SEMVER.test(version));
    expect(loose).toEqual([]);
  });

  test("Bun is the package manager, pinned exactly, and the one running (ADR 0009)", () => {
    const [manager, version = ""] = pkg.packageManager.split("@");
    expect(manager).toBe("bun");
    expect(version).toMatch(SEMVER);
    expect(Bun.version).toBe(version);
  });

  test("no workflow sets up Node (ADR 0009, ADR 0020)", () => {
    const folder = join(ROOT, ".github", "workflows");
    const workflows = readdirSync(folder).filter((name) => /\.ya?ml$/.test(name));
    expect(workflows.length).toBeGreaterThan(0);
    for (const name of workflows) {
      expect(readFileSync(join(folder, name), "utf8")).not.toContain("setup-node");
    }
  });
});
