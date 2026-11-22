import type { Language } from "../format";
import { CIRCUIT_SKILL } from "../init";

/**
 * The credit the `circuit` skill writes into a new circuit (ADR 0035), read from the skill itself, so
 * that the tests hold the default people are given to every check a circuit's text is held to: its
 * languages' rules, Nunito's letters, and the room along a drawing's edge.
 */
function skillCredit(): Readonly<Record<Language, string>> {
  const block = /```ts\n {2}credit: \{\n([\s\S]*?)\n {2}\},\n```/.exec(CIRCUIT_SKILL)?.[1];
  if (!block) throw new Error("The circuit skill no longer shows its default credit as a ts block");
  return Object.fromEntries(
    block.split("\n").map((line) => {
      const found = /^ {4}(en|fr|ru): (".*"),$/.exec(line);
      if (!found)
        throw new Error(`The skill's default credit has a line no test can read: ${line}`);
      return [found[1], JSON.parse(found[2] ?? "")];
    }),
  ) as Record<Language, string>;
}

export const SKILL_CREDIT = skillCredit();
