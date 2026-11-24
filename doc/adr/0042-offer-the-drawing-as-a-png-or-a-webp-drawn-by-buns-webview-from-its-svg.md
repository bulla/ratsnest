# ADR 0042: Offer the drawing as a PNG or a WebP, drawn by Bun's WebView from its SVG

**Status:** Accepted · 2026-11-23 · Amends ADR-0005 (a PNG or a WebP is the same file only from the same browser), ADR-0016 (on Linux and Windows, a PNG or a WebP needs a browser installed), ADR-0023 (a drawing is also written as `.png` or `.webp`) and ADR-0031 (the drawing alone is also a PNG or a WebP) · Amended by ADR-0048 (a stuck step gives up its view, and the picture is begun again, three times in all)

## Context

ADR 0031 made the drawing alone an SVG file, a picture for other pages to embed. The owner now wants
it as a PNG and as a WebP too, each a file of its own, for the places that take a picture but no
SVG.

Bun 1.4.5 encodes both itself: `Bun.Image` writes PNG with spng and WebP with libwebp, linked into
Bun, and says its output is the same bytes on Linux, macOS and Windows. It reads no SVG, though, so
something has to draw the SVG into pixels first. Two were tried on Push button:

- **Bun's `WebView`**, also in Bun 1.4.5 and marked experimental: a headless browser, the system's
  WebKit on macOS, and elsewhere a Chrome, Chromium, Edge or Brave that it finds on the machine. It
  drew the SVG as the page draws its drawing, in about a second.
- **resvg, in WebAssembly** (`@resvg/resvg-wasm` 2.6.2): it reads no CSS variable, so every colour
  came out black until the theme's were written into the file, and it draws Nunito's variable font
  at its lightest weight alone, so every label came out thin. It took a tenth of a second.

Two mistakes in the first trials say how the browser must be given the SVG. Put inside an HTML page,
the SVG's `:root` is the page's, so its theme, set on the `<svg>`, was lost, and a dark drawing came
out in light colours. And a `data:` address with no character set turned every `Ω` into two other
letters.

## Decision

**`ratsnest generate` also takes `--format png` and `--format webp`**, written to
`pages/<circuit>.<orientation>.<theme>.<language>.png` or `.webp` unless `--out` says where, from the
same four inputs.

**Each is a picture of the SVG that `--format svg` writes**, drawn from that very file, so all that
ADR 0031 says of how the SVG looks holds for both: its own background, its theme fixed, its credit
along its bottom edge, and no caption.

**It is drawn by Bun's `WebView`**: on macOS by WebKit, and on Linux and Windows by a Chrome, Chromium,
Edge or Brave it finds, Windows having Edge already. ratsnest always starts a headless browser of its
own, and never connects to one already running, which would open the drawing as a tab in a person's
own browser. The browser is given the SVG as a document of its own, as a `data:` address that says
UTF-8, sized to the picture, and the picture is taken once its fonts have loaded.

**It has 12 pixels per millimetre of the drawing**, twice the SVG's 6 (ADR 0031): a flat board about
1490 px wide, and the credit about 18 px tall.

**`Bun.Image` encodes it**, from the browser's PNG: a PNG, or a lossless WebP. Every system then
writes it with the same encoders, and the file holds nothing of the browser's but the pixels.

**With no browser to draw it, `generate` says what to install** and that `BUN_CHROME_PATH` names a
browser it does not find by itself, and makes nothing. **A step the browser has not finished in 15
seconds is given up**, and `generate` says which step and makes nothing, rather than wait for ever.

**The `circuit` skill makes a PNG or a WebP when asked, and hands the file over**, as it does an SVG.
It never publishes one, and `ARTIFACTS.md` lists pages alone (ADR 0013).

This amends ADR 0005, whose same inputs make the same file byte for byte, which a PNG or a WebP does
only from the same browser at the same version; ADR 0016, whose user installs nothing else, which
on Linux and Windows holds for everything but these two; ADR 0023, where a drawing is also named
`.png` or `.webp`; and ADR 0031, where the drawing alone is also a PNG or a WebP. Everything else in
them stands.

## Considered options

- **What draws the pixels**:
  - **Bun's `WebView`**: chosen by the owner. It brings no dependency, and it draws what a browser
    draws from the SVG, so there is one drawing to keep in step, whatever the browser can draw.
  - **resvg, in WebAssembly**: rejected. It is the same bytes on every system, needs nothing
    installed, and is ten times faster, but it is a dependency of 2.5 MB in every executable, under
    MPL-2.0, last released in 2024. ratsnest would write it a second SVG, its colours written out and
    its words turned into outlines with fontkit, which is a second way of drawing text to keep in
    step with the browser's.
  - **Playwright and its Chromium**: rejected. ratsnest uses them to look at a page where the work is
    done, never as a dependency, and they are hundreds of megabytes that a user would install.
  - **A button on the page that saves its drawing**: rejected. The reader's browser would draw it,
    differently in each, and the page would gain something to do after it is made (ADR 0008).
- **How large it is**:
  - **12 px per millimetre**: chosen. It is sharp on a phone or a high-density screen, and a host can
    always show it smaller.
  - **6 px per millimetre, the SVG's size**: rejected. A picture cannot be drawn again sharper, as an
    SVG is, and its credit would be 9 px tall.
  - **An option for the size**: not now. It would be an input beyond ADR 0004's four, for a need
    nobody has had yet.
- **How a WebP is written**:
  - **Lossless**: chosen. Push button's, at 6 px per millimetre, was 35 KB, against its PNG's 57 KB.
  - **Lossy**: rejected. It smudges the edges of text and of thin wires, which are most of the
    drawing.
- **What encodes it**:
  - **`Bun.Image`, from the browser's PNG**: chosen. The same encoders on every system, and no
    metadata of the browser's in the file.
  - **The browser**: rejected. WebKit writes no WebP, and each browser's PNG differs.
- **What the browser is given**:
  - **The SVG file, as a document of its own**: chosen. Its theme is the one it sets, as wherever it
    is embedded by `<img>`.
  - **The SVG inside an HTML page**: rejected. Its `:root` is the page's, and the theme is lost.

## Consequences

- **On Linux and Windows, a PNG or a WebP needs a browser installed**, which Windows has and a Linux
  machine without a desktop may not. ratsnest says so, and everything else it does still needs
  nothing installed.
- **The same inputs make the same picture only from the same browser at the same version.** A test
  holds the same bytes twice on one machine, and no test can hold them across machines. The page
  and the SVG are still the same bytes everywhere.
- **It leans on an API Bun calls experimental.** Bun is pinned exactly (ADR 0009), so the API
  changes only when ratsnest moves to another Bun, and the tests and the compiled check on three
  systems run it then.
- **A picture takes about a second**, most of it starting the browser.
- **macOS's WebKit once did not finish a picture in continuous integration**, where the same test
  had passed before and passed in every other file. A stuck step now fails after 15 seconds and
  names itself, so a hang is a failure that says where, not a wait for ever.
- **The tests need a browser where they run**: `CONTRIBUTING.md` says so for Linux. GitHub's runners
  have Chrome and Edge, and macOS its WebKit, which only the compiled check on macOS runs, since no
  Mac is at hand where the work is done.
- **A picture's words cannot be selected or found**, and it does not grow sharp as an SVG does: the
  SVG stays the better file for a host that takes one.
- **`--format` gains two values on the public surface**, so the release that brings them is a minor
  one (ADR 0017).
- **The `circuit` skill's text changes**, which users get: a line in the changelog, and every project
  takes it at its next `rnest update`. `ATTRIBUTION.md` says that a PNG or a WebP carries the credit
  as the SVG does.
