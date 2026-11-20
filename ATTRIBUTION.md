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
- reproduces no Raspberry Pi logo or other trademark: the RP2350's lid is left bare.

**The adapted drawing in `src/drawing/` is therefore distributed under CC BY-SA 4.0**, as
ShareAlike requires. That obligation covers the drawing, not the rest of this repository, so drawing
code moved out of `src/drawing/` takes the obligation with it. Every page ratsnest makes carries the
drawing, and says in its footer where the Pico comes from and that the drawing is CC BY-SA 4.0.

The reasoning is in ADR 0018, and before it in scratchpi's ADR 0023, which first carried this
attribution.

## What a release carries

Every release of ratsnest attaches a `NOTICES` file, made by `bun run build` from the licences of
everything its executable contains: Bun, which statically links JavaScriptCore and WebKit under the
LGPL-2, and ratsnest's dependencies (ADR 0016, ADR 0018).

## Trademarks

Raspberry Pi and Raspberry Pi Pico are trademarks of Raspberry Pi Ltd. ratsnest is not affiliated
with, endorsed by, or sponsored by Raspberry Pi Ltd, and its drawing reproduces no Raspberry Pi
logo.
