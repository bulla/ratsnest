import type { Language } from "../format";
import { CIRCUIT_SKILL } from "../init";

/**
 * The credits the `circuit` skill writes into a new circuit (ADR 0035), one for a circuit on a Pico
 * and one for a circuit with a supply, read from the skill itself, so that the tests hold the defaults
 * people are given to every check a circuit's text is held to: its languages' rules, Nunito's
 * letters, and the room along a drawing's edge.
 */
function skillCredit(label: string): Readonly<Record<Language, string>> {
  const at = CIRCUIT_SKILL.indexOf(`\n${label}`);
  const block = /```ts\n {2}credit: \{\n([\s\S]*?)\n {2}\},\n```/.exec(
    CIRCUIT_SKILL.slice(at),
  )?.[1];
  if (at < 0 || !block) {
    throw new Error(`The circuit skill no longer shows a default credit after "${label}"`);
  }
  return Object.fromEntries(
    block.split("\n").map((line) => {
      const found = /^ {4}(en|fr|ru): (".*"),$/.exec(line);
      if (!found)
        throw new Error(`The skill's default credit has a line no test can read: ${line}`);
      return [found[1], JSON.parse(found[2] ?? "")];
    }),
  ) as Record<Language, string>;
}

/** The credit the skill writes into a circuit on a Pico. */
export const SKILL_CREDIT = skillCredit("For a circuit on a Pico:");

/** The credit the skill writes into a circuit with a supply, whose drawing has no Pico. */
export const SKILL_SUPPLY_CREDIT = skillCredit("For a circuit with a supply");
