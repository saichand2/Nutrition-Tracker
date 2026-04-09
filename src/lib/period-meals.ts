import { eachDayOfInterval, startOfDay, subDays } from "date-fns";
import type { LogEntry, MacroTotals } from "../types";
import { toDateKey } from "./dates";
import { sumMacros } from "./macros";

export type MealPeriod = "7d" | "30d";

export type PeriodMealLine = Pick<LogEntry, "id" | "date" | "mealName" | "nutrition">;

export type PeriodMealsSnapshot = {
  period: MealPeriod;
  periodDayCount: number;
  firstDay: string;
  lastDay: string;
  loggedMeals: PeriodMealLine[];
  totals: MacroTotals;
};

function rollingDateKeysInclusive(dayCount: number): string[] {
  const end = startOfDay(new Date());
  const start = startOfDay(subDays(end, dayCount - 1));
  return eachDayOfInterval({ start, end }).map(toDateKey);
}

/** All log entries whose `date` falls in the rolling window ending today (inclusive). */
export function getMealsInRollingWindow(entries: LogEntry[], period: MealPeriod): PeriodMealsSnapshot {
  const periodDayCount = period === "7d" ? 7 : 30;
  const dayKeys = rollingDateKeysInclusive(periodDayCount);
  const keySet = new Set(dayKeys);
  const periodEntries = entries.filter((e) => keySet.has(e.date));
  const loggedMeals: PeriodMealLine[] = [...periodEntries]
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.id.localeCompare(b.id);
    })
    .map((e) => ({
      id: e.id,
      date: e.date,
      mealName: e.mealName,
      nutrition: e.nutrition,
    }));
  const totals = sumMacros(periodEntries);

  return {
    period,
    periodDayCount,
    firstDay: dayKeys[0]!,
    lastDay: dayKeys[dayKeys.length - 1]!,
    loggedMeals,
    totals,
  };
}
