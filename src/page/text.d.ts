/**
 * A stylesheet imported `with { type: "text" }`, which Bun gives as its text. The page carries its
 * stylesheets inside it (ADR 0004), and importing them, rather than reading them from disk, is what
 * puts them inside a compiled ratsnest too (ADR 0016).
 */
declare module "*.css" {
  const text: string;
  export default text;
}
