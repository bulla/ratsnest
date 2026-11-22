# ADR 0031: Offer the drawing alone as a self-contained SVG, made by `generate --format svg`

**Status:** Accepted · 2026-11-22 · Amends ADR-0004 (a circuit's output is its page, or its drawing alone when asked) and ADR-0023 (a drawing is written as `.svg`) · Amended by ADR-0035 (the credit's words are the circuit's)

## Context

ADR 0004 made one asset per circuit, its page, and put the drawing alone as an SVG file among its
considered options as "not now": a second output to keep in step, which nothing asked for. The owner
now wants one, to embed in other pages.

The drawing inside a page cannot simply be cut out of it. Made for Push button, it is 75 KB of the
page's 161 KB, and it takes three things from the page around it:

- **its colours**, as 33 of `tokens.css`'s variables, which the page's `data-theme` sets;
- **its styles**, the `part`, `callout-*`, `glow` and `lit` rules in `page.css`;
- **its font**: it names none, and inherits Nunito, which the page carries (ADR 0012).

It has no size of its own, only a `viewBox` in millimetres, since the page's stylesheet sizes it.
Its labels beside the board are drawn in the page's ink on no background, so in the dark theme they
are pale. And the credit CC BY-SA 4.0 asks for is in the page's footer (ADR 0018), not in the
drawing.

## Decision

**`ratsnest generate` takes `--format html` or `--format svg`, and `html` is the default**, so what
it does without the option is unchanged. With `svg` it writes the drawing alone, from the same four
inputs (ADR 0004, ADR 0005), to `pages/<circuit>.<orientation>.<theme>.<language>.svg` unless `--out`
says where. The same four inputs make the same file.

**The SVG is a picture embedded by reference**, by `<img>` or a Markdown image, and so a document of
its own: it names the SVG namespace and is well-formed XML. Since a picture loaded that way can reach
nothing outside itself, **it carries everything it needs**:

- Nunito, as the page carries it: the Latin file always, and the Cyrillic one when the drawing writes
  a Cyrillic letter (ADR 0012);
- `tokens.css` as it is written, with the theme in `data-theme` on the `<svg>`, which in a document
  of its own is `:root`;
- the drawing's rules, which move out of `page.css` into a stylesheet of their own that the page and
  the SVG both carry.

Its narrow no-break spaces are written as thin spaces, as the page's are (ADR 0012). The drawing's
markup is the page's, the hooks for the page's script included, which do nothing without it.

**Its theme is fixed, and it paints its own background** in that theme's page colour, so that it
reads the same on any page it is put in. A page that wants both themes chooses between the two files
itself, with `<picture>` and `prefers-color-scheme`.

**It credits the drawing in a visible line along its bottom edge**, in very small text: 1.5 mm, the
size of the numbers printed on the breadboard, in the labels' muted ink. The line is the footer's
credit, shortened, in the drawing's language: where the Pico is drawn from, © Raspberry Pi Ltd,
CC BY-SA 4.0 with the licence's address written out, since a link in a picture cannot be followed,
the same licence for this drawing, and Nunito under the SIL Open Font License 1.1. It is measured in
Nunito and wrapped to the drawing's width.

**It says its size in pixels, at 6 px per millimetre of its `viewBox`**: about the page's own scale,
which draws a flat board at least 45rem across, so that a flat board is about 740 px wide and the
credit about 9 px tall.

**It has no caption**: neither the page's "tap a step", which is about its script, nor the key to the
rails, which the rails' printed + and − and the jumpers from GND and 3V3 already show.

**The `circuit` skill makes an SVG when asked, and hands the file over.** It never publishes one, and
`ARTIFACTS.md` lists pages alone (ADR 0013).

This amends ADR 0004, where a circuit's output is now its page, or its drawing alone when asked, each
one file that needs nothing else; and ADR 0023, where a drawing is named as a page is, but `.svg`.
Everything else in them stands.

## Considered options

- **What the SVG is for**:
  - **A picture to embed in other pages**: chosen. It is ADR 0004's one file that needs nothing
    else, and a file that works by `<img>` also opens in a browser and prints.
  - **A file to edit, in Inkscape or Illustrator**: rejected. It would push towards literal colours
    and the features every editor reads alike, a promise ratsnest has no way to test.
  - **Pieces for ratsnest's own site**, sharing a stylesheet and a font: not now. The site is in the
    roadmap's Later, and a record of its own.
- **How it is asked for**:
  - **An option on `generate`**: chosen. The circuit is checked and its inputs read once, by the
    command that already does it.
  - **A command of its own**, such as `ratsnest draw`: rejected. It would repeat `generate`'s checks,
    options and naming.
  - **The kind of file read from `--out`'s extension**: rejected. The default name has no extension to
    read, so the option would be needed anyway, and a path that decides what is made is hard to see.
- **How it is embedded**:
  - **By reference**: chosen. An `<img>` keeps the host's styles out of the drawing and the
    drawing's out of the host, and its ids cannot meet the host's.
  - **Pasted inline**: rejected. Every style in it, the 33 variables first, would reach the whole
    host page unless scoped, two drawings on one page would share their ids, and the host's own CSS
    could restyle the drawing.
- **How it reads on a host whose background is unknown**:
  - **A fixed theme, with its own background**: chosen. It is the only one that reads everywhere, and
    the four inputs stay four.
  - **A fixed theme, transparent**: rejected. It reads only on a host whose background matches it,
    and a dark one's labels all but vanish on white.
  - **One file following `prefers-color-scheme`**: rejected. A host whose own theme does not follow
    the reader's system still puts pale labels on white, and the file would switch an input, which
    ADR 0005 rules out.
- **How it credits the drawing**:
  - **A visible line**: chosen. CC BY-SA 4.0 asks for a credit in a manner reasonable for the medium,
    and for a picture that is something to see.
  - **In its metadata alone**: rejected. Nobody looking at the host page would see it, and the duty
    would pass to everyone who embeds a drawing, most of whom would not know of it.
  - **Both**: rejected. The metadata would be read by nobody.
- **How large it says it is**:
  - **Pixels, at 6 px per millimetre**: chosen. It reads as the page's drawing does, and a host can
    make it smaller, as GitHub does by itself.
  - **True scale, in millimetres**: rejected. Printed, it would be the size of the breadboard, but on
    a screen a millimetre is about 3.8 px, and 1.5 mm text about 5.7 px tall.
  - **No size, only the `viewBox`**: rejected. A browser then draws it at 300 by 150 px, every host
    would have to size it, and a Markdown image cannot.
- **What the skill does with it**:
  - **Makes it and hands it over**: chosen.
  - **Publishes it too**, beside its page's Artifact: rejected. An Artifact is private and opened
    with a claude.ai sign-in, so no other page could load it by `<img>`, which is what the SVG is for.
  - **Nothing**, leaving `--format svg` to be typed: rejected. The skill is the one way in that a
    project has (ADR 0014), and Claude would miss the option or guess at it.

## Consequences

- **A circuit has a second output to keep in step**, as ADR 0004 warned. One drawing function and
  one stylesheet shared by both keep them from drifting, and the tests make both from the same
  inputs.
- **Every SVG carries its own copy of Nunito**, 44 KB of Latin, so Push button's comes to about
  120 KB. The Backlog's font cut to the letters it uses would shrink it most.
- **`--format` is a second meaning of the word in ratsnest**, which already calls a circuit file's
  number its format (ADR 0015), and whose help ends on "A circuit file is written in format 1". Their
  values never meet: numbers there, `html` and `svg` here.
- **The credit line makes the SVG a few millimetres taller than the page's drawing**, and three or
  four lines on a board standing up, where the drawing is about half as wide. It is words in every
  language, the Russian table's reading in M6 included.
- **A dark SVG on a light page is a dark panel**, and a light one on a dark page a light panel.
- **A reader of the SVG has no key to the rails**, and reads them from the board.
- **Nobody hosts an SVG but the person who embeds it.** ratsnest writes the file, and the skill hands
  it over.
- **The `circuit` skill's text changes**, which users get: a line in the changelog, and every project
  takes it at its next `rnest update`. `ATTRIBUTION.md` says that an SVG carries its own credit, as a
  page carries it in its footer.
- **The option is new on the public surface**, so the release that brings it is a minor one
  (ADR 0017).
- **The tests hold it**: an SVG parses as XML; the same inputs make the same bytes; its credit fits at
  all four orientations in every language; every character it writes is in the files it carries; and
  the compiled check makes each example's SVG, since a stylesheet a compiled ratsnest does not carry
  is the kind of thing only a compiled ratsnest finds (ADR 0016).
- **It is not built yet.** The roadmap's Backlog line names this record until the code lands.
