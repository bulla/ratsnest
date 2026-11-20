---
name: interview
description: Interviews the user relentlessly about a plan or design, one question at a time, walking the design tree and resolving dependencies between decisions until a shared understanding is reached. Recommends an answer for each question and explores the codebase instead of asking when the answer is discoverable. Use when refining a plan, pinning down ambiguous requirements, or pressure-testing a design before implementation.
argument-hint: [plan or topic to interview about]
triggers:
  - interview me about this plan
  - pressure-test this design
  - walk me through the decisions
  - help me pin down requirements
  - refine this plan before coding
user-invocable: true
---

# Interview (`/interview`)

Interview the user relentlessly about every aspect of this plan until you reach a shared
understanding. Walk down each branch of the design tree, resolving dependencies between
decisions one-by-one. For each question, provide your recommended answer. When applicable,
follow the rules of simple design, methodically eliminating complexity.

Ask the questions **one at a time**, waiting for feedback on each question before continuing.
Asking multiple questions at once is overwhelming.

If a question can be answered by exploring the codebase, **explore the codebase instead** of
asking.

## How to run it

1. **Anchor on the plan.** Restate, in one or two sentences, the plan or topic as you currently
   understand it. If the user gave a `$ARGUMENTS` topic, start there; otherwise use the plan
   already under discussion.

2. **Map the design tree before diving.** Identify the major branches (the independent areas of
   the design) and the dependencies between decisions. Order your questions so that a decision is
   only raised once everything it depends on is settled — resolve the root before its children.

3. **For each open question, first try to answer it yourself.** Search and read the codebase,
   existing specs, and conventions. If the answer is discoverable there, state what you found and
   the conclusion you draw from it — don't ask the user something the code already answers.

4. **Ask one question at a time.** Each question should:
   - be the single most important unresolved decision given everything settled so far;
   - come with **your recommended answer** and a one-line rationale;
   - prefer the option that eliminates complexity (see simple design below).

   Then stop and wait for the user's response. Do not stack a second question onto the first.

5. **Incorporate the answer, then recurse.** Fold the decision into your understanding, surface any
   new dependencies it created, re-order the remaining tree, and ask the next single question.
   Continue relentlessly until no meaningful ambiguity remains.

6. **Close with a shared understanding.** When the tree is fully resolved, summarize the agreed
   design as a concise decision list (decision → chosen answer → why). This is the artifact you
   both align on before any implementation begins.

## Rules of simple design (apply when eliminating complexity)

When recommending answers and pruning the tree, prefer designs that, in priority order:

1. **Pass the tests / satisfy the requirement** — the design must actually do the job.
2. **Reveal intent** — the simplest thing that makes the design obvious to the next reader.
3. **Eliminate duplication** — no concept, rule, or piece of knowledge expressed in two places.
4. **Minimize elements** — the fewest moving parts (classes, options, states, abstractions) that
   still satisfy the above. When two answers are otherwise equal, recommend the one with less.

Actively challenge complexity: for every abstraction, option, or layer the plan proposes, ask
whether the requirement survives without it. Default to removing it unless its value is concrete.

## Tone

Be direct and skeptical, not deferential. The goal is a genuinely shared, well-pressured
understanding — surface disagreements and trade-offs plainly, and say when you think a choice is
wrong. But ask only one thing at a time, and always lead with your own recommendation so the user
can simply confirm or correct.
