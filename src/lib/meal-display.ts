import type { CustomMeal, LogEntry } from "../types";

const SERVING_IN_NAME_RE = /^(.*)\s+\(([\d.]+)×\s*serving\)\s*$/i;

function formatMultiplier(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (Number.isInteger(r)) return String(r);
  return r.toFixed(2).replace(/\.?0+$/, "");
}

/**
 * One-line meal label, e.g. "Wheat roti x2" or "Oatmeal x1.5", when serving ≠ 1× is known.
 * Uses "(N× serving)" suffix on the stored name or infers from custom meal + logged calories.
 */
export function mealDisplayLabel(entry: LogEntry, customMeals: CustomMeal[]): string {
  const raw = entry.mealName.trim();
  const fromName = raw.match(SERVING_IN_NAME_RE);
  if (fromName) {
    const title = fromName[1]!.trim() || raw;
    const mult = fromName[2]!;
    return `${title} x${mult}`;
  }

  if (entry.customMealId) {
    const tpl = customMeals.find((c) => c.id === entry.customMealId);
    if (tpl && tpl.calories > 0) {
      const mult = entry.nutrition.calories / tpl.calories;
      if (Number.isFinite(mult) && mult > 0) {
        const rounded = Math.round(mult * 100) / 100;
        if (Math.abs(rounded - 1) < 0.01) {
          return raw;
        }
        return `${raw} x${formatMultiplier(rounded)}`;
      }
    }
  }

  return raw;
}
