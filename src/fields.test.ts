import { describe, expect, it } from "bun:test";
import { FIXTURE_IDS, FIXTURES } from "./__fixtures__/circuits";
import { fileOf } from "./__fixtures__/files";
import { FORMAT, fieldProblems, languagesOf } from "./fields";
import type { Circuit } from "./format";

/** A test circuit as a file, with some of its data replaced. */
const changed = (change: (data: Record<string, unknown>) => void, id = "light-and-button") => {
  const data = structuredClone(fileOf(FIXTURES[id as keyof typeof FIXTURES])) as unknown as Record<
    string,
    unknown
  >;
  change(data);
  return data;
};

/** What the field checks say of some data, as `path message`. */
const said = (data: unknown) =>
  fieldProblems(data).map(({ path, message }) => `${path || "the circuit"} ${message}`);

/** A step of the data, to change. */
const step = (data: Record<string, unknown>, index: number) =>
  (data.steps as Record<string, unknown>[])[index] as Record<string, unknown>;

/** Where the first button is placed: its step's index and its own among the step's parts. */
const buttonAt = (data: Record<string, unknown>): [number, number] => {
  const steps = data.steps as { parts: { kind: string }[] }[];
  for (const [index, each] of steps.entries()) {
    const at = each.parts.findIndex((placed) => placed.kind === "button");
    if (at >= 0) return [index, at];
  }
  throw new Error("No button is placed");
};

/** A part of a step, to change. */
const part = (data: Record<string, unknown>, stepIndex: number, partIndex: number) =>
  (step(data, stepIndex).parts as Record<string, unknown>[])[partIndex] as Record<string, unknown>;

describe("every test circuit, as a file", () => {
  it.each([...FIXTURE_IDS])("passes the field checks: %s", (id) => {
    expect(said(fileOf(FIXTURES[id]))).toEqual([]);
  });
});

describe("a file's format (ADR 0015)", () => {
  it("is this engine's, which is 2 since circuits carry their credit (ADR 0035)", () => {
    expect(FORMAT).toBe(2);
  });

  it("is said, or the file is refused", () => {
    expect(said(changed((data) => delete data.format))).toEqual([
      "format says no format: a circuit file says which it is written in, `format: 2` (ADR 0015)",
    ]);
    expect(said(changed((data) => (data.format = "1")))[0]).toContain("says no format");
  });

  it("is refused when newer, saying the project's ratsnest is older", () => {
    expect(said(changed((data) => (data.format = 3)))).toEqual([
      "format is written in format 3, newer than this ratsnest reads (2): run `ratsnest update`",
    ]);
  });

  it("is refused when older, saying the project's circuits need moving on", () => {
    expect(said(changed((data) => (data.format = 1)))).toEqual([
      "format is written in format 1, older than this ratsnest reads (2): run `ratsnest update`",
    ]);
  });

  it("is refused before anything else, so a person fixes that first", () => {
    const data = changed((data) => {
      data.format = 3;
      data.name = 42;
      delete data.steps;
    });
    expect(said(data)).toHaveLength(1);
  });
});

describe("a file's fields (ADR 0016)", () => {
  it("are only a circuit's, so a misspelt one is caught", () => {
    expect(said(changed((data) => (data.descripton = { en: "Typo" })))).toEqual([
      "descripton is not a field of a circuit: it has `format`, `name`, `description`, `credit`, `leds`, `buttons`, `buzzers`, `steps`, `script` or `scriptDoes`",
    ]);
  });

  it("are all there, but the lists of parts a circuit may not have", () => {
    expect(said(changed((data) => delete data.name))).toEqual([
      "the circuit has no `name`, a text",
    ]);
    expect(
      said(
        changed((data) => {
          delete data.buzzers;
        }),
      ),
    ).toEqual([]);
    expect(said(changed((data) => (data.steps = [])))).toEqual([
      "steps is empty: a circuit has a step at least",
    ]);
  });

  it("hold a text as an object keyed by language, in one at least", () => {
    expect(said(changed((data) => (data.name = "A light and a button")))).toEqual([
      'name is not a text keyed by language, such as `{ en: "…" }` (ADR 0010)',
    ]);
    expect(said(changed((data) => (data.name = {})))).toEqual([
      "name is in no language: a text needs one at least (ADR 0010)",
    ]);
    expect(said(changed((data) => (data.name = { de: "Ein Licht" })))).toEqual([
      "name.de is not a language ratsnest writes: it writes `en`, `fr` or `ru` (ADR 0010)",
    ]);
    expect(said(changed((data) => (data.description = { en: "  " })))).toEqual([
      "description.en is not a string with something in it",
    ]);
  });

  it("put a light, a button and a buzzer on a pin the Pico breaks out", () => {
    const data = changed((data) => {
      const [button] = data.buttons as Record<string, unknown>[];
      if (button) button.pin = { kind: "gpio", gpio: 23 };
    });
    expect(said(data)).toEqual([
      "buttons[0].pin.gpio is GP23, which the Pico 2 W does not break out",
    ]);
  });

  it("give an RGB light a pin that says how many are chained on it", () => {
    const data = changed((data) => {
      const [led] = data.leds as Record<string, unknown>[];
      if (led) led.pin = { kind: "rgb", gpio: 28 };
    }, "rgb-led-and-d-pad");
    expect(said(data)).toEqual(["leds[0].pin has no `count`, a whole number"]);
  });

  it("give every part an id of its own", () => {
    const data = changed((data) => {
      const [button] = data.buttons as Record<string, unknown>[];
      if (button) button.id = "red";
    });
    expect(said(data)).toContain("buttons[0].id is `red`, which leds[0] is already");
  });

  it("name a part ratsnest knows, with its own fields", () => {
    expect(said(changed((data) => (part(data, 0, 0).kind = "capacitor")))[0]).toStartWith(
      "steps[0].parts[0].kind is not a part ratsnest knows",
    );
    expect(said(changed((data) => (part(data, 0, 0).colour = "black")))[0]).toStartWith(
      "steps[0].parts[0].colour is not a field of a wire",
    );
  });

  it("put every leg in a hole a half-size breadboard prints", () => {
    expect(said(changed((data) => (part(data, 0, 0).from = "k19")))[0]).toStartWith(
      "steps[0].parts[0].from is not a hole on a half-size breadboard",
    );
    // A rail has holes in groups of five, so no rail has one at column 30.
    for (const hole of ["a31", "top+0", "3:a1", "A19", "bottom-30"]) {
      expect(said(changed((data) => (part(data, 0, 0).from = hole)))).toHaveLength(1);
    }
    for (const hole of ["a1", "j30", "top+1", "bottom-29", "2:f5"]) {
      expect(said(changed((data) => (part(data, 0, 0).from = hole)))).toEqual([]);
    }
  });

  it("refer to a light, a button or a buzzer the circuit has", () => {
    const [stepIndex, partIndex] = buttonAt(changed(() => {}));
    const data = changed((data) => (part(data, stepIndex, partIndex).button = "missing"));
    expect(said(data)).toEqual([
      `steps[${stepIndex}].parts[${partIndex}].button is \`missing\`, which is not the id of any of the circuit's buttons`,
    ]);
  });

  it("put a button on the second board with 2, and on no other (ADR 0028)", () => {
    const [stepIndex, partIndex] = buttonAt(changed(() => {}));
    const second = changed((data) => (part(data, stepIndex, partIndex).board = 2));
    expect(said(second)).toEqual([]);
    const first = changed((data) => (part(data, stepIndex, partIndex).board = 1));
    expect(said(first)).toEqual([
      `steps[${stepIndex}].parts[${partIndex}].board is not 2, the second breadboard, or left out for the first`,
    ]);
  });

  it("put a button on one half only in the rows that are a half", () => {
    const [stepIndex, partIndex] = buttonAt(changed(() => {}));
    const data = changed((data) => (part(data, stepIndex, partIndex).rows = ["a", "e"]));
    expect(said(data)[0]).toStartWith(
      `steps[${stepIndex}].parts[${partIndex}].rows is not the rows of one half`,
    );
    const above = changed((data) => (part(data, stepIndex, partIndex).rows = ["a", "d"]));
    expect(said(above)).toEqual([]);
  });
});

describe("a circuit's languages (ADR 0010)", () => {
  /** The test circuit with a French name, and French wherever `except` does not say. */
  const inBoth = (except: (circuit: Circuit) => void = () => {}) => {
    const data = structuredClone(fileOf(FIXTURES["two-lights"])) as Circuit;
    const french = (text: { en?: string }) => ({ ...text, fr: `${text.en} (fr)` });
    const both = {
      ...data,
      name: french(data.name),
      description: french(data.description),
      credit: french(data.credit),
      leds: (data.leds ?? []).map((led) => ({ ...led, name: french(led.name) })),
      steps: data.steps.map((each) => ({
        ...each,
        title: french(each.title),
        ...(each.note ? { note: french(each.note) } : {}),
      })),
      script: french(data.script),
      scriptDoes: french(data.scriptDoes),
    } as Circuit;
    except(both);
    return both;
  };

  it("are its name's", () => {
    expect(languagesOf(fileOf(FIXTURES["two-lights"]))).toEqual(["en"]);
    expect(languagesOf(inBoth())).toEqual(["en", "fr"]);
    expect(said(inBoth())).toEqual([]);
  });

  it("are every text's, so a text short of one is refused", () => {
    const data = inBoth((circuit) => {
      (circuit.steps[1] as { title: object }).title = { en: "Green LED on GP16" };
    });
    expect(said(data)).toEqual(["steps[1].title has no `fr`, which the circuit's name has"]);
  });

  it("are every text's only, so a text in another is refused", () => {
    const data = changed(
      (data) => (data.scriptDoes = { en: "They blink.", fr: "Elles clignotent." }),
    );
    expect(said(data)).toEqual([
      "scriptDoes.fr is in a language the circuit's name is not: a circuit's languages are its name's",
    ]);
  });
});

describe("a step's words (ADR 0006)", () => {
  it("never name a hole, which the engine names from the parts", () => {
    for (const hole of ["a21", "top-19", "2:f5"]) {
      const data = changed((data) => (step(data, 0).title = { en: `Start at ${hole}` }));
      expect(said(data)).toEqual([
        `steps[0].title.en names a hole, \`${hole}\`: the engine names holes from the parts, so a step's words never do (ADR 0006)`,
      ]);
    }
  });

  it("name no GPIO the circuit's parts are not on", () => {
    const data = changed((data) => (step(data, 0).note = { en: "Leave GP17 free." }));
    expect(said(data)).toEqual(["steps[0].note.en names GP17, which no part of the circuit is on"]);
  });

  it("may name a word that only looks like a hole inside a longer one", () => {
    expect(
      said(changed((data) => (step(data, 0).title = { en: "Use the 3V3 rail, not VBUS" }))),
    ).toEqual([]);
  });
});

describe("a circuit's characters (ADR 0012)", () => {
  it("are all Nunito's, so the page draws every one in its own font", () => {
    const data = changed((data) => (step(data, 0).title = { en: "Ground → both rails" }));
    expect(said(data)).toEqual([
      "steps[0].title.en has `→` (U+2192), which the page's font, Nunito, lacks: write it another way (ADR 0012)",
    ]);
  });

  it("may hold the narrow no-break space French writes, which the page draws as Nunito's thin one", () => {
    const data = changed((data) => (data.description = { en: "A light and a\u202Fbutton" }));
    expect(said(data)).toEqual([]);
  });

  it("leave the script alone, which is code in the device's own monospace", () => {
    expect(said(changed((data) => (data.script = { en: "print('→')" })))).toEqual([]);
  });
});

describe("ADR 0011's rules for a circuit's words", () => {
  /** The test circuit with every text in Russian only, the script left as it is. */
  const inRussian = (change: (data: Circuit) => void = () => {}) => {
    const data = structuredClone(fileOf(FIXTURES["two-lights"])) as Circuit;
    const ru = (words: string) => ({ ru: words });
    const russian = {
      ...data,
      name: ru("Два светодиода"),
      description: ru("Красный и зелёный светодиоды, каждый через резистор на землю."),
      credit: ru("Рисунок по спецификации Pico 2 W, © Raspberry Pi Ltd, по лицензии CC BY-SA 4.0."),
      leds: (data.leds ?? []).map((led, index) => ({
        ...led,
        name: ru(["красный светодиод", "зелёный светодиод"][index] ?? "светодиод"),
      })),
      steps: data.steps.map((step, index) => ({
        title: ru(`Шаг ${index + 2}`),
        parts: step.parts,
      })),
      script: ru(data.script.en ?? ""),
      scriptDoes: ru("Светодиоды мигают по очереди."),
    } as Circuit;
    change(russian);
    return russian;
  };

  it("pass a circuit written in Russian alone", () => {
    expect(said(inRussian())).toEqual([]);
  });

  it("refuse a text that is not NFC, the ohm sign included (rule 1)", () => {
    expect(said(changed((data) => (data.description = { en: "Café lights" })))[0]).toStartWith(
      "description.en is not written in Unicode's NFC form",
    );
    expect(said(changed((data) => (data.description = { en: "A resistor, Ω" })))[0]).toStartWith(
      "description.en is not written in Unicode's NFC form",
    );
  });

  it("refuse a Cyrillic letter in English, and a word that mixes scripts in Russian (rule 2)", () => {
    expect(said(changed((data) => (data.description = { en: "A red сolour" })))).toEqual([
      "description.en has a Cyrillic letter, `с`, in English (ADR 0011)",
    ]);
    const mixed = inRussian((data) => {
      (data as { description: object }).description = { ru: "Светодиодa на GP15" };
    });
    expect(said(mixed)).toEqual([
      "description.ru mixes Latin and Cyrillic letters in one word, `Светодиодa` (ADR 0011)",
    ]);
  });

  it("fold a Cyrillic look-alike before looking for a hole (rule 3)", () => {
    const hole = inRussian((data) => {
      (data.steps[0] as { title: object }).title = { ru: "Начните с а21" };
    });
    expect(said(hole)[0]).toStartWith("steps[0].title.ru names a hole, `a21`");
  });

  it("refuse a value written out, which is the engine's to write (rule 7)", () => {
    expect(
      said(changed((data) => (data.description = { en: "A button, about 6 mm across." }))),
    ).toEqual([
      "description.en writes a value, `6 mm`: the engine writes every value, in the page's language (ADR 0011)",
    ]);
    expect(said(changed((data) => (data.description = { en: "Take 3V3 from 3V3(OUT)." })))).toEqual(
      [],
    );
  });

  it("hold each language to its typography (rule 8)", () => {
    expect(said(changed((data) => (data.description = { en: "Ready ? Go." })))).toEqual([
      "description.en puts a space before `?`, which English does not (ADR 0011)",
    ]);
    const russian = inRussian((data) => {
      (data as { description: object }).description = { ru: 'Готово : "да"' };
    });
    expect(said(russian)).toEqual([
      "description.ru puts a space before `:`, which Russian does not (ADR 0011)",
      "description.ru writes straight quotes, where it writes `« »` (ADR 0011)",
    ]);
  });
});
