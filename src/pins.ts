/**
 * A Pico 2 W breaks out 26 GPIO: GP0 to GP22 and GP26 to GP28. GP23, 24, 25 and 29 are wired to
 * the wireless module and the SMPS, and never reach a header pin (ADR 0002).
 */
export const USABLE_GPIO: readonly number[] = [
  ...Array.from({ length: 23 }, (_, i) => i),
  26,
  27,
  28,
];

export function isUsableGpio(gpio: number): boolean {
  return USABLE_GPIO.includes(gpio);
}
