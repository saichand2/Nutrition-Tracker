import type { MacroTotals } from "../types";

type Bounds = {
  maxCalories: number;
  maxMacroGrams: number;
};

const DEFAULT_BOUNDS: Bounds = {
  maxCalories: 5000,
  maxMacroGrams: 350,
};

export function hasAnyMacroValue(m: MacroTotals): boolean {
  return m.calories > 0 || m.protein > 0 || m.carbs > 0 || m.fat > 0 || m.fiber > 0;
}

export function unrealisticMacroHints(m: MacroTotals, b: Bounds = DEFAULT_BOUNDS): string[] {
  const hints: string[] = [];
  if (m.calories > b.maxCalories) hints.push("Calories look unusually high.");
  if (m.protein > b.maxMacroGrams) hints.push("Protein looks unusually high.");
  if (m.carbs > b.maxMacroGrams) hints.push("Carbs look unusually high.");
  if (m.fat > b.maxMacroGrams) hints.push("Fat looks unusually high.");
  if (m.fiber > 120) hints.push("Fiber looks unusually high.");
  return hints;
}
