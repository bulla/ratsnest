/**
 * A resistor array's value and the code it prints (ADR 0059). Its value is free, as a resistor's is
 * (ADR 0039), and a real array prints it as a code, as a ceramic capacitor does (ADR 0051): two
 * figures and then how many zeros follow them, after the letter of its kind, `A` for bussed, its
 * resistors sharing one leg. `A331` is a bussed array of 330 Ω. A value is one the code can say.
 */

/**
 * The code a bussed array of a value in ohms prints: `A331` for 330, `A102` for 1000, `A470` for
 * 47. Undefined for a value the code cannot write: below 10 Ω, or with a third figure.
 */
export function resistorArrayCode(ohms: number): string | undefined {
  if (!Number.isInteger(ohms) || ohms < 10) return undefined;
  const zeros = String(ohms).length - 2;
  const figures = ohms / 10 ** zeros;
  return Number.isInteger(figures) && zeros <= 9 ? `A${figures}${zeros}` : undefined;
}
