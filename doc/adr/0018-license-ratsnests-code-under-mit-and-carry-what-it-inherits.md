# ADR 0018: License ratsnest's code under MIT, and carry what it inherits

**Status:** Accepted · 2026-11-20

## Context

ratsnest is to be open-sourced once it is done (ADR 0014). Four kinds of thing in it need a licence,
and only the first is a choice:

- **ratsnest's own code.**
- **The drawing of the Pico and the breadboard**, copied from scratchpi (ADR 0001). scratchpi's
  ADR 0023 treats it as an adaptation of Figure 2 of the _Raspberry Pi Pico 2 W Datasheet_,
  © Raspberry Pi Ltd, under Creative Commons Attribution-ShareAlike 4.0, and carries the attribution
  that licence asks for.
- **Nunito**, under the SIL Open Font License 1.1 (ADR 0012).
- **What each executable contains** (ADR 0016). Bun is MIT, and its licence says it statically links
  JavaScriptCore and WebKit, which are under the LGPL-2: an application linked that way has to be
  provided in a form that lets a user relink it with a modified library, and Bun points to its
  patched WebKit and how to relink it. Babel, `fontkit` and their dependencies are MIT.

## Decision

**ratsnest's own code is under the MIT licence**, in `LICENSE`, its copyright held by ratsnest's
owner.

**The drawing's code lives in `src/drawing/`, and is under CC BY-SA 4.0**, as the adaptation it is.
`ATTRIBUTION.md` names the source, its copyright and its licence, says what was changed, and says
which folder it covers. Every page's footer carries the attribution, so the drawing inside a page
stays CC BY-SA wherever the page goes.

**Nunito's licence sits beside its files in `fonts/`**, and every page's footer credits the font.

**Every release carries a `NOTICES` file**, made by `bun run build` from the licences of everything
the executable contains, Bun's among them, with where each source is found: Bun's patched WebKit and
its relinking instructions, and ratsnest's own repository. That is how the LGPL's relinking is
offered.

**The circuits people write, and the words of their pages, are theirs.** ratsnest's licence does not
reach them; only the drawing inside each page is CC BY-SA.

## Considered options

- **MIT for the code, and what is inherited carried as it came**: chosen. It is the usual licence for
  a command-line tool, the one Bun, Babel and `fontkit` use, and the shortest, and it lets anyone use
  and fork ratsnest.
- **Apache-2.0**: rejected. Its grant of patents is worth having where patents are in view, and
  ratsnest has none; it is longer, and has rules of its own for notices.
- **GPL-3.0 for everything**: rejected. CC BY-SA 4.0 is one-way compatible with GPLv3, so the drawing
  could join the code under one licence, but every fork and every bundle of ratsnest would then have
  to stay GPL, which keeps some people from using a tool at all.
- **Redraw the board unlike the original, to drop CC BY-SA**: rejected, as scratchpi's ADR 0023
  rejected it. The look is what the owner chose ratsnest for (ADR 0001).

## Consequences

- **Three licences in one repository.** `ATTRIBUTION.md` says which covers what, and moving drawing
  code out of `src/drawing/` moves the obligation with it.
- **A published page carries a CC BY-SA drawing**: anyone may share and adapt it, with the
  attribution, under the same licence.
- **`NOTICES` is made by every build**, so a new dependency's licence goes in without anyone
  remembering it.
- **`LICENSE` needs its holder's name**, written when the file is.
