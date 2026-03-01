# Finance GUI - Technical Specification

## Architecture

Three-layer separation: **UI -> Store -> Service**

| Layer   | Purpose                         | Rules                                              |
| ------- | ------------------------------- | -------------------------------------------------- |
| UI      | Presentation only               | No business logic. Observes stores, dispatches.     |
| Store   | State + business logic (MobX)   | Orchestrates services. Never imports UI.            |
| Service | API, persistence, integrations  | Stateless. No MobX, no UI awareness.               |

## Tech Stack

| Technology         | Version | Purpose                    |
| ------------------ | ------- | -------------------------- |
| React              | 19.x    | UI framework               |
| TypeScript         | 5.9.x   | Type safety                |
| Vite               | 7.x     | Build tool (SWC)           |
| Tailwind CSS       | 4.x     | Utility-first styling      |
| React Flow (@xyflow/react) | 12.x | Node-based canvas   |
| MobX               | 6.x     | State management           |
| mobx-react-lite    | 4.x     | React bindings for MobX    |
| Lucide React       | latest  | Icon library               |
| Framer Motion      | latest  | Animations                 |

## File Structure

```
src/
  core/types/         # Shared TypeScript types (account, goal, node, flow, tax)
  features/
    canvas/            # React Flow canvas + custom nodes + edges + default flow
    sidebar/           # Collapsible sidebar, node palette, SetupManager
    panels/            # Detail panel with property editors
    onboarding/        # Demo mode wizard (OnboardingWizard, 5 step components)
  stores/              # MobX stores (Account, Goal, Flow, Tax, Root, Onboarding)
  services/            # Financial calculations, tax, projections, SS, persistence
  components/          # Shared UI components (Header, ProgressBar, CurrencyDisplay, NumberInput)
docs/                  # Project documentation
.cursor/
  agents/
    docs-sync-architecture-explorer.md  # Docs sync + architecture Q&A subagent
    main-diff-reviewer.md  # Diff-focused top-3 layout/architecture/design reviewer for current branch changes
    main-diff-pr-writer.md  # Diff-focused PR writer for current branch changes
    codebase-layout-architecture-auditor.md  # Full-repo top-3 architecture/layout/design auditor
```

## Agent Documentation Workflow

- Documentation baseline for planning and state questions:
  - `docs/roadmap.md`
  - `docs/tech_spec.md`
  - `docs/changelog.md`
- Verification rule:
  - Validate material doc claims against code before presenting them as facts.
- Q&A categorization:
  - Current state (implemented now)
  - Planned state (roadmap/changelog)
  - Architecture and patterns (stable conventions)

## Design System

- **Theme**: Dark futuristic minimalist (Ethan Style)
- **Background**: zinc-950 (#09090b) with dot grid pattern
- **Nodes**: Glassmorphism (bg-zinc-900/70 + backdrop-blur-md + border-zinc-800)
- **Edges**: Custom GlowEdge with animated cyan dash, blur glow layer
- **Accents**: cyan-400/500 (primary), emerald-400 (positive/ahead), amber-400 (warnings)
- **Typography**: Sans-serif (Inter/system), tracking-wide on headings
- **Sidebar**: bg-zinc-900/80 + backdrop-blur, animated open/close with Framer Motion
- **Detail Panel**: Slides in from right, animated with Framer Motion

## Data Model

### Account
- id, name, type (401k | roth_ira | traditional_ira | pension | brokerage | savings)
- provider, balance, monthlyContribution
- contributionPercent (% of disposable income allocated to this account, 0-100)
- annualReturn (decimal), vestingPercent (0-100)
- maxBalance (contribution cap; 0 = unlimited), overflowAccountId (redirect when cap is hit)

### RetirementGoal
- id, targetAge, currentAge
- monthlySpending, savingsRate (decimal)
- `targetAmount` removed — now auto-computed via `calcRequiredSavingsForSpending()` (Phase 2.6)

### Flow
- nodes[] (React Flow nodes with typed data payloads)
- edges[] (FinanceFlowEdge with glowEdge type)

## Custom Node Types

| Type          | Purpose                              | Data                         | Sidebar |
| ------------- | ------------------------------------ | ---------------------------- | ------- |
| accountNode   | Display account balance/vesting      | accountId, label             | Yes     |
| engineNode    | Central aggregation + projection     | label                        | Yes     |
| outputNode    | Display computed metrics             | metric (net_worth/goal_status/monthly_income/net_monthly_income/take_home_pay/disposable_income) | Yes |
| w2TaxNode     | Working-years W-2 income tax         | label                        | Yes     |
| grossPayNode  | Gross annual income display          | label                        | Yes     |
| expensesNode  | Monthly expenses display             | label                        | Yes     |
| variableNode  | Tunable planning variable w/ slider  | key, value, min/max/step, suffix | Yes |
| chartNode     | Multi-series projection chart        | displayMode, showNominal/Real/GoalLine/Accounts | Yes |
| incomeNode    | Income source with SS auto-estimate  | sourceType, monthlyAmount, autoEstimate | Hidden  |
| goalNode      | Display/edit goal parameters         | goalId, label                | Hidden  |
| taxNode       | Tax breakdown with income allocation | filingStatus, stateRate      | Hidden  |

**Hidden nodes** are not available in the sidebar palette but remain renderable for legacy saved flows. They can be reconsidered once edge-driven computation is implemented.

## Connection Contract

Edges are currently decorative (they visualize the conceptual data flow but do not drive computation — all values flow through MobX stores). To prevent confusing connections, a strict allowlist is enforced:

| Source Type    | Allowed Targets                          |
| -------------- | ---------------------------------------- |
| grossPayNode   | w2TaxNode, engineNode                    |
| w2TaxNode      | outputNode, expensesNode                 |
| expensesNode   | outputNode, engineNode                   |
| outputNode     | outputNode, accountNode, taxNode, chartNode |
| accountNode    | engineNode                               |
| incomeNode     | engineNode                               |
| goalNode       | engineNode                               |
| variableNode   | engineNode                               |
| engineNode     | outputNode, chartNode                    |
| taxNode        | outputNode                               |

Self-connections and duplicate edges are also blocked.

**Enforcement:** Connection rules are validated in `FlowStore.isValidConnection()` (store layer), not only the `isValidConnection` UI prop. This ensures setup restore (`loadSetup`) and programmatic edge insertion also respect the allowlist.

## Services

### financialCalc.ts
- `calcFutureValue()` - Compound interest with monthly contributions
- `calcNetWorth()` - Sum of vested account balances
- `calcGoalProgress()` - Projected vs target, returns percent + status *(note: `GoalStore.progress` uses its own income-based logic inline; this function is not currently called)*
- `calcMonthlyRetirementIncome()` - 4% rule withdrawal estimate
- `calcRequiredSavings()` - Reverse calculation from target income
- `calcRequiredSavingsForSpending()` - Binary search: savings needed so 4% withdrawals cover spending after taxes (SS-aware, gap-year-aware)
- `resolveAccountContributions()` - Single source of truth for per-account monthly contributions: applies `contributionPercent × monthlySavings`, falls back to `monthlyContribution`, and redirects contributions from capped accounts to their `overflowAccountId`
- `adjustForInflation()` - Convert nominal future value to today's dollars
- `calcRealReturn()` - Inflation-adjusted rate of return
- `formatCurrency()` - USD formatting with compact mode

### taxCalc.ts
- `calcFederalOrdinaryTax()` - Progressive federal brackets (2024)
- `calcFederalLTCGTax()` - LTCG/qualified dividends at 0%/15%/20% (stacked on ordinary income)
- `calcNIIT()` - Net Investment Income Tax (3.8% surtax)
- `calcStateTax()` - Flat state rate
- `calcFICATax()` - SS + Medicare (not applicable to retirement income)
- `calcRetirementTax()` - Full breakdown with income allocation (ordinary/LTCG/tax-free)
- `calcW2Tax()` - Working-years W-2 tax: federal income, state, FICA (SS + Medicare + surtax)
- `W2TaxBreakdown` type - gross, federal, state, SS, medicare, surtax, total, effective rate, net
- `IncomeAllocation` type - splits income by tax treatment category

#### Income Tax Treatment by Account Type
| Account Type     | Tax Treatment | Rate Category |
| ---------------- | ------------- | ------------- |
| 401(k)           | Ordinary      | Federal brackets (10-37%) |
| Traditional IRA  | Ordinary      | Federal brackets (10-37%) |
| Pension          | Ordinary      | Federal brackets (10-37%) |
| Savings          | Ordinary      | Federal brackets (10-37%) |
| Brokerage        | LTCG          | Preferential (0%/15%/20%) |
| Roth IRA         | Tax-Free      | $0 federal tax |

### projectionCalc.ts
- `calcYearByYearProjection()` - Full projection array from current age to retirement, accepts optional derived monthly savings
- `YearProjection` interface - per-year nominal, real, per-account, cumulative contributions, totalGrowth, costBasis, taxableGains, goal line

### socialSecurityCalc.ts
- `estimateSSBenefit()` - PIA estimation from AIME bend points + claim age adjustment
- `calcSSWithCOLA()` - COLA-adjusted benefit over time
- Supports early claiming (62+), full retirement (67), delayed credits (up to 70)

## Stores

### AccountStore
- Observable: accounts[]
- Computed: netWorth, totalMonthlyContributions
- Actions: addAccount, updateAccount, removeAccount, getAccount (query), setAccounts (bulk restore)

### GoalStore
- Observable: goal, inflationRate, currentAnnualIncome, ssClaimAge, monthlyExpenses
- Computed (core projections): projectedAmountAtRetirement, realProjectedAmount, requiredSavings, progress, yearByYearProjection
- Computed (income): estimatedMonthlyIncome, realMonthlyIncome, realNetRetirementIncome, w2TaxBreakdown, takeHomePayAnnual, takeHomePayMonthly, monthlySavings, computedSavingsRate
- Computed (SS + gap years): ssMonthlyBenefit, ssStartsAfterRetirement, ssGapYears, gapAnnualShortfall, gapReserve, portfolioAfterGapReserve
- Computed (timing): yearsToRetirement, yearsToDelayForTarget, yearsCanRetireEarly
- Computed (insights): monthlyIncomeGap, additionalMonthlySavingsNeeded, savingsImpactPer100
- Computed (ending net worth): endingNetWorth, endingNetWorthReal, currentNetWorth, totalContributionsAtRetirement, totalGrowthAtRetirement, contributionSharePercent, growthPercent
- Computed (tax basis): costBasis, taxableGains, taxablePercent
- Late-bound: TaxSettingsGetter (filingStatus, stateRate, allocation from TaxStore via RootStore; warns on null access)
- Actions: updateGoal, setInflationRate, setCurrentAnnualIncome, setSSClaimAge, setMonthlyExpenses, setTaxSettings, restoreState

### TaxStore
- Observable: filingStatus, stateRate, autoAllocate, manualOrdinaryPct/LtcgPct/TaxFreePct
- Computed: autoAllocation (derived from account types via resolveAccountContributions), allocation, breakdown, netMonthlyIncome, effectiveRate
- Actions: setFilingStatus, setStateRate, setAutoAllocate, setManualOrdinaryPct/LtcgPct/TaxFreePct, restoreState

### FlowStore
- Observable: nodes[], edges[], selectedNodeId
- Computed: selectedNode, hasNodes
- Actions: onNodesChange, onEdgesChange, onConnect (validates via isValidConnection), addNode, removeNode, updateNodeData, selectNode, setNodes, setEdges (bulk set), initializeDefaultFlow, buildFlowFromAccounts
- Validation: isValidConnection(connection) — enforces ALLOWED_CONNECTIONS allowlist at the store layer (not just UI); called by onConnect and available as ReactFlow prop
- ALLOWED_CONNECTIONS constant lives in FlowStore (not Canvas) so setup restore and programmatic edge creation respect the same rules

### OnboardingStore (src/stores/OnboardingStore.ts)
- Ephemeral wizard store — not persisted; instantiated fresh by OnboardingWizard
- Observable: currentStep, totalSteps, currentAge, retirementAge, filingStatus, annualIncome, desiredMonthlyIncome, accounts[]
- Computed: isAboutYouValid, isIncomeValid, isAccountsValid, canProceed
- Actions: nextStep, prevStep, goToStep, setCurrentAge, setRetirementAge, setFilingStatus, setAnnualIncome, setDesiredMonthlyIncome, addAccount, removeAccount, updateAccount

### RootStore
- Wires all sub-stores; exposes typed hook accessors (useGoalStore, useAccountStore, useTaxStore, useFlowStore)
- Setup management: saveSetup, loadSetup, deleteSetup, exportSetup, importSetup
- Onboarding orchestration: completeOnboarding(onboarding, defaultNodes, defaultEdges) — populates all stores from wizard and builds flow

## Persistence

All state auto-saved to localStorage via MobX reactions:

| Key                    | Data                |
| ---------------------- | ------------------- |
| `finance-gui:accounts` | Account[]           |
| `finance-gui:goals`    | RetirementGoal      |
| `finance-gui:goal-settings` | inflationRate, currentAnnualIncome, ssClaimAge, monthlyExpenses |
| `finance-gui:tax`      | TaxSettings (filing, rate, allocation mode) |
| `finance-gui:flow-nodes` | FinanceFlowNode[] |
| `finance-gui:flow-edges` | FinanceFlowEdge[] |
| `finance-gui:saved-setups` | SavedSetup[] (name, nodes, edges, accounts, goal, goalSettings, taxSettings) |

Hydrates from localStorage on app load, falls back to demo defaults.
