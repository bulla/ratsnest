import type { Layout, Led, ShownCircuit } from "./circuit";
import type { Circuit, Language, Text } from "./format";

/**
 * A checked circuit, taken into one of its languages as the engine's model: the circuit and the
 * layout the drawing and the page are written against (ADR 0022). Every text becomes the string in
 * that language, and everything else is as the file declares it.
 */

/** A text in a language the circuit has, which the checks have made sure of. */
const inLanguage = (text: Text, language: Language): string => {
  const words = text[language];
  if (words === undefined) throw new Error(`A text with no ${language} passed the checks`);
  return words;
};

export function shownIn(
  circuit: Circuit,
  language: Language,
): { readonly circuit: ShownCircuit; readonly layout: Layout } {
  const say = (text: Text) => inLanguage(text, language);
  const named = <T extends { readonly name: Text }>(part: T) => ({ ...part, name: say(part.name) });
  return {
    circuit: {
      name: say(circuit.name),
      description: say(circuit.description),
      credit: say(circuit.credit),
      leds: (circuit.leds ?? []).map((led): Led => named(led)),
      buttons: (circuit.buttons ?? []).map(named),
      buzzers: (circuit.buzzers ?? []).map(named),
    },
    layout: {
      steps: circuit.steps.map((step) => ({
        title: say(step.title),
        ...(step.note ? { note: say(step.note) } : {}),
        parts: step.parts,
      })),
      script: say(circuit.script),
      scriptDoes: say(circuit.scriptDoes),
    },
  };
}
