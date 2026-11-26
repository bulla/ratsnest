import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { FIXTURE_IDS, FIXTURES, type Fixture, type FixtureId } from "../__fixtures__/circuits";
import { TRILINGUAL } from "../__fixtures__/trilingual";
import type { Layout, ShownCircuit } from "../circuit";
import { legsOf, pinOfStrip } from "../drawing/breadboard";
import { HEADER_PINS } from "../drawing/geometry";
import { CYRILLIC, FONT_FAMILY, fileOf } from "../fonts";
import { shownIn } from "../shown";
import { PAGE_WORDS, type PageFiles, wiringPage } from "./page";

const read = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");

const FILES: PageFiles = {
  tokens: read("./tokens.css"),
  drawing: read("./drawing.css"),
  css: read("./page.css"),
  script: read("./steps.js"),
};

const page = (id: FixtureId, language: "en" | "fr" = "en") =>
  wiringPage(FIXTURES[id].circuit, FIXTURES[id].layout, FILES, { language });

/** The steps, not the drawing's description, which says every sentence again. */
const steps = (html: string) => html.slice(html.indexOf('<ol class="steps">'));

/** What a reader reads, the markup taken out: a narrow space's words are held in a span of their own. */
const words = (html: string) => html.replace(/<[^>]+>/g, "");

/** Every GPIO a circuit's components are on. */
const gpiosOf = (circuit: ShownCircuit): number[] => [
  ...circuit.leds.flatMap((led) => (led.pin ? [led.pin.gpio] : [])),
  ...circuit.buttons.flatMap((button) => (button.pin ? [button.pin.gpio] : [])),
  ...circuit.buzzers.map((buzzer) => buzzer.pin.gpio),
];

/** Every GPIO a layout wires a part to, a ceramic capacitor's pins among them (ADR 0051). */
const wiredOf = (layout: Layout): number[] =>
  layout.steps.flatMap((step) =>
    step.parts.flatMap((part) =>
      legsOf(part).flatMap((hole) => {
        const pin = pinOfStrip(hole);
        return HEADER_PINS.find((header) => header.number === pin)?.gpio ?? [];
      }),
    ),
  );

/** A part's name in the French test circuits, which are the fixtures written in French. */
const FRENCH_NAMES: Readonly<Record<string, string>> = {
  "red LED": "LED rouge",
  "green LED": "LED verte",
  "RGB LED": "LED RVB",
  "LED ring": "anneau de LED",
  "motion sensor": "détecteur de mouvement",
};

/**
 * A fixture as a circuit written in French would be: its name, its description, its parts'
 * names, its steps and what its script does, all in French. Only its script stays as it is, since
 * it is code.
 */
function inFrench({ circuit, layout }: Fixture): { circuit: ShownCircuit; layout: Layout } {
  const named = <T extends { readonly name: string }>(part: T): T => ({
    ...part,
    name: FRENCH_NAMES[part.name] ?? part.name,
  });
  return {
    circuit: {
      name: "Circuit d’essai",
      description: "Un circuit d’essai, écrit en français.",
      credit:
        "Dessin d’après la fiche technique du Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0.",
      ...(circuit.supply ? { supply: circuit.supply } : {}),
      leds: circuit.leds.map(named),
      buttons: circuit.buttons.map(named),
      buzzers: circuit.buzzers.map(named),
    },
    layout: {
      ...layout,
      steps: layout.steps.map((step, index) => ({
        title: `Étape ${index + 2}`,
        parts: step.parts.map((part) => (part.kind === "pir" ? named(part) : part)),
      })),
      test: "Le script fait marcher chaque composant à son tour.",
    },
  };
}

const frenchPage = (id: FixtureId) => {
  const french = inFrench(FIXTURES[id]);
  return wiringPage(french.circuit, french.layout, FILES, { language: "fr" });
};

describe.each([...FIXTURE_IDS])("the page for %s", (id) => {
  const { circuit, layout } = FIXTURES[id];
  const html = page(id);

  it("is headed by the circuit, and links nowhere else on the site", () => {
    expect(html).toContain(`<title>${circuit.name}</title>`);
    expect(html).toContain(`<h1>${circuit.name}</h1>`);
    expect(html).toContain(circuit.description);
    // No back link, no twin in another language: a page is one asset (ADR 0004).
    expect(html).not.toContain("<nav");
    expect(html).not.toContain("hreflang");
    expect(html).not.toMatch(/href="\//);
  });

  it("is drawn in one scale, which nothing on it switches (ADR 0005)", () => {
    expect(html).toContain('<html lang="en" data-theme="dark">');
    expect(html).not.toContain("location");
  });

  it("is the same file every time it is made from the same inputs (ADR 0004)", () => {
    expect(page(id)).toBe(html);
  });

  it("reads every custom property from a token that exists", () => {
    const declared = new Set([...FILES.tokens.matchAll(/(--[\w-]+):/g)].map((match) => match[1]));
    const used = new Set([...html.matchAll(/var\((--[\w-]+)\)/g)].map((match) => match[1]));
    expect(used.size).toBeGreaterThan(0);
    expect([...used].filter((name) => !declared.has(name))).toEqual([]);
  });

  it("has a step for the Pico, if it has one, one for each of the layout's, and one to test it", () => {
    const pico = circuit.supply ? 0 : 1;
    expect(html.match(/<button class="step"/g) ?? []).toHaveLength(pico + layout.steps.length + 1);
  });

  it("picks out something in the drawing for every step", () => {
    const drawn = [...html.matchAll(/data-g="([^"]+)"/g)].flatMap((match) =>
      (match[1] ?? "").split(" "),
    );
    const groups = [...html.matchAll(/data-groups="([^"]+)"/g)].map((match) => match[1] ?? "");
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(group.split(" ").some((each) => drawn.includes(each))).toBe(true);
    }
  });

  it("names holes only where the layout places something", () => {
    // Titles and notes are written by hand, so a hole named there is one the drawing might not
    // show. The parts' own sentences name them, from the layout (ADR 0007).
    for (const step of layout.steps) {
      for (const words of [step.title, step.note ?? ""]) {
        expect(words).not.toMatch(/\b[a-j]\d{1,2}\b/);
      }
    }
  });

  it("mentions no GPIO the circuit does not use", () => {
    const used = [...gpiosOf(circuit), ...wiredOf(layout)];
    for (const step of layout.steps) {
      for (const [, gpio] of `${step.title} ${step.note ?? ""}`.matchAll(/GP(\d+)/g)) {
        expect(used).toContain(Number(gpio));
      }
    }
  });

  it("tests every part on the pin its circuit puts it on, shown as it is written", () => {
    for (const gpio of gpiosOf(circuit)) expect(layout.script).toContain(`Pin(${gpio}`);
    // Escaped the way the page escapes it: a script that prints a string has quotes in it.
    const shown = (layout.script ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    expect(html).toContain(shown);
  });

  it("credits the drawing and the font in its circuit's own words, as its footer (ADR 0035)", () => {
    expect(html).toContain(`<footer>\n    ${circuit.credit}\n  </footer>`);
  });

  it("has no footer at all when its circuit leaves its credit out (ADR 0035)", () => {
    const { credit: _, ...uncredited } = circuit;
    const bare = wiringPage(uncredited, layout, FILES);
    expect(bare).not.toContain("<footer>");
    expect(bare).not.toContain("CC BY-SA");
  });

  it("has no tooltip on anything, the browser's included", () => {
    expect(html).not.toMatch(/\stitle="/);
  });

  it("labels nothing whose role cannot be labelled", () => {
    // A <pre> has the generic role in ARIA 1.2, which may not be named, as Biome found on a page.
    // The heading just before the script names it.
    expect(html).not.toMatch(/<pre[^>]*\saria-label/);
  });
});

describe("a page with a supply in the Pico's place (ADR 0032)", () => {
  const { circuit, layout } = FIXTURES["two-lights-on-a-supply"];
  const html = page("two-lights-on-a-supply");

  it("draws the supply's cell and no Pico, and puts no pin's chip or note anywhere", () => {
    expect(html).toContain('data-kind="supply"');
    expect(html).not.toContain('data-g="pico"');
    expect(html).not.toContain("(GP");
    expect(html).toMatch(/<text[^>]*>3 V<\/text>/);
  });

  it("starts with the circuit's own steps, and ends by connecting the supply, then its test", () => {
    const shown = words(steps(html));
    expect(shown).not.toContain("Put the Pico across the middle");
    expect(shown).toContain("Connect the supply and test");
    expect(shown).toContain(
      `Put the supply's red lead in the top + rail and its black lead in the top − rail, both in column 1. ${layout.test}`,
    );
    expect(html).toContain('data-groups="supply test" data-test=""');
  });

  it("lists the supply first, and no Pico or cable", () => {
    const list = html.slice(html.indexOf('<ul class="parts">'));
    expect(list).toMatch(
      /^<ul class="parts"><li><span class="count">1<\/span><span>Two AA batteries/,
    );
    expect(list).not.toContain("Raspberry Pi Pico 2 W, with its header pins");
    expect(list).not.toContain("Micro-USB");
  });

  it("has no script to copy, and says to disconnect the supply rather than the cable", () => {
    expect(html).not.toContain('id="script"');
    expect(html).not.toContain("Thonny");
    expect(html).toContain("Disconnect the supply while you change the wiring.");
    expect(html).not.toContain("Unplug the USB cable");
    expect(html).toContain("+ rail: 3 V");
    expect(html).toContain(`A 3 V supply to the left of the breadboard.`);
  });

  it("still credits the drawing it is made by, in its circuit's own credit (ADR 0018, ADR 0035)", () => {
    expect(html).toContain(`<footer>\n    ${circuit.credit}\n  </footer>`);
    expect(circuit.credit).toContain("creativecommons.org/licenses/by-sa/4.0");
    expect(circuit.credit).not.toStartWith("The Pico");
    expect(circuit.supply?.volts).toBe(3);
  });

  it("writes the voltage as each language does", () => {
    expect(PAGE_WORDS.en.volts(4.5)).toBe("4.5 V");
    expect(PAGE_WORDS.fr.volts(4.5)).toBe("4,5 V");
    expect(PAGE_WORDS.ru.volts(3.7)).toBe("3,7 В");
  });
});

describe("a d-pad's page, its two jumpers arching over the board (scratchpi's ADR 0166)", () => {
  it("says which two jumpers are long ones that arch over the board", () => {
    const html = page("d-pad");
    expect(steps(html).match(/A long yellow jumper from/g)).toHaveLength(2);
    expect(steps(html).match(/arching over the board\./g)).toHaveLength(2);
    expect(html).toContain("Yellow jumper wires, long and flexible: about 10 cm.");
    // And the other yellow ones are short, counted apart.
    expect(html).toMatch(/<span class="count">2<\/span><span>Yellow jumper wires, short\.<\/span>/);
  });

  it("says the same in French", () => {
    const html = frenchPage("d-pad");
    expect(steps(html).match(/Un long fil jaune de/g)).toHaveLength(2);
    expect(steps(html).match(/qui passe par-dessus la plaque\./g)).toHaveLength(2);
    expect(words(html)).toContain("Fils de connexion jaunes, longs et souples");
  });

  it("is, with the two circuits that build on it, the only one with a jumper off the board", () => {
    for (const id of FIXTURE_IDS) {
      if (id === "d-pad" || id === "rgb-led-and-d-pad" || id === "ring-and-button") continue;
      expect(page(id)).not.toContain("arching over the board");
    }
  });
});

describe("an RGB LED's page, on two breadboards (scratchpi's ADR 0226)", () => {
  it("takes 5 V, ground and GP28 up to the second breadboard, and says which board", () => {
    const html = steps(page("rgb-led-and-d-pad"));
    expect(html).toContain(
      'A red jumper from <span class="hole">a2</span> (VBUS, pin 40) to <span class="hole">j2</span> on the second breadboard.',
    );
    expect(html).toContain(
      'A yellow jumper from <span class="hole">a8</span> (GP28, pin 34) to <span class="hole">j8</span> on the second breadboard.',
    );
    // The model's name for a second board's hole is never what a reader sees.
    expect(page("rgb-led-and-d-pad")).not.toMatch(/\b2:(?:[a-j]\d|top|bottom)/);
  });

  it("stands the LED in four holes side by side, naming its legs in the guide's order", () => {
    expect(steps(page("rgb-led-and-d-pad"))).toContain(
      'The RGB LED, its legs in <span class="hole">f2</span>, <span class="hole">f3</span>, <span class="hole">f4</span> and <span class="hole">f5</span> on the second breadboard: +5 V, then data out, the longest, then ground, then data in.',
    );
  });

  it("lists two breadboards and the LED, and no resistor for it", () => {
    const html = page("rgb-led-and-d-pad");
    expect(html).toMatch(
      /<span class="count">2<\/span><span>Half-size breadboards: 30 columns each/,
    );
    expect(html).toContain("RGB LED: a 10 mm addressable LED. It needs no resistor.");
    expect(html).not.toContain("works for a light");
    expect(html).toContain("turned round, it would put 5 V on GP28");
    expect(html).toContain("An RGB LED and a d-pad, on two half-size breadboards");
  });

  it("warns of the pin the LED's data is on, wherever its circuit puts it", () => {
    const { circuit, layout } = FIXTURES["rgb-led-and-d-pad"];
    const moved: ShownCircuit = {
      ...circuit,
      leds: circuit.leds.map((led) =>
        led.colour === "rgb" ? { ...led, pin: { ...led.pin, gpio: 27 } } : led,
      ),
    };
    const html = wiringPage(moved, layout, FILES);
    expect(html).toContain("turned round, it would put 5 V on GP27");
    expect(html).not.toContain("5 V on GP28");
  });

  it("draws the second board, above the first, only on a page that uses it", () => {
    const boards = (html: string) => html.match(/<g class="breadboard"/g)?.length ?? 0;
    // The RGB LED's, and a slide potentiometer's, which lies across both (ADR 0053).
    const two: readonly FixtureId[] = [
      "rgb-led-and-d-pad",
      "slide-potentiometer-read-by-an-analogue-pin",
    ];
    for (const id of two) {
      expect(boards(page(id))).toBe(2);
      expect(page(id)).toContain('<g class="breadboard" transform="translate(0 -53.34)">');
    }
    for (const id of FIXTURE_IDS) if (!two.includes(id)) expect(boards(page(id))).toBe(1);
  });

  it("says it in French", () => {
    const html = steps(frenchPage("rgb-led-and-d-pad"));
    expect(html).toContain(
      'Un fil rouge de <span class="hole">a2</span> (VBUS, broche 40) à <span class="hole">j2</span> de la seconde plaque.',
    );
    expect(html).toContain("La LED RVB, ses pattes en");
    expect(frenchPage("rgb-led-and-d-pad")).toContain("à l’envers, elle mettrait 5 V sur GP28");
  });
});

describe("a ring's page, the ring laid out below the board (scratchpi's ADR 0238)", () => {
  it("brings 5 V from VBUS in a jumper that arches over the board, then across the channel", () => {
    const html = steps(page("ring-and-button"));
    expect(html).toContain(
      'A long red jumper from <span class="hole">a2</span> (VBUS, pin 40) to <span class="hole">a28</span>, arching over the board.',
    );
    expect(html).toContain(
      'A red jumper from <span class="hole">e28</span> to <span class="hole">f28</span>.',
    );
    expect(html).toContain(
      'A black jumper from <span class="hole">e27</span> to <span class="hole">f27</span>.',
    );
  });

  it("names each of the ring's four pins by its hole, and its data from GP15", () => {
    const html = steps(page("ring-and-button"));
    expect(html).toContain(
      'The LED ring, standing up: data in in <span class="hole">j29</span>, 5 V in <span class="hole">j28</span>, ground in <span class="hole">j27</span> and data out in <span class="hole">j26</span>.',
    );
    expect(html).toContain(
      'A yellow jumper from <span class="hole">i21</span> (GP15, pin 20) to <span class="hole">i29</span>.',
    );
  });

  it("lists the ring and one breadboard, and warns which way round it goes", () => {
    const html = page("ring-and-button");
    expect(html).toMatch(/<span class="count">1<\/span><span>Half-size breadboard: 30 columns/);
    expect(html).toContain(
      "LED ring: twelve addressable RGB LEDs in a ring about 48 mm across, with a header of four pins. It needs no resistor.",
    );
    expect(html).toContain("turned round, it would put 5 V on GP15");
    expect(html).not.toContain("works for a light");
  });

  it("draws the ring's twelve LEDs, from LED 0 by the header, below the board", () => {
    const html = page("ring-and-button");
    const leds = [
      ...html.matchAll(/<g data-led="(\d+)" transform="translate\(([\d.]+) ([\d.]+)\)/g),
    ];
    expect(leds.map((match) => match[1])).toEqual(Array.from({ length: 12 }, (_, i) => String(i)));
    const ys = leds.map((match) => Number(match[3]));
    // LED 0 is the highest, nearest the header, and every LED is below the board's middle rows.
    expect(ys[0]).toBe(Math.min(...ys));
    expect(Math.min(...ys)).toBeGreaterThan(40);
    // The picture reaches down past the ring.
    const [, top, , height] = (/viewBox="([^"]+)"/.exec(html)?.[1] ?? "").split(" ").map(Number);
    expect((top ?? 0) + (height ?? 0)).toBeGreaterThan(Math.max(...ys) + 5);
    // Only its own page has one.
    for (const id of FIXTURE_IDS) {
      if (id !== "ring-and-button") expect(page(id)).not.toContain('data-kind="ring">');
    }
  });

  it("says it in French", () => {
    const html = steps(frenchPage("ring-and-button"));
    expect(words(html)).toContain("L’anneau de LED, debout");
    expect(html).toContain("passe par-dessus la plaque");
  });
});

describe("a motion sensor's page, the sensor beside the board (ADR 0055, ADR 0056)", () => {
  const ID = "motion-sensor-and-light";

  it("says where each of its three jumpers goes, from the pin of its name", () => {
    expect(steps(page(ID))).toContain(
      'The motion sensor, beside the board, dome up: a red jumper from its VCC pin to <span class="hole">a2</span> (VBUS, pin 40), a yellow one from its OUT pin to <span class="hole">a13</span> (GP22, pin 29) and a black one from its GND pin to <span class="hole">a14</span> (GND, pin 28).',
    );
  });

  it("lists the sensor and its three jumpers, and says to plug them on by name", () => {
    const html = page(ID);
    expect(html).toContain(
      '<span class="count">1</span><span>Motion sensor: a PIR module with three pins, VCC, OUT and GND, that runs on 5 V. Its OUT gives 3.3 V while it sees movement.</span>',
    );
    expect(html).toContain(
      '<span class="count">3</span><span>Female-to-male jumpers, about 20 cm: a red, a yellow and a black one for each motion sensor, to go on its pins.</span>',
    );
    expect(html).toContain("Push each jumper onto the pin of its name");
    // Only its own page has one.
    for (const id of FIXTURE_IDS) {
      if (id !== ID) expect(page(id)).not.toContain("motion sensor");
    }
  });

  it("tags the three pins its jumpers reach, labels it by its name, and is picked out by the test", () => {
    const html = page(ID);
    for (const label of ["VBUS", "GP22", "GND"]) expect(html).toContain(`>${label}</text>`);
    expect(html).toContain('class="callout-title">motion sensor</text>');
    expect(html).toContain('class="callout-detail">OUT to a13</text>');
    expect(html).toContain('data-g="step-2 test" data-kind="pir">');
  });

  it("says it in French", () => {
    const html = frenchPage(ID);
    expect(words(steps(html))).toContain(
      "Le détecteur de mouvement, à côté de la plaque, dôme en haut",
    );
    expect(words(html)).toContain("Fils de connexion femelle-mâle");
  });

  it("says it in Russian, held to its typography and to Nunito's letters (ADR 0011)", () => {
    const { circuit, layout } = FIXTURES[ID];
    const html = wiringPage(
      {
        ...circuit,
        name: "Датчик движения и светодиод",
        description: "Испытательная схема.",
        credit: "Рисунок по технической документации Pico 2 W.",
        leds: circuit.leds.map((led) => ({ ...led, name: "Красный светодиод" })),
      },
      {
        ...layout,
        steps: layout.steps.map((step, index) => ({
          title: `Шаг ${index + 2}`,
          parts: step.parts.map((part) =>
            part.kind === "pir" ? { ...part, name: "Датчик движения" } : part,
          ),
        })),
        test: "Скрипт зажигает светодиод.",
      },
      FILES,
      { language: "ru" },
    );
    const prose = html
      .slice(html.indexOf("<body>"))
      .replace(/<(script|style|pre)[\s\S]*?<\/\1>/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");
    expect(prose).toContain(
      "Датчик движения, рядом с платой, куполом вверх: красная перемычка от вывода VCC в a2 (VBUS, вывод 40)",
    );
    expect(prose).toContain("Перемычка мама-папа, около 20 см");
    for (const english of ["jumper", "sensor", " the ", " and "]) {
      expect(prose).not.toContain(english);
    }
    expect(prose).not.toMatch(/\s[:;?!]/);
    const lacking = new Set([...written(html)].filter((c) => !fileOf(c)));
    expect([...lacking]).toEqual([]);
  });
});

describe("a button's cap on its page (scratchpi's ADR 0174)", () => {
  const WITH_BUTTONS = FIXTURE_IDS.filter((id) => FIXTURES[id].circuit.buttons.length > 0);

  it("is on most of the test circuits", () => {
    expect(WITH_BUTTONS.length).toBeGreaterThan(3);
  });

  it.each(WITH_BUTTONS)("names each cap's colour on %s, in its step and its parts", (id) => {
    const html = page(id);
    for (const button of FIXTURES[id].circuit.buttons) {
      expect(steps(html)).toContain(`${button.name}, the ${button.colour} button,`);
      expect(html).toContain(
        `${button.name}: a 6 mm tactile switch with four legs, and a ${button.colour} cap.`,
      );
    }
  });

  it("lists the buttons BTN1 first, whatever order they are built in", () => {
    const listed = [...page("d-pad").matchAll(/(BTN\d): a 6 mm tactile switch/g)].map(
      (match) => match[1],
    );
    expect(listed).toEqual(["BTN1", "BTN2", "BTN3", "BTN4"]);
  });

  it("says it in French, agreeing with bouton and capuchon", () => {
    const html = frenchPage("d-pad");
    expect(steps(html)).toContain("BTN1, le bouton rouge, à cheval sur la rainure centrale");
    expect(steps(html)).toContain("BTN3, le bouton bleu, au-dessus de la rainure centrale");
    // The narrow no-break space is written as Nunito's thin space (ADR 0012).
    expect(words(html)).toContain(
      "BTN4\u2009: un interrupteur tactile de 6 mm à quatre pattes, avec un capuchon jaune.",
    );
  });

  it.each(WITH_BUTTONS)("draws each cap on %s in its button's colour", (id) => {
    const { circuit, layout } = FIXTURES[id];
    const drawn = [...page(id).matchAll(/r="1\.85" fill="var\(--color-led-(\w+)\)"/g)].map(
      (match) => match[1],
    );
    const laid = layout.steps
      .flatMap((step) => step.parts)
      .flatMap((part) =>
        part.kind === "button"
          ? [circuit.buttons.find((button) => button.id === part.button)?.colour]
          : [],
      );
    expect(laid.length).toBeGreaterThan(0);
    expect(drawn).toEqual(laid);
  });
});

describe.each([...FIXTURE_IDS])("the French page for %s", (id) => {
  const { circuit } = inFrench(FIXTURES[id]);
  const html = frenchPage(id);
  const english = page(id);
  /** What a reader sees, without the markup, the script or the drawing's own labels. */
  const prose = html
    .replace(/<script>[\s\S]*?<\/script>/g, "")
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/<pre[\s\S]*?<\/pre>/g, "")
    .replace(/<code>[\s\S]*?<\/code>/g, "")
    .replace(/<[^>]+>/g, " ");

  it("is in French, headed by the circuit's own name", () => {
    expect(html).toContain('<html lang="fr"');
    expect(html).toContain(`<title>${circuit.name}</title>`);
    expect(html).toContain(`<h1>${circuit.name}</h1>`);
    expect(html).toContain(circuit.description);
  });

  it("builds the same circuit as the English page, step for step", () => {
    const count = (each: string) => (each.match(/<button class="step"/g) ?? []).length;
    expect(count(html)).toBe(count(english));
    const groups = (each: string) => [...each.matchAll(/data-g="([^"]+)"/g)].map((m) => m[1]);
    expect(groups(html)).toEqual(groups(english));
    const holes = (each: string) => [...each.matchAll(/class="hole">([^<]+)</g)].map((m) => m[1]);
    expect(holes(html)).toEqual(holes(english));
  });

  it("says nothing in English that a reader would read", () => {
    for (const words of [
      "jumper",
      "resistor",
      "long leg",
      "short leg",
      "the channel",
      "Build it",
      "Parts",
      "Test it from Thonny",
      ">Copy<",
      "rail:",
      "Plug the USB",
      "Tap a step",
      "breadboard",
      "is drawn from",
      " the ",
      " and ",
    ]) {
      expect(prose).not.toContain(words);
    }
  });

  it("writes French typography: a narrow no-break space before : ; ? ! (ADR 0011)", () => {
    expect(prose).not.toMatch(/ [:;?!]/);
  });

  it("credits the drawing in its circuit's French, and has no tooltip", () => {
    expect(html).toContain("sous licence CC BY-SA 4.0.\n  </footer>");
    expect(html).not.toMatch(/\stitle="/);
  });
});

describe("French's grammar, where a sentence is built", () => {
  const fr = PAGE_WORDS.fr;
  const rail = { kind: "rail", side: "top", sign: "−" } as const;
  const hole = { kind: "hole", html: "a21" } as const;

  it("contracts à and de before a rail, and places a hole the way a board game does", () => {
    expect(fr.from(rail)).toBe("du rail − du haut");
    expect(fr.to(rail)).toBe("au rail − du haut");
    expect(fr.in(rail)).toBe("dans le rail − du haut");
    expect(fr.from(hole)).toBe("de a21");
    expect(fr.to(hole)).toBe("à a21");
    expect(fr.in(hole)).toBe("en a21");
  });

  it("gives a light la, a buzzer le, and either l’ before a vowel", () => {
    expect(fr.led("LED rouge", hole, hole)).toMatch(/^La LED rouge/);
    expect(fr.buzzer("buzzer", hole, hole)).toMatch(/^Le buzzer/);
    expect(fr.led("ampoule", hole, hole)).toMatch(/^L’ampoule/);
  });

  it("starts a button with its name, which takes no article, then its cap", () => {
    expect(fr.button("BTN1", "red", "across", ["a23"], false)).toMatch(
      /^BTN1, le bouton rouge, à cheval sur la rainure centrale/,
    );
    expect(fr.button("BTN2", "green", "above", ["a23"], false)).toMatch(/^BTN2, le bouton vert/);
    expect(fr.listButton("BTN3", "blue")).toMatch(/avec un capuchon bleu\.$/);
  });

  it("says once that a button's legs are on the second breadboard (ADR 0028)", () => {
    expect(fr.button("BTN1", "red", "across", ["e5", "f5"], true)).toMatch(
      /ses pattes en e5 et f5 de la seconde plaque\.$/,
    );
    expect(fr.button("BTN1", "red", "across", ["e5", "f5"], false)).toMatch(/en e5 et f5\.$/);
  });

  it("agrees a wire's colour with how many there are, and writes a decimal with a comma", () => {
    expect(fr.wire("ground", 1)).toBe("noir");
    expect(fr.wire("ground", 2)).toBe("noirs");
    expect(fr.listWire(fr.wire("ground", 2), 2)).toBe("Fils de connexion noirs, courts.");
    expect(fr.ohms(4700)).toBe("4,7 kΩ");
    expect(fr.band("1")).toBe("marron");
    expect(fr.band("gold")).toBe("or");
  });
});

/** Every character the page's body writes in Nunito: not its code, its styles or its script. */
const written = (html: string): Set<string> =>
  new Set(
    html
      .slice(html.indexOf("<body>"))
      .replace(/<(script|style|pre)[\s\S]*?<\/\1>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/[\n\t]/g, ""),
  );

describe("the page's font (ADR 0012)", () => {
  const pages = FIXTURE_IDS.flatMap((id) => [page(id), frenchPage(id)]);

  it("is Nunito, carried inside the page under ratsnest's own family name", () => {
    const html = page("two-lights");
    const faces = html.match(/@font-face\{[^}]*\}/g) ?? [];
    expect(faces).toHaveLength(1);
    expect(faces[0]).toContain(`font-family:"${FONT_FAMILY}"`);
    expect(faces[0]).toContain("font-weight:200 1000");
    expect(faces[0]).toContain("src:url(data:font/woff2;base64,");
    expect(html).not.toContain("fonts.googleapis");
    expect(FILES.tokens).toContain(`--font-page: "${FONT_FAMILY}"`);
  });

  it("carries the Cyrillic file only on a page that writes Cyrillic", () => {
    const { circuit, layout } = FIXTURES["two-lights"];
    const cyrillic = wiringPage({ ...circuit, name: "Два светодиода" }, layout, FILES);
    expect(cyrillic.match(/@font-face/g)).toHaveLength(2);
    expect(cyrillic).toContain(Buffer.from(CYRILLIC.bytes).toString("base64").slice(0, 64));
  });

  it("has every character any test circuit's page writes, in either language", () => {
    const lacking = new Set(pages.flatMap((html) => [...written(html)].filter((c) => !fileOf(c))));
    expect([...lacking]).toEqual([]);
  });

  it("writes no narrow no-break space, which Nunito lacks, and holds its words together instead", () => {
    for (const html of pages) {
      expect(html.slice(0, html.indexOf("<pre")).includes("\u202f")).toBe(false);
    }
    const french = frenchPage("d-pad");
    expect(french).toContain('<span class="nowrap">BTN4\u2009:</span>');
    // In the drawing nothing wraps, so the thin space stands alone there.
    const drawing = french.slice(french.indexOf("<svg"), french.indexOf("</svg>"));
    expect(drawing).not.toContain("nowrap");
  });
});

describe("a page's inputs (ADR 0004, ADR 0005, ADR 0013)", () => {
  const { circuit, layout } = FIXTURES["two-lights"];

  it("names all four in its meta tag, so a page whose file is gone can still be found", () => {
    const html = wiringPage(circuit, layout, FILES, {
      circuit: "two-lights",
      orientation: 270,
      theme: "light",
      language: "fr",
    });
    expect(html).toContain(
      '<meta name="ratsnest" content="circuit=two-lights;orientation=270;theme=light;language=fr">',
    );
  });

  it("is drawn in the theme it is given, which nothing on it switches", () => {
    const light = wiringPage(circuit, layout, FILES, { theme: "light" });
    expect(light).toContain('<html lang="en" data-theme="light">');
    // The light scale is the root's own; only the dark one overrides it.
    expect(FILES.tokens).toMatch(/:root \{\s*color-scheme: light;/);
  });

  it("draws the board the same in both themes, since it is a drawing of an object", () => {
    const drawing = (theme: "dark" | "light") => {
      const html = wiringPage(circuit, layout, FILES, { theme });
      return html.slice(html.indexOf("<svg"), html.indexOf("</svg>"));
    };
    expect(drawing("light")).toBe(drawing("dark"));
  });

  it("is titled by its circuit's name alone, as an Artifact's page is (ADR 0013)", () => {
    expect(wiringPage(circuit, layout, FILES)).toContain(`<title>${circuit.name}</title>`);
  });
});

describe("a page in Russian (ADR 0010, ADR 0011)", () => {
  const { circuit, layout } = shownIn(TRILINGUAL, "ru");
  const html = wiringPage(circuit, layout, FILES, { language: "ru" });
  /** What a reader reads, without the markup, the script or the styles. */
  const prose = html
    .slice(html.indexOf("<body>"))
    .replace(/<(script|style|pre)[\s\S]*?<\/\1>/g, "")
    .replace(/<[^>]+>/g, " ");

  it("says its language, and carries the Cyrillic file it needs (rule 9, ADR 0012)", () => {
    expect(html).toContain('<html lang="ru"');
    expect(html.match(/@font-face/g)).toHaveLength(2);
  });

  it("says nothing in English that a reader would read", () => {
    for (const words of [
      "jumper",
      "resistor",
      "leg",
      "Build it",
      "Parts",
      "breadboard",
      " the ",
      " and ",
    ]) {
      expect(prose).not.toContain(words);
    }
  });

  it("writes Russian typography: no space before : ; ? !, and no straight quotes (rule 8)", () => {
    expect(prose).not.toMatch(/\s[:;?!]/);
    expect(prose).not.toContain('"');
  });

  it("writes its values in Russian, the drawing's included (rule 7)", () => {
    expect(prose).toContain("4,7 кОм");
    expect(html).not.toContain("4.7 kΩ");
  });

  it("writes every letter in Nunito's files", () => {
    const lacking = new Set([...written(html)].filter((c) => !fileOf(c)));
    expect([...lacking]).toEqual([]);
  });
});

describe("a page with diodes (ADR 0049)", () => {
  const { circuit, layout } = FIXTURES["lights-kept-apart-by-diodes"];
  const inLanguage = (language: "en" | "fr" | "ru") =>
    words(steps(wiringPage(circuit, layout, FILES, { language })));

  it("says where each diode's anode goes, and its cathode, at its band", () => {
    expect(inLanguage("en")).toContain(
      "A 1N4007 diode: its anode in i14, and its cathode, at the band, in i18.",
    );
    expect(inLanguage("en")).toContain(
      "A 1N4148 diode: its anode in j23, and its cathode, at the band, in j18.",
    );
  });

  it("lists each model by what it is sold as, and its case", () => {
    expect(inLanguage("en")).toContain("11N4007 rectifier diode, in a black case.");
    expect(inLanguage("en")).toContain("11N4148 signal diode, in an orange glass case.");
  });

  it("notes which way round a diode goes, and that any model it knows does on a light's way", () => {
    const html = page("lights-kept-apart-by-diodes");
    expect(html).toContain(PAGE_WORDS.en.diodePolarity);
    expect(html).toContain("The 1N4148, 1N4001 and 1N4007 all do on a light's way");
  });

  it("says it in French and Russian, every character in Nunito's files", () => {
    expect(inLanguage("fr")).toContain("Diode de redressement 1N4007, en boîtier noir.");
    expect(inLanguage("ru")).toContain("Импульсный диод 1N4148 в оранжевом стеклянном корпусе.");
    for (const language of ["fr", "ru"] as const) {
      const html = wiringPage(circuit, layout, FILES, { language });
      expect([...written(html)].filter((c) => !fileOf(c))).toEqual([]);
    }
  });
});

describe("a page with a ceramic capacitor (ADR 0051)", () => {
  const { circuit, layout } = FIXTURES["capacitor-timed-by-two-pins"];
  const inLanguage = (language: "en" | "fr" | "ru") =>
    words(steps(wiringPage(circuit, layout, FILES, { language })));

  it("says where its legs go, either way round, and the code it is marked with", () => {
    expect(inLanguage("en")).toContain(
      "A 47 nF ceramic capacitor, marked 473, either way round: one leg in f26 and the other in f27.",
    );
  });

  it("lists it by its value and its code", () => {
    expect(inLanguage("en")).toContain("147 nF ceramic capacitor, marked 473.");
  });

  it("notes how its code says its value, and what its resistor can be", () => {
    const html = page("capacitor-timed-by-two-pins");
    expect(html).toContain(PAGE_WORDS.en.ceramicCode("473", "47 nF"));
    expect(html).toContain(PAGE_WORDS.en.chargeResistor("1 kΩ", "8.2 kΩ"));
  });

  it("picks the capacitor out in its test step, since its script times it", () => {
    expect(page("capacitor-timed-by-two-pins")).toContain(
      'data-g="step-2 test" data-kind="ceramic"',
    );
  });

  it("says it in French and Russian, every character in Nunito's files", () => {
    expect(inLanguage("fr")).toContain("Condensateur céramique de 47 nF, marqué 473.");
    expect(inLanguage("ru")).toContain("Керамический конденсатор 47 нФ, маркировка 473.");
    for (const language of ["fr", "ru"] as const) {
      const html = wiringPage(circuit, layout, FILES, { language });
      expect([...written(html)].filter((c) => !fileOf(c))).toEqual([]);
    }
  });
});

describe("a page with a slide switch (ADR 0052)", () => {
  const { circuit, layout } = FIXTURES["lights-chosen-by-a-slide-switch"];
  const inLanguage = (language: "en" | "fr" | "ru") =>
    words(steps(wiringPage(circuit, layout, FILES, { language })));

  it("says where its middle leg goes, and its outer ones, either way round", () => {
    expect(inLanguage("en")).toContain(
      "A slide switch, either way round: its middle leg in f20, one outer leg in f19 and the other in f21.",
    );
  });

  it("lists it with its legs a breadboard's pitch apart", () => {
    expect(inLanguage("en")).toContain(
      "1SPDT slide switch, its three legs 2.54 mm apart, as a breadboard's holes are.",
    );
  });

  it("notes that it stays as it is slid, as a button does not", () => {
    expect(page("lights-chosen-by-a-slide-switch")).toContain(PAGE_WORDS.en.slideSwitchNote);
  });

  it("picks the switch out in its test step, since the reader slides it", () => {
    expect(page("lights-chosen-by-a-slide-switch")).toContain(
      'data-g="step-1 test" data-kind="slideSwitch"',
    );
  });

  it("says it in French and Russian, every character in Nunito's files", () => {
    expect(inLanguage("fr")).toContain(
      "sa patte du milieu en f20, une patte extérieure en f19 et l’autre en f21.",
    );
    expect(inLanguage("ru")).toContain(
      "Ползунковый переключатель SPDT: три ножки с шагом 2,54 мм, как отверстия макетной платы.",
    );
    for (const language of ["fr", "ru"] as const) {
      const html = wiringPage(circuit, layout, FILES, { language });
      expect([...written(html)].filter((c) => !fileOf(c))).toEqual([]);
    }
  });
});

describe("a page with a slide potentiometer (ADR 0053)", () => {
  const { circuit, layout } = FIXTURES["slide-potentiometer-read-by-an-analogue-pin"];
  const inLanguage = (language: "en" | "fr" | "ru") =>
    words(steps(wiringPage(circuit, layout, FILES, { language })));

  it("says where its wiper goes, and each end, across both breadboards", () => {
    expect(inLanguage("en")).toContain(
      "A 10 kΩ slide potentiometer, lying across both breadboards: its wiper in a11 (GP26, pin 31), the end beside it in a9 (AGND, pin 33), and its other end in e9 on the second breadboard.",
    );
  });

  it("lists it by its value and its length", () => {
    expect(inLanguage("en")).toContain(
      "110 kΩ slide potentiometer, 45 mm long, with two legs at one end and one at the other, and a cap for the knob.",
    );
  });

  it("notes which leg is its wiper, and the analogue pins it may go to", () => {
    expect(page("slide-potentiometer-read-by-an-analogue-pin")).toContain(
      PAGE_WORDS.en.slidePotentiometerWiper(["GP26", "GP27", "GP28"]),
    );
  });

  it("picks the potentiometer out in its test step, since the reader slides it", () => {
    expect(page("slide-potentiometer-read-by-an-analogue-pin")).toContain(
      'data-g="step-1 test" data-kind="slidePotentiometer"',
    );
  });

  it("says it in French and Russian, every character in Nunito's files", () => {
    expect(inLanguage("fr")).toContain(
      "son curseur en a11 (GP26, broche 31), l’extrémité à côté en a9 (AGND, broche 33)",
    );
    expect(inLanguage("ru")).toContain("Ползунковый потенциометр 10 кОм, длиной 45 мм");
    for (const language of ["fr", "ru"] as const) {
      const html = wiringPage(circuit, layout, FILES, { language });
      expect([...written(html)].filter((c) => !fileOf(c))).toEqual([]);
    }
  });
});

describe("a page with a DIP switch (ADR 0054)", () => {
  const { circuit, layout } = FIXTURES["switches-read-by-pull-ups"];
  const inLanguage = (language: "en" | "fr" | "ru") =>
    words(steps(wiringPage(circuit, layout, FILES, { language })));

  it("says which way round it goes, and where its first and last switches' legs are", () => {
    expect(inLanguage("en")).toContain(
      "A 2-way DIP switch across the channel, its ON side towards row a: switch 1 in e22 and f22, and switch 2 in e23 and f23.",
    );
  });

  it("lists it by how many switches it has", () => {
    expect(inLanguage("en")).toContain(
      "12-way DIP switch, with its legs in two rows 7.62 mm apart, to go across the channel.",
    );
  });

  it("notes that its switches go to ground, read through the Pico's own pull-ups", () => {
    expect(page("switches-read-by-pull-ups")).toContain(PAGE_WORDS.en.dipPullUp);
  });

  it("picks the switch out in its test step, since the reader turns its switches", () => {
    expect(page("switches-read-by-pull-ups")).toContain(
      'data-g="step-2 test" data-kind="dipSwitch"',
    );
  });

  it("says it in French and Russian, every character in Nunito's files", () => {
    expect(inLanguage("fr")).toContain("l’interrupteur 1 en e22 et f22");
    expect(inLanguage("ru")).toContain("DIP-переключатель на 2 позиции");
    for (const language of ["fr", "ru"] as const) {
      const html = wiringPage(circuit, layout, FILES, { language });
      expect([...written(html)].filter((c) => !fileOf(c))).toEqual([]);
    }
  });
});
