import type { Circuit, Text } from "../format";
import type { Fixture } from "./circuits";

/**
 * A test circuit as a circuit file would declare it, in format 2 and in English, and that file's
 * source: what the reader and the checks are tested on (ADR 0007).
 */

const en = (words: string): Text => ({ en: words });

/** A test circuit in the circuit format, every text in English. */
export function fileOf({ circuit, layout }: Fixture): Circuit {
  const named = <T extends { readonly name: string }>(part: T) => ({
    ...part,
    name: en(part.name),
  });
  return {
    format: 2,
    name: en(circuit.name),
    description: en(circuit.description),
    credit: en(circuit.credit),
    leds: circuit.leds.map(named),
    buttons: circuit.buttons.map(named),
    buzzers: circuit.buzzers.map(named),
    steps: layout.steps.map((step) => ({
      title: en(step.title),
      ...(step.note ? { note: en(step.note) } : {}),
      parts: step.parts,
    })) as Circuit["steps"],
    script: en(layout.script),
    scriptDoes: en(layout.scriptDoes),
  };
}

/** A circuit file's source declaring a value, written out as JSON, which TypeScript reads too. */
export const sourceOf = (data: unknown): string =>
  `import type { Circuit } from "ratsnest";\n\nexport default ${JSON.stringify(data, null, 2)} satisfies Circuit;\n`;
