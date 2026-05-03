import type { LogEntry, MealPeriodTag } from "../types";

export const MEAL_PERIOD_TAGS: MealPeriodTag[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_PERIOD_LABELS: Record<MealPeriodTag, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export const MEAL_PERIOD_COLORS: Record<MealPeriodTag, string> = {
  breakfast: "bg-amber-100 text-amber-800",
  lunch: "bg-sky-100 text-sky-800",
  dinner: "bg-violet-100 text-violet-800",
  snack: "bg-emerald-100 text-emerald-800",
};

const DISPLAY_ORDER: Array<MealPeriodTag | "untagged"> = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "untagged",
];

export function groupEntriesByPeriod(
  entries: LogEntry[]
): Map<MealPeriodTag | "untagged", LogEntry[]> {
  const map = new Map<MealPeriodTag | "untagged", LogEntry[]>();
  for (const tag of DISPLAY_ORDER) map.set(tag, []);
  for (const e of entries) {
    const key: MealPeriodTag | "untagged" = e.mealPeriod ?? "untagged";
    map.get(key)!.push(e);
  }
  // Remove empty groups
  for (const [k, v] of map) {
    if (v.length === 0) map.delete(k);
  }
  return map;
}
