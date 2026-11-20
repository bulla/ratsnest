# Working on ratsnest

This is the walkthrough for working on ratsnest itself: the engine, the command-line tool and the
`circuit` skill. Using ratsnest to make wiring guides is a different thing, and the README says how.

In Claude Code, `/setup` walks you through the steps below: it runs each one, checks what it printed,
and explains what did not go as written. The steps are written once, here, and the skill follows
them.

## What you need

- **git**.
- **Bun 1.4.5, exactly.** ratsnest runs on Bun alone, with no Node (ADR 0009), and a test fails on any
  other version of Bun, because continuous integration runs this one. `bun upgrade` would take you to
  the newest Bun rather than this one, so install it by its number:

  ```sh
  # Linux and macOS
  curl -fsSL https://bun.sh/install | bash -s "bun-v1.4.5"
  ```

  ```powershell
  # Windows, in PowerShell
  iex "& {$(irm https://bun.sh/install.ps1)} -Version 1.4.5"
  ```

  If either has moved, Bun's installation page, <https://bun.sh/docs/installation>, has the current
  form. When the version in `package.json`'s `packageManager` changes, install that one the same way.

- **Chromium, from the second milestone on**, to look at the pages the engine makes. Nothing
  installs it for you, and it is never a dependency.

## Set up

1. **Check Bun.**

   ```sh
   bun --version
   ```

   It prints `1.4.5`.

2. **Clone the repository.** `develop` is its default branch, and the one all work starts from.

   ```sh
   git clone https://github.com/bulla/ratsnest.git
   cd ratsnest
   ```

3. **Install the dependencies.**

   ```sh
   bun install
   ```

   It lists what it added and ends with a line such as `50 packages installed`. Afterwards
   `git status` shows nothing changed: `bun.lock` already says what to install.

4. **Run the checks**, the three that continuous integration runs on every pull request (ADR 0020).

   ```sh
   bun run lint
   bun run typecheck
   bun run test
   ```

   `bun run lint` ends with `No fixes applied.` and no error. `bun run typecheck` prints only the
   command it runs, `$ tsc --noEmit`. `bun run test` ends with a count of tests that pass and
   `0 fail`.

   Always say `bun run test`, not `bun test`: both work today, but every command goes through
   `bun run`, so that a script changed in `package.json` changes for everyone.

5. **Run one test**, which is how you will work most of the time.

   ```sh
   bun run test scripts/changelog.test.ts
   bun run test -t "pinned exactly"
   ```

   The first runs one file, the second every test whose name contains those words. Each ends with
   `0 fail`.

That is everything. If a step printed something else, `/setup` can tell you why.

## How work is done here

- **Read [`CLAUDE.md`](CLAUDE.md) first.** It is written for Claude, and is the shortest complete
  account of the project for anyone: the design, the stack, the layout, the conventions and the
  traps already fallen into.
- **Branch from `develop`, and open every pull request against it.** Nothing is committed to it
  directly. Keep each commit to one change, with a subject in the imperative: "Add the tick loop", not
  "added tick loop".
- **A decision is a record** in [`doc/adr/`](doc/adr/), written when it is made, with the options it
  rejected and what it costs. A change that contradicts a record becomes a new record first.
  [`doc/adr/README.md`](doc/adr/README.md) has the rules.
- **The roadmap is the plan.** [`doc/ROADMAP.md`](doc/ROADMAP.md) says what is next. A pull request that
  finishes roadmap work updates it in the same pull request, and a milestone that lands moves to
  [`doc/HISTORY.md`](doc/HISTORY.md).
- **A change users get has its line in [`CHANGELOG.md`](CHANGELOG.md)**, under *Unreleased*: anything
  in `src/` but its tests, `fonts/`, the `circuit` skill or `install.sh`. Continuous integration
  refuses a pull request that has none, unless it is labelled `no changelog`.
- **Releases are made by `bun run release` alone** (ADR 0017), from the milestone that writes it.
  Never set the version, edit `api/` or push a tag by hand.

## With Claude Code

Claude Code reads `CLAUDE.md` by itself. Three skills come with the repository:

- **`/setup`** walks you through the steps above.
- **`/interview`** pressure-tests a plan one question at a time, and is how every record so far was
  argued.
- **`/circuit`** adds, changes and publishes circuits, and keeps every circuit file declarative. It
  works once the engine exists, and says so until then.
