import { startOfWeek } from "date-fns";
import type { ExerciseGroupId, ExerciseLogEntry } from "../types";
import { format, parseDateKey, toDateKey } from "./dates";

const PPL: ExerciseGroupId[] = ["push", "pull", "legs"];

export function suggestNextGroup(logs: ExerciseLogEntry[]): {
  group: ExerciseGroupId;
  reason: string;
} | null {
  const today = toDateKey(new Date());
  const dayGroups = new Map<string, Set<ExerciseGroupId>>();
  for (const log of logs) {
    if (log.date === today) continue; // only use past days
    const s = dayGroups.get(log.date) ?? new Set<ExerciseGroupId>();
    s.add(log.groupId);
    dayGroups.set(log.date, s);
  }
  if (dayGroups.size === 0) return null;

  const sortedDays = [...dayGroups.keys()].sort((a, b) => b.localeCompare(a));

  // Collect groups from last 2 distinct exercise days
  const recentDays = sortedDays.slice(0, 2);
  const recentGroups = new Set<ExerciseGroupId>();
  for (const day of recentDays) {
    for (const g of dayGroups.get(day)!) recentGroups.add(g);
  }

  // First group in PPL order not yet done recently
  for (const g of PPL) {
    if (!recentGroups.has(g)) {
      const covered = [...recentGroups].map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(" + ");
      return {
        group: g,
        reason: `Last ${recentDays.length} session${recentDays.length > 1 ? "s" : ""} covered ${covered}`,
      };
    }
  }

  // All 3 covered in last 2 sessions — pick next after most recent group
  const lastGroups = dayGroups.get(sortedDays[0]!)!;
  let lastIdx = -1;
  for (const g of lastGroups) {
    const idx = PPL.indexOf(g);
    if (idx > lastIdx) lastIdx = idx;
  }
  return {
    group: PPL[(lastIdx + 1) % 3]!,
    reason: "Completing Push → Pull → Legs rotation",
  };
}

export type WeekFreqPoint = {
  weekLabel: string;
  push: number;
  pull: number;
  legs: number;
};

export function buildWeeklyFrequency(logs: ExerciseLogEntry[], weeks = 8): WeekFreqPoint[] {
  const now = new Date();
  const points: WeekFreqPoint[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7),
      { weekStartsOn: 1 }
    );
    const weekStartKey = toDateKey(weekStart);
    const weekEndKey = toDateKey(new Date(weekStart.getTime() + 6 * 86_400_000));

    const weekLogs = logs.filter((l) => l.date >= weekStartKey && l.date <= weekEndKey);
    const dayGroupMap = new Map<string, Set<ExerciseGroupId>>();
    for (const log of weekLogs) {
      const s = dayGroupMap.get(log.date) ?? new Set<ExerciseGroupId>();
      s.add(log.groupId);
      dayGroupMap.set(log.date, s);
    }

    let push = 0, pull = 0, legs = 0;
    for (const groups of dayGroupMap.values()) {
      if (groups.has("push")) push++;
      if (groups.has("pull")) pull++;
      if (groups.has("legs")) legs++;
    }
    points.push({ weekLabel: format(weekStart, "MMM d"), push, pull, legs });
  }

  return points;
}

export type WeightPoint = { date: string; weight: number; label: string };

export function buildWeightProgression(
  logs: ExerciseLogEntry[],
  exerciseName: string
): WeightPoint[] {
  return logs
    .filter((l) => l.exerciseName === exerciseName && l.weightKg != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({ date: l.date, weight: l.weightKg!, label: format(parseDateKey(l.date), "MMM d") }));
}

export function exercisesWithWeightData(logs: ExerciseLogEntry[]): string[] {
  const names = new Set<string>();
  for (const log of logs) {
    if (log.weightKg != null) names.add(log.exerciseName);
  }
  return [...names].sort();
}
