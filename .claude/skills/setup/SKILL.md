---
name: setup
description: Walks someone through setting ratsnest up to work on, by following CONTRIBUTING.md step by step, running each step, checking what it printed against what the file says, and explaining whatever differs. Use when someone has just cloned ratsnest, asks how to set it up or get started on it, or a check fails on a fresh machine.
argument-hint: [nothing, or the step that went wrong]
triggers:
  - set up ratsnest
  - set up the project
  - get started working on ratsnest
  - onboard me
user-invocable: true
---

# Setup (`/setup`)

`CONTRIBUTING.md` is the walkthrough. This skill holds no steps of its own: it follows that file, so
that the two can never disagree. Read `CONTRIBUTING.md` now, all of it, before doing anything else.

## How to run it

1. **Say what you are about to do**: follow `CONTRIBUTING.md`'s *Set up*, one step at a time,
   checking each.
2. **Check what the person needs, from *What you need*.** Look before installing anything. When
   something is missing or is the wrong version, Bun most of all, say what you found and ask before
   installing or changing anything on the machine. Use the command `CONTRIBUTING.md` gives, never
   `bun upgrade`, which goes past the pinned version.
3. **Run each step of *Set up* in order**, as written. Skip the clone when you are already in a
   checkout of ratsnest, and say that you did.
4. **Compare what each step printed with what `CONTRIBUTING.md` says it prints.** When they agree,
   say so in a line and go on. When they differ, stop there: say what was expected, what came, the
   likeliest reason, and how to put it right, and wait for the person before going further.
5. **Finish with a short account**: each step, and whether it passed. Then point to *How work is done
   here*, and to `CLAUDE.md` and `doc/ROADMAP.md` to read next.

## The rules

- **Never change `CONTRIBUTING.md` to match what happened.** If a step is wrong for everyone, say so,
  and offer a pull request that fixes the file, since every newcomer meets the same mistake.
- **Never paper over a failing check**: no skipped test, no loosened lint rule, no different Bun.
  A check that fails on a fresh machine is either the machine or a bug, and both are worth saying
  plainly.
- **Ask before anything leaves the checkout**: installing a program, changing a shell profile,
  deleting a folder.
