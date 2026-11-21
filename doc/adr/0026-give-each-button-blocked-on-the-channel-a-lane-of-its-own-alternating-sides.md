# ADR 0026: Give each button blocked on the channel a lane of its own, alternating sides

**Status:** Accepted · 2026-11-21

## Context

A button's leader leaves along the channel, towards the board's end, where its label is
(ADR 0024). A button with another labelled button further along the channel would run its leader
straight through that one, so the copied code lifts it: it leaves from the top of its body and runs
between rows d and e instead (scratchpi's ADR 0097), so that nobody has to tell two leaders on one
line apart.

scratchpi never had more than two buttons in a line. With three, as a row of red, green and blue
buttons has, the first two are both blocked, both are lifted into the gap between d and e, and their
leaders share one line from the second button to the margin: the very thing the lift was for.

## Decision

**Each blocked button takes a lane of its own, on alternating sides of the channel.** The blocked
buttons in a line are taken from the one nearest the end their labels go past to the one furthest
from it. The first runs between rows d and e, as before; the second between f and g, below the
channel; the third between c and d, and the fourth between g and h, each a row further out on its
side. A lane above leaves from the top of the button's body, and a lane below from its bottom.

The labels need no order of their own: they stand in the order their leaders reach the board's
end (ADR 0024), so no two leaders cross. Three buttons in a line at 90° are labelled first, last and
middle, left to right.

## Considered options

- **Alternating sides**: chosen. Two blocked buttons, the case scratchpi had, run as they always
  did, and a third goes under the channel, where nothing has run before.
- **Stacked on one side, d and e, then c and d, then b and c**: rejected. It works, but every lane
  past the first runs through rows a to d, where the jumpers to a button's own column and to the
  rails are, and it puts the first button's label furthest from the channel.
- **Let the circuit order the labels**: rejected. A label's place is how a page looks, which a circuit
  never says (ADR 0007), and an order the leaders do not follow would cross them.

## Consequences

- **A drawing with two buttons in a line is unchanged**, byte for byte.
- **A leader can now run below the channel**, between f and g, past the bottom legs of every button
  further along. Nothing checks that a part's words leave that gap clear, as nothing checked it for d
  and e.
- **The labels' order follows the lanes**, so a reader of three buttons in a line meets their
  labels out of their order along the board. That is the cost of leaders that never cross.
