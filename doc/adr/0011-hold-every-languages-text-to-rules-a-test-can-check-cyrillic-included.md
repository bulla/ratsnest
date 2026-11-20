# ADR 0011: Hold every language's text to rules a test can check, Cyrillic included

**Status:** Proposed · 2026-11-20 · *the owner asked for these rules; agreed once they have read
them*

## Context

ADR 0010 lets a circuit be written in English, French or Russian, and the owner expected Cyrillic to
be hard to test. It is, in five ways the copied code never met:

- **Cyrillic letters are not Latin ones, and some look exactly like them.** `а е о р с х` are not
  `a e o p c x`, so a word can look right and be a different string.
- **The same letter can be stored two ways.** `й` and `ё`, like French `é`, are one code point or a
  letter and a combining mark, and the two look the same.
- **Cyrillic is wider.** The copied drawing estimates a word's width by counting its characters, at
  about a millimetre each. That holds for the Latin capitals and digits it was written for, not for
  `Ш Щ Ж Ю`, and Russian words run longer than English ones.
- **Russian counts in three forms where English has two**: 1 резистор, 2 резистора, 5 резисторов.
- **Russian changes a word with its place in the sentence**: красная кнопка, but вставьте красную
  кнопку. An adjective also agrees with its noun's gender.

## Decision

Every rule below is checked by the validator or by the engine's own tests, except the one marked as a
reader's.

1. **Every text is NFC.** The validator refuses a text that is not, so a length, a width and a
   comparison each mean one thing. It also turns the ohm sign, U+2126, into the omega, U+03A9.
2. **One script to a word.** No word mixes Latin and Cyrillic letters. English and French text holds
   no Cyrillic letter at all. Russian text may hold a Latin word, but only whole: `GP15`, `USB`,
   `Thonny`, `MicroPython`.
3. **Look-alikes are folded before a hole or a pin is looked for.** A step's title or note never
   names a hole (ADR 0006), and in Russian `а21`, with a Cyrillic `а`, is a whole Cyrillic word that
   passes rule 2 and reads as the hole `a21`. So the check first folds every Cyrillic letter that
   Unicode's list of confusables pairs with a Latin one, and then looks for a hole or a pin.
4. **A drawn word is measured, not counted.** Every word the drawing writes, the callouts, the pins'
   names and the resistors' values, is measured from the advance widths of the font it is drawn in,
   and the overlap check (ADR 0007) runs for every language the circuit has, at all four
   orientations (ADR 0003). Which font, and how a page carries it, is decided next.
5. **A count goes through its language's plural rules.** The engine picks the form with
   `Intl.PluralRules` for the page's language, and each table gives every form its language needs,
   typed so that a missing one does not compile.
6. **A name is never inflected.** The engine's sentences put a part's name only where it stands as
   written, as the callouts already do, a title over a detail, and never as the object of a verb.
   A test cannot check grammar: a reader of Russian checks the Russian table before it ships, and
   again whenever it changes.
7. **The engine writes every value, in the page's language**: its decimal separator and its unit,
   such as 4.7 kΩ in English and 4,7 kΩ in French, through `Intl.NumberFormat` and the tables. A
   circuit's own text writes none, and the validator refuses a number followed by a unit in it.
8. **Each language's typography is checked.** French puts a narrow no-break space, U+202F, before
   `: ; ? !` and inside `« »`, as the copied tests already require. Russian uses `« »` and no space
   before `: ; ? !`, and English no space before them either. Straight double quotes are refused in
   French and Russian.
9. **A page says its language.** `<html lang>` is the language it was made in, so the browser's
   hyphenation, the font's forms for the language and a screen reader all follow it, and a long
   Russian word breaks in the page's text instead of overflowing it.
10. **The engine's tests use Russian on purpose.** A test circuit of the engine's own (ADR 0007) is
    written in all three languages, its Russian chosen from the widest letters and the longest
    words, and drawn at every orientation, so the overlap check meets the worst case rather than the
    English one.

## Considered options

- **Rules a test can check, and one reader's review**: proposed. Every danger above except grammar
  can be caught by a machine, and grammar is caught by the one person who can.
- **Trust the translator**: rejected. A Latin `a` in a Russian word, or a word one letter too wide
  for the margin, is invisible on the screen and in review alike.
- **Keep every word in a language out of the drawing**, with numbered markers on the board and the
  words in the page around it: rejected. It would make measuring unnecessary, and it would take away
  the callouts, which are part of the look the owner chose (ADR 0001).
- **Transliterate Russian into Latin letters**: rejected. A Russian reader reads Cyrillic.

## Consequences

- **The overlap check runs three times more often for a circuit in three languages**, at each of four
  orientations.
- **The engine's sentences are written around rule 6**, which makes the Russian ones read like
  labels more than like prose, and the French and English ones with them.
- **Rule 4 depends on knowing the font**, which a page that leaves its font to the reader's device
  cannot promise.
- **The Russian table waits for a reader of Russian**, and so does every change to it.
