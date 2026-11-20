# ADR 0013: Publish a page as an Artifact only when asked, one per set of inputs, its link kept by each person

**Status:** Accepted · 2026-11-20

## Context

The owner wants a few of ratsnest's pages kept as Artifacts on claude.ai first, and served as static
files later. Four facts shape how:

- **An Artifact belongs to one account**, private until its owner shares it, and everyone who
  checks out the repository publishes to their own.
- **The Artifact tool remembers nothing between conversations.** A later session can update an
  Artifact only if it has the Artifact's link, and two pages of one circuit, made with different
  inputs, have the same title (ADR 0005).
- **A cloud session's checkout is reclaimed when the session ends.** A file that is not committed
  lasts as long as the machine it is on.
- **claude.ai has a contract for an Artifact's page**: a title that is a name, colours as tokens on
  `:root`, an explicit background, no sideways scroll on a phone, and its theme following the
  reader's.

## Decision

**The `circuit` skill publishes a page only when asked**, with Claude's Artifact tool, and **one
Artifact holds one set of four inputs** (ADR 0005): Red/Green LEDs at 90°, dark, in Russian is one
page at one link.

**Each person keeps their own links in `doc/ARTIFACTS.md`, which is gitignored.** The skill makes it
the first time it publishes: a row per Artifact, with its four inputs, its link, the commit its page
was made from and the date. Asked again for inputs it has a row for, the skill updates that
Artifact, at the same link; after a change to the engine, it can republish every row.

**Every page names its four inputs, in a `<meta name="ratsnest">` tag, so the file can be lost.**
When it has no row for the inputs asked, on a new machine, in a new cloud session or after a
deletion, the skill looks through the person's own Artifacts that carry the circuit's title, reads
each one's tag, and updates the one that matches before it makes a new one. The row then goes back
into the file.

**A page meets the Artifact contract where no record says otherwise**: its `<title>` is the
circuit's name, its colours are tokens on `:root`, it has an explicit background, and it never
scrolls sideways on a phone, because the drawing scrolls in its own panel. It does not follow the
reader's light or dark, because its theme is one of its inputs (ADR 0005). Publishing never changes
a generated page (ADR 0007): where the contract and the page disagree, the engine changes, with a
record.

## Considered options

- **On request, one Artifact per set of inputs, the links in a gitignored file of each person's own,
  and the pages able to rebuild it**: chosen. The owner asked for the file and for it to be
  gitignored, and the tag is what makes a file that comes and goes with a machine safe to rely on.
- **The links committed to the repository**: rejected by the owner. A person's Artifacts are their
  own and private, so one person's links are no use to another.
- **The file alone, with no tag in the page**: rejected. In a cloud session the file is gone at the
  end of every session, and the next one would publish duplicates of every page.
- **The tags alone, with no file**: rejected. Every publish would read every Artifact with the
  circuit's name, where the file answers at once. The file makes the usual case quick, and the tag
  makes the unusual one safe.
- **One Artifact per circuit, holding every variant as a file of its own**: rejected. A variant
  would be reachable only by typing its address, since a page links nowhere (ADR 0004).
- **Publish every page that is made**: rejected. The gallery would fill with near-duplicates.

## Consequences

- **In a cloud session the file goes with the session**, and the next session rebuilds it from the
  pages' tags, one read for each Artifact carrying the circuit's title.
- **A published page does not follow the engine.** It stays as it was made until it is published
  again, and the file says which commit made each one.
- **The links are private**: they open for their owner, and for whoever each Artifact is shared
  with.
- **Publishing happens in Claude, not from a script**, because only the Artifact tool can do it. A
  static site, later, is the way out that needs no Claude.
