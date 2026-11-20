# ADR 0008: Write the engine in plain TypeScript, with no framework and no bundler

**Status:** Accepted · 2026-11-20

## Context

The owner asked whether ratsnest needs a JavaScript framework, having taken scratchpi's web side to
Solid 2. ratsnest makes one self-contained page per circuit, and a page is a pure function of four
inputs (ADR 0004, ADR 0005). The copied drawing (ADR 0001) is written as strings of SVG, and the
page's one script, about a hundred lines of plain JavaScript, picks out a step's parts and copies the
test script. Nothing on a page changes once it is made, beyond what that script does.

## Decision

**No framework, and no bundler.** The engine is plain TypeScript: it builds each page as a string,
inlines the stylesheet and the one plain script, and writes the file. Neither Solid nor Vite nor any
other bundler is in the stack.

**Solid 2 comes in only when something on a page has to change after it is made**, such as a page
that picks the four inputs and shows the result as they change, and then by a record of its own.

## Considered options

- **Plain TypeScript writing strings**: chosen. A document that never changes needs a function that
  writes it, and the copy already is one.
- **Solid 2, rendering the page**: rejected for now. Either every page carries Solid's runtime, or a
  build renders Solid to static markup, and both bring a compiler and its version rules to make a
  document that nothing updates. scratchpi had to pin its Solid compiler and runtime to the same
  pre-release, because a mismatch dropped every click handler without an error.
- **A bundler, such as Vite**: rejected. There is no app to bundle, and the page inlines one script
  that has no imports.
- **A static site generator, such as Astro or Eleventy**: rejected. It is a framework for pages,
  with templates and a build of its own, to do what one function does here.

## Consequences

- **A page is tested as a string.** The engine's tests compare and parse the markup it writes, and
  only the page's script needs a DOM.
- **Adding Solid later was tried before deciding**, on 2026-11-20, with Solid 2.0.3 and its compiler,
  `@solidjs/compiler` 2.0.2, on Bun with no Node (ADR 0009). Two ways in worked:
  - Bun's bundler, with a plugin of about ten lines calling the compiler's `transform()`. A
    component rendered under `bun test` and a click reached its handler, and the production bundle
    was 13.7 KB gzipped. The tests need `--conditions browser`, because Bun resolves a package as a
    server does and Solid hands a server its server build. The bundle needs the production
    condition, or Solid's development warnings come with it: 131 KB where it should be 34.
  - Vite with `@solidjs/vite-plugin` 3.0.1, run on Bun: 12 KB gzipped.

  So Solid would cost a record and a few dependencies on the day it comes, and nothing built before
  it is thrown away: the engine's markup can go into a component as it is.
- **Solid's compiler and runtime have to agree**, and a mismatch shows only as dead clicks. On the
  day Solid comes in, its first test is a click.
