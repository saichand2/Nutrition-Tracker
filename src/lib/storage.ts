import type { CustomMeal, LogEntry, NutritionGoals } from "../types";
import { defaultGoals } from "../types";

const KEYS = {
  entries: "nt-entries-v1",
  meals: "nt-custom-meals-v1",
  goals: "nt-goals-v1",
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadEntries(): LogEntry[] {
  return readJson(KEYS.entries, []);
}

export function saveEntries(entries: LogEntry[]): void {
  localStorage.setItem(KEYS.entries, JSON.stringify(entries));
}

export function loadCustomMeals(): CustomMeal[] {
  return readJson(KEYS.meals, []);
}

export function saveCustomMeals(meals: CustomMeal[]): void {
  localStorage.setItem(KEYS.meals, JSON.stringify(meals));
}

export function loadGoals(): NutritionGoals {
  return readJson(KEYS.goals, defaultGoals());
}

export function saveGoals(goals: NutritionGoals): void {
  localStorage.setItem(KEYS.goals, JSON.stringify(goals));
}
