import type { LogEntry, MacroTotals } from "../types";
import { toDateKey } from "./dates";
import { subDays } from "date-fns";

export type DailyMacroPoint = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export function buildDailyPoints(
  entries: LogEntry[],
  dayCount: 7 | 30 | 90
): DailyMacroPoint[] {
  const totalsMap = new Map<string, MacroTotals>();
  for (const e of entries) {
    const t = totalsMap.get(e.date) ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    totalsMap.set(e.date, {
      calories: t.calories + e.nutrition.calories,
      protein: t.protein + e.nutrition.protein,
      carbs: t.carbs + e.nutrition.carbs,
      fat: t.fat + e.nutrition.fat,
      fiber: t.fiber + e.nutrition.fiber,
    });
  }

  const points: DailyMacroPoint[] = [];
  const today = new Date();
  for (let i = dayCount - 1; i >= 0; i--) {
    const date = toDateKey(subDays(today, i));
    const t = totalsMap.get(date) ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    points.push({ date, ...t });
  }
  return points;
}

export function rollingAverage(
  points: DailyMacroPoint[],
  windowSize: number
): DailyMacroPoint[] {
  return points.map((_, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const window = points.slice(start, i + 1);
    const count = window.length;
    const sum = window.reduce(
      (acc, p) => ({
        date: p.date,
        calories: acc.calories + p.calories,
        protein: acc.protein + p.protein,
        carbs: acc.carbs + p.carbs,
        fat: acc.fat + p.fat,
        fiber: acc.fiber + p.fiber,
      }),
      { date: "", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
    return {
      date: points[i]!.date,
      calories: Math.round((sum.calories / count) * 10) / 10,
      protein: Math.round((sum.protein / count) * 10) / 10,
      carbs: Math.round((sum.carbs / count) * 10) / 10,
      fat: Math.round((sum.fat / count) * 10) / 10,
      fiber: Math.round((sum.fiber / count) * 10) / 10,
    };
  });
}

export function daysLogged(points: DailyMacroPoint[]): number {
  return points.filter((p) => p.calories > 0).length;
}

export function averageOf(
  points: DailyMacroPoint[],
  key: keyof Omit<DailyMacroPoint, "date">
): number {
  const logged = points.filter((p) => p.calories > 0);
  if (logged.length === 0) return 0;
  return Math.round((logged.reduce((s, p) => s + p[key], 0) / logged.length) * 10) / 10;
}
