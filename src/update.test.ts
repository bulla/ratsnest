import { afterEach, describe, expect, it } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { version } from "../package.json";
import { executableOf, TARGETS } from "../scripts/build";
import { FIXTURES } from "./__fixtures__/circuits";
import { fileOf, sourceOf } from "./__fixtures__/files";
import { main } from "./cli";
import { CIRCUIT_SKILL, FORMAT_SOURCE } from "./init";
import type { Migration } from "./migrate";
import {
  assetOf,
  besideOf,
  downloadUrlOf,
  fetchExecutable,
  install,
  isCompiled,
  latestVersion,
  stage,
  updateProject,
} from "./update";

const made: string[] = [];

afterEach(() => {
  for (const folder of made.splice(0)) rmSync(folder, { recursive: true, force: true });
});

const folderOf = (): string => {
  const folder = mkdtempSync(join(tmpdir(), "ratsnest-update-"));
  made.push(folder);
  return folder;
};

const LIGHTS = fileOf(FIXTURES["two-lights"]);

/**
 * A project made by an older ratsnest: its version, a stale type and skill, and the circuit files
 * given, in `circuits/`.
 */
function olderProject(circuits: Record<string, unknown>, expected = "0.0.0-alpha"): string {
  const folder = folderOf();
  writeFileSync(join(folder, "ratsnest.json"), JSON.stringify({ ratsnest: expected }));
  mkdirSync(join(folder, ".ratsnest"));
  writeFileSync(join(folder, ".ratsnest", "ratsnest.d.ts"), "// an older format");
  mkdirSync(join(folder, ".claude", "skills", "circuit"), { recursive: true });
  writeFileSync(join(folder, ".claude", "skills", "circuit", "SKILL.md"), "an older skill");
  mkdirSync(join(folder, "circuits"));
  for (const [name, data] of Object.entries(circuits)) {
    writeFileSync(join(folder, "circuits", name), sourceOf(data));
  }
  return folder;
}

/** What `update` said, line by line. */
function listening() {
  const out: string[] = [];
  const err: string[] = [];
  return {
    out,
    err,
    io: { out: (line: string) => out.push(line), err: (line: string) => err.push(line) },
  };
}

/** A format 0 made for the test, whose `scriptSays` format 1 calls `scriptDoes`. */
const { scriptDoes, ...rest } = LIGHTS;
const FORMAT_ZERO = { ...rest, format: 0, scriptSays: scriptDoes };
const renaming: Migration = {
  from: 0,
  says: "`scriptSays` is now `scriptDoes`",
  migrate: ({ scriptSays, ...others }) => ({
    data: { ...others, scriptDoes: scriptSays },
    moved: new Map([["scriptSays", "scriptDoes"]]),
  }),
};
const undecided: Migration = {
  from: 0,
  says: "never",
  migrate: () => ({ undecided: ["which light is the first"] }),
};

describe("a project moved on (ADR 0015)", () => {
  it("is set to this version, and given this version's type and skill", () => {
    const folder = olderProject({ "lights.ts": LIGHTS });
    const said = listening();
    expect(updateProject(folder, said.io)).toBe(0);
    expect(JSON.parse(readFileSync(join(folder, "ratsnest.json"), "utf8"))).toEqual({
      ratsnest: version,
    });
    expect(readFileSync(join(folder, ".ratsnest", "ratsnest.d.ts"), "utf8")).toBe(FORMAT_SOURCE);
    expect(readFileSync(join(folder, ".claude", "skills", "circuit", "SKILL.md"), "utf8")).toBe(
      CIRCUIT_SKILL,
    );
    expect(said.out.at(-1)).toBe("1 circuit checked: all well.");
    expect(said.err).toEqual([]);
  });

  it("leaves a circuit in the current format as it was", () => {
    const folder = olderProject({ "lights.ts": LIGHTS });
    const before = readFileSync(join(folder, "circuits", "lights.ts"), "utf8");
    updateProject(folder, listening().io);
    expect(readFileSync(join(folder, "circuits", "lights.ts"), "utf8")).toBe(before);
  });

  it("migrates an older circuit, says how, and checks it", () => {
    const folder = olderProject({ "lights.ts": FORMAT_ZERO });
    const said = listening();
    expect(updateProject(folder, said.io, [renaming])).toBe(0);
    expect(said.out[0]).toBe(
      "circuits/lights.ts: moved to format 1: `scriptSays` is now `scriptDoes`",
    );
    const now = readFileSync(join(folder, "circuits", "lights.ts"), "utf8");
    expect(now).toContain("format: 1,");
    expect(now).toContain("scriptDoes:");
    expect(now).not.toContain("scriptSays");
  });

  it("leaves a circuit a person has to decide on as it was, and says what to decide", () => {
    const folder = olderProject({ "lights.ts": FORMAT_ZERO, "more.ts": LIGHTS });
    const before = readFileSync(join(folder, "circuits", "lights.ts"), "utf8");
    const said = listening();
    expect(updateProject(folder, said.io, [undecided])).toBe(1);
    expect(readFileSync(join(folder, "circuits", "lights.ts"), "utf8")).toBe(before);
    expect(said.err).toEqual([
      "circuits/lights.ts: left as it was, until a person decides which light is the first",
      "1 circuit of 2 needs a person.",
    ]);
  });

  it("leaves a circuit in a newer format as it was, and says why", () => {
    const folder = olderProject({ "lights.ts": { ...LIGHTS, format: 2 } });
    const said = listening();
    expect(updateProject(folder, said.io)).toBe(1);
    expect(said.err[0]).toBe(
      "circuits/lights.ts: left as it was, since it is in format 2, newer than 1",
    );
    expect(said.err.at(-1)).toBe("1 circuit of 1 needs a person.");
  });

  it("gives a project the files an owner took away", () => {
    const folder = folderOf();
    writeFileSync(join(folder, "ratsnest.json"), JSON.stringify({ ratsnest: "0.0.0-alpha" }));
    const said = listening();
    expect(updateProject(folder, said.io)).toBe(0);
    expect(existsSync(join(folder, ".ratsnest", "ratsnest.d.ts"))).toBe(true);
    expect(existsSync(join(folder, ".claude", "skills", "circuit", "SKILL.md"))).toBe(true);
    expect(said.out.at(-1)).toBe("0 circuits checked: all well.");
  });
});

describe("ratsnest update, run from its source (ADR 0016)", () => {
  /** Runs the command in a folder, once it has finished. */
  async function run(cwd: string, ...args: string[]) {
    const said = listening();
    const status = await main(["update", ...args], cwd, said.io);
    return { status, out: said.out.join("\n"), err: said.err.join("\n") };
  }

  it("is not a compiled ratsnest, whose Bun it would replace", () => {
    expect(isCompiled()).toBe(false);
  });

  it("moves the project on to its own version, after which every command runs", async () => {
    const folder = olderProject({ "lights.ts": LIGHTS });
    const before = await main(["check"], folder, listening().io);
    expect(before).toBe(2);
    expect((await run(folder)).status).toBe(0);
    expect(await main(["check"], folder, listening().io)).toBe(0);
  });

  it("takes its own version, with a v or without", async () => {
    expect((await run(olderProject({}), "--version", version)).status).toBe(0);
    expect((await run(olderProject({}), "--version", `v${version}`)).status).toBe(0);
  });

  it("refuses another version, which only a compiled ratsnest can fetch", async () => {
    const result = await run(olderProject({}), "--version", "9.9.9");
    expect(result.status).toBe(2);
    expect(result.err).toContain(`run from its source, at ${version}`);
    expect((await run(olderProject({}), "--from", "ratsnest-linux-x64")).status).toBe(2);
  });

  it("refuses a version that is not a release's", async () => {
    const result = await run(olderProject({}), "--version", "latest");
    expect(result).toEqual({
      status: 2,
      out: "",
      err: "ratsnest: --version is a release's version, such as `0.2.0`, not `latest`",
    });
  });

  it("never moves a project back", async () => {
    const folder = olderProject({}, "99.0.0");
    const result = await run(folder);
    expect(result.status).toBe(2);
    expect(result.err).toContain("a project is never moved back");
    expect(JSON.parse(readFileSync(join(folder, "ratsnest.json"), "utf8"))).toEqual({
      ratsnest: "99.0.0",
    });
  });

  it("refuses a folder in no project, and a file", async () => {
    expect((await run(folderOf())).err).toContain("`ratsnest init` makes one");
    expect((await run(olderProject({}), "circuits/lights.ts")).status).toBe(2);
  });
});

describe("the executable put in place (ADR 0016)", () => {
  it("is named as `bun run build` names it, for every system it is built for", () => {
    const systems: [string, string][] = [
      ["linux", "x64"],
      ["linux", "arm64"],
      ["darwin", "arm64"],
      ["darwin", "x64"],
      ["win32", "x64"],
    ];
    expect(systems.map(([platform, arch]) => assetOf(platform, arch)).sort()).toEqual(
      TARGETS.map(executableOf).sort(),
    );
    expect(assetOf("win32", "arm64")).toBeUndefined();
    expect(assetOf("freebsd", "x64")).toBeUndefined();
  });

  it("is fetched from the release's page", async () => {
    expect(downloadUrlOf("0.2.0", "ratsnest-linux-x64")).toBe(
      "https://github.com/bulla/ratsnest/releases/download/v0.2.0/ratsnest-linux-x64",
    );
    const asked: string[] = [];
    const fake = (async (url: string) => {
      asked.push(url);
      return new Response(new Uint8Array([1, 2, 3]));
    }) as unknown as typeof fetch;
    expect(await fetchExecutable("0.2.0", "ratsnest-linux-x64", fake)).toEqual(
      new Uint8Array([1, 2, 3]),
    );
    expect(asked).toEqual([downloadUrlOf("0.2.0", "ratsnest-linux-x64")]);
    const missing = (async () => new Response("", { status: 404 })) as unknown as typeof fetch;
    await expect(fetchExecutable("0.2.0", "ratsnest-linux-x64", missing)).rejects.toThrow(
      "ratsnest 0.2.0 has no ratsnest-linux-x64 to fetch",
    );
  });

  it("is the latest release's by default, as GitHub says it", async () => {
    const answering = (status: number, body: unknown) =>
      (async () => Response.json(body, { status })) as unknown as typeof fetch;
    expect(await latestVersion(answering(200, { tag_name: "v0.3.1" }))).toBe("0.3.1");
    await expect(latestVersion(answering(404, {}))).rejects.toThrow("ratsnest has no release yet");
    await expect(latestVersion(answering(500, {}))).rejects.toThrow("GitHub answered 500");
  });

  it("waits beside the running one under a name Windows still runs", () => {
    expect(besideOf("/usr/local/bin/ratsnest", "new")).toBe("/usr/local/bin/ratsnest.new");
    expect(besideOf("C:\\bin\\ratsnest.exe", "new")).toBe("C:\\bin\\ratsnest.new.exe");
    expect(besideOf("C:\\bin\\ratsnest.exe", "old")).toBe("C:\\bin\\ratsnest.old.exe");
  });

  it("takes the running one's place, ready to run", () => {
    const current = join(folderOf(), "ratsnest");
    writeFileSync(current, "old");
    const incoming = stage(current, new TextEncoder().encode("new"));
    expect(readFileSync(current, "utf8")).toBe("old");
    install(current, incoming, false);
    expect(readFileSync(current, "utf8")).toBe("new");
    expect(existsSync(incoming)).toBe(false);
    if (process.platform !== "win32") expect(statSync(current).mode & 0o111).toBe(0o111);
  });

  it("on Windows, moves the running one out of the way first, in place of the last", () => {
    const current = join(folderOf(), "ratsnest.exe");
    writeFileSync(current, "old");
    writeFileSync(besideOf(current, "old"), "older");
    install(current, stage(current, new TextEncoder().encode("new")), true);
    expect(readFileSync(current, "utf8")).toBe("new");
    expect(readFileSync(besideOf(current, "old"), "utf8")).toBe("old");
  });
});

describe("a compiled ratsnest", () => {
  it("is told by where Bun keeps its own files", () => {
    expect(isCompiled("/$bunfs/root/ratsnest")).toBe(true);
    expect(isCompiled("B:/~BUN/root/ratsnest.exe")).toBe(true);
    expect(isCompiled("B:\\~BUN\\root\\ratsnest.exe")).toBe(true);
    expect(isCompiled("/home/someone/ratsnest/src/cli.ts")).toBe(false);
  });
});
