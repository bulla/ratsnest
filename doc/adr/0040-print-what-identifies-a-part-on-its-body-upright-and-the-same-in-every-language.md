# ADR 0040: Print what identifies a part on its body, upright and the same in every language

**Status:** Accepted · 2026-11-23

## Context

Several of the new parts look alike from a distance: an NPN and a PNP transistor are the same black
body, and one capacitor can looks like another. The owner wants each one to say what it is, written
on the part, as Fritzing does, and better drawn.

Two things in the drawing bear on where words can go:

- **Every word is upright at all four quarter turns** (ADR 0003): `word()` turns each word back
  about its own point, so a word stays level on the screen while the part turns under it. A word on
  a body therefore has to fit the body's narrower side.
- **A resistor's value sits on a tag beside it**, and placing those tags is the drawing's most
  fragile work: a place found clear of everything else, a second line on a standing board, and a
  Russian value wider than an English one (ADR 0011).

## Decision

**What identifies a part is printed on its body, wherever it fits upright at all four turns, and on
a tag, as a resistor's value is, only where it does not.** The body may be drawn larger than life
where the print needs room, and the crowding check measures whichever it is.

**The print is the same in every language**, as the Pico's own `GP15` and `3V3(OUT)` are: it stands
for what the reader sees on the part in their hand. The page's sentences and its parts list still
write a value in the page's language, `470 мкФ` in Russian, while the can says `470 µF`.

For the first parts:

| Part                   | Drawn as                                                                                                               | Printed                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Electrolytic capacitor | Standing, seen from the side, as a light is: a can, a pale stripe down its − side marked `−`, the + leg the longer one | Its value across the can, `470 µF`                                                      |
| 2N3904, 2N3906         | Standing, its flat face towards the viewer: a black TO-92, larger than life                                            | Its type, `NPN` or `PNP`, large, its model small beneath, and `E`, `B`, `C` by its legs |
| Diode                  | Lying, as a resistor does, with the band at its cathode                                                                | On a tag: lying, it is too thin to hold an upright word at 90°                          |

## Considered options

- **On the body where it fits, a tag only where it does not, the same in every language**: chosen.
  The print moves with its part, so it cannot crowd anything, and it has one width in every
  language, so it is never what a page in one language alone is refused for.
- **The model alone, as on the real part**: rejected. `2N3904` and `2N3906` differ by one figure,
  and a reader learning the parts does not know which is which. The type is what tells them apart,
  so it is the larger.
- **Every print on a tag, as a resistor's value**: rejected. Each tag is one more to place, and the
  flasher alone would have four, about the board's middle where its resistors already put theirs.
- **A callout for each part, past the board's end, as a light has**: rejected. Callouts are for the
  parts a circuit names (ADR 0041), and the column past the board's end holds about nine.
- **The print in the page's language**: rejected. A Russian can would say `470 мкФ`, which no real
  can does, and the body's width would differ by language.

## Consequences

- **A reader can tell an NPN from a PNP, and one capacitor from another, by looking at the
  drawing.**
- **A body larger than life covers more of the board** in the drawing than the part does on the
  real one. The holes it covers are still free on the real board, and the wiring check, which reads
  holes, not drawings, does not change.
- **A Russian page carries Latin print on its parts**, `µF` and `NPN`, as it carries the Pico's
  labels. The font test still holds every character a page writes to Nunito's files.
- **A lying part with something to say has a tag**, and its tag goes through the same placing as a
  resistor's.
