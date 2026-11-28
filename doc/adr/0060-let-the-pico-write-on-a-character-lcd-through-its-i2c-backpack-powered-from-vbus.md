# ADR 0060: Let the Pico write on a character LCD through its I2C backpack, powered from VBUS

**Status:** Accepted · 2026-11-28

## Context

The owner asked for a simple display screen as a part outside the board, after a tutorial they
chose. Its screen is a 16×2 character LCD: two rows of sixteen characters, on a green board about
80 mm by 36 mm, lit from behind. Its own sixteen pins would take most of a Pico's, so a small board
on its back, a backpack, drives them, and gives it four pins instead, named on the backpack `GND`,
`VCC`, `SDA` and `SCL`. The backpack talks I2C, at address `0x27` on most (`0x3F` on some), and
takes 5 V on VCC, which its backlight and the screen's contrast need; a blue dial on its back sets
the contrast, and a jumper on two pins beside it turns the backlight on.

The tutorial joins it by four female-to-male jumpers, the screen lying beside the breadboard: GND to
a ground pin, VCC to VBUS, SDA to GP14 and SCL to GP15, which are I2C1's on the Pico. Its script
drives it through a library of two files saved on the Pico (ADR 0062).

I2C lets one pair of pins carry many parts, each at its own address. The Pico's I2C pins come in
pairs, each GPIO one bus's SDA or SCL: GP0 is I2C0's SDA and GP1 its SCL, GP2 and GP3 are I2C1's,
and so on round, an even GPIO always SDA. The backpack pulls SDA and SCL up to its own 5 V. The
RP2350's GPIO take 5 V while the chip is powered, as its datasheet marks them, except those the ADC
shares, GP26 to GP28 on the Pico 2 W, which do not.

## Decision

**The part is `{ kind: "lcd", name, power, ground, data, clock }`**: its name, which every part
outside the board has (ADR 0057), and the holes its four jumpers go in, from its VCC, GND, SDA and
SCL pins. It is placed in its step as the motion sensor is (ADR 0055), its pins read from the wiring
and declared nowhere, and is a Pico's part: a circuit with a supply has none.

**The wiring check learns its one use** (ADR 0038), being written to over I2C:

1. **VCC on VBUS**, the 5 V it runs on.
2. **GND on ground.**
3. **SDA and SCL each straight on one GPIO of its own**, with nothing else on it, **SDA on an SDA pin
   and SCL on the same bus's SCL**, which the problem names, saying which pins would do.
4. **Neither on GP26, GP27 or GP28**, which cannot take the 5 V its backpack pulls them up to.

It is bought as what it is, not by a model, as the motion sensor is: its jumpers go on by the names
printed beside its pins, whatever order a backpack has them in.

**The page says it, by its name**: its label past the board's end, "LCD, SDA to j20"; the step's
sentence, "The LCD, beside the board, screen up: a black jumper from its GND pin to j19 (GND, pin
18), a red one from its VCC pin to j23, a blue one from its SDA pin to j20 (GP14, pin 19) and a
yellow one from its SCL pin to j21 (GP15, pin 20)."; the parts list's lines, "LCD: a character LCD of
two rows of 16, with an I2C backpack whose four pins are GND, VCC, SDA and SCL, that runs on 5 V."
and its four female-to-male jumpers; and a note, that its jumpers go on by the names on its backpack, that it
answers at `0x27` or `0x3F`, which a scan of the bus shows, and that a screen showing nothing, or a
row of blocks, wants its contrast dial turned a little at a time. The test step picks it out, since
the reader reads it.

The example is `examples/counting-screen.ts`: the screen's jumpers in the strips of the GND, GP14
and GP15 pins side by side on the Pico's bottom row, the tutorial's own, and VBUS brought over the
board and across the channel, as the ring's example brings it; and a script that writes a greeting,
then counts the seconds.

## Considered options

- **Placed as the motion sensor is, its pins read from the wiring, its name on the part**: chosen.
  It is a board of its own beside the breadboard, as the sensor is, and ADR 0057 names it.
- **The tutorial's pins, GP14 and GP15**: chosen. They sit beside a ground pin on the Pico's bottom
  row, so three of its jumpers go in side by side, and a reader with the tutorial's script finds it
  on the pins it names.
- **GP16 and GP17, on the top row by a ground pin**: rejected, though they need no wire to bring VBUS
  across. They are I2C0's, and a reader with the tutorial's script would find it on other pins and
  another bus.
- **Any GPIO for SDA and SCL, as the motion sensor takes any**: rejected. The Pico's I2C reaches only
  its own pairs, and a script given another pin fails with no word of the wiring.
- **VCC on 3V3(OUT)**: rejected. Most such screens show nothing at 3.3 V, their contrast needing
  more, and the backlight is dim.
- **A level shifter between the backpack and the Pico**: rejected. The Pico 2 W's pins take its 5 V,
  but for the three the ADC shares, which the check refuses.
- **A closed list of models**: rejected, as for the motion sensor (ADR 0055). The screens sold with a
  backpack differ in its address and the order of its pins, and the jumpers go on by name.
- **The screen's own sixteen pins, without a backpack**: rejected until a circuit needs it. It takes
  six GPIOs and a potentiometer, and every screen sold to go with a Pico has the backpack.

## Consequences

- **A circuit can write on a screen**, and its page names the parts to buy for it: the screen with
  its backpack, and four female-to-male jumpers.
- **Its script needs a library**, which the Pico does not carry, so the circuit names it, and the page
  says where to fetch it (ADR 0062).
- **VBUS reaches past the Pico on a jumper**, as for the motion sensor. The check refuses VBUS joined
  to any pin, and the jumper is red.
- **A second part on the same I2C pins**, as the tutorial's temperature sensor, is refused: SDA and
  SCL each have nothing else on them. A circuit that shares the bus brings that use with it.
- **A backpack at another address** shows nothing with the script as written; the note says how to
  find its address.
- **The engine's Russian grows** by its sentence, its label, its parts list's lines and its note.
