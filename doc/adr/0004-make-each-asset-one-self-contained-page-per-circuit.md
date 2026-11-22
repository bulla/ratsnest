# ADR 0004: Make each asset one self-contained page per circuit

**Status:** Accepted · 2026-11-20 · Amended by ADR-0031 (a circuit's output is its page, or its drawing alone when asked)

## Context

The owner wants ratsnest's wiring guides kept as Artifacts first and served as static files later.
The copied page (ADR 0001) is already one HTML document with everything inside it. It also carries
things that only made sense inside scratchpi's app: a link back to the app, a theme handed over by
the app, and a link to its twin in the other language.

## Decision

**One asset is one HTML file, for one circuit, that needs nothing else**: its tokens, its stylesheet,
the drawing as inline SVG and its one script are all inside it. It holds, in order:

1. the circuit's name and a sentence saying what it is;
2. the drawing, with a key to the rails;
3. the steps to build it, each one picking out its own parts in the drawing, the last one testing
   it;
4. the parts list, with every resistor's colour bands;
5. a MicroPython script that tests every part, with a button that copies it;
6. notes on the parts;
7. a footer with the drawing's attribution.

**There is no back link and no language link.** Nothing links to a page yet, and a page is written
in one language (ADR 0005). The page reads completely without its script; the script only adds the
picking out and the copying.

## Considered options

- **The whole page, self-contained**: chosen. It is the page the owner liked, and the one file is
  both the Artifact and, later, the static resource, so there is one output and not two.
- **The drawing alone, as an SVG file**: not now. It would be a second output to keep in step, and
  nothing asks for it yet. The drawing is a function of its own, so it can be offered later without
  changing the page.
- **A page with its stylesheet and script beside it as files**: rejected. An Artifact is one file,
  and a page that needs no other request is simpler to serve and impossible to half-deploy.
- **Leave the test script out**: rejected. A wiring guide is finished when the reader has checked
  that the circuit works, and the script is how they check.

## Consequences

- **Every page carries its own copy of the tokens and the stylesheet**, around 15 KB in scratchpi.
  That is the price of a file that needs nothing else.
- **The test script is MicroPython**, which holds because every circuit is a Pico circuit (ADR 0002).
- **A back link waits for a place to go back to.** Once there is a site with an index, linking to it
  is a record of its own.
