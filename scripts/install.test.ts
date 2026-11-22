import { afterEach, describe, expect, it } from "bun:test";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

/**
 * `install.sh` (ADR 0016), with a stand-in for the executable, since none is released yet, and `rnest`
 * beside it (ADR 0029).
 */
const made: string[] = [];
afterEach(() => {
  for (const folder of made.splice(0)) rmSync(folder, { recursive: true, force: true });
});

/** A folder holding a stand-in executable, and the folder the install puts it into. */
function setUp() {
  const folder = mkdtempSync(join(tmpdir(), "ratsnest-install-"));
  made.push(folder);
  const standIn = join(folder, "built");
  writeFileSync(standIn, "#!/bin/sh\necho 9.9.9\n");
  chmodSync(standIn, 0o755);
  return { standIn, into: join(folder, "bin") };
}

/** Runs the install from the stand-in, with `into` not on the `PATH`. */
const install = ({ standIn, into }: { standIn: string; into: string }) =>
  $`sh ${join(import.meta.dir, "..", "install.sh")}`
    .env({
      ...process.env,
      RATSNEST_FROM: standIn,
      RATSNEST_INSTALL: into,
      PATH: "/usr/bin:/bin",
    })
    .quiet();

describe.skipIf(process.platform === "win32")("install.sh", () => {
  it("puts the executable it is given into the folder asked, says its version, and leaves nothing half done", async () => {
    const at = setUp();
    const said = (await install(at)).text();
    expect(said).toStartWith(`ratsnest 9.9.9 is in ${at.into}, also as rnest.`);
    expect(said).toContain(`Add ${at.into} to your PATH to run it as \`rnest\` or \`ratsnest\`.`);
    expect(existsSync(join(at.into, "ratsnest"))).toBe(true);
    expect(existsSync(join(at.into, "ratsnest.partial"))).toBe(false);
  });

  it("puts rnest beside it, a link to it that runs it, and keeps it so when run again", async () => {
    const at = setUp();
    await install(at);
    await install(at);
    const rnest = join(at.into, "rnest");
    expect(lstatSync(rnest).isSymbolicLink()).toBe(true);
    expect(readlinkSync(rnest)).toBe("ratsnest");
    expect((await $`${rnest}`.text()).trim()).toBe("9.9.9");
  });

  it("leaves an rnest that is something else alone, and says so", async () => {
    const at = setUp();
    mkdirSync(at.into);
    const other = join(at.into, "rnest");
    writeFileSync(other, "another tool\n");
    const result = await install(at);
    expect(result.stderr.toString()).toContain(`${other} is something else already`);
    expect(result.text()).toStartWith(`ratsnest 9.9.9 is in ${at.into}.`);
    expect(result.text()).toContain("to run it as `ratsnest`.");
    expect(readFileSync(other, "utf8")).toBe("another tool\n");
    expect(existsSync(join(at.into, "ratsnest"))).toBe(true);
  });
});
