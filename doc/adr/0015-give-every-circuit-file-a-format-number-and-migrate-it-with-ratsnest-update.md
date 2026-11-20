# ADR 0015: Give every circuit file a format number, and migrate it with `ratsnest update`

**Status:** Accepted · 2026-11-20

## Context

With circuits in projects of their own (ADR 0014), ratsnest changes underneath files it never sees.
The owner does not want the engine kept compatible with old circuit files, and asked for an upgrade
path in the manner of Angular's command-line tool, whose `ng update` moves a project to a new
version and runs the migrations that version ships.

## Decision

**Every circuit file says which format it is written in**: `format: 1`, an integer in its data
(ADR 0007). It rises only when a change to the circuit format would break existing files, not with
every release of ratsnest.

**The engine reads only the current format.** It refuses a file of an older one before anything
else, naming the file and saying to run `ratsnest update`, and refuses a newer one, saying the
project's ratsnest is older than the file.

**`ratsnest update` is the upgrade path.** It:

1. moves the project's pinned ratsnest to the version asked for, the latest by default;
2. runs that version's migrations on every circuit file, from each file's format to the current one,
   one format at a time;
3. replaces the project's copy of the `circuit` skill (ADR 0014);
4. runs `ratsnest check`, and says which files, if any, need a person.

**A migration takes a circuit's object from one format to the next**, and nothing else. Because a
circuit file only declares (ADR 0007), a migration never meets a loop or a helper it does not
understand: it reads the object, changes it, and writes the file back with its comments, leaving
the formatting to Biome. A migration that cannot decide something leaves the file as it was and
names what a person has to choose. Each migration ships with a test that runs it on files of the
format before, ratsnest's examples among them, kept as they were.

## Considered options

- **A format number in every file, and migrations run by `update`**: chosen. A file says what it is
  wherever it is copied, and an upgrade is one command.
- **The project's ratsnest version as the only clue, as Angular reads `package.json`**: rejected. A
  circuit copied from one project to another, or sent to someone, would no longer say what it is.
- **An engine that reads every old format**: rejected by the owner. Every old format would live in
  the engine for ever, and every rule would be checked against all of them.
- **No migrations, and release notes saying what to change by hand**: rejected. Every person would
  make every change in every file, and some would make it differently.

## Consequences

- **Breaking the circuit format costs a migration and its test**, written in the same change, which
  makes such a change deliberate.
- **Writing a file back with its comments needs a printer that keeps them**, a tool still to choose,
  in the milestone that writes the first migration.
- **Old files are kept as test fixtures for as long as their migration exists.**
- **A project that skips versions migrates through every format in between**, in order, which is the
  only way each migration needs to know just one format before its own.
