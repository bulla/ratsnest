# Attribution

ratsnest's own code is under the MIT licence, in [`LICENSE`](LICENSE), with the exceptions below
(ADR 0018).

## The Raspberry Pi Pico 2 W and breadboard drawing

The drawing of the Pico and the breadboard, everything under [`src/drawing/`](src/drawing/), is an
**adaptation of the Raspberry Pi Pico 2 W pinout**, Figure 2 of the _Raspberry Pi Pico 2 W
Datasheet_ (RP-008304-DS). It came to ratsnest from scratchpi (`bulla/scratchpi`, ADR 0001), whose
board drawing it is.

- **Source:** <https://datasheets.raspberrypi.com/picow/pico-2-w-datasheet.pdf>
- **Copyright:** © 2022–2026 Raspberry Pi Ltd
- **Licence:** [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/)
  (CC BY-SA 4.0)

**Changes were made.** Nothing was traced or copied: the board is drawn from the mechanical
specification in §2 and Figure 3 of the same datasheet, in millimetres, and the header labels are
from Figure 2's pin assignment. What it takes from Figure 2 is the presentation: the board's colours,
the arrangement of labelled chips beside each pin, and the colour coding of the header. It differs
from the original in that it:

- leaves out every alternate function (UART, I²C, SPI, PWM, PIO, debugging);
- groups the header into four kinds rather than the original's eight;
- shades those four so that their labels meet WCAG AA, which the original's pale green and pink do
  not;
- turns the Pico on its side and pushes it into a half-size breadboard, with the parts a circuit
  places at the holes and pins they are wired to;
- draws, for a circuit with no Pico, a supply's cell in the Pico's place beside the breadboard
  (ADR 0032);
- reproduces no Raspberry Pi logo or other trademark: the RP2350's lid is left bare.

**The adapted drawing in `src/drawing/` is therefore distributed under CC BY-SA 4.0**, as
ShareAlike requires. That obligation covers the drawing, not the rest of this repository, so drawing
code moved out of `src/drawing/` takes the obligation with it. Every page ratsnest makes carries the
drawing, with the Pico or with a supply in its place, and its circuit's credit, if it has one, as its
footer; the drawing alone, as an SVG file (ADR 0031), carries that credit in a line of small text
along its bottom edge, so that it goes wherever the file is put. The `circuit` skill gives every
circuit it makes ratsnest's credit, and the update to format 2 gives it to every circuit written
before with none (ADR 0036), which says where the drawing comes from, that it is
CC BY-SA 4.0, with the licence's address written out, and that the font is Nunito, under the SIL
Open Font License 1.1. A circuit's author may reword it, or take it out to credit the drawing
elsewhere, as a tutorial of several drawings would once (ADR 0035), and nothing checks it: a drawing
shown with no credit anywhere around it no longer meets the licence, which is the author's to answer
for.

The reasoning is in ADR 0018, and before it in scratchpi's ADR 0023, which first carried this
attribution.

## Nunito

Every page is set in **Nunito 3.602**, by the Nunito Project Authors
(<https://github.com/googlefonts/nunito>), and carries it inside it (ADR 0012). The two files in
[`fonts/`](fonts/) are Nunito cut by Google Fonts' subsetter to ratsnest's characters, and
[`fonts/README.md`](fonts/README.md) says how each was made.

- **Licence:** [SIL Open Font License 1.1](fonts/OFL.txt), which goes wherever the files go: beside
  them in the repository, inside every release, and named in every page's footer.
- **Changes:** none to the glyphs. The files are subsets holding only the characters ratsnest writes,
  which the licence counts as a Modified Version. Nunito's copyright notice reserves no font name, so
  the subsets may keep it. Every page names the font under a family of ratsnest's own,
  `ratsnest Nunito`, only to tell it apart from a Nunito installed on the reader's device.

## The picture of Ernest

The picture at the top of the README, [`doc/ernest.webp`](doc/ernest.webp), is a photo of **Baby**, a
pet rat, taken by Maaique. It is a still from her video _Baby
eating spaghetti_, which went round the world in October 2015 as "Spaghetti Rat", often reposted
with another credit.

- **Source:** <https://www.youtube.com/watch?v=bQ1nR-mf-qI>, on her YouTube channel,
  <https://www.youtube.com/@maaique>
- **Copyright:** Maaique
- **Licence:** none published. The photo is not under ratsnest's MIT licence, and is not ratsnest's
  to license.

**Changes were made:** the spaghetti in his paws became a bundle of jumper wires, and the picture was
resized and saved as WebP. The README calls him Ernest.

## What a release carries

Every release of ratsnest attaches a `NOTICES` file, made by `bun run build` from the licences of
everything its executable contains: Bun, which statically links JavaScriptCore and WebKit under the
LGPL-2, and ratsnest's dependencies (ADR 0016, ADR 0018).

## Trademarks

Raspberry Pi and Raspberry Pi Pico are trademarks of Raspberry Pi Ltd. ratsnest is not affiliated
with, endorsed by, or sponsored by Raspberry Pi Ltd, and its drawing reproduces no Raspberry Pi
logo.
