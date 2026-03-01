# Finance GUI - Roadmap

## Phase 1: Functional MVP (Complete)

- [x] Project setup (Vite + React 19 + TypeScript)
- [x] Install dependencies (Tailwind v4, React Flow, MobX, Lucide, Framer Motion)
- [x] Core types (Account, Goal, Node, Flow)
- [x] Service layer (financial calculations, localStorage persistence)
- [x] MobX stores (AccountStore, GoalStore, FlowStore, RootStore)
- [x] Shared UI components (Header, ProgressBar, CurrencyDisplay)
- [x] Custom React Flow nodes (Account, Engine, Output, Income, Goal)
- [x] Custom GlowEdge with animated cyan glow
- [x] Canvas with dot grid, minimap, controls
- [x] Sidebar with draggable node palette
- [x] Detail panel with property editors (AccountEditor, GoalEditor)
- [x] Default flow layout (accounts left, variables bottom, endpoints right)
- [x] Node selection + property editing
- [x] localStorage persistence for all state

## Phase 2: Enhanced Financial Functionality (Complete)

- [x] Tax Calculator service with federal brackets, LTCG/qualified dividends brackets, NIIT, state tax
- [x] Income allocation by tax treatment (ordinary vs LTCG vs tax-free Roth)
- [x] Auto-derive income allocation from account types, with manual override
- [x] Year-by-year projection engine with per-account tracking
- [x] Social Security benefit estimator (PIA, early/late claim adjustment, COLA)
- [x] Inflation adjustment helpers (real return, purchasing power conversion)
- [x] TaxStore with filing status, state rate, income allocation, wired to RootStore
- [x] GoalStore enhancements: inflationRate, currentAnnualIncome, realProjectedAmount, yearByYearProjection
- [x] TaxNode with income mix bar, tax burden bar, per-category breakdown
- [x] VariableNode with inline slider (reusable for inflation rate, etc.)
- [x] ChartNode with multi-series SVG area chart, hover tooltips, legend
- [x] EngineNode enhanced with real projection data, nominal vs inflation-adjusted lines
- [x] IncomeNode enhanced with SS auto-estimation from current income
- [x] TaxEditor with filing status, state rate, auto/manual income allocation, full breakdown
- [x] ChartEditor, IncomeEditor, VariableEditor detail panels
- [x] DetailPanel routing to all new editor types
- [x] All new node types registered in Canvas + NodePalette
- [x] Full default flow pipeline: accounts + SS -> engine -> outputs + chart, gross -> tax -> net income
- [x] OutputNode updated with source handle for chaining, net_monthly_income metric

## Demo Mode (Complete)

- [x] `npm run demo` script using Vite `--mode demo` with `.env.demo`
- [x] OnboardingStore (temporary MobX store for wizard form state)
- [x] OnboardingWizard with 5-step questionnaire and Framer Motion transitions
- [x] WelcomeStep, AboutYouStep, IncomeStep, AccountsStep, ReviewStep
- [x] Wizard completion populates AccountStore, GoalStore, TaxStore and launches main canvas
- [x] Step progress indicator with back/forward navigation

## Phase 2.5: Income-Driven Pipeline & Engine Properties (Complete)

- [x] W-2 Income Tax service (`calcW2Tax()`) with federal, state, FICA breakdown
- [x] GoalStore income-driven computeds: W2 tax, take-home pay, monthly savings, computed savings rate
- [x] GoalStore ending net worth, contribution/growth split, tax basis tracking
- [x] Projection engine accepts derived monthly contributions from savings rate
- [x] YearProjection tracks totalGrowth, costBasis, taxableGains per year
- [x] W2TaxNode canvas component with tax burden bar, savings derivation display
- [x] W2TaxEditor detail panel with income input, filing status, expenses, full tax breakdown, auto-savings
- [x] EngineEditor detail panel with years to retirement, contributions, contribution/growth split, tax basis
- [x] Net Worth OutputNode shows ending projected net worth (not current)
- [x] W2TaxNodeData type, W2TaxFlowNode registered in Canvas, Palette, DetailPanel, default flow
- [x] Late-binding pattern for GoalStore -> TaxStore to resolve circular dependency

## Phase 2.6: Auto-Computed Retirement Target (Complete)

- [x] `calcRequiredSavingsForSpending()` binary search to find savings needed for spending after taxes
- [x] Removed manual `targetAmount` from `RetirementGoal` interface — now auto-computed
- [x] `GoalStore.requiredSavings` computed: savings where 4% rule withdrawals minus retirement taxes cover monthly spending
- [x] Goal progress and projection goal line now use auto-computed target
- [x] GoalEditor shows required savings as read-only (no more manual target input)
- [x] EngineEditor shows required savings instead of manual target

## Phase 2.7: Save/Load Setups, Node Creation Fixes, Singleton Filtering (Complete)

- [x] `SavedSetup` type with full state snapshot (nodes, edges, accounts, goal, tax settings)
- [x] `setupService.ts` for serializing/deserializing complete app state
- [x] RootStore setup management: `saveSetup()`, `loadSetup()`, `deleteSetup()`, `exportSetup()`, `importSetup()`
- [x] `SetupManager.tsx` UI component in sidebar with save, load, delete, export/import
- [x] Restore methods on AccountStore, GoalStore, TaxStore for setup loading
- [x] NodePalette `defaultData` field carries type-specific metadata (accountType, sourceType, metric, etc.)
- [x] Palette serializes full JSON payload via dataTransfer (type + label + defaultData)
- [x] Canvas `onDrop` parses palette metadata and builds correct node data per type
- [x] Account nodes auto-create linked Account in AccountStore on drop (no more "No account linked")
- [x] Income nodes set correct sourceType, output nodes set correct metric, goal nodes set correct label
- [x] Singleton filtering: Target Age, Spending, Savings Rate, Inflation Rate, Plan Engine, W-2 Income Tax hidden from palette when already on canvas
- [x] NodePalette is now an `observer` component with FlowStore access for live filtering

## Phase 2.8: Income Pipeline & Enhanced Outputs (Complete)

- [x] `grossPayNode` — New input node for gross annual income, with GrossPayEditor panel
- [x] `expensesNode` — New input node for monthly expenses, with ExpensesEditor panel
- [x] `take_home_pay` OutputMetric — Displays after-tax monthly take-home pay
- [x] `disposable_income` OutputMetric — Displays monthly savings available for investing
- [x] `net_worth` output shows inflation-adjusted value below nominal
- [x] `monthly_income` output shows inflation-adjusted value below nominal
- [x] Income pipeline layout: Gross Pay → W-2 Tax → Take-Home → Expenses → Disposable Income → Accounts → Engine → Outputs
- [x] Demo flow builder updated for pipeline layout with dynamic account positioning
- [x] Goal status uses inflation-adjusted net retirement income vs user-entered expenses
- [x] `GoalStore.realNetRetirementIncome` computed for inflation-adjusted net retirement income
- [x] FlowStore backfill includes new pipeline nodes for persisted flows
- [x] NodePalette: New "Income Pipeline" category with Gross Pay and Expenses (singleton-filtered)
- [x] Node types, flow types, Canvas, DetailPanel all updated for new node types

## Phase 2.9: Contribution Model Overhaul

- [x] Account `contributionPercent` field: % of disposable income allocated per account
- [x] Remove Take-Home → Expenses edge; both Take-Home and Expenses feed into Disposable Income
- [x] Disposable Income → Accounts → Engine flow (accounts with % allocations)
- [x] Projection engine uses `contributionPercent × monthlySavings` instead of fixed dollar contributions
- [x] `GoalStore.projectedAmountAtRetirement` uses percent-based contributions
- [x] TaxStore autoAllocation uses percent-based contributions
- [x] AccountNode: shows contribution % and computed $/mo, plus target handle for incoming edges
- [x] AccountEditor: contribution % slider replaces fixed monthly contribution input
- [x] W2TaxNode: removed redundant expenses/savings section (now separate nodes)
- [x] Onboarding: AccountsStep uses % of disposable, ReviewStep shows total allocation %
- [x] Legacy migration: accounts without `contributionPercent` default to 0%
- [x] FlowStore backfill updated with new edge topology

## Phase 2.10: Default Accounts & Savings Overflow

- [x] Default accounts changed to Savings + Brokerage (replaces 401k, Roth IRA, Pension) *(replaced by 5 personal accounts: Growth Brokerage, Roth IRA, Index Portfolio, Savings, YOLO — Session 15)*
- [x] Account type gains `maxBalance` (cap) and `overflowAccountId` (redirect target) fields
- [x] Savings account: 3% APY default, $30k max balance, overflow to Brokerage
- [x] Brokerage account: 7% return, no cap, receives overflow
- [x] AccountNode: shows APY for savings, cap indicator with overflow target
- [x] AccountEditor: max balance input, overflow account dropdown, savings yield label
- [x] Variable/Goal nodes (Savings Rate, Target Age, Inflation) repositioned below Engine
- [x] Legacy migration: accounts without maxBalance/overflowAccountId default to 0/''
- [x] Static account IDs and edges updated in App.tsx and defaultFlow.ts

## Phase 2.11: Brokerage Cost-Basis Tax Tracking

- [x] TaxStore.autoAllocation splits brokerage projected value into gains (LTCG) and cost basis (tax-free)
- [x] Cost basis = starting balance + cumulative contributions over working years
- [x] Only gains portion is taxed as LTCG; cost basis withdrawals are tax-free return of capital
- [x] requiredSavings automatically benefits via updated allocation percentages

## Phase 2.12: SS-Aware Retirement Income & Gap-Year Reserve (Complete)

- [x] `GoalStore.ssMonthlyBenefit` computed — store-level SS benefit from `estimateSSBenefit`
- [x] Gap-year reserve computeds: `gapAnnualShortfall`, `gapReserve`, `portfolioAfterGapReserve`
- [x] `estimatedMonthlyIncome` includes portfolio 4% withdrawal (gap-adjusted) + SS benefit
- [x] `realMonthlyIncome` inflation-adjusts portfolio portion; SS treated as COLA-adjusted (no discount)
- [x] `calcRequiredSavingsForSpending` accepts SS annual benefit and gap years; binary search accounts for gap reserve and SS income
- [x] `requiredSavings` passes SS and gap years to binary search — required savings drops when SS covers part of spending
- [x] Inflation-adjusted display promoted from footnote to prominent section in OutputNode

## Phase 2.13: Architecture Hardening (Complete — Session 25)

- [x] `resolveAccountContributions()` helper in `financialCalc.ts` — single source of truth for per-account contribution amounts; applies overflow capping when `maxBalance` is hit; used by `projectionCalc`, `GoalStore`, and `TaxStore` (eliminates triplicated formula and activates previously-ignored `maxBalance`/`overflowAccountId` fields)
- [x] `FlowStore.isValidConnection()` — connection validation moved from UI-only `Canvas.tsx` prop to store layer; `onConnect` now validates before adding edges; enforced for setup restore
- [x] `FlowStore.buildFlowFromAccounts()` — flow construction logic extracted from `App.tsx` into FlowStore
- [x] `RootStore.completeOnboarding()` — onboarding orchestration moved from `App.tsx` callback (90 lines of store mutations) to RootStore action
- [x] `OnboardingStore` moved from `features/onboarding/` to `src/stores/` (consistent store location)
- [x] `FilingStatus` type moved to `src/core/types/tax.ts`; re-exported from `services/taxCalc` for backward compat; `core/types/flow.ts` no longer imports from service layer
- [x] `NumberInput` extracted to `src/components/NumberInput.tsx`; all 7 duplicated inline definitions replaced
- [x] SVG gradient IDs in `EngineNode` and `ChartNode` switched to `useId()` — fixes rendering corruption when multiple instances exist on the canvas
- [x] `IncomeNode` and `IncomeEditor` now read `goalStore.ssMonthlyBenefit` instead of calling `estimateSSBenefit()` directly — eliminates dual computation path
- [x] `GoalStore._taxSettings` null access emits a console warning to surface mis-wiring

## Phase 3: Advanced Features

- [ ] Monte Carlo simulation engine
- [ ] Multiple workflow tabs/scenarios
- [x] Import/export flows as JSON
- [ ] PDF report generation
- [ ] Goal & action automation nodes
- [ ] Undo/redo history
- [ ] Dark/light theme toggle

## Developer Workflow Tooling

- [x] Personal Cursor skill: `parallel-codebase-architect` for parallel code exploration and architecture/functional reporting
- [x] Project Cursor subagent: `codebase-layout-architecture-auditor` for high-impact layout/architecture/design audits with verification pass
- [x] Project Cursor subagent: `main-diff-reviewer` for review of current changes against `main` with top-3 high-impact findings and mandatory double-check pass
- [x] Project Cursor subagent: `main-diff-pr-writer` for creating PRs to `main` with complete branch-vs-main summaries and structured PR descriptions

## Developer Workflow: Documentation Intelligence (Complete)

- [x] Added project Cursor subagent `docs-sync-architecture-explorer`
- [x] Standardized workflow: verify `docs/*` claims against code before answering architecture/state questions
- [x] Added response structure for codebase state, future plans, and pattern/architecture decision Q&A
