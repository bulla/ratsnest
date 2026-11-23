import type { Circuit, PicoCircuit, SupplyCircuit, Text } from "../format";
import type { Fixture } from "./circuits";

/**
 * A test circuit as a circuit file would declare it, in format 1 and in English, and that file's
 * source: what the reader and the checks are tested on (ADR 0007).
 */

const en = (words: string): Text => ({ en: words });

const named = <T extends { readonly name: string }>(part: T) => ({ ...part, name: en(part.name) });

const stepsOf = ({ layout }: Fixture): PicoCircuit["steps"] =>
  layout.steps.map((step) => ({
    title: en(step.title),
    ...(step.note ? { note: en(step.note) } : {}),
    parts: step.parts,
  })) as PicoCircuit["steps"];

/** A test circuit on a Pico in the circuit format, every text in English. */
export function fileOf(fixture: Fixture): PicoCircuit {
  const { circuit, layout } = fixture;
  if (circuit.supply || layout.script === undefined) {
    throw new Error(`${circuit.name} has a supply: take it with supplyFileOf`);
  }
  return {
    format: 1,
    name: en(circuit.name),
    description: en(circuit.description),
    leds: circuit.leds.map((led) => {
      if (led.colour !== "rgb" && !led.pin) throw new Error(`${led.id} has no pin`);
      return named(led) as NonNullable<PicoCircuit["leds"]>[number];
    }),
    buttons: circuit.buttons.map((button) => {
      if (!button.pin) throw new Error(`${button.id} has no pin`);
      return { ...named(button), pin: button.pin };
    }),
    buzzers: circuit.buzzers.map(named),
    steps: stepsOf(fixture),
    script: en(layout.script),
    scriptDoes: en(layout.test),
  };
}

/** A test circuit with a supply in the circuit format (ADR 0032), every text in English. */
export function supplyFileOf(fixture: Fixture): SupplyCircuit {
  const { circuit, layout } = fixture;
  if (!circuit.supply) throw new Error(`${circuit.name} is on a Pico: take it with fileOf`);
  const unpinned = <T extends { readonly name: string; readonly pin?: unknown }>({
    pin: _,
    ...part
  }: T) => named(part);
  return {
    format: 1,
    name: en(circuit.name),
    description: en(circuit.description),
    supply: circuit.supply,
    leds: circuit.leds.map((led) => {
      if (led.colour === "rgb") throw new Error(`${led.id} is an RGB LED, which needs a Pico`);
      return unpinned(led) as NonNullable<SupplyCircuit["leds"]>[number];
    }),
    buttons: circuit.buttons.map(unpinned),
    steps: stepsOf(fixture),
    test: en(layout.test),
  };
}

/** Any test circuit in the circuit format, on a Pico or with a supply. */
export const circuitFileOf = (fixture: Fixture): Circuit =>
  fixture.circuit.supply ? supplyFileOf(fixture) : fileOf(fixture);

/** A circuit file's source declaring a value, written out as JSON, which TypeScript reads too. */
export const sourceOf = (data: unknown): string =>
  `import type { Circuit } from "ratsnest";\n\nexport default ${JSON.stringify(data, null, 2)} satisfies Circuit;\n`;
