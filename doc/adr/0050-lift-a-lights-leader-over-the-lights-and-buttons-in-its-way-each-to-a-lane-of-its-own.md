# ADR 0050: Lift a light's leader over the lights and buttons in its way, each to a lane of its own

**Status:** Accepted · 2026-11-24 · Amends ADR-0047 (lights and buttons in its way count too, and each lifted leader takes a lane of its own)

## Context

Every label on the first board goes past its far end (ADR 0024), its leader along the lane between
two rows nearest the part's middle. A light's lane follows from the row it stands in: a light in row
f or g runs along the channel, one in row h or i between f and g. A button across the channel runs
along the channel too, and one with another button further along takes a lane of its own (ADR 0026).
ADR 0047 lifted a light's leader over the transistors and capacitors in its way, and only those.

The diode's example (ADR 0049) has three lights and two buttons on one board, all wired from the
bottom rails. Every leader runs to the same end, and two parts at one lane cannot both run clear: a
light in row f or g blocks the channel's lane of every button to its left, and a button blocks such
a light's lane to its right. A search of every arrangement of its parts the check would pass found
none whose five leaders each ran clear, unless the lights stood in the top half, wired across the
channel, the circuit then hidden under twice its wires. A leader run behind a light or a button reads
as running into it.

## Decision

**A light's leader rises over the lights and buttons in its way, as over transistors and capacitors**
(ADR 0047): from the top of its lens, straight up to a lane between rows, and along it to its label.
**Each lifted leader takes a lane of its own**: the first above the light and everything in its way
that nothing standing crosses and no other leader runs along, the other leaders being every
labelled part's but a light's further from the end. So the lights nearer the end choose first, and a
light further from it rises higher, its rise crossing no other's run. A light's box is its lens down
to its legs' holes; a button's, its body with its legs.

## Considered options

- **Lifted over lights and buttons too, each to a lane of its own**: chosen. It is ADR 0047's rule
  with two more parts counted, and a lane chosen where two leaders would have shared one.
- **The layout alone**: rejected. No layout of this circuit on one board gives every leader a clear
  run without wires across the channel to lights in the top half.
- **The labels at the near end, on a circuit with a supply**, where no Pico stands: rejected. It
  would move the labels of every page with a supply, and ADR 0047 turned down labels at both ends
  of one board as reading like two drawings.
- **A button's leader lifted or laned over a light in its way as well**: not now. A button keeps
  ADR 0026's lanes, so a layout keeps lights out of a button's lane further along, as the example
  does. A rule for both is a lane for every labelled part at once, which this circuit does not need.
- **Fewer labelled parts**: rejected. Lights and buttons are labelled because a reader watches and
  presses them by name (ADR 0041); the example's are what it teaches.

## Consequences

- **No page made before changes.** Every example's drawing, at every quarter turn, in both themes and
  every language it has, is the same before and after, but for the tokens it carries; the capacitor
  tester's light rises to the lane it rose to.
- **A layout puts a lifted light further from its label's end than every button whose lane would
  cross its rise**, and keeps the lanes above it free: the example's lights stand left of both
  buttons, under an empty top half.
- **Up to four leaders can rise from one half of the board**, one to each lane above it, before none
  is left; a light with no free lane runs straight, as before ADR 0047.
- **A value tag still keeps off a light's legs but not its lens**, as it always has, so a layout is
  looked at, at every quarter turn, before it is published.
