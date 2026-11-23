# ADR 0016: Ship ratsnest as a standalone executable, built by Bun, from GitHub Releases

**Status:** Accepted · 2026-11-20 · Amends ADR-0014 · Amended by ADR-0042 (on Linux and Windows, a PNG or a WebP needs a browser installed)

## Context

ADR 0014 makes ratsnest something circuits projects install. Its repository is private now and is
to be public once ratsnest is done, and the name `ratsnest` is free on npm. But most people who wire
a Pico on a breadboard do not have Bun installed, and an npm package of ratsnest would run only on
Bun (ADR 0009).

Bun can compile a program into one executable that carries Bun inside it. A small tool shaped like
ratsnest was compiled on 2026-11-20 with Bun 1.4.4:

- it ran on a machine with neither Bun nor Node on the `PATH`;
- it read a circuit file as data, parsing it and never running it, and refused one that was not data
  with the line of the offending expression (ADR 0007);
- it carried the Nunito file inside itself and measured words with it (ADR 0012);
- it came to 105 MB for Linux on x64 or arm64, 86 MB for macOS on Apple silicon, 94 MB for macOS on
  Intel and 111 MB for Windows, or 39 to 49 MB compressed, each cross-compiled from Linux in under a
  second;
- it failed at first, because `fontkit` reads a data file of `unicode-properties` from disk under the
  `node` condition, and an executable has no such file. Compiling with `--conditions=browser` takes
  that package's other loader, which carries the data in its code.

## Decision

**ratsnest reaches its users as one executable per platform**: Linux on x64 and arm64, macOS on
Apple silicon and Intel, and Windows on x64. Each is built with
`bun build --compile --conditions=browser` from the same source, with Nunito inside it.

**Every release attaches the five executables to a GitHub Release**, and an install script in the
repository puts the right one on the `PATH`. There is no npm package.

**The executable reads a circuit file as data**: it parses the file and takes the object as it is,
and never imports or runs it. It also checks every field of the object itself, because a circuits
project may never run `tsc`.

**A circuits project has no `package.json`.** `ratsnest.json` names the version of ratsnest it
expects. `ratsnest init` writes the `Circuit` type into `.ratsnest/`, with a `tsconfig.json` that
points `"ratsnest"` at it, so that `import type { Circuit } from "ratsnest"` resolves in an editor,
and `ratsnest update` replaces both.

**`ratsnest update` also updates ratsnest itself.** It fetches the newer executable for its platform
and puts it in place of the running one, then does what ADR 0015 says. An executable older than its
project's `ratsnest.json` refuses to run, and a newer one says to run `ratsnest update`.

**ratsnest's own development is unchanged**: Bun, running the source through `bun run` (ADR 0009).
`bun run build` makes the executables, and they are how the owner's own projects use ratsnest until
the repository is public.

This amends ADR 0014, where a circuits project had ratsnest pinned in its `package.json`: its
ratsnest is now the executable and `ratsnest.json`, and the `Circuit` type comes from `.ratsnest/`.
Everything else in it stands.

## Considered options

- **A standalone executable, from GitHub Releases**: chosen. Its user installs nothing else, and
  opening a stranger's circuit file can never run the stranger's code.
- **An npm package, run with Bun**: rejected. Every user would install Bun first, for a tool whose
  readers wire breadboards.
- **Both an executable and an npm package**: rejected for now. Two ways in to keep in step. An npm
  package can come later, as a record of its own.
- **Installing from a GitHub tag, as a Bun dependency**: rejected. It needs Bun as well, and the
  repository's address typed into every project.

## Consequences

- **A download of 39 to 49 MB**, and 86 to 111 MB on disk, where an npm package would be a few
  hundred kilobytes on top of Bun itself.
- **Every release builds five executables**, which is continuous integration's work.
- **macOS is untested.** Whether an unsigned executable cross-compiled from Linux runs on Apple
  silicon has to be tried on a Mac before the first release, and signing and notarizing it need an
  Apple Developer account.
- **On Windows the executable cannot overwrite itself while it runs**, so `update` renames the old one
  first.
- **A new dependency can bring the `unicode-properties` problem back.** Continuous integration checks
  the examples with the compiled executable, not only with the source.
- **The `Circuit` type is written into every project**, and `update` is what keeps it current.
