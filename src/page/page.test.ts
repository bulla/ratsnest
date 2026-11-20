import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { FIXTURE_IDS, FIXTURES, type Fixture, type FixtureId } from "../__fixtures__/circuits";
import type { Layout, ShownCircuit } from "../circuit";
import { PAGE_THEME, PAGE_WORDS, type PageFiles, wiringPage } from "./page";

const read = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");

const FILES: PageFiles = {
  tokens: read("./tokens.css"),
  css: read("./page.css"),
  script: read("./steps.js"),
};

const page = (id: FixtureId, language: "en" | "fr" = "en") =>
  wiringPage(FIXTURES[id].circuit, FIXTURES[id].layout, FILES, language);

/** The steps, not the drawing's description, which says every sentence again. */
const steps = (html: string) => html.slice(html.indexOf('<ol class="steps">'));

/** Every GPIO a circuit's components are on. */
const gpiosOf = (circuit: ShownCircuit): number[] => [
  ...circuit.leds.map((led) => led.pin.gpio),
  ...circuit.buttons.map((button) => button.pin.gpio),
  ...circuit.buzzers.map((buzzer) => buzzer.pin.gpio),
];

/** A part's name in the French test circuits, which are the fixtures written in French. */
const FRENCH_NAMES: Readonly<Record<string, string>> = {
  "red LED": "LED rouge",
  "green LED": "LED verte",
  "RGB LED": "LED RVB",
  "LED ring": "anneau de LED",
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
      leds: circuit.leds.map(named),
      buttons: circuit.buttons.map(named),
      buzzers: circuit.buzzers.map(named),
    },
    layout: {
      ...layout,
      steps: layout.steps.map((step, index) => ({
        title: `Étape ${index + 2}`,
        parts: step.parts,
      })),
      scriptDoes: "Le script fait marcher chaque composant à son tour.",
    },
  };
}

const frenchPage = (id: FixtureId) => {
  const french = inFrench(FIXTURES[id]);
  return wiringPage(french.circuit, french.layout, FILES, "fr");
};

describe.each([...FIXTURE_IDS])("the page for %s", (id) => {
  const { circuit, layout } = FIXTURES[id];
  const html = page(id);

  it("is headed by the circuit, and links nowhere else on the site", () => {
    expect(html).toContain(`<title>${circuit.name} · ratsnest</title>`);
    expect(html).toContain(`<h1>${circuit.name}</h1>`);
    expect(html).toContain(circuit.description);
    // No back link, no twin in another language: a page is one asset (ADR 0004).
    expect(html).not.toContain("<nav");
    expect(html).not.toContain("hreflang");
    expect(html).not.toMatch(/href="\//);
  });

  it("is drawn in one scale, which nothing on it switches (ADR 0005)", () => {
    expect(html).toContain(`<html lang="en" data-theme="${PAGE_THEME}">`);
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

  it("has a step for the Pico, one for each of the layout's, and one to test it", () => {
    expect(html.match(/<button class="step"/g) ?? []).toHaveLength(layout.steps.length + 2);
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
    const used = gpiosOf(circuit);
    for (const step of layout.steps) {
      for (const [, gpio] of `${step.title} ${step.note ?? ""}`.matchAll(/GP(\d+)/g)) {
        expect(used).toContain(Number(gpio));
      }
    }
  });

  it("tests every part on the pin its circuit puts it on, shown as it is written", () => {
    for (const gpio of gpiosOf(circuit)) expect(layout.script).toContain(`Pin(${gpio}`);
    // Escaped the way the page escapes it: a script that prints a string has quotes in it.
    const shown = layout.script
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    expect(html).toContain(shown);
  });

  it("credits the board drawing it adapts (ADR 0018)", () => {
    expect(html).toContain("creativecommons.org/licenses/by-sa/4.0");
    expect(html).toContain("Raspberry Pi Ltd");
  });

  it("has no tooltip on anything, the browser's included", () => {
    expect(html).not.toMatch(/\stitle="/);
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
    expect(html).toContain("Fils de connexion jaunes, longs et souples");
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
    expect(html).toContain("RGB LED: a 10 mm addressable LED");
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

  it("draws the second board, above the first, only on its own page", () => {
    const boards = (html: string) => html.match(/<g class="breadboard"/g)?.length ?? 0;
    expect(boards(page("rgb-led-and-d-pad"))).toBe(2);
    expect(page("rgb-led-and-d-pad")).toContain(
      '<g class="breadboard" transform="translate(0 -53.34)">',
    );
    for (const id of FIXTURE_IDS) if (id !== "rgb-led-and-d-pad") expect(boards(page(id))).toBe(1);
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
    expect(html).toContain("LED ring: twelve addressable RGB LEDs in a ring about 48 mm across");
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
    expect(html).toContain("L’anneau de LED, debout");
    expect(html).toContain("passe par-dessus la plaque");
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
    expect(html).toContain(
      "BTN4 : un interrupteur tactile de 6 mm à quatre pattes, avec un capuchon jaune.",
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
    expect(html).toContain(`<title>${circuit.name} · ratsnest</title>`);
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

  it("credits the board drawing it adapts, and has no tooltip", () => {
    expect(html).toContain("creativecommons.org/licenses/by-sa/4.0");
    expect(html).toContain("Raspberry Pi Ltd");
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
    expect(fr.button("BTN1", "red", "across", ["a23"])).toMatch(
      /^BTN1, le bouton rouge, à cheval sur la rainure centrale/,
    );
    expect(fr.button("BTN2", "green", "above", ["a23"])).toMatch(/^BTN2, le bouton vert/);
    expect(fr.listButton("BTN3", "blue")).toMatch(/avec un capuchon bleu\.$/);
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
