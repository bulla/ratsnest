# ADR 0047: Lift a light's leader over the transistors and capacitors in its way

**Status:** Accepted · 2026-11-23

## Context

A labelled part's leader runs from the part straight to its label past the board's end (ADR 0024),
along the lane between two rows nearest its middle. A button in the way of another button's leader
gives that one a lane of its own (ADR 0026), and nothing else was ever in the way: the parts scratchpi
drew were lights, buttons and buzzers, which a layout spaced apart.

The capacitor tester (ADR 0046) stands two transistors and two capacitors in a row between its two
lights. The left light's leader ran along the channel behind all four, drawn under their cases, and
read as running into them rather than past them.

## Decision

**When a light's leader would pass behind a transistor's case or a capacitor's can on its way to its
label's end of the board, it rises over them**: it leaves from the top of the light's lens, goes
straight up to the first lane between rows above the light and every one of them, and runs along
that lane to the label. Only those two parts count, the ones ADR 0040 brought, so that no page made
before them changes.

## Considered options

- **Lifted over them, from the top of the lens**: chosen. The leader leaves the light where nothing
  else is, and runs where nothing stands.
- **Left as it was, behind them**: rejected. It reads as running into the first part in its way.
- **Drawn over them**: rejected. A line across a transistor's case crosses its print, which is what
  tells it apart (ADR 0040).
- **The label at the board's near end, for a light whose way is blocked**: rejected. The near end is
  where a second board's near half puts its labels (ADR 0027), and a page with labels at both ends
  for parts on one board reads as two drawings.
- **Every standing part counted, a light's lens and a buzzer included**: not now. It would move the
  leaders of pages made before, and no layout has needed it.

## Consequences

- **The capacitor tester's labels read**, at every quarter turn.
- **A leader may now bend twice**, up from the light and along its lane, as a blocked button's
  does.
- **Only lights are lifted.** A button's leader keeps ADR 0026's lanes, and a buzzer's or an RGB
  LED's would still run behind a transistor in its way, until a layout puts one there.
