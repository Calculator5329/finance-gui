Create a pull request for the current branch against `main` by using the `main-diff-pr-writer` subagent.

Requirements:
- Always use `subagent_type="main-diff-pr-writer"` for this command.
- Base branch must be `main`.
- If the branch is not pushed yet, push it with upstream before creating the PR.
- The PR title should be concise and action-oriented.
- The PR body must be high quality and follow this structure:

## Summary
- 1-3 bullets describing the user-impacting intent of the changes.
- Include key architectural or risk-relevant details.

## Test plan
- A checklist with concrete verification steps.
- Include any manual validation and relevant automated checks.

Execution notes:
- Analyze all commits on this branch since divergence from `main` (not just the latest commit).
- Ensure the description explains *why* the changes exist, not only *what* changed.
- Return the final PR URL when complete.
