/**
 * A library a circuit's script needs (ADR 0062): where its files are, and the name each is saved
 * under on the Pico, which is the last part of its address.
 */

/** An address a page may link: `https://`, a host, and nothing a page could not write in a link. */
export const isAddress = (text: string): boolean => {
  if (!text.startsWith("https://") || /[\s"<>\\]/.test(text)) return false;
  try {
    return new URL(text).host.length > 0;
  } catch {
    return false;
  }
};

/** The name a file is saved under on the Pico: the last part of its address, `lcd_api.py`. */
export const fileNameOf = (address: string): string =>
  decodeURIComponent(new URL(address).pathname.split("/").pop() ?? "");

/** Whether a name is a file MicroPython imports: a `.py` or a compiled `.mpy`, with a name before it. */
export const isModuleFile = (name: string): boolean => /^[A-Za-z_][A-Za-z0-9_]*\.m?py$/.test(name);
