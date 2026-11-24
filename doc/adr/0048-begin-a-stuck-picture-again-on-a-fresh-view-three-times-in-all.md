# ADR 0048: Begin a stuck picture again on a fresh view, three times in all

**Status:** Accepted · 2026-11-24 · Amends ADR-0042 (a step the browser has not finished in 15 seconds gives up that view, not the picture, which is begun again on a fresh one, three times in all)

## Context

ADR 0042 draws the drawing as a PNG or a WebP with Bun's `WebView`, and gives each step in the
browser 15 seconds, after which `generate` names the step and makes nothing. Once that was in,
continuous integration failed now and then on the first step, "load the drawing": macOS's WebKit
on the electrolytic capacitor's pull request, twice, and Linux's Chrome on `develop` itself, just
after the pictures were merged, where the same code passed on the commits either side. No machine at
hand made it happen, in more than a hundred pictures drawn one after another and six processes
drawing at once.

`navigate` resolves on the page's `load` event and on nothing else: Bun 1.4.5's Chrome backend waits
for `Page.loadEventFired`, and nothing asks again if it never comes. The drawing is a `data:`
address, with nothing to fetch. The jobs' times say what follows: a failing test job took about 15
seconds longer than a passing one, as for one wait, though the pictures after it in the same file
were drawn by the same browser. One view waits for ever, and the next draws at once.

## Decision

**A picture whose step the browser has not finished in 15 seconds is begun again, on a fresh view,
in the same browser, three times in all.** Only a stuck step is tried again: a browser that cannot
be started would fail the same way each time, and is said at once. After the third, `generate` says
which step stuck, and in how many tries, and makes nothing, as ADR 0042 says.

This amends ADR 0042's clause on a stuck step, which gave the picture up at the first.

## Considered options

- **Begin the picture again on a fresh view** (chosen). It is what the jobs showed to work: the next
  view in the same browser drew.
- **Give the step longer.** A view that has missed its `load` does not get it later: before
  ADR 0042's 15 seconds, the test's own 30 did not see it come.
- **Start the browser again, with `Bun.WebView.closeAll()`, before trying again.** It would also mend
  a browser stuck whole, which was not seen, and costs a second start each time; a first start slower
  than 15 seconds would be killed and begun cold again.
- **Wait for the drawing otherwise than by `navigate`**, asking the page from `evaluate` whether it
  has loaded. Bun does not say what `evaluate` does while a navigation is in flight, and the drawing
  must be a document of its own (ADR 0042), so it cannot be written by script into an HTML page.
- **Run the failing tests again in continuous integration, and leave `generate` alone.** Whoever runs
  `generate` meets the same hang, with nobody to run it again for them.
- **Leave it, and run failing jobs again by hand.** Every pull request stacked on another waits on
  someone to notice.

## Consequences

- **A hang costs 15 seconds, not the picture**, and a picture stuck three times running costs 45
  before `generate` says so.
- **The cause is not known**, only where it happens and what mends it. If a later Bun stops missing
  the `load`, this is a retry with nothing to do; if every view in a browser came to hang, three
  tries would only wait three times as long before saying so.
- **The tests' timeouts leave room for it**: a test that draws a picture has 60 seconds, and the CLI
  test that draws two has 90.
- **A test holds the retry with a step stuck by hand**, and no test can make the browser miss its
  `load`, so only continuous integration says whether three tries are enough.
