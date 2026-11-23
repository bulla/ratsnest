# ADR 0005: Fix a page's theme and language when it is generated

**Status:** Accepted · 2026-11-20 · Amended by ADR-0038 (a PNG or a WebP is the same file only from the same browser)

## Context

The copied page (ADR 0001) opened dark, took the light scale only when scratchpi's app handed it
over in the address, and linked to its twin in the other language. None of that has an app behind
it now. The owner wants the theme, dark or light, and the language of the instructions to be asked
for when a page is made, and wants no language switch on the page.

## Decision

**The generator takes a theme, `dark` or `light`, and a language, as inputs**, beside the circuit
and the orientation (ADR 0003). The page is drawn in that theme and written in that language, and
there is no switch on it for either. **The same inputs always make the same file**, byte for byte.

The board and its parts look the same in both themes, as they did in scratchpi: they are drawings
of objects, and an object does not repaint itself when the room does. Only the page around them
changes.

Which languages there are is a record of its own.

## Considered options

- **Fixed when the page is generated**: chosen, as the owner asked. A page holds one set of words and
  one set of colours, and what it shows is exactly what was asked for.
- **A switch on the page**: rejected. Every page would carry every language's words, and the owner
  does not want a language switch on an Artifact.
- **Follow the reader's system setting for the theme**: rejected, because the owner wants the theme
  chosen. It costs something: on claude.ai, an Artifact usually follows the reader's light or dark,
  and a ratsnest page will not.

## Consequences

- **A page is a pure function of its inputs**: circuit, orientation, theme and language. A test can
  generate one and compare it with what it should be, and two people asking for the same page get
  the same file.
- **Publishing everything multiplies**: four orientations, two themes and each language, per
  circuit. A static site will have to choose what it serves, or serve them all, and that is decided
  with the site.
- **A reader who wants the other theme or language needs the other file.** Nothing on the page
  leads them to it.
