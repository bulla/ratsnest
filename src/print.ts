import { CIRCUIT_TYPE, pathOf, TYPES_MODULE } from "./read";

/**
 * A circuit's data written back as a circuit file, with its comments (ADR 0015): what a migration
 * writes, since a circuit file only declares and a migration changes its object and nothing else.
 * One style, the same for every file: two spaces in, an object or a list on one line when it fits in
 * the line, and on a line each otherwise, with a comma after every value. A circuits project has no
 * formatter of its own to tidy after it.
 */

/** How wide a line may be. */
const WIDTH = 100;

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const keyOf = (key: string): string => (IDENTIFIER.test(key) ? key : JSON.stringify(key));

/** A string as the file writes it: a template on lines of its own, for a script, or quoted. */
function stringOf(value: string): string {
  if (
    value.includes("\n") &&
    !value.includes("`") &&
    !value.includes("${") &&
    !value.includes("\\")
  ) {
    return `\`${value}\``;
  }
  return JSON.stringify(value);
}

type Comments = ReadonlyMap<string, readonly string[]>;

/** Whether a value, or anything in it, has a comment, which keeps it on lines of its own. */
const commented = (path: string, comments: Comments): boolean =>
  [...comments.keys()].some(
    (key) =>
      key !== "" &&
      (key === path ||
        key.startsWith(`${path}.`) ||
        key.startsWith(`${path}[`) ||
        key.startsWith(`${path}/`)),
  );

/** A value on one line, or undefined for one that cannot be. */
function inline(value: unknown): string | undefined {
  if (typeof value === "string") return value.includes("\n") ? undefined : JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const items = value.map(inline);
    return items.every((item) => item !== undefined) ? `[${items.join(", ")}]` : undefined;
  }
  if (value && typeof value === "object") {
    const members = Object.entries(value).map(([key, member]) => {
      const written = inline(member);
      return written === undefined ? undefined : `${keyOf(key)}: ${written}`;
    });
    if (members.length === 0) return "{}";
    return members.every((member) => member !== undefined)
      ? `{ ${members.join(", ")} }`
      : undefined;
  }
  return undefined;
}

/** A value as the file writes it, at an indent, after what the line already holds. */
function valueOf(
  value: unknown,
  path: string,
  indent: string,
  lead: number,
  comments: Comments,
): string {
  if (typeof value === "string") return stringOf(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const short = inline(value);
  if (short !== undefined && !commented(path, comments) && lead + short.length <= WIDTH)
    return short;
  const inner = `${indent}  `;
  const lines: string[] = [];
  const entries: [string, unknown, string][] = Array.isArray(value)
    ? value.map((item, index) => [pathOf(path, index), item, ""])
    : Object.entries(value as Record<string, unknown>).map(([key, member]) => [
        pathOf(path, key),
        member,
        `${keyOf(key)}: `,
      ]);
  for (const [at, member, key] of entries) {
    for (const comment of comments.get(at) ?? []) lines.push(`${inner}${comment}`);
    lines.push(`${inner}${key}${valueOf(member, at, inner, inner.length + key.length, comments)},`);
  }
  for (const comment of comments.get(`${path}/end`) ?? []) lines.push(`${inner}${comment}`);
  const [open, close] = Array.isArray(value) ? ["[", "]"] : ["{", "}"];
  return `${open}\n${lines.join("\n")}\n${indent}${close}`;
}

/** A circuit file declaring this data, its comments where they were. */
export function printCircuit(data: unknown, comments: Comments = new Map()): string {
  const header = (comments.get("") ?? []).map((comment) => `${comment}\n`).join("");
  const declared = valueOf(data, "", "", "export default ".length, comments);
  return `${header}import type { ${CIRCUIT_TYPE} } from "${TYPES_MODULE}";\n\nexport default ${declared} satisfies ${CIRCUIT_TYPE};\n`;
}
