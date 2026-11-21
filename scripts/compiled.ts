/**
 * The examples run with a compiled ratsnest, as a circuits project runs them (ADR 0016, ADR 0020): its
 * `check`, then every example's page in every language, orientation and theme, each the same file,
 * byte for byte, as the source makes. Bun's compiler packs only what is imported, so a file read from
 * beside the source works from it and is missing from the executable; this is what finds that. Then
 * a copy of it updates a project of its own `--from` the executable, so that it stages, runs and puts
 * in place an executable over itself, which on Windows means renaming itself while it runs.
 *
 *   bun scripts/compiled.ts dist/ratsnest-linux-x64
 */
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { $ } from "bun";
import { version } from "../package.json";
import { checkFile } from "../src/check";
import { languagesOf } from "../src/fields";
import { ORIENTATIONS } from "../src/orientation";
import { PAGE_FILES } from "../src/page/files";
import { wiringPage } from "../src/page/page";
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
          const file = join(out, `${stem}.${orientation}.${theme}.${language}.html`);
          await $`${executable} generate examples/${name} --language ${language} --orientation ${orientation} --theme ${theme} --out ${file}`
            .cwd(ROOT)
            .quiet();
          const expected = wiringPage(shown.circuit, shown.layout, PAGE_FILES, {
            circuit: stem,
            language,
            orientation,
            theme,
          });
          if (readFileSync(file, "utf8") !== expected) {
            throw new Error(`${file} is not the page the source makes`);
          }
          made += 1;
        }
      }
    }
  }
  console.log(`${made} pages made by ${executable}, each the source's own.`);

  const bin = join(out, "bin");
  mkdirSync(bin);
  const copy = join(bin, basename(executable));
  copyFileSync(executable, copy);
  chmodSync(copy, 0o755);
  const project = join(out, "project");
  await $`${copy} init ${project}`.quiet();
  await $`${copy} update --from ${executable}`.cwd(project).quiet();
  const after = (await $`${copy} --version`.text()).trim();
  if (after !== version) throw new Error(`the updated executable says ${after}, not ${version}`);
  console.log(`${copy} updated a project, and put an executable in place over itself.`);
} finally {
  rmSync(out, { recursive: true, force: true });
}
