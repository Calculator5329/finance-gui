export type GoalStatus = 'on_track' | 'behind' | 'ahead' | 'unknown';

export interface RetirementGoal {
  id: string;
  targetAge: number;
  currentAge: number;
  monthlySpending: number;
  savingsRate: number; // as decimal, e.g. 0.15 for 15%
}

export const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  on_track: '#22c55e',  // green-500
  behind: '#ef4444',    // red-500
  ahead: '#22d3ee',     // cyan-400
  unknown: '#a1a1aa',   // zinc-400
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  on_track: 'On Track',
  behind: 'Behind',
  ahead: 'Ahead',
  unknown: 'Unknown',
};
