/**
 * A font file imported `with { type: "file" }`, which Bun gives as a path it can read, in a compiled
 * ratsnest as well as from source (ADR 0016).
 */
declare module "*.woff2" {
  const path: string;
  export default path;
}
