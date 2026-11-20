# ADR 0009: Run everything on Bun, its tests included

**Status:** Accepted · 2026-11-20

## Context

ADR 0008 leaves ratsnest a TypeScript engine with tests and a script that generates pages. The
copied code (ADR 0001) ran on scratchpi's tools: Bun to install packages and run scripts, Vitest on
Node to test, Biome to lint and `tsc` to check the types. The owner would rather have one runtime,
Bun or Deno, than Bun and Node together.

ADR 0007's declarative check also needs a parser for TypeScript. TypeScript 7 offers its own only
under `typescript/unstable/*`, through its native compiler running beside it as another process.

Each option was tried on 2026-11-20, with Node taken off the `PATH`.

## Decision

**Bun is the only runtime.** It installs the packages, runs the generator and every script, and runs
the tests with its own runner, `bun test`. There is no Node, no Vitest and no Vite. Beside it:

- TypeScript checks the types, with `tsc --noEmit` run by Bun;
- Biome lints and formats;
- `@babel/parser` parses the circuit files for the declarative check (ADR 0007);
- jsdom runs the page's one script in its tests;
- a page is looked at with the Playwright and Chromium already installed where the work is done,
  and neither is a dependency.

**Every command goes through `bun run`**, and `bun run test` calls `bun test`. The tools' launchers
ask for `node` by name, and `bun run` stands in for it where there is none. Called directly, a
launcher fails.

**Every dependency is pinned exactly**, with no caret, at its latest release when it is added or
moved. The versions are in the Stack table of `CLAUDE.md` and, once it exists, in `package.json`.
This record does not repeat them, because a record is never rewritten and a version is.

## Considered options

- **Bun alone, with `bun test`**: chosen. One runtime does everything, and the trial passed with no
  Node: the tests, the parser, jsdom running a page's inline script, `tsc` and Biome.
- **Bun, with Vitest running on Node**: rejected. It works, as it did in scratchpi, but it is two
  runtimes, and it keeps Vitest and Vite, which Vitest 5 requires, for nothing ratsnest needs.
- **Vitest running on Bun**: rejected. Its default pool crashes on Bun
  (`child.channel.unref is not a function`), and it passes only with `pool: "threads"`: a
  workaround from the first day, with Vite still underneath.
- **Deno**: rejected. It needs the fewest tools, since it tests, checks the types, lints and formats
  by itself, and it passed too. But its type checker is TypeScript 6.0.3, every copied test would
  change its imports to Deno's own modules, and it is the hardest home for Solid: nothing can plug
  Solid's compiler into `deno test`, and Solid's package hands Deno its server build (ADR 0008).
- **TypeScript 7's own parser, for the declarative check**: rejected. It sits under
  `typescript/unstable/*` and runs through the native compiler as another process, which is too
  heavy and too unstable for one test.

## Consequences

- **`bun test` is plainer than Vitest**: no browser mode, and fewer plugins. ratsnest's tests are
  pure functions and one script in jsdom, and need neither.
- **scratchpi's warning turns round.** There, `bun test` bypassed Vitest; here it is the runner. A
  test that imports from `vitest`, as every copied test does, runs, because Bun redirects the
  import, and fails the type check until it imports from `bun:test`.
- **Continuous integration and the host install Bun, and nothing else.**
- **Types can trail what they describe**: `@types/jsdom` is a major version behind jsdom, and
  `@types/bun` can be a patch behind Bun.
- **Bun's own bugs are ratsnest's.** A release that misbehaves is stepped back in one line, because
  every pin is exact.
