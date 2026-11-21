import { parse, type parseExpression } from "@babel/parser";

/**
 * A circuit file, read as data and never run (ADR 0016), and held to the declarative check on the
 * way (ADR 0007): `import type` lines from `ratsnest`, one `export default { … } satisfies Circuit`,
 * and every value a string, a number, `true` or `false`, or an array or object of those.
 *
 * The node types come from the parser's own signature rather than from `@babel/types`, which is the
 * parser's dependency and not ratsnest's.
 */

type Program = ReturnType<typeof parse>["program"];
type Statement = Program["body"][number];
type Expression = ReturnType<typeof parseExpression>;
type ObjectMember = Extract<Expression, { type: "ObjectExpression" }>["properties"][number];
type ArrayElement = Extract<Expression, { type: "ArrayExpression" }>["elements"][number];
type Node = Statement | Expression | ObjectMember | NonNullable<ArrayElement>;

/** Where something is in a file: its line and column, both counted from 1. */
export interface Location {
  readonly line: number;
  readonly column: number;
}

/** Something wrong with a circuit, and where it is when that is known. */
export interface Problem {
  readonly file: string;
  readonly at?: Location;
  readonly message: string;
}

/** A file read: its data if it only declares, where each value of it is, and what is wrong. */
export interface Read {
  /** The object the file declares, or undefined when it does anything else. */
  readonly data?: unknown;
  /** Where the value at a path is written, `steps[2].parts[0].from`, so a check can point at it. */
  readonly at: (path: string) => Location | undefined;
  /**
   * The file's comments, so that a migration can write it back with them (ADR 0015): by the path of
   * the value each stands before, `""` for those before the import, and a path followed by `/end` for
   * those after an object's or a list's last value.
   */
  readonly comments: ReadonlyMap<string, readonly string[]>;
  readonly problems: readonly Problem[];
}

/** A comment as it is written in the file. */
const commentText = (comment: { type: string; value: string }): string =>
  comment.type === "CommentLine" ? `//${comment.value}` : `/*${comment.value}*/`;

/** The module a circuit's types are imported from, in ratsnest and in every circuits project. */
export const TYPES_MODULE = "ratsnest";

/** The type a circuit's object satisfies. */
export const CIRCUIT_TYPE = "Circuit";

const locationOf = (node: { loc?: { start: { line: number; column: number } } | null }) =>
  node.loc ? { line: node.loc.start.line, column: node.loc.start.column + 1 } : undefined;

/** A path into the data, as the checks name it: `name.en`, `steps[2].parts`. */
export const pathOf = (parent: string, key: string | number): string =>
  typeof key === "number" ? `${parent}[${key}]` : parent ? `${parent}.${key}` : key;

/** What a node is, in words, for a message about something a circuit may not hold. */
function what(node: Node): string {
  switch (node.type) {
    case "Identifier":
      return `a name, \`${node.name}\`, where a value must be written out`;
    case "CallExpression":
    case "NewExpression":
    case "TaggedTemplateExpression":
      return "a call";
    case "ArrowFunctionExpression":
    case "FunctionExpression":
    case "ObjectMethod":
      return "a function";
    case "SpreadElement":
      return "a spread";
    case "ConditionalExpression":
    case "LogicalExpression":
      return "a condition";
    case "BinaryExpression":
    case "UnaryExpression":
    case "UpdateExpression":
    case "AssignmentExpression":
      return "an operation";
    case "TemplateLiteral":
      return "a template string that puts a value in";
    case "MemberExpression":
    case "OptionalMemberExpression":
      return "a reference to another value";
    case "NullLiteral":
      return "`null`";
    case "TSAsExpression":
    case "TSSatisfiesExpression":
    case "TSNonNullExpression":
    case "TSTypeAssertion":
      return "a type assertion";
    case "VariableDeclaration":
      return "a variable";
    case "FunctionDeclaration":
      return "a function";
    case "ExportNamedDeclaration":
    case "ExportAllDeclaration":
      return "a named export";
    case "ImportDeclaration":
      return "an import";
    default:
      return `a ${node.type}`;
  }
}

const ONLY_DECLARES = "a circuit file only declares (ADR 0007)";

/** Reads a circuit file's source as data, without running anything in it. */
export function readCircuit(source: string, file: string): Read {
  const problems: Problem[] = [];
  const locations = new Map<string, Location>();
  const at = (path: string) => locations.get(path);
  const comments = new Map<string, string[]>();
  /** The comments before a node, kept under its path. */
  const keep = (
    path: string,
    node: { leadingComments?: readonly { type: string; value: string }[] | null },
  ) => {
    const before = node.leadingComments ?? [];
    if (before.length > 0)
      comments.set(path, [...(comments.get(path) ?? []), ...before.map(commentText)]);
  };
  /** The comments after the last of a list's or an object's values, kept under its path's end. */
  const keepEnd = (
    path: string,
    last: { trailingComments?: readonly { type: string; value: string }[] | null } | undefined,
  ) => {
    const after = last?.trailingComments ?? [];
    if (after.length > 0) comments.set(`${path}/end`, after.map(commentText));
  };
  const refuse = (node: Node | { loc?: Node["loc"] }, message: string) => {
    const where = locationOf(node);
    problems.push(where ? { file, at: where, message } : { file, message });
  };

  let program: Program;
  try {
    program = parse(source, { sourceType: "module", plugins: ["typescript"] }).program;
  } catch (error) {
    const loc = (error as { loc?: { line: number; column: number } }).loc;
    const message = `is not TypeScript the engine can read: ${(error as Error).message}`;
    return {
      at,
      comments,
      problems: [
        loc ? { file, at: { line: loc.line, column: loc.column + 1 }, message } : { file, message },
      ],
    };
  }

  /** The value a node writes out, or undefined, with a problem, for anything else. */
  const dataOf = (node: Node, path: string): unknown => {
    const where = locationOf(node);
    if (where) locations.set(path, where);
    switch (node.type) {
      case "StringLiteral":
      case "NumericLiteral":
      case "BooleanLiteral":
        return node.value;
      case "TemplateLiteral": {
        const [quasi] = node.quasis;
        if (node.expressions.length === 0 && quasi && quasi.value.cooked != null) {
          return quasi.value.cooked;
        }
        break;
      }
      case "UnaryExpression":
        if (node.operator === "-" && node.argument.type === "NumericLiteral") {
          return -node.argument.value;
        }
        break;
      case "ArrayExpression":
        keepEnd(path, node.elements.at(-1) ?? undefined);
        return node.elements.map((element, index) => {
          if (element === null) {
            refuse(node, `an empty slot in an array: ${ONLY_DECLARES}`);
            return undefined;
          }
          keep(pathOf(path, index), element);
          return dataOf(element, pathOf(path, index));
        });
      case "ObjectExpression": {
        const object: Record<string, unknown> = {};
        for (const member of node.properties) {
          if (member.type !== "ObjectProperty") {
            refuse(member, `${what(member)}: ${ONLY_DECLARES}`);
            continue;
          }
          if (member.computed) {
            refuse(member, `a computed key: ${ONLY_DECLARES}`);
            continue;
          }
          if (member.shorthand) {
            refuse(member, `a shorthand property, which names a variable: ${ONLY_DECLARES}`);
            continue;
          }
          const key =
            member.key.type === "Identifier"
              ? member.key.name
              : member.key.type === "StringLiteral"
                ? member.key.value
                : undefined;
          if (key === undefined) {
            refuse(member, `a key that is not a name or a string: ${ONLY_DECLARES}`);
            continue;
          }
          if (Object.hasOwn(object, key)) {
            refuse(member, `\`${key}\` is written twice`);
            continue;
          }
          keep(pathOf(path, key), member);
          object[key] = dataOf(member.value as Node, pathOf(path, key));
        }
        keepEnd(path, node.properties.at(-1));
        return object;
      }
    }
    refuse(node, `${what(node)}: ${ONLY_DECLARES}`);
    return undefined;
  };

  let data: unknown;
  let exported = false;
  for (const statement of program.body) {
    keep("", statement);
    if (statement.type === "ImportDeclaration") {
      if (statement.importKind !== "type") {
        refuse(statement, `an import that brings a value: write \`import type\` (ADR 0007)`);
      } else if (statement.source.value !== TYPES_MODULE) {
        refuse(
          statement,
          `types imported from \`${statement.source.value}\`: a circuit's types come from \`${TYPES_MODULE}\` alone, the only types the engine knows`,
        );
      }
      continue;
    }
    if (statement.type === "ExportDefaultDeclaration" && !exported) {
      exported = true;
      const declared = statement.declaration as Node;
      if (
        declared.type === "TSSatisfiesExpression" &&
        declared.typeAnnotation.type === "TSTypeReference" &&
        declared.typeAnnotation.typeName.type === "Identifier" &&
        declared.typeAnnotation.typeName.name === CIRCUIT_TYPE &&
        declared.expression.type === "ObjectExpression"
      ) {
        data = dataOf(declared.expression, "");
      } else {
        refuse(statement, `the default export is not \`{ … } satisfies ${CIRCUIT_TYPE}\``);
      }
      continue;
    }
    if (statement.type === "ExportDefaultDeclaration") {
      refuse(statement, "a second default export");
      continue;
    }
    refuse(
      statement,
      `${what(statement)}: a circuit file holds \`import type\` lines and one \`export default { … } satisfies ${CIRCUIT_TYPE}\`, and nothing else (ADR 0007)`,
    );
  }
  if (!exported) {
    problems.push({
      file,
      message: `has no \`export default { … } satisfies ${CIRCUIT_TYPE}\``,
    });
  }

  return problems.length > 0 ? { at, comments, problems } : { data, at, comments, problems };
}
