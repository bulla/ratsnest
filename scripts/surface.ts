/**
 * ratsnest's public surface, as data (ADR 0017): the circuit format's number and its types, the
 * commands with their options, and `ratsnest.json`'s fields. Every release writes it to
 * `api/surface.json`, and the next release's version is computed against it.
 *
 * The surface is a flat record of named sets: `type LedColour` holds the colours a light can be,
 * `Circuit.leds` how the field is declared, `command generate --theme` the themes. A name that goes,
 * or a value that leaves a set, is a change that breaks someone; a name or a value that only arrives
 * is a gain.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "@babel/parser";
import { COMMANDS } from "../src/cli";
import { FORMAT } from "../src/fields";

export type Surface = Record<string, string[]>;

export type Bump = "major" | "minor" | "patch";

const ROOT = join(import.meta.dir, "..");

/** The fields of `ratsnest.json`, which `init` writes and every command reads (ADR 0016). */
export const PROJECT_FIELDS = ["ratsnest"];

type Program = ReturnType<typeof parse>["program"];

/** The source a node spans, its whitespace collapsed, so that reformatting changes nothing. */
const textOf = (source: string, node: { start?: number | null; end?: number | null }) =>
  source
    .slice(node.start ?? 0, node.end ?? 0)
    .replace(/\s+/g, " ")
    .trim();

/**
 * The format's exported types: a union as the set of its members, a string by its value and any
 * other by its text, so that a member added is a gain and one removed a change; an interface by its
 * members and what it extends; anything else as its text.
 */
function typesOf(source: string): Surface {
  const program: Program = parse(source, { sourceType: "module", plugins: ["typescript"] }).program;
  const surface: Surface = {};
  for (const statement of program.body) {
    if (statement.type !== "ExportNamedDeclaration") continue;
    const declared = statement.declaration;
    if (declared?.type === "TSTypeAliasDeclaration") {
      const type = declared.typeAnnotation;
      const members = type.type === "TSUnionType" ? type.types : [type];
      surface[`type ${declared.id.name}`] = members
        .map((member) =>
          member.type === "TSLiteralType" && member.literal.type === "StringLiteral"
            ? member.literal.value
            : textOf(source, member),
        )
        .sort();
    }
    if (declared?.type === "TSInterfaceDeclaration") {
      // What it extends is part of it: a shape that stopped sharing the base would lose its members
      // without one of its own going (ADR 0036).
      if (declared.extends?.length) {
        surface[`${declared.id.name} extends`] = declared.extends
          .map((heritage) => textOf(source, heritage))
          .sort();
      }
      for (const member of declared.body.body) {
        if (member.type !== "TSPropertySignature" || member.key.type !== "Identifier") continue;
        const type = member.typeAnnotation
          ? textOf(source, member.typeAnnotation.typeAnnotation)
          : "";
        surface[`${declared.id.name}.${member.key.name}`] = [
          `${member.optional ? "optional" : "required"} ${type}`,
        ];
      }
    }
  }
  return surface;
}

/** The surface as this checkout has it. */
export function surfaceOf(root = ROOT): Surface {
  const surface: Surface = { format: [String(FORMAT)] };
  Object.assign(surface, typesOf(readFileSync(join(root, "src", "format.ts"), "utf8")));
  for (const [name, command] of Object.entries(COMMANDS)) {
    surface[`command ${name}`] = [command.arguments];
    for (const [option, values] of Object.entries(command.options)) {
      surface[`command ${name} --${option}`] = typeof values === "string" ? [values] : [...values];
    }
  }
  surface["ratsnest.json"] = [...PROJECT_FIELDS];
  return Object.fromEntries(Object.entries(surface).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * The least bump from one surface to the next (ADR 0017): major when the format's number rose, or
 * anything was removed or changed, a required field added among them, since it breaks every file
 * without it; minor when the surface only gained; patch otherwise.
 */
export function bumpOf(before: Surface, after: Surface): Bump {
  if (Number(after.format?.[0]) > Number(before.format?.[0])) return "major";
  let gained = false;
  for (const [key, values] of Object.entries(before)) {
    const now = after[key];
    if (!now || values.some((value) => !now.includes(value))) return "major";
    if (now.some((value) => !values.includes(value))) gained = true;
  }
  for (const [key, values] of Object.entries(after)) {
    if (key in before) continue;
    if (values.some((value) => value.startsWith("required ")) && /^\w+\./.test(key)) {
      const type = key.split(".")[0];
      if (Object.keys(before).some((each) => each.startsWith(`${type}.`))) return "major";
    }
    gained = true;
  }
  return gained ? "minor" : "patch";
}

const ORDER: readonly Bump[] = ["patch", "minor", "major"];

/** Whether one bump is at least another. */
export const atLeast = (bump: Bump, least: Bump): boolean =>
  ORDER.indexOf(bump) >= ORDER.indexOf(least);

/**
 * The version right after the last, for a bump, never skipping one (ADR 0017). Until 1.0.0 a change
 * that would be major raises the minor number and any other the patch (ADR 0021).
 */
export function nextVersion(last: string, bump: Bump): string {
  const [major = 0, minor = 0, patch = 0] = last.split("-")[0]?.split(".").map(Number) ?? [];
  if (major === 0) {
    return bump === "major" ? `0.${minor + 1}.0` : `0.${minor}.${patch + 1}`;
  }
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** The first release, which says by its number that anything may still change (ADR 0021). */
export const FIRST_VERSION = "0.1.0";

/** The versions a release after `last` may be, given the least bump: one for each bump at least it. */
export const allowedVersions = (last: string, least: Bump): string[] => [
  ...new Set(ORDER.filter((bump) => atLeast(bump, least)).map((bump) => nextVersion(last, bump))),
];

if (import.meta.main) console.log(JSON.stringify(surfaceOf(), null, 2));
