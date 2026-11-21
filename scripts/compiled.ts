/**
 * The examples run with a compiled ratsnest, as a circuits project runs them (ADR 0016, ADR 0020): its
 * `check`, then every example's page in every language, orientation and theme, each the same file,
 * byte for byte, as the source makes. Bun's compiler packs only what is imported, so a file read from
 * beside the source works from it and is missing from the executable; this is what finds that.
 *
 *   bun scripts/compiled.ts dist/ratsnest-linux-x64
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { $ } from "bun";
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
} finally {
  rmSync(out, { recursive: true, force: true });
}
