Perform a thorough, multi-perspective review of the current branch's changes against `main`. Launch subagents **in parallel** to maximize coverage and minimize latency.

## Subagents to Launch (all in parallel)

### 1. `main-diff-reviewer`
- Compare the current branch to `main`.
- Identify the top 3 highest-impact issues in layout, architecture, or design.
- Re-check shortlisted findings before reporting.
- If no meaningful issues exist, explicitly say so.

### 2. `codebase-layout-architecture-auditor`
- Audit the full repo for structural and design quality.
- Focus findings on areas **touched by the current branch** — don't just report pre-existing issues unless they're made worse.
- Report the top 3 highest-impact improvements with evidence.

### 3. `docs-sync-architecture-explorer`
- Verify that any documentation (`docs/`, README, inline doc comments) is still aligned with the implementation after this branch's changes.
- Flag any docs that are now stale, missing, or contradictory.
- If no docs exist for newly added functionality, flag that as a gap.

### 4. `parallel-codebase-architect`
- Analyze where new logic lives, how new/changed modules interact, and whether data flow is clean.
- Report evidence-backed insights on design, runtime behavior, and extension points.
- Focus on the **changed areas** and their interaction with the rest of the codebase.

## Synthesis

After all subagent results return, **synthesize the findings** into a single structured review:

### Output Format

#### 🔴 Critical Issues
Items that should block merge. Architectural violations, broken contracts, data integrity risks.

#### 🟡 Improvements
High-value suggestions that would meaningfully improve the code but aren't blockers.

#### 🟢 Observations
Minor style notes, opportunities for future improvement, or things done well worth calling out.

#### 📄 Documentation Gaps
Any stale, missing, or contradictory docs surfaced by the review.

### Rules
- Deduplicate findings across subagents — don't repeat the same issue from multiple perspectives.
- Prioritize by impact: correctness > architecture > maintainability > style.
- Every finding must include a **file path and line range** or commit reference.
- If all subagents agree the changes are clean, say so confidently — don't manufacture issues.
- Be direct. No filler. High signal only.
