import { describe, expect, test } from "bun:test";
import { gainedAnEntry, reachesUsers, unreleased } from "./changelog";

describe("what reaches users", () => {
  test("the engine and the tool do, their tests and fixtures do not", () => {
    expect(reachesUsers("src/drawing/board.ts")).toBe(true);
    expect(reachesUsers("src/drawing/board.test.ts")).toBe(false);
    expect(reachesUsers("src/cli/__fixtures__/circuit.ts")).toBe(false);
  });

  test("the font, the circuit skill and the installer do", () => {
    expect(reachesUsers("fonts/nunito-latin.woff2")).toBe(true);
    expect(reachesUsers(".claude/skills/circuit/SKILL.md")).toBe(true);
    expect(reachesUsers("install.sh")).toBe(true);
  });

  test("the records, the examples, the other skills and the frame do not", () => {
    expect(reachesUsers("doc/adr/0021-keep-versions.md")).toBe(false);
    expect(reachesUsers("examples/red-green-leds.ts")).toBe(false);
    expect(reachesUsers(".claude/skills/setup/SKILL.md")).toBe(false);
    expect(reachesUsers("package.json")).toBe(false);
  });
});

const BEFORE = `# Changelog

## [Unreleased]

### Added

- The Light ring

## [0.1.0] - 2026-12-01

- The first release
`;

describe("the Unreleased section", () => {
  test("holds its list items, and stops at the next release", () => {
    expect(unreleased(BEFORE)).toEqual(["- The Light ring"]);
  });

  test("is empty when the changelog has none", () => {
    expect(unreleased("# Changelog\n")).toEqual([]);
  });

  test("gains an entry only from a new list item", () => {
    const added = BEFORE.replace("- The Light ring", "- The Light ring\n- A buzzer");
    expect(gainedAnEntry(BEFORE, added)).toBe(true);
    expect(gainedAnEntry(BEFORE, BEFORE)).toBe(false);
    expect(gainedAnEntry(BEFORE, BEFORE.replace("### Added", "### Added\n\n### Fixed"))).toBe(
      false,
    );
  });

  test("does not count an entry under a release as unreleased", () => {
    const released = BEFORE.replace("- The first release", "- The first release\n- Pages");
    expect(gainedAnEntry(BEFORE, released)).toBe(false);
  });

  test("reads a file written with CRLF endings the same", () => {
    expect(unreleased(BEFORE.replaceAll("\n", "\r\n"))).toEqual(["- The Light ring"]);
  });
});
