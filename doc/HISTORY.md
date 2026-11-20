# History

What ratsnest has become, milestone by milestone, and the log of how it got there. Each milestone
below carries the paragraph that summed it up and the items it finished; the items it left open go
to [`ROADMAP.md`](ROADMAP.md), gathered by kind. Why each thing is the way it is lives in
[`adr/`](adr/).

When a piece of work lands, its checklist moves here under a heading of its own, its open items go
to the roadmap's Open points or Backlog, and the Log below gets an entry.

## Milestones

### M0: the design

M0 is done: twenty records, argued one question at a time by `/interview` on 2026-11-20, and no
code. ratsnest started as a stand-alone copy of scratchpi's wiring pages and became a builder: a
command-line tool, shipped as one executable per platform, that reads a circuit written as data in a
project of its own and makes a self-contained page in a chosen orientation, theme and language.
Several choices were tried before they were made, on this container with Node taken off the `PATH`:
Bun, Vitest on Bun and Deno for the runtime; Solid 2 on Bun, for later; Nunito's coverage and
metrics against five other fonts; and a compiled executable on five systems. What they found is in
each record, and the traps they turned up are in `CLAUDE.md`'s Notes.

- [x] What ratsnest starts from, and what it draws: ADR 0001, ADR 0002
- [x] What an asset is, and the inputs that make it: ADR 0003 to ADR 0005
- [x] What a circuit is, written as data with everything that computes outside it: ADR 0006,
      ADR 0007
- [x] The stack: no framework, Bun entirely: ADR 0008, ADR 0009
- [x] Languages, Cyrillic included, and the font: ADR 0010 to ADR 0012
- [x] Publishing as Artifacts, and from where: ADR 0013, ADR 0019
- [x] A builder, circuits in projects of their own, and their migrations: ADR 0014, ADR 0015
- [x] Shipping, versions, licences and continuous integration: ADR 0016 to ADR 0018, ADR 0020
- [x] The `circuit` skill, which keeps every circuit declarative and every page alike
- [x] `CLAUDE.md`'s Status, Design and Stack from the records, and the roadmap

## Log

- 2026-11-20: Repo created, empty. `CLAUDE.md`, the roadmap, this file, the records' practice and
  the `interview` skill carried over from scratchpi, with nothing yet for them to describe.
- 2026-11-20: Renamed from ratnest to ratsnest on GitHub, because it reads better and is the more
  accurate name.
- 2026-11-20: M0. The design, by interview, in twenty records. It began as a copy of scratchpi's
  circuit pages, the visuals above all (ADR 0001), and turned on one rule the owner asked for: a
  circuit file only declares, and the engine alone computes, which is what keeps every page alike
  (ADR 0007). Two questions reshaped it halfway. Asked whether circuits had to live in ratsnest's
  repository, the answer made ratsnest a builder with projects of its own and migrations in the
  manner of Angular's (ADR 0014, ADR 0015); asked whether Bun could make a standalone tool, a trial
  compile made it the way ratsnest ships (ADR 0016). Strict SemVer, computed from a snapshot of the
  public surface, came out of wanting to publish safely (ADR 0017). The owner merged each batch of
  records as it was decided, from pull request 3 on.
