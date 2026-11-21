import { afterEach, describe, expect, it } from "bun:test";
import { chmodSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

/** `install.sh` (ADR 0016), with a stand-in for the executable, since none is released yet. */
const made: string[] = [];
afterEach(() => {
  for (const folder of made.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe.skipIf(process.platform === "win32")("install.sh", () => {
  it("puts the executable it is given into the folder asked, says its version, and leaves nothing half done", async () => {
    const folder = mkdtempSync(join(tmpdir(), "ratsnest-install-"));
    made.push(folder);
    const standIn = join(folder, "built");
    writeFileSync(standIn, "#!/bin/sh\necho 9.9.9\n");
    chmodSync(standIn, 0o755);
    const into = join(folder, "bin");
    const said = await $`sh ${join(import.meta.dir, "..", "install.sh")}`
      .env({
        ...process.env,
        RATSNEST_FROM: standIn,
        RATSNEST_INSTALL: into,
        PATH: "/usr/bin:/bin",
      })
      .text();
    expect(said).toStartWith(`ratsnest 9.9.9 is in ${into}.`);
    expect(said).toContain(`Add ${into} to your PATH`);
    expect(existsSync(join(into, "ratsnest"))).toBe(true);
    expect(existsSync(join(into, "ratsnest.partial"))).toBe(false);
  });
});
