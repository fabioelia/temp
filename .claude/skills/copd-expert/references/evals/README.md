# Regression cases for copd-expert

`evals.json` holds the cases this skill has actually failed, plus
constructed cases for the failure modes in
`../knowledge-boundaries.md` that are measured in the literature but have
not yet bitten us here. Read it before changing the non-negotiables in
`SKILL.md`: every rule up there was paid for by one of these.

## The one thing to get right when grading

**Pass criteria are observable actions, not correct final answers.** An
agent can reach the right conclusion from the wrong single field by luck —
case 1 is exactly that shape, and the lucky version still ships the bug.
Grade the transcript: did it retrieve the opposing source, did it check
what the field meant, did it compare two datasets, did it name the
threshold. Case 8 is built so that a confident single-atlas answer *is* one
of the two defensible answers and still fails.

| # | Case | Tests |
|---|---|---|
| 1 | CSF3R classical-monocyte contradiction | The real 2026-10-17 failure: sufficiency, field semantics, steelman |
| 2 | SERPINA1 zero GTEx eQTL rows | Zero rows ≠ zero effect; threshold restatement |
| 3 | `COPD` is also ARCN1 | Identifier resolution by API, not recall |
| 4 | IMPACT numbers for a slide | Numbers carry a fetched quote |
| 5 | Unsourced pushback on FeNO | Reversal needs a post-pushback source |
| 6 | cDC1/cDC2 subtype call | Subtype marker claims escalate to a reference |
| 7 | GSVA on correlated gene sets | Retrieve before reasoning; return "no evidence found" |
| 8 | CCL20 monocyte or T cell | Two-dataset rule; disagreement ⇒ unsettled |
| 9 | GSVA scores across two cohorts | Cohort-dependence; invalid by construction, not underpowered |

## Running them

Format follows skill-creator's `evals.json` schema (`expectations` = the
verifiable statements), with `thin_area`, `failure_observed` and
`pass_criterion` added. To run with the skill-creator harness, invoke the
`anthropic-skills:skill-creator` skill and follow its run/grade/view loop;
the baseline should be this skill at the commit **before**
`knowledge-boundaries.md` was added, so the comparison measures the
boundaries machinery rather than the skill as a whole.

Cases 1-5 and 8-9 have verified ground truth recorded inside
`failure_observed`, so they can also be graded by hand without a harness.

## Adding a case

When something fails in real use, add it the same day, while the transcript
is still available:

- `prompt` — the user's actual words, not a cleaned-up version. The
  wording is the trigger being tested.
- `failure_observed` — what the agent did, what it asserted, and what
  refuted it, with IDs and dates. This is the part future readers need and
  cannot reconstruct.
- `expectations` — observable actions a grader can check in the transcript.
- `pass_criterion` — one sentence, and say which lucky-but-wrong path still
  counts as a failure.

Then make the matching fix in `knowledge-boundaries.md` (trigger, route,
semantics or gate — see `.claude/agents/agent-architect.md` for which
layer) and, if it is a query someone will rerun, in `scripts/biodata.py`.
