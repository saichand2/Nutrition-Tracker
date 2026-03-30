import type { LogEntry, MacroTotals, NutritionGoals } from "../types";

const MACRO_KEYS: (keyof MacroTotals)[] = ["calories", "protein", "carbs", "fat", "fiber"];

/** Each macro with a positive goal is strictly above 95% of that goal (same goals used on Dashboard). */
export function allGoalsHitAbove95Percent(totals: MacroTotals, goals: NutritionGoals): boolean {
  let hasActiveGoal = false;
  for (const k of MACRO_KEYS) {
    const g = goals[k];
    if (g <= 0) continue;
    hasActiveGoal = true;
    if (totals[k] <= g * 0.95) return false;
  }
  return hasActiveGoal;
}

export function sumMacros(entries: LogEntry[]): MacroTotals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.nutrition.calories,
      protein: acc.protein + e.nutrition.protein,
      carbs: acc.carbs + e.nutrition.carbs,
      fat: acc.fat + e.nutrition.fat,
      fiber: acc.fiber + e.nutrition.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

export function clampPct(value: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((value / goal) * 100));
}

/** Remaining vs daily goal for Today’s intake (short label for UI tiles). */
export function formatRemainingToGoal(current: number, goal: number, unit: string): string {
  if (goal <= 0) return "Set a goal";
  const diff = goal - current;
  const rounded = Math.round(Math.abs(diff) * 10) / 10;
  if (diff > 0) return `${rounded} ${unit} left`;
  if (diff === 0) return "At goal";
  return `${rounded} ${unit} over`;
}
