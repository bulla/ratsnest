# ADR 0010: Let a circuit be written in one language or several, and make a page only in one it has

**Status:** Accepted · 2026-11-20

## Context

ADR 0005 makes the language an input to the generator, and left which languages there are to a
record of its own. ADR 0006 left how a circuit's file holds its words in more than one language to
the same record. The owner wants one language to be enough for a circuit, several to be possible in
the same file, English, French or Russian among them, and the language asked for to be checked
against the file before anything is made.

## Decision

**The engine knows three languages: English `en`, French `fr` and Russian `ru`.** For each one it
has a table of its own sentences, the ones it writes from the parts, such as where a resistor goes.
Each table is complete and typed, so a sentence missing in one language does not compile. A
language the engine does not know is a change to the engine.

**A circuit is written in any of them, one at least.** Every text in its file that a reader sees, its
name, its sentence, its parts' names, each step's title and note, and its test script, is an object
with a key for each language it is written in:

```ts
title: { en: "Green LED on GP16", ru: "Зелёный светодиод на GP16" },
```

**A circuit's languages are the languages of its name**, and every other text in it has exactly
those. The validator refuses a file where a text lacks a language the name has, or has one the name
lacks, and names the text and the language.

**A page is made only in a language its circuit has.** The generator checks the language first,
before anything is drawn, and refuses with the languages the circuit does have. The `circuit` skill
checks before it calls the generator: when it asks for a language it offers only the circuit's own,
and when a request names one the circuit lacks, it says so and offers to add it.

## Considered options

- **One language required, several allowed, checked first**: chosen, as the owner asked. A circuit
  ships as soon as it reads well in one language, and gains others one at a time.
- **Every circuit in every language the engine knows**: rejected. A circuit could not ship until all
  its translations exist, and the owner wants one to be enough.
- **A list of the circuit's languages, declared in its file**: rejected. The keys of its name already
  say it, and a list would be a second place to keep in step with them.
- **A file per language, such as `red-green-leds.ru.ts`**: rejected. ADR 0006 puts a circuit in one
  file, and a step reworded in one language would leave its others out of sight.

## Consequences

- **A circuit in Russian alone is a whole circuit**, so the engine's Russian has to be as complete as
  its English from the start.
- **Adding a language to a circuit means writing every one of its texts in it**, and the validator
  lists the ones still missing.
- **A wrong language fails before any drawing**, so nothing half-made comes out of the generator.
- **The engine's three tables are kept complete by their types, not correct.** A sentence whose
  meaning drifts between languages is for someone who reads both to catch, and the engine's Russian
  needs a reader of Russian before it ships.
- **Cyrillic brings checks of its own** (ADR 0011).
