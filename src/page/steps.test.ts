import { afterEach, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { FIXTURES, type FixtureId } from "../__fixtures__/circuits";
import { type PageFiles, wiringPage } from "./page";

/**
 * The page's own script, run by jsdom on the page it is inlined into (ADR 0009), as a browser
 * runs it: once, as the page loads.
 */
const read = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");

const FILES: PageFiles = {
  tokens: read("./tokens.css"),
  css: read("./page.css"),
  script: read("./steps.js"),
};

const opened: JSDOM[] = [];

afterEach(() => {
  // A window left open keeps the Copy button's timer, and the test run, alive.
  for (const dom of opened.splice(0)) dom.window.close();
});

/** Opens a test circuit's page with its script running. */
function open(id: FixtureId = "light-and-button") {
  const { circuit, layout } = FIXTURES[id];
  const dom = new JSDOM(wiringPage(circuit, layout, FILES), { runScripts: "dangerously" });
  opened.push(dom);
  const document = dom.window.document;
  const steps = [...document.querySelectorAll<HTMLButtonElement>(".step")];
  const drawing = document.querySelector(".breadboard-drawing");
  if (!drawing) throw new Error("The page has no drawing");
  /** The groups of every part picked out in the drawing. */
  const lit = () =>
    [...drawing.querySelectorAll(".part.on")].map((part) => part.getAttribute("data-g") ?? "");
  return { dom, document, steps, drawing, lit };
}

describe("a page's steps", () => {
  it("pick out nothing until one is tapped", () => {
    const { steps, drawing, lit } = open();
    expect(steps.length).toBeGreaterThan(2);
    expect(lit()).toEqual([]);
    expect(drawing.classList.contains("focus")).toBe(false);
    for (const step of steps) expect(step.getAttribute("aria-pressed")).toBe("false");
  });

  it("pick out a step's own parts when it is tapped, and only those", () => {
    const { steps, drawing, lit } = open();
    const step = steps[1];
    if (!step) throw new Error("No second step");
    step.click();
    const groups = (step.getAttribute("data-groups") ?? "").split(" ");
    expect(drawing.classList.contains("focus")).toBe(true);
    expect(lit().length).toBeGreaterThan(0);
    for (const own of lit()) expect(own.split(" ").some((g) => groups.includes(g))).toBe(true);
    expect(step.getAttribute("aria-pressed")).toBe("true");
  });

  it("let go of a step tapped again, and move on to another tapped next", () => {
    const { steps, drawing, lit } = open();
    const [first, second] = steps;
    if (!first || !second) throw new Error("Fewer than two steps");
    first.click();
    second.click();
    expect(first.getAttribute("aria-pressed")).toBe("false");
    expect(second.getAttribute("aria-pressed")).toBe("true");
    second.click();
    expect(second.getAttribute("aria-pressed")).toBe("false");
    expect(lit()).toEqual([]);
    expect(drawing.classList.contains("focus")).toBe(false);
  });

  it("run the test in the drawing when the last step is tapped", () => {
    const { steps, drawing } = open();
    steps.at(-1)?.click();
    expect(drawing.classList.contains("testing")).toBe(true);
    steps.at(-1)?.click();
    expect(drawing.classList.contains("testing")).toBe(false);
  });

  it("take two lights in turns, the way the script makes them", () => {
    const { drawing } = open("two-lights");
    const phases = [...drawing.querySelectorAll('[data-kind="led"]')].map((led) =>
      led.getAttribute("data-phase"),
    );
    expect(phases).toEqual(["0", "1"]);
  });
});

describe("a page's Copy button", () => {
  it("selects the script where the clipboard cannot be written, and says so in the page's words", () => {
    // jsdom has no clipboard, as a page opened from a file in some browsers has none.
    const { document, dom } = open();
    const button = document.querySelector<HTMLButtonElement>(".copy");
    const code = document.getElementById("script");
    if (!button || !code) throw new Error("No Copy button or no script");
    expect(button.textContent).toBe("Copy");
    button.click();
    expect(button.textContent).toBe("Selected");
    expect(dom.window.getSelection()?.toString()).toBe(code.textContent ?? "");
  });
});
