# ADR 0057: Give every part outside the breadboard a name, written on the part

**Status:** Accepted · 2026-11-26 · Amends ADR-0041 (a part outside the board has a name of its own)

## Context

ADR 0041 places a new part in its step as a resistor is, with no name of its own and no callout,
and the parts after it followed it, those the script reads among them (ADR 0051, ADR 0053,
ADR 0054). The PIR motion sensor (ADR 0055) is the first part that is not in the breadboard at all:
it lies beside it, on jumpers (ADR 0056). More will come: relay boards, LED matrices, solar panels,
LCD screens. Each is a board of its own, with pins of its own, bought as a module.

Its second draft followed ADR 0041 and had no name. The owner asked otherwise: everything that goes
outside the breadboard, as an extra component or board, has a name.

## Decision

**Every part that lies outside the breadboard has a name of its own, written on the part as a text
in each of the circuit's languages, and required:**

```ts
{
  kind: "pir",
  name: { en: "motion sensor", fr: "détecteur de mouvement" },
  power: "a2",
  output: "a13",
  ground: "a14",
}
```

The page calls it by its name, as it calls a light: **its label past the board's end**, its name
over the hole its signal goes in; **its step's sentence**, which opens with it; and **its parts
list's line**, which opens with it too. The field checks hold the name to the circuit's languages
and to ADR 0011's rules, as every text a reader sees.

Its pins are still read from its wiring and declared nowhere, as those of the parts the script reads
are (ADR 0051, ADR 0053): the name is the only thing it adds.

A part in the breadboard is placed as ADR 0041 says, with no name of its own.

## Considered options

- **The name on the part**: chosen, by the owner. One place for it, beside the holes it describes,
  and no `id` to keep in step with a list elsewhere, since a part outside the board is placed once.
  It fits a screen or a relay board with several signal pins as well as the sensor with one.
- **One `modules` list, declared at the top as `leds` and `buttons` are, and placed by its `id`**:
  rejected. It holds an `id` and a name and nothing else, so its only work is to be pointed at.
- **A list for each kind, `sensors`, `relays`, `screens`, each with the pin it is read on, as
  `buttons` are**: rejected, though it was the motion sensor's first draft. Each new kind of board
  adds a list, and a screen or a relay board with two or more signal pins has no one pin to declare.
- **No name, as ADR 0041 has every new part**: rejected by the owner. A board beside the breadboard
  is a thing a reader holds and buys by what it is, and the drawing's label is what points at it,
  away from the board, where a part's own print cannot be read.
- **A name a circuit may give or leave out**, as ADR 0041 left for later: rejected. A part outside
  the board without one would have no label, and every one of them has a name to give.

## Consequences

- **Every part outside the board has a label** past the board's end, which takes one place in the
  column there, as a light does.
- **A circuit file names it on the part**, a second place in the format where a name is written,
  beside the lists at the top for lights, buttons and buzzers. A reader of the format learns both.
- **ADR 0041 holds for every part in the breadboard**, and its status line says it is amended.
- **A French sentence gives the name its article by the part's kind**, `Le` for a sensor, so a kind
  whose names are feminine, `la carte relais`, brings its own when it comes.
- **Each new kind of board outside the breadboard takes `name` as the sensor does**, and its record
  says nothing more of it.
