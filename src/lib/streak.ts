import type { LogEntry } from "../types";
import { toDateKey } from "./dates";
import { subDays } from "date-fns";

export function computeStreak(entries: LogEntry[]): number {
  const datesWithEntries = new Set(entries.map((e) => e.date));
  if (datesWithEntries.size === 0) return 0;

  let streak = 0;
  let cursor = new Date();

  // If today has no entries, still count yesterday onward (streak not yet broken)
  if (!datesWithEntries.has(toDateKey(cursor))) {
    cursor = subDays(cursor, 1);
  }

  while (datesWithEntries.has(toDateKey(cursor))) {
    streak++;
    cursor = subDays(cursor, 1);
  }

  return streak;
}
