# Finance GUI - Changelog

## Session 25 - Architecture Hardening (Feb 18, 2026)

### Completed

**Activated maxBalance/overflowAccountId in projections**
- Added `resolveAccountContributions(accounts, monthlySavings)` to `financialCalc.ts` — single helper that distributes contributions by `contributionPercent`, falls back to `monthlyContribution`, and redirects contributions from capped accounts (`balance >= maxBalance`) to their `overflowAccountId`.
- All three projection paths (`projectionCalc.ts`, `GoalStore.projectedAmountAtRetirement`, `TaxStore.autoAllocation`) now use this helper — eliminates the triplicated formula and activates overflow routing that was previously silently ignored.

**Connection validation hardened**
- Moved `ALLOWED_CONNECTIONS` from `Canvas.tsx` (UI-only) to `FlowStore` (store layer).
- `FlowStore.isValidConnection()` is the single enforcement point; `onConnect` validates before inserting edges.
- `Canvas.tsx` passes `flowStore.isValidConnection` as the `isValidConnection` prop.

**Onboarding orchestration moved to store layer**
- `RootStore.completeOnboarding(onboarding, defaultNodes, defaultEdges)` encapsulates all multi-store mutations previously in `App.tsx` `handleOnboardingComplete` callback (~90 lines removed from UI layer).
- `FlowStore.buildFlowFromAccounts(accounts, defaultNodes, defaultEdges)` handles flow layout construction (previously `buildFlowWithAccounts` in `App.tsx`).
- `App.tsx` onboarding handler reduced to two lines.

**OnboardingStore moved to src/stores/**
- Moved from `src/features/onboarding/OnboardingStore.ts` to `src/stores/OnboardingStore.ts` for consistency.
- All onboarding feature imports updated.

**FilingStatus type extracted**
- `FilingStatus` moved to `src/core/types/tax.ts`; re-exported from `services/taxCalc.ts`.
- `core/types/flow.ts` now imports from `core/types/tax` instead of the service layer (eliminates reverse dependency).

**NumberInput shared component**
- Extracted to `src/components/NumberInput.tsx`; replaced 7 independently-defined local copies in GoalEditor, AccountEditor, IncomeEditor, W2TaxEditor, ExpensesEditor, VariableEditor, GrossPayEditor.

**SVG gradient ID fix**
- `EngineNode` and `ChartNode` now use React 18's `useId()` for per-instance gradient IDs, preventing rendering corruption when multiple instances are on the canvas.

**IncomeNode/IncomeEditor use store computed**
- Both now read `goalStore.ssMonthlyBenefit` instead of calling `estimateSSBenefit()` directly — eliminates duplicate computation path.

**GoalStore null guard**
- `GoalStore._taxSettings` null access now emits a `console.warn` to surface mis-wiring during development.

### Technical Decisions
- `buildFlowFromAccounts` takes `defaultNodes`/`defaultEdges` as parameters (dependency injection) so `FlowStore` doesn't import from `features/canvas/` — store layer stays clean.
- `resolveAccountContributions` overflow logic uses current `account.balance >= account.maxBalance` as the cap check — simple and correct for pre-retirement state; year-by-year cap simulation is a future improvement.

---

## Session 24 - Sidebar Trim & Connection Validation (Feb 18, 2026)

### Completed

**Trimmed sidebar palette to verified-working nodes only**
- Removed 8 palette items: entire Income Sources category (Social Security, Pension Income, 401(k) Drawdown, Roth Drawdown), Tax Calculator, and 3 GoalNode variants (Target Age, Spending, Savings Rate).
- Hidden node types remain renderable for existing saved flows; only sidebar creation is affected.
- Sidebar now shows 18 items across 5 categories: Accounts (6), Income Pipeline (2), Processing (2), Variables (1), Output (7).

**Added connection validation**
- New `ALLOWED_CONNECTIONS` allowlist in `Canvas.tsx` defines which source node types can connect to which target types, derived from the default flow pipeline.
- `isValidConnection` prop on ReactFlow blocks self-links, duplicate edges, and invalid node-type pairings.
- Invalid connection attempts are visually rejected by React Flow (handle won't accept the edge).

**Cleaned up dead UI elements**
- Removed non-functional `MoreHorizontal` menu buttons from `AccountNode` and `GoalNode` (had no onClick handlers).
- Removed unused `useAccountStore` import from `OutputNode`.
- Removed `GoalNode` target handle (nothing connected into it; source handle retained for engine connection).

### Technical Decisions
- **AccountNode and OutputNode keep both handles**: The default flow uses `outputNode -> accountNode` edges (disposable income fans out to accounts) and `outputNode -> taxNode` edges (gross monthly -> tax calculator), so both handles are required.
- **GoalNode target handle removed**: No default or user edge targets a GoalNode; it only emits data to the engine.
- **Connection rules are strict**: Only pairs that appear in or are logically consistent with the default flow are allowed. This prevents confusing decorative edges while edges remain non-functional.
- **Hidden nodes are not deleted**: `incomeNode`, `taxNode`, and `goalNode` components remain in the `nodeTypes` registry so legacy persisted flows render without crashes.

---

## Session 23 - Parallel Architect Subagent Migration (Feb 18, 2026)

### Completed

**Converted the parallel architecture explorer from skill to project subagent**
- Created `.cursor/agents/parallel-codebase-architect.md`.
- Migrated the prior skill behavior into a subagent prompt with the same core workflow: input contract, parallel exploration strategy, and evidence-backed reporting.
- Added proactive delegation language in `description` to improve automatic routing.

### Technical Decisions
- Implemented as a **project subagent** so the behavior is versioned with this repository and shared across collaborators.
- Kept thread limits and evidence requirements explicit to preserve quality and prevent overlapping investigations.

---

## Session 22 - Convert Architecture Auditor to Subagent (Feb 18, 2026)

### Completed

**Converted the architecture audit capability from skill to project subagent**
- Created `.cursor/agents/codebase-layout-architecture-auditor.md`.
- Preserved core behavior: full-repo exploration, top-3 high-impact architecture/layout/design issues, verification pass, and explicit honesty when no strong issues are found.
- Removed `.cursor/skills/codebase-layout-architecture-auditor/SKILL.md`.

### Technical Decisions
- Implemented as a **project subagent** for isolated execution context and better delegation ergonomics.
- Updated project docs to keep tooling/state references aligned with actual `.cursor/agents/` files.

---

## Session 21 - Docs Sync Subagent Migration (Feb 18, 2026)

### Completed

**Replaced docs sync skill with a project-level subagent**
- Created `.cursor/agents/docs-sync-architecture-explorer.md`.
- Migrated the previous docs-sync workflow into a subagent system prompt.
- Removed `.cursor/skills/docs-sync-architecture-explorer/SKILL.md` per request.
- Kept the same behavior: docs baseline read, docs-to-code validation, and evidence-backed answers about current state, future plans, patterns, and architecture decisions.

### Technical Decisions
- Used a **project subagent** so the behavior is versioned with this repository and available to collaborators.
- Preserved explicit guardrails for `UI -> Store -> Service` architecture alignment and docs-vs-code drift reporting.

---

## Session 20 - Main-Diff PR Writer Subagent (Feb 18, 2026)

### Completed

**Added a project-level subagent for creating PRs against `main`**
- Created `.cursor/agents/main-diff-pr-writer.md`.
- Added a diff-aware workflow that inspects branch state and full `main...HEAD` changes before opening a PR.
- Standardized PR body structure with `Summary` and `Test plan` sections.
- Added output requirements to report branch recap, final title/body, and resulting PR URL.

### Technical Decisions
- Implemented as a **project subagent** so PR-writing behavior is versioned with the repository and shared across collaborators.
- Kept the prompt focused on complete branch-vs-main analysis to avoid shallow, latest-commit-only PR descriptions.

---

## Session 19 - Main-Diff Review Subagent (Feb 18, 2026)

### Completed

**Refined the project-level subagent for reviewing changes against `main`**
- Updated `.cursor/agents/main-diff-reviewer.md`.
- Subagent now focuses on the top 3 highest-impact layout, architecture, and design improvements from `main...HEAD` (fallback `master...HEAD`).
- Added a mandatory double-check pass that re-validates each shortlisted finding before reporting.
- Enforced honesty rule: if fewer than 3 issues survive verification, report fewer; if none survive, explicitly report no meaningful fixes.
- Updated output format to include review scope, top issues (max 3), and double-check notes.

### Technical Decisions
- Implemented as a **project subagent** so the behavior is versioned with this repository and shared across collaborators.
- Kept the prompt focused on actionable, diff-aware findings to reduce generic feedback and improve merge quality.

---

## Session 18 - Project Top-3 Architecture Audit Skill (Feb 18, 2026)

### Completed

**Added project-level Cursor skill for high-impact architecture/layout/design audits**
- Created `.cursor/skills/codebase-layout-architecture-auditor/SKILL.md`.
- Skill performs full-repo exploration and prioritizes the top 3 high-impact issues (layout, architecture, design).
- Added a mandatory verification pass that re-checks each top issue before finalizing recommendations.
- Added an honesty rule: if fewer than 3 issues survive verification, report fewer; if none survive, explicitly report no strong issues.

### Technical Decisions
- Implemented as a **project skill** to keep behavior versioned with the repository and shared across collaborators.
- Added an impact/confidence/effort scoring rubric to prioritize substantive improvements over cosmetic findings.
- Kept output format structured for fast triage and direct follow-up implementation planning.

---

## Session 17 - Personal Parallel Architecture Explorer Skill (Feb 18, 2026)

### Completed

**Created a personal Cursor skill for architecture + functional analysis in parallel**
- Added personal skill at `~/.cursor/skills/parallel-codebase-architect/SKILL.md`.
- Skill defines an input contract (question, scope, depth, output mode, constraints) to reduce ambiguity before exploration.
- Skill enforces parallel exploration strategy (2-4 focused sub-questions, up to 4 subagents, scoped responsibilities, merged conclusions).
- Skill supports dual output modes:
  - concise default for fast answers
  - structured report on request (architecture, flow, evidence, risks, follow-ups).

### Technical Decisions
- Implemented as a **personal** skill so it can be reused across multiple repositories.
- Kept `SKILL.md` concise and directive for better discoverability and application performance.
- Required evidence-backed conclusions to reduce speculative architectural claims.

---

## Session 16 - Cursor Docs Sync Subagent Skill (Feb 18, 2026)

### Completed

**Added project-level Cursor skill for documentation-grounded exploration**
- Created `.cursor/skills/docs-sync-architecture-explorer/SKILL.md`.
- Skill workflow now enforces a docs-to-code validation pass before answering questions.
- Skill scope targets:
  - Current codebase state
  - Future plans and roadmap direction
  - Patterns and architecture decisions
- Included a standard response template: docs sync status, answer, evidence, and follow-up doc updates.

### Technical Decisions
- Implemented as a **project skill** (not personal) so behavior is shared and versioned with the repository.
- Documentation is treated as a baseline, not a source of absolute truth; code validation is required for material claims.
- Architecture guidance in the skill explicitly reinforces the project convention: `UI -> Store -> Service`.

---

## Session 15 — Personal Default Financial Profile (Feb 15, 2026)

### Completed

**Updated default data to real personal financial profile**
- `AccountStore`: Replaced 2 placeholder accounts (Savings, Brokerage) with 5 personal accounts:
  - Growth Brokerage — $60K, $1,800/mo, 15% return (Fidelity, brokerage)
  - Roth IRA — $10K, $625/mo, 12% return (Fidelity, roth_ira)
  - Index Portfolio — $7K, $425/mo, 10% return (Vanguard, brokerage)
  - Savings — $500, $200/mo, 4.5% return (Ally Bank, savings)
  - YOLO — $4K, $100/mo, 20% return (Robinhood, brokerage)
- `GoalStore`: Age 20 → retire at 45, retirement spending $8,000/mo, pre-retirement expenses $2,000/mo
- `TaxStore`: Filing status changed from `married_joint` to `single`
- `defaultFlow.ts`: Canvas layout expanded from 2 to 5 account nodes, all connected from Disposable Income and into the Engine. Tax Calculator node updated to `single`. Positions adjusted for clean vertical spacing.

**Note:** To see new defaults, clear `finance-gui:*` keys from localStorage (DevTools → Application → Storage) or open in an incognito window.

---

## Session 14 — SS-Aware Retirement Income & Inflation-Adjusted Display (Feb 16, 2026)

### Completed

**Social Security integrated into retirement income calculations**
- Added `GoalStore.ssMonthlyBenefit` computed: calls `estimateSSBenefit(currentAnnualIncome, ssClaimAge)` at the store level instead of computing ad-hoc in IncomeNode.
- `estimatedMonthlyIncome` now returns portfolio 4% withdrawal (gap-adjusted) + SS monthly benefit.
- `realMonthlyIncome` inflation-adjusts the portfolio portion; SS is treated as already COLA-adjusted and added directly without discounting.
- `realNetRetirementIncome` (inflation-adjusted net income) automatically reflects the combined income since it reads from `realMonthlyIncome`.
- Required savings target now accounts for SS income — `requiredSavings` drops because the portfolio no longer needs to cover 100% of spending.

**Gap-year reserve for early retirement before SS**
- New computeds: `gapAnnualShortfall`, `gapReserve`, `portfolioAfterGapReserve`.
- When `ssGapYears > 0` and 4% portfolio withdrawal is insufficient to cover annual spending, the excess is multiplied by gap years and reserved as a lump-sum withdrawal at retirement.
- The 4% rule is then applied to the remaining portfolio for the SS-era.
- If 4% of the full portfolio already covers spending, no gap reserve is needed (shortfall = 0).

**`calcRequiredSavingsForSpending` updated**
- New parameters: `ssAnnualBenefit` (default 0), `gapYears` (default 0).
- Binary search now computes gap reserve inside each iteration: for candidate portfolio P, calculates shortfall, subtracts gap reserve, then checks if 4% of remaining + SS covers spending after taxes.
- Net income is monotonically increasing with P, so convergence is guaranteed.

**Promoted inflation-adjusted values from footnote to prominent section**
- OutputNode: The inflation-adjusted value is now displayed as its own distinct visual block with a labeled header, amber dot indicator, and bold amber-colored value — separated from the nominal value by a divider line.
- Applied consistently to all metrics with inflation-adjusted values: `net_monthly_income` ("Inflation-Adjusted:"), `monthly_income` ("Inflation-Adjusted:"), and `net_worth` ("In Today's Dollars:").

**Goal status switched to income-based comparison**
- `GoalStore.progress` now compares inflation-adjusted net monthly retirement income (`realNetRetirementIncome`) against monthly spending, not projected savings vs required savings.
- Ratio-based thresholds: >=110% ahead, >=90% on_track, else behind.
- GoalEditor progress bar relabeled "Income Coverage" showing net income vs spending.
- GoalEditor summary now includes "Inflation-adj. net income" row with status color.
- OutputNode `goal_status` subtitle updated: shows "$X/mo of $Y/mo spending" instead of savings comparison.
- Savings rate slider removed from GoalEditor panel.

### Technical Decisions
- SS benefits include COLA, so they are treated as already inflation-adjusted and not discounted further when computing real income. This means the SS portion of `realMonthlyIncome` is the same as the nominal SS benefit.
- Gap reserve uses a gross-basis approximation (spending vs 4% withdrawal) rather than a net-basis calculation. The binary search for `requiredSavings` handles the tax impact correctly within its iteration loop.
- The income allocation system (ordinary/LTCG/tax-free split) continues to derive from account types. SS income flowing through `estimatedMonthlyIncome` into `TaxStore.breakdown` gets proportionally split by the existing allocation, which is an approximation (SS is technically ordinary income). This is acceptable for planning purposes and avoids a major refactor of the allocation system.
- Goal progress is now purely income-based (does retirement income cover spending?) rather than savings-based (does projected portfolio hit required target?). This gives a more intuitive answer to "am I on track?" since the user entered spending in today's dollars and `realNetRetirementIncome` is also in today's dollars.

---

## Session 13 — Brokerage Cost-Basis Tax Tracking (Feb 15, 2026)

### Completed

**Cost-Basis Aware Tax Allocation**
- `TaxStore.autoAllocation` now splits brokerage account projected values into **gains** (taxed as LTCG) and **cost basis** (tax-free return of capital).
- Cost basis is calculated as: starting vested balance + (monthly contribution × 12 × years to retirement).
- Only the gains portion (projected value minus cost basis) is allocated to the LTCG tax bucket.
- The cost basis portion is allocated to the tax-free bucket, reducing the effective tax rate on brokerage withdrawals.
- `calcRequiredSavingsForSpending` automatically benefits because it receives the updated allocation from TaxStore.

**Impact**: Retirement projections now require a smaller nest egg to support the same spending level, since a significant portion of brokerage withdrawals (the cost basis) is not taxed.

---

## Session 10 - Income Pipeline & Enhanced Outputs (Feb 15, 2026)

### Completed

**New Nodes: Gross Pay & Expenses**
- `GrossPayNode` (`grossPayNode`): Input node displaying gross annual income with monthly breakdown. Reads/writes `goalStore.currentAnnualIncome`. Emerald-themed card with dollar icon.
- `ExpensesNode` (`expensesNode`): Input node displaying monthly expenses with annual breakdown. Reads/writes `goalStore.goal.monthlySpending`. Orange-themed card with receipt icon.
- `GrossPayEditor`: Currency input for annual income with summary panel.
- `ExpensesEditor`: Currency input for monthly expenses with take-home/savings context summary.

**New Output Metrics**
- `take_home_pay`: Shows `goalStore.takeHomePayMonthly` with annual subtitle. Emerald-colored.
- `disposable_income`: Shows `goalStore.monthlySavings` with savings rate percentage subtitle. Cyan-colored.

**Enhanced Output Metrics — Inflation-Adjusted Display**
- `net_worth` metric now shows nominal ending net worth (large) with inflation-adjusted value below in smaller text.
- `monthly_income` metric now shows nominal gross monthly retirement income (large) with inflation-adjusted value below in smaller text.

**Income Pipeline Layout**
- Redesigned default flow with left-to-right income pipeline: Gross Pay → W-2 Tax → Take-Home Pay → Expenses → Disposable Income → Accounts → Engine → Outputs.
- Pipeline nodes occupy columns 1-4 (x: 50-770), accounts in column 5, engine in column 6, outputs in column 7.
- Edges connect the full pipeline including Disposable Income → each Account.
- Demo flow builder (`buildFlowWithAccounts`) updated to position accounts in column 5 with Disposable Income → Account and Account → Engine edges.

**Goal Assessment: Inflation-Adjusted Net Retirement Income**
- Added `GoalStore.realNetRetirementIncome` computed: takes inflation-adjusted gross retirement income, applies retirement taxes (federal/state/LTCG via `calcRetirementTax`), returns net monthly in today's dollars.
- Goal status (`progress.status`) now compares `realNetRetirementIncome / monthlySpending` ratio: >=1.1 = ahead, >=0.9 = on_track, else behind.
- Goal progress percent reflects this income coverage ratio (capped at 150%).

**Registration & Compatibility**
- Node types, flow types, Canvas nodeTypes, DEFAULT_NODE_DATA, DetailPanel routing, NodePalette all updated.
- New "Income Pipeline" palette category with singleton-filtered Gross Pay and Expenses items.
- FlowStore backfill includes `node-grosspay`, `node-takehome`, `node-expenses`, `node-disposable` and their pipeline edges for existing persisted flows.
- OutputNode METRIC_ICONS expanded with Wallet and PiggyBank for new metrics.

### Technical Decisions
- Gross Pay and Expenses are dedicated node types (not VariableNode variants) because they display currency values and need a distinct visual style rather than sliders.
- The Spending GoalNode was removed from the default flow since the ExpensesNode now serves this purpose in the pipeline. The GoalNode for Spending is still available in the palette.
- Goal assessment uses income-based framing (does retirement income cover expenses?) rather than the savings-based comparison (projected portfolio vs required savings), while keeping the projection engine unchanged.
- Inflation-adjusted net retirement income is computed by applying retirement taxes to the real (inflation-adjusted) gross income. This is more accurate than simply inflation-adjusting the nominal net income because tax brackets are nominally defined.

## Session 9 - Save/Load Setups, Node Creation Fixes, Singleton Filtering (Feb 15, 2026)

### Completed

**Save/Load Setup System**
- New `SavedSetup` type in `flow.ts`: Stores a complete app state snapshot — nodes, edges, accounts, goal, goal settings (inflation, income, SS claim age), and tax settings.
- New `setupService.ts`: Service layer functions for creating setup snapshots (`createSetupSnapshot`), exporting to JSON (`exportSetupToJSON`), and importing from JSON with validation (`importSetupFromJSON`).
- `RootStore`: Added `savedSetups` observable array (persisted to `finance-gui:saved-setups`). Methods: `saveSetup(name)`, `loadSetup(id)`, `deleteSetup(id)`, `exportSetup(id)` (triggers browser download), `importSetup(json)`.
- Restore methods added to `AccountStore.setAccounts()`, `GoalStore.restoreState()`, `TaxStore.restoreState()` — all used by `loadSetup()` to replace current state wholesale.
- New `SetupManager.tsx` component in the sidebar: inline name input for saving, list of saved setups with load/export/delete actions, file upload for importing JSON setups. Follows existing design system.
- Integrated into `Sidebar.tsx` as a "Saved Setups" section below the node palette.

**Fixed Node Creation from Palette (All Types)**
- **Root cause**: `NodePalette` only passed `item.type` through `dataTransfer`. All 6 account items shared `type: 'accountNode'`, all getting the generic fallback data `{ accountId: '' }`, resulting in "No account linked".
- **Fix**: Added `defaultData` field to each `PaletteItem` carrying type-specific metadata (e.g., `{ accountType: 'roth_ira' }` for Roth IRA, `{ sourceType: 'pension_income' }` for Pension Income, `{ metric: 'goal_status' }` for Goal Status output).
- `DraggablePaletteItem` now serializes a full JSON payload (`{ type, label, defaultData }`) into `dataTransfer`.
- `Canvas.onDrop` parses this payload and delegates to `buildNodeData()`, which constructs correct data per node type:
  - **accountNode**: Reads `accountType`, auto-creates an Account in AccountStore via `addAccount()`, sets the `accountId` on the node. The node is immediately linked and editable.
  - **incomeNode**: Sets correct `sourceType` (social_security, pension_income, 401k_drawdown, roth_drawdown).
  - **outputNode**: Sets correct `metric` (net_worth, goal_status, monthly_income, net_monthly_income).
  - **goalNode**: Sets correct `label` (Target Age, Spending, Savings Rate).
  - Others: Use existing defaults unchanged.
- Backward compatible: if `dataTransfer` contains a plain string (legacy format), falls back to `DEFAULT_NODE_DATA`.

**Singleton Node Filtering in Palette**
- Added `singleton` and `singletonCheck` fields to `PaletteItem`.
- `NodePalette` is now an `observer` component that reads `FlowStore.nodes`.
- Singleton items are hidden from the palette when a matching node already exists on the canvas.
- Singletons: Target Age, Spending, Savings Rate (goalNode variants), Inflation Rate (variableNode), Plan Engine (engineNode), W-2 Income Tax (w2TaxNode).
- Category headers are hidden when all items in the category are filtered out.

### Technical Decisions
- Setup management lives in `RootStore` rather than a separate `SetupStore` because it orchestrates across all four stores. Individual stores expose focused restore methods; RootStore coordinates the full snapshot/restore.
- `structuredClone()` is used in `createSetupSnapshot` to deep-copy all state, preventing saved setups from being mutated by later edits.
- Singleton detection uses callback functions on each palette item rather than a static registry, allowing flexible matching logic (e.g., label substring matching for goalNode variants).
- Account auto-creation on drop means every account node dragged from the palette is immediately functional — no "linker" step required.

## Session 8 - Auto-Computed Retirement Target (Feb 15, 2026)

### Completed

**Removed manual Target Amount — now auto-computed from spending needs**
- **Problem**: Goal status showed "Ahead" even when retirement income (4% rule withdrawals minus taxes) didn't cover monthly spending. The manual `targetAmount` was compared against projected savings, producing misleading results.
- **Solution**: The retirement target is now automatically calculated as the savings needed so that 4% withdrawals, after federal/state/LTCG retirement taxes, produce net income equal to monthly spending.
- `calcRequiredSavingsForSpending()` in `financialCalc.ts`: Binary search over `calcRetirementTax()` to find the savings amount where net annual income >= spending * 12. Accounts for progressive tax brackets, income allocation (ordinary/LTCG/tax-free), and state taxes.
- `GoalStore.requiredSavings` computed: Calls the binary search with current spending, filing status, state rate, and income allocation (from TaxStore via expanded `TaxSettingsGetter` interface).
- `calcGoalProgress()` and `calcYearByYearProjection()` now accept `targetAmount` as a separate parameter (passed from `GoalStore.requiredSavings`).
- Removed `targetAmount` from `RetirementGoal` interface and `DEFAULT_GOAL`.
- GoalEditor: Replaced editable Target Amount input with read-only "Required Savings" display showing the auto-computed value with explanation text.
- EngineEditor: "Target" row updated to show `requiredSavings`.

### Technical Decisions
- **Binary search over closed-form**: Because retirement taxes are progressive (federal brackets + LTCG stacking + NIIT + state), there is no closed-form inverse. Binary search with 60 iterations converges to sub-dollar precision.
- **No circular dependency**: `requiredSavings` depends on spending + tax parameters (filing status, state rate, allocation), not on projected amounts. TaxStore's `allocation` depends on account projections which don't depend on the target.
- **TaxSettingsGetter expanded**: Added `allocation: IncomeAllocation` to the late-bound interface so GoalStore can compute required savings without importing TaxStore directly.

## Session 7 - Fix Account Linking After Onboarding (Feb 15, 2026)

### Bug Fix

**Account nodes showed "No account linked" after onboarding wizard**
- **Root cause**: `handleOnboardingComplete` in `App.tsx` deleted default accounts (with IDs like `acc-401k-default`) and created new ones via `addAccount()` which generates auto-incrementing IDs (`account-{timestamp}-{n}`). The default flow nodes still referenced the old hardcoded IDs, causing an ID mismatch.
- **Fix**: Added `buildFlowWithAccounts()` helper that dynamically generates account flow nodes and edges from the actual account IDs. On onboarding completion, the flow is force-set (via `setNodes`/`setEdges`) with the correctly linked account nodes instead of relying on the static `DEFAULT_NODES`. Left-column positioning (SS, W-2 tax nodes) adjusts automatically based on account count.
- Separated demo-mode vs non-demo flow initialization: `useEffect` only runs for non-demo; demo initializes directly in the onboarding completion handler.

**Added account linker UI for unlinked nodes**
- When an account node has no linked account (or the linked account was deleted), the detail panel now shows an `AccountLinker` component with a list of all available accounts. Clicking one links it to the node via `flowStore.updateNodeData()`.
- This also fixes account nodes dragged from the sidebar palette (which default to `accountId: ''`) — they can now be linked post-creation.

### Technical Decisions
- Used `flowStore.setNodes()`/`setEdges()` directly instead of `initializeDefaultFlow()` in demo mode to bypass the `hasNodes` guard, which would skip setting the flow if stale persisted data existed from a previous session.
- Account linker is an `observer` component that reactively lists accounts from `AccountStore`, so new accounts appear immediately.

## Session 6 - Income-Driven Pipeline & Engine Properties (Feb 15, 2026)

### Completed

**New Service: W-2 Tax Calculation**
- `calcW2Tax()` in `taxCalc.ts`: Computes working-years income taxes — federal income tax (with standard deduction), state tax (on taxable income), Social Security (6.2% up to $168,600), Medicare (1.45% + 0.9% surtax above threshold). Returns `W2TaxBreakdown` with all line items, effective rate, net take-home.

**GoalStore: Income-Driven Computeds**
- W2 tax breakdown from `currentAnnualIncome` using TaxStore's filing status/state rate (late-bound via `TaxSettingsGetter` to break circular dependency).
- `takeHomePayAnnual` / `takeHomePayMonthly`: gross minus W2 taxes.
- `monthlySavings`: take-home minus monthly expenses, clamped >= 0.
- `computedSavingsRate`: savings rate auto-derived from income/taxes/expenses (no longer a manual slider input).
- `endingNetWorth` / `endingNetWorthReal`: projected net worth at retirement from projection engine.
- `totalContributionsAtRetirement`, `totalGrowthAtRetirement`, `contributionPercent`, `growthPercent`: breakdown of how much ending net worth comes from contributions vs compound growth.
- `costBasis`, `taxableGains`, `taxablePercent`: conservative tax basis tracking — current balances assumed 100% taxable gains, only future contributions create deductible cost basis.

**Projection Engine Enhanced**
- `calcYearByYearProjection()` now accepts `monthlySavings` parameter (from income-driven pipeline). Distributes proportionally across accounts by balance weight.
- `YearProjection` expanded with `totalGrowth`, `costBasis`, `taxableGains` fields for per-year tax basis tracking.

**New Node: W2TaxNode**
- Canvas node showing working-years W-2 income tax: tax burden stacked bar (federal/state/FICA/net), per-line monthly breakdown, savings derivation section (take-home - expenses = savings + savings rate).

**New Editor: W2TaxEditor**
- Detail panel for W2 Tax node: gross income input, filing status dropdown, state rate slider, monthly expenses input, full annual tax breakdown, auto-calculated savings summary with monthly/annual savings and computed savings rate.

**New Editor: EngineEditor**
- Detail panel for Engine node (replaces static placeholder text): key stats (current age, target age, years to retirement, current net worth, monthly contributions, savings rate, account count), projected values at retirement (nominal, real, target), contribution vs growth split (stacked bar with current balances/new contributions/growth), tax basis breakdown (taxable gains vs cost basis with conservative assumptions).

**Net Worth Output Updated**
- `OutputNode` with `net_worth` metric now shows **ending projected net worth** (at retirement age) instead of current vested balances. Shows subtitle "Projected at age 65".

**Registration & Default Flow**
- Added `W2TaxNodeData` type, `w2TaxNode` to `FinanceNodeType`, `W2TaxFlowNode` to flow types.
- Registered `w2TaxNode` in Canvas node types, NodePalette (Processing category), DetailPanel routing.
- Added W2 Tax node to default flow layout with edge `w2tax -> engine`.
- FlowStore backfill includes `node-w2tax` and `e-w2tax-eng` for persisted flows.

### Technical Decisions
- **Circular dependency resolution**: GoalStore needs TaxStore's `filingStatus`/`stateRate` for W2 tax calculation, but TaxStore depends on GoalStore. Resolved with late binding: GoalStore accepts a `TaxSettingsGetter` interface set by RootStore after both stores are constructed. The getter reads directly from TaxStore's observables.
- **Savings-driven contributions**: Monthly savings (income - W2 taxes - expenses) are distributed across accounts proportionally by current balance weight. This means accounts with larger balances receive larger contributions, approximating real-world allocation behavior.
- **Conservative tax basis**: All current account balances are assumed to be 100% taxable gains (no cost basis). Only future contributions create deductible cost basis. This is intentionally conservative for planning purposes.
- **Net Worth OutputNode change**: Showing ending projected net worth (instead of current) makes the output meaningful as a projection endpoint connected to the engine, while the Header still displays current net worth as a "now" snapshot.

## Session 5 - Demo Mode / Onboarding Wizard (Feb 15, 2026)

### Completed

**Demo Mode Entry Point**
- Added `npm run demo` script using `vite --mode demo`, loading `.env.demo` with `VITE_DEMO_MODE=true`.
- `App.tsx` conditionally renders `OnboardingWizard` when demo mode is active and onboarding is not yet complete.

**OnboardingStore**
- Lightweight MobX store (`src/features/onboarding/OnboardingStore.ts`) holding temporary wizard form data: age, retirement age, filing status, annual income, desired monthly income, and a dynamic list of investment accounts.
- Step navigation (next/prev/goTo), per-step validation, not persisted to localStorage.

**Onboarding Wizard UI**
- `OnboardingWizard.tsx`: Full-screen wizard container with step progress indicator (numbered dots + labels + connector lines), Framer Motion slide/fade transitions, and Back/Continue/Launch navigation.
- `WelcomeStep`: Intro screen with icon, description, and numbered preview of upcoming steps.
- `AboutYouStep`: Current age, target retirement age (with years-to-retirement display), single/married toggle buttons.
- `IncomeStep`: Annual pre-tax income (for SS estimation), desired monthly retirement income, live replacement ratio calculation.
- `AccountsStep`: Dynamic add/remove investment accounts with name, type dropdown (401k/Roth IRA/Traditional IRA/Brokerage/Pension/Savings), balance, and monthly contribution fields.
- `ReviewStep`: Summary cards for About You, Income, and Accounts sections with totals and formatting.

**Store Population on Completion**
- On wizard completion: clears default accounts, adds user-entered accounts via `AccountStore.addAccount()` + `updateAccount()`, sets goal data via `GoalStore.updateGoal()` + `setCurrentAnnualIncome()`, sets filing status via `TaxStore.setFilingStatus()`, then initializes the default flow.

### Technical Decisions
- Used Vite's `--mode` flag rather than cross-platform env tools (`cross-env`) to avoid a new dev dependency. The `.env.demo` file is loaded automatically by Vite when `--mode demo` is specified.
- `OnboardingStore` is created locally via `useState` inside the wizard component — it is never added to `RootStore` and is garbage-collected when onboarding completes.
- Step validation is computed (`get canProceed`) so the Continue button enables reactively as the user fills fields.
- Accounts step allows zero accounts (user can add them later on the canvas).
- All new UI follows the existing Futuristic Minimalist design system: glassmorphism cards, cyan accents, zinc-900 inputs, Framer Motion transitions.

## Session 4 - SS Claim Age Fix (Feb 15, 2026)

### Completed

**Social Security Claim Age Decoupled from Retirement Age**
- `GoalStore`: Added `ssClaimAge` observable (default: 67, full retirement age), `setSSClaimAge()` action (clamped 62-70), `ssStartsAfterRetirement` and `ssGapYears` computed properties. Persisted alongside existing goal-settings with migration fallback for existing localStorage data.
- `IncomeNode`: Now uses `goalStore.ssClaimAge` instead of `goalStore.goal.targetAge` for SS benefit estimation and display. Shows amber warning with gap-years count when SS starts after retirement.
- `IncomeEditor`: Replaced static claim age display with interactive slider (range 62-70). Added amber info banner warning users about the investment gap period when retiring before SS kicks in. Updated disclaimer text.

### Technical Decisions
- SS claim age is persisted in the `goal-settings` localStorage key alongside `inflationRate` and `currentAnnualIncome`. Migration handles the case where `ssClaimAge` is absent in existing persisted data by defaulting to 67 (full retirement age).
- Claim age is clamped to 62-70 per SSA rules, matching the existing `estimateSSBenefit()` function's internal clamping but now enforced at the store level.
- The gap-years warning is purely informational; projection engine integration (making SS income appear only at claim age in year-by-year projections) is future work.

## Session 3 - Phase 2: Enhanced Financial Functionality (Feb 15, 2026)

### Completed

**New Services**
- `taxCalc.ts`: Full federal tax engine with ordinary income brackets (2024), long-term capital gains brackets (0%/15%/20%), Net Investment Income Tax (3.8% NIIT), state tax, FICA. Income allocation system splits retirement income into ordinary, LTCG, and tax-free categories based on account types.
- `projectionCalc.ts`: Year-by-year projection engine tracking per-account nominal balances, inflation-adjusted (real) totals, cumulative contributions, and goal line progression.
- `socialSecurityCalc.ts`: Social Security benefit estimator using PIA formula with AIME bend points, early/late claim age adjustments (62-70), and COLA projections.
- `financialCalc.ts`: Added `adjustForInflation()` and `calcRealReturn()` helpers.

**New Stores**
- `TaxStore`: Manages filing status, state rate, income allocation (auto-derived from account types or manual override), computes full tax breakdown. Wired into `RootStore`.
- `GoalStore` enhancements: Added `inflationRate`, `currentAnnualIncome`, `realProjectedAmount`, `realMonthlyIncome`, `yearByYearProjection` computed values.

**New Node Components**
- `TaxNode`: Displays income mix bar (ordinary/LTCG/tax-free), tax burden bar (federal ordinary, federal LTCG, NIIT, state, net), per-line monthly breakdown, and effective rate.
- `VariableNode`: Reusable slider node with live value display, configurable min/max/step. Used for inflation rate.
- `ChartNode`: Large SVG multi-series area chart with nominal (cyan) and real/inflation-adjusted (violet) lines, dashed goal line, grid, hover crosshair with tooltip, age x-axis, and legend.

**Enhanced Existing Nodes**
- `EngineNode`: Now uses real projection data from `GoalStore.yearByYearProjection`. Shows dual lines (nominal + inflation-adjusted) and stats row with nominal and real projected values.
- `IncomeNode`: Auto-estimates Social Security benefits from `GoalStore.currentAnnualIncome` when `sourceType === 'social_security'`. Shows claim age and "est." badge.
- `OutputNode`: Added `net_monthly_income` metric showing post-tax income from `TaxStore`. Added source handle for chaining (gross -> tax).

**New Detail Panels**
- `TaxEditor`: Filing status dropdown, state rate slider, auto/manual income allocation toggle with visual breakdown bar, full annual tax breakdown (federal ordinary, federal LTCG, NIIT, state), net income, monthly, overall and taxable effective rates.
- `ChartEditor`: Projection summary at retirement age (nominal, real, goal).
- `IncomeEditor`: Current annual income input for SS estimation, benefit breakdown.
- `VariableEditor`: Slider + number input for precise variable tuning.

**Canvas & Palette**
- Registered `taxNode`, `variableNode`, `chartNode` in Canvas node types.
- Updated NodePalette with Income Sources category and new processing/variable/output items.
- Updated default flow with full pipeline: 3 accounts + Social Security -> Engine -> Net Worth + Goal Status + Gross Income + Chart, Gross -> Tax Calculator -> Net Income. Variables (Spending, Savings Rate, Target Age, Inflation Rate) feed into Engine.

**Updated Core Types**
- Added `TaxNodeData`, `VariableNodeData`, `ChartNodeData` to `node.ts`.
- Added `net_monthly_income` to `OutputMetric`.
- Added `autoEstimate` to `IncomeNodeData`.
- Added `TaxFlowNode`, `VariableFlowNode`, `ChartFlowNode` to `flow.ts`.

### Technical Decisions
- LTCG tax stacking: ordinary income fills brackets first, then LTCG/qualified dividends are stacked on top at preferential rates. This matches IRS rules for retirement withdrawal planning.
- Income allocation auto-derives from projected account balances at retirement, categorized by account type tax treatment (ordinary: 401k/IRA/pension, LTCG: brokerage, tax-free: Roth).
- Social Security estimation uses simplified PIA formula with 2024 bend points. Claim age adjustments use exact monthly reduction/credit rates per SSA rules.
- Inflation-adjusted projections use the Fisher equation for real returns.
- `calcRetirementTax` normalizes allocation percentages to always sum to 100%.

## Session 2 - Gross/Net Income Stabilization (Feb 15, 2026)

### Completed

**Flow Compatibility + Visibility**
- Added compatibility backfill in `FlowStore.initializeDefaultFlow()` to inject missing required nodes/edges in persisted flows (net worth, goal status, gross monthly, tax calculator, net monthly).
- Ensured required path edges are restored when missing: engine -> outputs, gross -> tax, tax -> net.
- Updated default layout positions so gross monthly -> tax calculator -> net monthly income reads left-to-right on the right side of the canvas.

**Output + Defaults**
- Updated output node chaining handle to emit from the right side for cleaner gross-to-tax flow.
- Preserved default 401(k) vesting at 100% and added normalization for legacy persisted demo account records.

### Technical Decisions
- Backfill logic is additive-only for persisted flows: it appends missing required nodes/edges and does not reset existing user layouts.
- Required-path edge checks are semantic (source/target pairing) to avoid duplicate edges.
- Legacy data normalization is scoped to the demo 401(k) seed account (`acc-401k-default`) to avoid mutating user-created account assumptions.

## Session 1 - Initial Build (Feb 15, 2026)

### Completed

**Infrastructure**
- Project scaffolded with Vite 7 + React 19 + TypeScript 5.9
- Installed core dependencies: Tailwind CSS v4, React Flow v12, MobX 6, Lucide React, Framer Motion
- Configured Tailwind CSS with Vite plugin (@tailwindcss/vite)
- Set up dark theme global styles with React Flow overrides
- Custom CSS animations for edge glow, scrollbar, node selection
- Created docs/ with roadmap, tech spec, and changelog

**Core Types**
- Account types with AccountType enum, color/label mappings
- Goal types with GoalStatus and status colors
- Node types (5 custom node data interfaces + palette item type)
- Flow types (typed React Flow nodes/edges, serializable FlowState)

**Service Layer**
- Financial calculator: future value, net worth, goal progress, retirement income, required savings
- Currency formatter with compact mode
- localStorage persistence service with typed save/load/remove/clearAll

**State Management (MobX)**
- AccountStore: observable accounts array, computed net worth, CRUD actions, auto-persist
- GoalStore: retirement goal with computed progress/status/income, auto-persist
- FlowStore: React Flow nodes/edges, selection tracking, drag-and-drop, auto-persist
- RootStore: composition root with React context + hooks

**Custom React Flow Nodes**
- AccountNode: icon, provider, balance, vesting progress bar, color-coded by type
- EngineNode: aggregation node with SVG mini chart, projected value
- OutputNode: displays net worth / goal status / monthly income with status colors
- IncomeNode: Social Security, Pension, 401k drawdown, Roth drawdown
- GoalNode: Target age, spending, savings rate with live values
- GlowEdge: triple-layer edge (blur glow + solid + animated dash)

**UI Features**
- Header with hamburger toggle, Net Worth display, AI Dashboard button
- Collapsible sidebar with categorized node palette (5 categories, 16 items)
- Drag-and-drop from sidebar to canvas
- Detail panel with AccountEditor (full CRUD) and GoalEditor (with progress visualization)
- Canvas with dot grid background, minimap, zoom controls

**Default Flow**
- Pre-populated workflow: 3 accounts + 3 goal nodes -> Engine -> 2 output nodes
- 8 animated edges connecting the workflow
- Demo data: 401k ($245,500), Roth IRA ($78,200), Pension ($3,500/mo)

### Technical Decisions
- Used @xyflow/react v12 (React Flow) for the node canvas
- MobX with `makeAutoObservable` and `autoBind` for clean store patterns
- Framer Motion `AnimatePresence` for sidebar/panel slide animations
- All financial calculations are pure functions in the service layer (stateless)
- Persistence via MobX `reaction()` - auto-saves on any observable change

---

## Session 11 — Contribution Model Overhaul (Percent-of-Disposable)

### Summary
Replaced fixed monthly contribution amounts with a percent-of-disposable-income model. Contributions per account are now defined as a percentage (0–100%) of disposable income. The flow topology was restructured so Take-Home Pay and Expenses both feed into Disposable Income, which then fans out to accounts.

### Changes

#### New Account Field
- Added `contributionPercent: number` to the `Account` interface (0–100, default 0)
- Legacy accounts without the field are auto-migrated to 0% on load

#### Flow Topology
- Removed Take-Home → Expenses edge
- Added Take-Home → Disposable Income edge (Take-Home and Expenses both feed into Disposable)
- Disposable Income → each Account (accounts with non-zero contribution %)
- W2TaxNode no longer displays expenses/savings section (handled by separate nodes)

#### Projection & Goal Engine
- `calcYearByYearProjection` distributes by `contributionPercent` of disposable income
- `GoalStore.projectedAmountAtRetirement` uses percent-based contributions
- `GoalStore.progress` no longer depends on `calcGoalProgress` (avoids stale `monthlyContribution: 0`)
- `TaxStore.autoAllocation` uses percent-based contributions
- Renamed `GoalStore.contributionPercent` → `contributionSharePercent` to avoid naming conflict

#### UI
- AccountNode: shows contribution % and computed $/mo, plus left target handle
- AccountEditor: contribution % slider replaces fixed monthly contribution input
- Onboarding AccountsStep: % of disposable input replaces $ monthly contribution
- ReviewStep: shows total allocation % instead of total $ contributions

#### Backfill & Migration
- FlowStore backfill updated with new edge IDs (`e-th-disp` replaces `e-th-exp`)
- AccountStore normalizer adds `contributionPercent: 0` for legacy saved accounts

---

## Session 12 — Default Accounts & Savings Overflow

### Summary
Replaced the default 401(k)/Roth IRA/Pension accounts with a simpler Savings + Brokerage setup. Added savings-specific features: max balance cap with overflow redirection to another account. Repositioned variable/goal nodes to sit directly below the Retirement Plan Engine.

### Changes

#### Account Type
- Added `maxBalance: number` (0 = unlimited) and `overflowAccountId: string` to `Account` interface
- Legacy migration normalizes missing fields to `0` / `''`

#### Default Accounts
- **Savings**: $15k balance, 100% of disposable income, 3% APY, $30k max balance → overflow to Brokerage
- **Brokerage**: $25k balance, 0% direct allocation (receives overflow), 7% return, no cap

#### Default Flow
- Account nodes: `node-savings` and `node-brokerage` replace `node-401k`, `node-roth`, `node-pension`
- Social Security node repositioned to y:310 (below 2 accounts instead of 3)
- Savings Rate, Target Age, and Inflation Rate nodes moved from bottom-left to directly below the Engine (x:1180–1500, y:580)
- Edges updated accordingly

#### AccountNode
- Shows APY label for savings type (instead of "real return")
- Shows max balance cap with overflow target indicator
- Provider falls back to account name when empty

#### AccountEditor
- "Savings Yield (APY)" label for savings accounts
- Max Balance input field (0 = unlimited)
- Overflow account dropdown appears when max balance > 0
- Real return section hidden for savings accounts

#### App.tsx
- Static account node/edge IDs updated for new defaults
