# ADR 0023: Write a generated page into `pages/`, named by its four inputs

**Status:** Accepted · 2026-11-20 · Amended by ADR-0031 (a drawing is written as `.svg`) and ADR-0042 (or as `.png` or `.webp`)

## Context

`ratsnest generate <file>` makes a page from a circuit and three other inputs: an orientation, a
theme and a language (ADR 0003, ADR 0005, ADR 0010). The same four always make the same file
(ADR 0004). Nothing yet says where the file goes, and the `circuit` skill hands it over, then
publishes it on request (ADR 0013), so the skill has to find it.

## Decision

**`generate` writes the page into `pages/`, beside `circuits/`**, making the folder if it is not
there, **and names it by its four inputs**: the circuit file's name, then the orientation, the theme
and the language, as `pages/push-button.0.dark.en.html`. It prints the path it wrote. `--out <file>`
writes it somewhere else instead.

## Considered options

- **`pages/`, named by the four inputs**: chosen. One file per set of inputs, which is one Artifact
  per set (ADR 0013), and making it again overwrites the same file rather than piling up copies.
- **Beside the circuit file, in `circuits/`**: rejected. `circuits/` holds circuit files and nothing
  else (ADR 0007).
- **Standard output, for the caller to redirect**: rejected as the default. Every caller, the skill
  first, would name the file itself, and they would not name it alike. `--out -` is not offered
  either: nothing needs it yet.
- **Named by the circuit alone**: rejected. A page in French would overwrite the English one.

## Consequences

- **`pages/` is generated**, so a project may ignore it in git. Whether `init` writes that into its
  `.gitignore` is M7's to decide.
- **The name is part of the public surface** (ADR 0017): the skill and anyone's scripts read it, so
  changing it is a change users get.
