# Finance GUI

A node-based retirement planning tool. Build a visual pipeline of your income, accounts, and spending to project your path to financial independence.

## Stack

- **React 19** + **TypeScript** — UI and type safety
- **MobX** — reactive state management (three-layer architecture)
- **React Flow (@xyflow/react)** — node-based canvas
- **Tailwind CSS v4** — styling
- **Vite** — build tool (SWC)

## Getting Started

```bash
npm install
npm run dev         # standard dev mode
npm run demo        # demo mode with onboarding wizard
npm run build       # production build
```

## Architecture

Strict three-layer separation: **UI → Store → Service**

| Layer | Location | Rules |
|-------|----------|-------|
| UI | `src/features/`, `src/components/` | Observes stores, dispatches actions. No business logic. |
| Store | `src/stores/` | MobX state + business logic. Orchestrates services. |
| Service | `src/services/` | Stateless pure functions. No MobX, no UI awareness. |

See [`docs/tech_spec.md`](docs/tech_spec.md) for full architecture details and [`docs/roadmap.md`](docs/roadmap.md) for feature history.

## Key Features

- **Visual pipeline**: Drag-and-drop nodes represent income sources, tax calculators, accounts, and outputs
- **Retirement projections**: Year-by-year compound growth with inflation adjustment
- **Tax-aware**: 2024 federal brackets, LTCG rates, FICA, state tax, Social Security estimation
- **Savings overflow**: Account contribution caps with automatic overflow routing
- **Save/load setups**: Export and import complete app state as JSON
- **Demo mode**: Onboarding wizard to pre-populate your personal data
