/**
 * A ceramic capacitor's value and its code (ADR 0051). Its value is free, as a resistor's is
 * (ADR 0039), and the drawing's disc prints it, `100 nF`. A real disc prints its code instead, which
 * the page gives beside the value: in picofarads, two figures and then how many zeros follow them,
 * `104` for 100 nF. A value is one the code can say.
 */

/**
 * The code a ceramic capacitor of a value in nanofarads prints: `104` for 100, `472` for 4.7, `220`
 * for 0.022. Undefined for a value the code cannot write: below 10 pF, or with a third figure.
 */
export function ceramicCode(nanofarads: number): string | undefined {
  if (!Number.isFinite(nanofarads) || nanofarads <= 0) return undefined;
  const picofarads = Math.round(nanofarads * 1000);
  if (Math.abs(picofarads - nanofarads * 1000) > 1e-6 || picofarads < 10) return undefined;
  const zeros = String(picofarads).length - 2;
  const figures = picofarads / 10 ** zeros;
  return Number.isInteger(figures) && zeros <= 9 ? `${figures}${zeros}` : undefined;
}

/** `100 nF`, `4.7 nF`: a ceramic capacitor's value as a bag of them says it, in English. */
export function formatNanofarads(nanofarads: number): string {
  return `${nanofarads} nF`;
}
