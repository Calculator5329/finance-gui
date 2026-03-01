Find and fully implement a single high-value improvement to the app. The improvement should be something that makes the app more useful, more polished, or more fun to use — not a refactor or cleanup.

## Phase 1: Discovery (parallel subagents)

Launch these subagents **in parallel** to gather improvement candidates:

### 1. `parallel-codebase-architect`
- Map the current feature set, UI components, and data flow.
- Identify gaps: what would a real user expect next? What feels incomplete or clunky?
- Suggest 3-5 concrete improvements ranked by user impact.

### 2. `codebase-layout-architecture-auditor`
- Audit the full repo for UX and functional gaps (not just code quality).
- Focus on: missing feedback, rough edges, features that are 80% done, opportunities for delight.
- Report the top 3 improvements that would make the biggest difference to a user.

### 3. `docs-sync-architecture-explorer`
- Read `docs/roadmap.md` for planned-but-unbuilt features (Phase 3 and beyond).
- Read `docs/changelog.md` for recent momentum — what direction is the project heading?
- Suggest which roadmap item or new idea would be highest-value to tackle right now.

## Phase 2: Selection

After all subagent results return, **pick exactly one improvement** to implement. Selection criteria (in priority order):

1. **User delight** — Would a user notice and appreciate this immediately?
2. **Completeness** — Can it be fully implemented in one session (no half-built features)?
3. **Fun factor** — Is it satisfying to interact with?
4. **Builds on strengths** — Does it leverage the existing architecture cleanly?

Announce your choice to the user with a brief rationale before proceeding.

## Phase 3: Implementation

1. Read the Ethan Style UI skill before building any UI components.
2. Follow the three-layer architecture: UI → Store → Service.
3. Build the full feature end-to-end — no stubs, no TODOs, no "coming soon".
4. If the feature needs new node types, wire them into Canvas, DetailPanel, NodePalette, and default flow.
5. Test by launching the dev server and verifying in the browser.

## Phase 4: Documentation

After implementation is verified:

1. Update `docs/roadmap.md` — check off the item if it was on the roadmap, or add it as a new completed item.
2. Update `docs/changelog.md` with what was built.
3. Update `docs/tech_spec.md` if the architecture, data model, or services changed.

## Rules

- **One improvement only.** Do not try to do multiple things. Depth over breadth.
- **Ship it complete.** The feature must work when you're done. Verify visually.
- **No refactors disguised as improvements.** The user should see something new or better.
- **Respect the design system.** Dark theme, glassmorphism, cyan accents — read the UI skill.
- **Be bold.** Pick something that makes the app feel meaningfully better, not a safe micro-tweak.
