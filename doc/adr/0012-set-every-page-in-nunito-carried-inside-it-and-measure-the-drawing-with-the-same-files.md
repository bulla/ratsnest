# ADR 0012: Set every page in Nunito, carried inside it, and measure the drawing with the same files

**Status:** Accepted · 2026-11-20

## Context

ADR 0011 measures every word the drawing writes with the font it is drawn in, and a page can promise
that only if it carries its font. The copied pages ask for `ui-rounded, "Nunito", "Segoe UI",
system-ui`: SF Rounded in Safari, and elsewhere whatever the device has, since few devices have
Nunito installed. So the copied look already changed from one device to the next.

Nunito is under the SIL Open Font License 1.1, covers Latin and Cyrillic, and is a variable font,
with every weight from 200 to 1000 in one file. Checked on 2026-11-20 against the copy Google Fonts
serves, version 3.602:

- **it has every character the copied pages write but two**: the narrow no-break space, U+202F,
  which French typography needs, and the left arrow, U+2190, which only scratchpi's back link used;
- **Google's ready-made Latin file drops `Ω`**, which every resistor's value needs;
- **Google's subsetter, asked for an exact set of characters, returns a variable WOFF2 holding
  those and nothing else**: 42.7 KB for ratsnest's Latin set, `Ω` and the thin space included, and
  23.4 KB for Cyrillic.

## Decision

**Every page, and the drawing in it, is set in Nunito, and carries it.**

- **Two variable WOFF2 files, committed in `fonts/`.** `nunito-latin.woff2` holds Basic Latin,
  Latin-1 and the few marks the pages write: `Œ œ ‘ ’ “ ” … – − Ω` and the thin space.
  `nunito-cyrillic.woff2` holds U+0400 to U+045F. Each is made by Google Fonts' subsetter from
  Nunito 3.602, and `fonts/` records the address that made it, with Nunito's licence beside the
  files.
- **Every page carries the Latin file, and a Russian page the Cyrillic one too**, as data URLs in an
  `@font-face` covering every weight. The family has a name of ratsnest's own, so that a Nunito
  installed on the device, possibly another version with other widths, is never used instead.
- **The engine measures every drawn word with the same files**, at the weight it is drawn in,
  through `fontkit`.
- **A test fails on any character a page writes that its files lack**, and names it. Adding a
  character means fetching the files again with it.
- **The narrow no-break space is written as Nunito's thin space, U+2009.** In the page it is joined
  to its neighbours by `white-space: nowrap`, so it still never breaks; in the drawing it stands as
  it is, since nothing there wraps. A circuit's French still holds U+202F, as ADR 0011 checks: only
  what the engine writes changes.
- **The test script stays in the device's monospace font.** It is code, it is never measured, and
  Nunito has no monospace.

## Considered options

- **Nunito, carried by the page, cut to ratsnest's characters**: chosen. What is measured is exactly
  what is drawn, every device shows the same rounded type, and nothing is fetched when a page is
  read.
- **Google's ready-made Latin and Cyrillic files**: rejected. The Latin one has no `Ω`.
- **The whole font**: rejected. 277 KB of TrueType, most of it for languages ratsnest does not write.
- **Cutting the font ourselves, with a subsetting library**: rejected for now. Google's subsetter
  makes the same cut from the same font and adds no dependency. One of ratsnest's own can come if
  Google's stops being enough.
- **The device's own fonts, measured against the widest likely one**: rejected. A guess, and the
  look changes from device to device.
- **A link to Google Fonts**: rejected. The page would stop being self-contained (ADR 0004), and
  every reader would make a request to a third party.

## Consequences

- **Every page grows by about 57 KB, and a Russian page by about 88 KB**, as base64, against about
  15 KB of tokens.
- **ratsnest's characters are a fixed set.** Adding one means fetching the files again, and `←` and
  `→` cannot be added at all, because Nunito has neither.
- **`fontkit` joins the stack**, pinned exactly (ADR 0009).
- **Nunito's licence goes wherever the files go**: beside them in the repository, and named in every
  page's footer with the drawing's own attribution.
- **Fetching the files needs Google's servers, and making a page does not.** A page is made from the
  committed files alone.
