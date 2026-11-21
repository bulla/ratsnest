/**
 * Fetches the two Nunito files every page carries, cut by Google Fonts' subsetter to exactly
 * ratsnest's characters (ADR 0012), into `fonts/`, and writes the address that made each into
 * `fonts/README.md`. Run it again, with `bun run fonts`, only to add a character: a page is made from
 * the committed files alone, and this is the one thing that needs Google's servers.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const range = (from: number, to: number): string =>
  Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i)).join("");

/** Basic Latin, Latin-1, and the few marks the pages write, the thin space among them (ADR 0012). */
export const LATIN = `${range(0x20, 0x7e)}${range(0xa0, 0xff)}Œœ‘’“”…–−Ω `;

/** The Cyrillic block's letters, U+0400 to U+045F (ADR 0012). */
export const CYRILLIC = range(0x400, 0x45f);

/** Nunito's version the files are cut from, as Google Fonts serves it. */
const VERSION = "3.602";

/** What Google's CSS API is asked: every weight of Nunito, holding exactly these characters. */
export const addressOf = (text: string): string =>
  `https://fonts.googleapis.com/css2?${new URLSearchParams({
    family: "Nunito:wght@200..1000",
    text,
  })}`;

/** Google serves WOFF2 to a browser it knows, so the request says it is one. */
const BROWSER =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

async function fetchCut(name: string, text: string): Promise<string> {
  const address = addressOf(text);
  const css = await (await fetch(address, { headers: { "User-Agent": BROWSER } })).text();
  const urls = [...css.matchAll(/url\((https:[^)]+)\) format\('woff2'\)/g)].map((m) => m[1]);
  if (urls.length !== 1 || !urls[0])
    throw new Error(`Expected one WOFF2 for ${name}, got:\n${css}`);
  const bytes = new Uint8Array(await (await fetch(urls[0])).arrayBuffer());
  writeFileSync(join(import.meta.dir, "..", "fonts", name), bytes);
  console.log(`fonts/${name}: ${(bytes.length / 1000).toFixed(1)} KB`);
  return address;
}

if (import.meta.main) {
  const latin = await fetchCut("nunito-latin.woff2", LATIN);
  const cyrillic = await fetchCut("nunito-cyrillic.woff2", CYRILLIC);
  writeFileSync(
    join(import.meta.dir, "..", "fonts", "README.md"),
    `# Fonts

Every page ratsnest makes is set in Nunito ${VERSION}, by the Nunito Project Authors, and carries it
(ADR 0012). Nunito is under the SIL Open Font License 1.1, in [\`OFL.txt\`](OFL.txt),
which goes wherever these files go.

| File                    | What it holds                                                 |
| ----------------------- | ------------------------------------------------------------- |
| \`nunito-latin.woff2\`    | Basic Latin, Latin-1, \`Œ œ ‘ ’ “ ” … – − Ω\` and the thin space |
| \`nunito-cyrillic.woff2\` | The Cyrillic letters, U+0400 to U+045F                         |

Both are variable, with every weight from 200 to 1000, and were cut by Google Fonts' subsetter from
these addresses, by \`bun run fonts\` (\`scripts/fonts.ts\`), which holds the characters:

- \`nunito-latin.woff2\`: <${latin}>
- \`nunito-cyrillic.woff2\`: <${cyrillic}>

Adding a character means adding it to \`scripts/fonts.ts\` and running it again. A test fails on any
character a page writes that these files lack.
`,
  );
}
