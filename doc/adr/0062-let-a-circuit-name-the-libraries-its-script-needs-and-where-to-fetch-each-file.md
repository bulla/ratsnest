# ADR 0062: Let a circuit name the libraries its script needs, and where to fetch each file

**Status:** Accepted · 2026-11-28

## Context

Every script so far has used MicroPython's own modules, which every Pico carries. The character
LCD's (ADR 0060) imports a library that it does not: two files, `lcd_api.py` and `pico_i2c_lcd.py`,
published by their author on GitHub, which the reader saves on the Pico beside the script before
running it. The tutorial the owner chose gives the address of each file's raw text, to open, copy
whole into a new tab in Thonny and save on the Pico under the same name. The owner asked for the
circuit to say so and to link to the library, as the tutorial does.

A step's note could say it in words, but a circuit's words are text, which the page escapes and
does not link, and an address written in each language is three copies of one fact.

## Decision

**A circuit on a Pico may name the libraries its script needs**, in `libraries`, each one its name,
the address of its page and the address of each of its files:

```ts
libraries: [
  {
    name: "RPI-PICO-I2C-LCD",
    url: "https://github.com/T-622/RPI-PICO-I2C-LCD",
    files: [
      "https://raw.githubusercontent.com/T-622/RPI-PICO-I2C-LCD/main/lcd_api.py",
      "https://raw.githubusercontent.com/T-622/RPI-PICO-I2C-LCD/main/pico_i2c_lcd.py",
    ],
  },
],
```

None of them is a text: a library's name and its addresses are the same in every language. The
field checks hold every address to `https://`, each file's to end in a MicroPython file's name,
`.py` or `.mpy`, which is the name the reader saves it under, and no two files to share a name. A
circuit with a supply has no script, and no libraries.

**The page says it above the script**, in its language, the library's name linked to its page and
each file's name to its address: "This script needs the RPI-PICO-I2C-LCD library, which the Pico
does not have. Open each of its files, lcd_api.py and pico_i2c_lcd.py, copy all of it into a new
tab in Thonny, and save it on the Raspberry Pi Pico under the same name, before you run the script."
Its links are the page's only ones that leave it, and load nothing: the page still carries all it
draws (ADR 0004).

## Considered options

- **A field of its own, with an address for each file**: chosen. The page links each file the
  reader saves, as the tutorial does, and the name it is saved under is the address's last part.
- **A step's note, or the description**: rejected. A circuit's words are not linked, and each
  language would write the addresses again.
- **The engine knowing the LCD's library, as it knows a transistor's legs**: rejected. The library is
  the script's choice, not the part's: another script drives the same screen with another library,
  or none.
- **The page's own copy of each file, carried inside it**: rejected. The files are their author's,
  under their own licence, and change; the page would carry a copy it cannot keep up to date.
- **`mip install`, MicroPython's own installer, as the instruction**: rejected for now. It needs the
  Pico on a network, or `mpremote` on the computer, and the reader uses Thonny.

## Consequences

- **A page can send a reader off it**, to another site, for the first time. The link is to where the
  library's author publishes it, which the circuit's author answers for, as for its credit
  (ADR 0035).
- **A library that moves breaks its circuit's page**, which nothing checks, since ratsnest reads no
  address. Its author changes the address in the circuit.
- **The format grows a field**, which every older circuit does without: a minor release (ADR 0017).
- **The engine's Russian grows** by the sentence above the script.
