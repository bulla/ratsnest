import { describe, expect, it } from "bun:test";
import { moveUnreleased, sectionOf, tagProblem } from "./release";
import {
  allowedVersions,
  bumpOf,
  FIRST_VERSION,
  nextVersion,
  type Surface,
  surfaceOf,
} from "./surface";

const base: Surface = {
  format: ["1"],
  "type Language": ["en", "fr"],
  "Circuit.name": ["required Text"],
  "command generate --theme": ["dark", "light"],
};

describe("the public surface (ADR 0017)", () => {
  it("holds the format, its types, the commands' options and ratsnest.json", () => {
    const surface = surfaceOf();
    expect(surface.format).toEqual(["2"]);
    expect(surface["Circuit.credit"]).toEqual(["required Text"]);
    expect(surface["type Language"]).toEqual(["en", "fr", "ru"]);
    expect(surface["type Part"]).toContain("RingPart");
    expect(surface["Circuit.leds"]).toEqual(["optional readonly Led[]"]);
    expect(surface["command generate --orientation"]).toEqual(["0", "90", "180", "270"]);
    expect(surface["ratsnest.json"]).toEqual(["ratsnest"]);
  });
});

describe("the least bump", () => {
  it("is major when the format rises, or anything is removed or changed", () => {
    expect(bumpOf(base, { ...base, format: ["2"] })).toBe("major");
    const { "command generate --theme": _, ...removed } = base;
    expect(bumpOf(base, removed)).toBe("major");
    expect(bumpOf(base, { ...base, "type Language": ["en"] })).toBe("major");
    expect(bumpOf(base, { ...base, "Circuit.name": ["optional Text"] })).toBe("major");
  });

  it("is major for a required field added to a type a file already declares", () => {
    expect(bumpOf(base, { ...base, "Circuit.author": ["required Text"] })).toBe("major");
  });

  it("is minor when the surface only gained", () => {
    expect(bumpOf(base, { ...base, "type Language": ["en", "fr", "ru"] })).toBe("minor");
    expect(bumpOf(base, { ...base, "Circuit.author": ["optional Text"] })).toBe("minor");
    expect(bumpOf(base, { ...base, "command update": ["[<version>]"] })).toBe("minor");
  });

  it("is patch when nothing on it changed", () => {
    expect(bumpOf(base, { ...base })).toBe("patch");
  });
});

describe("the next version (ADR 0017, ADR 0021)", () => {
  it("raises y for what would be major, and z for anything else, until 1.0.0", () => {
    expect(nextVersion("0.1.0", "major")).toBe("0.2.0");
    expect(nextVersion("0.1.0", "minor")).toBe("0.1.1");
    expect(nextVersion("0.1.3", "patch")).toBe("0.1.4");
  });

  it("follows SemVer from 1.0.0 on", () => {
    expect(nextVersion("1.2.3", "major")).toBe("2.0.0");
    expect(nextVersion("1.2.3", "minor")).toBe("1.3.0");
    expect(nextVersion("1.2.3", "patch")).toBe("1.2.4");
  });

  it("allows a higher bump than the least, never a lower one, and never skips", () => {
    expect(allowedVersions("1.2.3", "minor")).toEqual(["1.3.0", "2.0.0"]);
    expect(allowedVersions("0.1.0", "patch")).toEqual(["0.1.1", "0.2.0"]);
  });
});

describe("the changelog at a release", () => {
  const changelog =
    "# Changelog\n\n## [Unreleased]\n\n### Added\n\n- A thing.\n\n## [0.1.0] - 2026-11-01\n\n- Old.\n";

  it("moves Unreleased under the version and the date, and leaves Unreleased empty", () => {
    expect(moveUnreleased(changelog, "0.1.1", "2026-11-21")).toBe(
      "# Changelog\n\n## [Unreleased]\n\n## [0.1.1] - 2026-11-21\n\n### Added\n\n- A thing.\n\n## [0.1.0] - 2026-11-01\n\n- Old.\n",
    );
  });

  it("refuses with nothing under Unreleased", () => {
    expect(() => moveUnreleased("## [Unreleased]\n\n## [0.1.0]\n", "0.1.1", "x")).toThrow(
      "nothing is under Unreleased",
    );
  });

  it("gives a version's own section for its GitHub Release", () => {
    expect(sectionOf(moveUnreleased(changelog, "0.1.1", "2026-11-21"), "0.1.1")).toBe(
      "### Added\n\n- A thing.",
    );
  });
});

describe("a pushed tag (ADR 0020)", () => {
  const ok = { tag: "v0.1.1", version: "0.1.1", snapshot: base, surface: base };

  it("is the version, with the surface as its snapshot", () => {
    expect(
      tagProblem({ ...ok, tag: "v0.1.2", previous: { version: "0.1.0", snapshot: base } }),
    ).toBe("the tag v0.1.2 is not the version, 0.1.1");
    expect(
      tagProblem({
        ...ok,
        surface: { ...base, format: ["2"] },
        previous: { version: "0.1.0", snapshot: base },
      }),
    ).toStartWith("api/surface.json is not the surface");
  });

  it("is 0.1.0 when it is the first", () => {
    expect(tagProblem({ ...ok, tag: `v${FIRST_VERSION}`, version: FIRST_VERSION })).toBeUndefined();
    expect(tagProblem(ok)).toBe("the first release is 0.1.0, not 0.1.1");
  });

  it("is a version the rule allows after the previous one", () => {
    expect(tagProblem({ ...ok, previous: { version: "0.1.0", snapshot: base } })).toBeUndefined();
    const smaller = { ...base, "type Language": ["en"] };
    expect(
      tagProblem({
        ...ok,
        previous: { version: "0.1.0", snapshot: base },
        snapshot: smaller,
        surface: smaller,
      }),
    ).toBe(
      "after 0.1.0, whose surface this one changes by at least a major bump, the release is 0.2.0, not 0.1.1",
    );
  });
});
