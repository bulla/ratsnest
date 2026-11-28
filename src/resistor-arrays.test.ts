import { describe, expect, it } from "bun:test";
import { resistorArrayCode } from "./resistor-arrays";

describe("a resistor array's code (ADR 0059)", () => {
  it("is A, two figures and how many zeros follow them", () => {
    expect(resistorArrayCode(330)).toBe("A331");
    expect(resistorArrayCode(220)).toBe("A221");
    expect(resistorArrayCode(1000)).toBe("A102");
    expect(resistorArrayCode(47)).toBe("A470");
    expect(resistorArrayCode(10000)).toBe("A103");
  });

  it("is none for a value the code cannot say", () => {
    expect(resistorArrayCode(332)).toBeUndefined();
    expect(resistorArrayCode(4.7)).toBeUndefined();
    expect(resistorArrayCode(0)).toBeUndefined();
  });
});
