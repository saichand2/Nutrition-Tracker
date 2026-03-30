import { useCallback, useMemo, useState } from "react";
import { EXERCISE_GROUP_IDS, EXERCISE_GROUP_LABELS, EXERCISES_BY_GROUP } from "../lib/exercises";
import { createId } from "../lib/id";
import { format, parseDateKey, todayKey } from "../lib/dates";
import { loadExerciseLogs, saveExerciseLogs } from "../lib/storage";
import type { ExerciseGroupId, ExerciseLogEntry } from "../types";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

const labelClass = "block text-xs font-medium text-slate-600";

export function ExercisePage() {
  const [logs, setLogs] = useState<ExerciseLogEntry[]>(() => loadExerciseLogs());
  const [groupId, setGroupId] = useState<ExerciseGroupId>("push");
  const [exerciseName, setExerciseName] = useState<string>(() => EXERCISES_BY_GROUP.push[0]!);
  const [weightInput, setWeightInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const exerciseOptions = EXERCISES_BY_GROUP[groupId];

  const onGroupChange = useCallback((next: ExerciseGroupId) => {
    setGroupId(next);
    setExerciseName(EXERCISES_BY_GROUP[next][0] ?? "");
    setWeightInput("");
    setFormError(null);
  }, []);

  const onExerciseChange = useCallback((name: string) => {
    setExerciseName(name);
    setFormError(null);
  }, []);

  const pastForSelection = useMemo(() => {
    if (!exerciseName) return [];
    return logs
      .filter((l) => l.groupId === groupId && l.exerciseName === exerciseName)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [logs, groupId, exerciseName]);

  const logSet = useCallback(() => {
    setFormError(null);
    const trimmed = weightInput.trim();
    const parsed = trimmed === "" ? null : Number.parseFloat(trimmed.replace(",", "."));
    const isLegs = groupId === "legs";

    if (isLegs) {
      if (trimmed === "" || parsed === null || Number.isNaN(parsed) || parsed <= 0) {
        setFormError("Enter weight (kg) for leg exercises.");
        return;
      }
    } else if (trimmed !== "" && (parsed === null || Number.isNaN(parsed) || parsed < 0)) {
      setFormError("Weight must be a valid number.");
      return;
    }

    const weightKg =
      isLegs ? parsed! : trimmed === "" || parsed === null || Number.isNaN(parsed) ? null : parsed;

    const entry: ExerciseLogEntry = {
      id: createId(),
      date: todayKey(),
      groupId,
      exerciseName,
      weightKg,
    };
    const next = [...logs, entry];
    setLogs(next);
    saveExerciseLogs(next);
    if (isLegs) setWeightInput("");
  }, [weightInput, groupId, exerciseName, logs]);

  return (
    <div className="mx-auto max-w-4xl px-3 py-6 sm:px-4">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Exercise</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pick a group and lift, log weight (required for legs), and review past sets below.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-slate-900">Log a set</h2>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="ex-group" className={labelClass}>
                  Group
                </label>
                <select
                  id="ex-group"
                  className={inputClass}
                  value={groupId}
                  onChange={(e) => onGroupChange(e.target.value as ExerciseGroupId)}
                >
                  {EXERCISE_GROUP_IDS.map((id) => (
                    <option key={id} value={id}>
                      {EXERCISE_GROUP_LABELS[id]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label htmlFor="ex-name" className={labelClass}>
                  Exercise
                </label>
                <select
                  id="ex-name"
                  className={inputClass}
                  value={exerciseName}
                  onChange={(e) => onExerciseChange(e.target.value)}
                >
                  {exerciseOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="ex-weight" className={labelClass}>
                Weight (kg)
                {groupId === "legs" ? (
                  <span className="font-normal text-emerald-700"> — required for legs</span>
                ) : (
                  <span className="font-normal text-slate-400"> — optional</span>
                )}
              </label>
              <input
                id="ex-weight"
                type="number"
                min={0}
                step="0.5"
                inputMode="decimal"
                className={inputClass}
                placeholder={groupId === "legs" ? "e.g. 60" : "Optional"}
                value={weightInput}
                onChange={(e) => {
                  setWeightInput(e.target.value);
                  setFormError(null);
                }}
              />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <button
              type="button"
              onClick={() => void logSet()}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
            >
              Log set
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-slate-900">Past log</h2>
          <p className="mt-1 text-xs text-slate-500">
            History for <span className="font-medium text-slate-700">{exerciseName || "—"}</span> (
            {EXERCISE_GROUP_LABELS[groupId]}). Updates as you change the dropdowns or after you log.
          </p>
          {pastForSelection.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No entries yet for this exercise.</p>
          ) : (
            <ul className="mt-4 max-h-[min(24rem,50vh)] space-y-2 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/80 p-3">
              {pastForSelection.map((row) => (
                <li
                  key={row.id}
                  className="flex items-baseline justify-between gap-3 rounded-md border border-slate-100 bg-white px-3 py-2 text-sm"
                >
                  <span className="text-slate-600">
                    {format(parseDateKey(row.date), "MMM d, yyyy")}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-slate-900">
                    {row.weightKg != null ? `${row.weightKg} kg` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
