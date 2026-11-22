/**
 * The examples run with a compiled ratsnest, as a circuits project runs them (ADR 0016, ADR 0020): its
 * `check`, then every example's page, and its drawing alone (ADR 0031), in every language,
 * orientation and theme, each the same file, byte for byte, as the source makes. Bun's compiler packs only what is imported, so a file read from
 * beside the source works from it and is missing from the executable; this is what finds that. Then
 * a copy of it updates a project of its own `--from` the executable, migrating a circuit of format 1
 * in it, so that it stages, runs and puts in place an executable over itself, which on Windows means renaming itself while it runs. Outside
 * Windows it does so again run through `rnest`, a link to it as `install.sh` makes (ADR 0029), which
 * must still be a link afterwards: the update replaces the file, not the name it was run by.
 *
 *   bun scripts/compiled.ts dist/ratsnest-linux-x64
 */
import {
  chmodSync,
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { $ } from "bun";
import { version } from "../package.json";
import { checkFile } from "../src/check";
import { FORMAT, languagesOf } from "../src/fields";
import { ORIENTATIONS } from "../src/orientation";
import { PAGE_FILES } from "../src/page/files";
import { drawingFile, wiringPage } from "../src/page/page";
import { shownIn } from "../src/shown";
import { THEMES } from "../src/theme";

const executable = resolve(process.argv[2] ?? "");
const ROOT = join(import.meta.dir, "..");
const out = mkdtempSync(join(tmpdir(), "ratsnest-compiled-"));
let made = 0;
try {
  await $`${executable} check examples`.cwd(ROOT);
  for (const name of readdirSync(join(ROOT, "examples")).filter((each) => each.endsWith(".ts"))) {
    const circuit = checkFile(join(ROOT, "examples", name)).circuit;
    if (!circuit) throw new Error(`examples/${name} does not pass its checks`);
    const stem = name.replace(/\.ts$/, "");
    for (const language of languagesOf(circuit)) {
      const shown = shownIn(circuit, language);
      for (const orientation of ORIENTATIONS) {
        for (const theme of THEMES) {
          for (const format of ["html", "svg"] as const) {
            const file = join(out, `${stem}.${orientation}.${theme}.${language}.${format}`);
            await $`${executable} generate examples/${name} --language ${language} --orientation ${orientation} --theme ${theme} --format ${format} --out ${file}`
              .cwd(ROOT)
              .quiet();
            const inputs = { circuit: stem, language, orientation, theme };
            const expected =
              format === "svg"
                ? drawingFile(shown.circuit, shown.layout, PAGE_FILES, inputs)
                : wiringPage(shown.circuit, shown.layout, PAGE_FILES, inputs);
            if (readFileSync(file, "utf8") !== expected) {
              throw new Error(`${file} is not the file the source makes`);
            }
            made += 1;
          }
        }
      }
    }
  }
  console.log(`${made} pages and drawings made by ${executable}, each the source's own.`);

  const bin = join(out, "bin");
  mkdirSync(bin);
  const copy = join(bin, basename(executable));
  copyFileSync(executable, copy);
  chmodSync(copy, 0o755);
  const project = join(out, "project");
  await $`${copy} init ${project}`.quiet();
  // A circuit in format 1, which the update moves on to the format it reads (ADR 0015, ADR 0035).
  const older = join(project, "circuits", "push-button.ts");
  copyFileSync(join(ROOT, "examples", "format-1", "push-button.ts"), older);
  await $`${copy} update --from ${executable}`.cwd(project).quiet();
  const after = (await $`${copy} --version`.text()).trim();
  if (after !== version) throw new Error(`the updated executable says ${after}, not ${version}`);
  const migrated = readFileSync(older, "utf8");
  if (!migrated.includes(`format: ${FORMAT},`) || !migrated.includes("credit:")) {
    throw new Error(`${older} was not moved on to format ${FORMAT}`);
  }
  console.log(
    `${copy} updated a project, migrated its circuit, and put an executable in place over itself.`,
  );

  if (process.platform !== "win32") {
    const rnest = join(bin, "rnest");
    symlinkSync(basename(copy), rnest);
    await $`${rnest} update --from ${executable}`.cwd(project).quiet();
    if (!lstatSync(rnest).isSymbolicLink()) {
      throw new Error(`${rnest} is no longer a link to ${copy}: the update replaced the link`);
    }
    const through = (await $`${rnest} --version`.text()).trim();
    if (through !== version) throw new Error(`rnest says ${through}, not ${version}`);
    console.log(`${rnest}, a link, updated the executable it points to and is still a link.`);
  }
} finally {
  rmSync(out, { recursive: true, force: true });
}
