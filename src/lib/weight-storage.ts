import type { WeightLog } from "../types";

const KEY = "nt-weight-logs-v1";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadWeightLogs(): WeightLog[] {
  return readJson(KEY, []);
}

export function saveWeightLogs(logs: WeightLog[]): void {
  localStorage.setItem(KEY, JSON.stringify(logs));
}
