import type { Circuit } from "../format";
import { FORMAT_2_CREDIT } from "../migrate";
import { FIXTURES } from "./circuits";
import { fileOf } from "./files";

/**
 * The engine's test circuit in all three of its languages (ADR 0011, rule 10): the RGB LED on a
 * d-pad, the test circuit with the most to label, its Russian chosen from the widest letters and the
 * longest words, so that the checks meet the worst case rather than the English one.
 */
const english = fileOf(FIXTURES["rgb-led-and-d-pad"]);

const RUSSIAN_NAMES: Readonly<Record<string, string>> = {
  "RGB LED": "Многоцветный адресуемый светодиод",
  BTN1: "Широкая кнопка Ш1",
  BTN2: "Широкая кнопка Ш2",
  BTN3: "Широкая кнопка Ш3",
  BTN4: "Широкая кнопка Ш4",
};

const FRENCH_NAMES: Readonly<Record<string, string>> = { "RGB LED": "LED RVB" };

export const TRILINGUAL: Circuit = {
  ...english,
  name: {
    en: "Test circuit in three languages",
    fr: "Circuit d’essai en trois langues",
    ru: "Испытательная схема на трёх языках",
  },
  description: {
    en: "Four buttons in a cross and an addressable LED, on two breadboards.",
    fr: "Quatre boutons en croix et une LED adressable, sur deux plaques d’essai.",
    ru: "Четыре кнопки крестом и многоцветный адресуемый светодиод, собранные на двух половинных макетных платах.",
  },
  credit: {
    en: FORMAT_2_CREDIT.en ?? "",
    fr: FORMAT_2_CREDIT.fr ?? "",
    ru: FORMAT_2_CREDIT.ru ?? "",
  },
  leds: (english.leds ?? []).map((led) => {
    const name = led.name.en ?? "";
    return {
      ...led,
      name: { en: name, fr: FRENCH_NAMES[name] ?? name, ru: RUSSIAN_NAMES[name] ?? name },
    };
  }),
  buttons: (english.buttons ?? []).map((button) => {
    const name = button.name.en ?? "";
    return { ...button, name: { en: name, fr: name, ru: RUSSIAN_NAMES[name] ?? name } };
  }),
  steps: english.steps.map((step, index) => ({
    title: {
      en: `Step ${index + 2}`,
      fr: `Étape ${index + 2}`,
      ru: `Шаг ${index + 2}: подключение широкоформатных компонентов`,
    },
    parts: step.parts,
  })),
  script: { en: english.script.en, fr: english.script.en, ru: english.script.en },
  scriptDoes: {
    en: "The script tries every part in turn.",
    fr: "Le script essaie chaque composant à son tour.",
    ru: "Скрипт по очереди проверяет каждый компонент.",
  },
};
