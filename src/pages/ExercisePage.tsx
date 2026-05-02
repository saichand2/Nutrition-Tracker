import { useCallback, useMemo, useState } from "react";
import { EXERCISE_GROUP_IDS, EXERCISE_GROUP_LABELS, EXERCISES_BY_GROUP } from "../lib/exercises";
import { eachDayOfInterval, endOfWeek, format, parseDateKey, startOfWeek, toDateKey, todayKey } from "../lib/dates";
import { useTracker } from "../context/TrackerContext";
import type { ExerciseGroupId } from "../types";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

const labelClass = "block text-xs font-medium text-slate-600";

export function ExercisePage() {
  const { exerciseLogs: logs, addExerciseLog, deleteExerciseLog } = useTracker();
  const [groupId, setGroupId] = useState<ExerciseGroupId>("push");
  const [exerciseName, setExerciseName] = useState<string>(() => EXERCISES_BY_GROUP.push[0]!);
  const [weightInput, setWeightInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const today = todayKey();
  const [selectedDate, setSelectedDate] = useState(today);

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

  const weekDays = useMemo(() => {
    const selected = parseDateKey(selectedDate);
    const start = startOfWeek(selected, { weekStartsOn: 0 });
    const end = endOfWeek(selected, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);
  const weekLabel = useMemo(
    () => `${format(weekDays[0]!, "MMM d")} - ${format(weekDays[6]!, "MMM d, yyyy")}`,
    [weekDays]
  );

  const logsForSelectedDay = useMemo(
    () => logs.filter((l) => l.date === selectedDate),
    [logs, selectedDate]
  );
  /** Three most recent logs for the selected group + exercise (newest first). */
  const recentSelectionLogs = useMemo(() => {
    return logs
      .filter((l) => l.groupId === groupId && l.exerciseName === exerciseName)
      .sort((a, b) => {
        const byDate = b.date.localeCompare(a.date);
        if (byDate !== 0) return byDate;
        return b.id.localeCompare(a.id);
      })
      .slice(0, 3);
  }, [logs, groupId, exerciseName]);
  const groupsByDate = useMemo(() => {
    const map = new Map<string, ExerciseGroupId[]>();
    for (const entry of logs) {
      const current = map.get(entry.date) ?? [];
      if (!current.includes(entry.groupId)) current.push(entry.groupId);
      map.set(entry.date, current);
    }
    return map;
  }, [logs]);

  const logSet = useCallback(async () => {
    setFormError(null);
    const trimmed = weightInput.trim();
    const parsed = trimmed === "" ? null : Number.parseFloat(trimmed.replace(",", "."));
    const isLegs = groupId === "legs";

    if (isLegs) {
      if (trimmed === "" || parsed === null || Number.isNaN(parsed) || parsed <= 0) {
        setFormError("Enter weight (lbs) for leg exercises.");
        return;
      }
    } else if (trimmed !== "" && (parsed === null || Number.isNaN(parsed) || parsed < 0)) {
      setFormError("Weight must be a valid number.");
      return;
    }

    const weightKg =
      isLegs ? parsed! : trimmed === "" || parsed === null || Number.isNaN(parsed) ? null : parsed;

    await addExerciseLog({
      date: today,
      groupId,
      exerciseName,
      weightKg,
    });
    if (isLegs) setWeightInput("");
  }, [weightInput, groupId, exerciseName, today, addExerciseLog]);

  const deleteLog = useCallback(
    (id: string) => {
      const target = logs.find((l) => l.id === id);
      if (!target) return;
      const ok = confirm(`Delete log for "${target.exerciseName}" on ${target.date}?`);
      if (!ok) return;
      void deleteExerciseLog(id);
    },
    [logs, deleteExerciseLog]
  );

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
                Weight (lbs)
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
                placeholder={groupId === "legs" ? "e.g. 135" : "Optional"}
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

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <p className="text-xs font-semibold text-slate-800">
                Last 3 logs · {exerciseName} ({EXERCISE_GROUP_LABELS[groupId]})
              </p>
              {recentSelectionLogs.length === 0 ? (
                <p className="mt-1 text-xs text-slate-600">No logs yet for this exercise.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {recentSelectionLogs.map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-600">{format(parseDateKey(row.date), "EEE, MMM d")}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium tabular-nums text-slate-900">
                          {row.weightKg != null ? `${row.weightKg} lbs` : "—"}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteLog(row.id)}
                          className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-slate-900">Past log</h2>
          <p className="mt-1 text-xs text-slate-500">
            Select a day in the week calendar to see all exercise logs for that day.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const d = parseDateKey(selectedDate);
                d.setDate(d.getDate() - 7);
                setSelectedDate(toDateKey(d));
              }}
              className="order-2 flex-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:order-1 sm:flex-none sm:py-1.5"
            >
              Previous week
            </button>
            <div className="order-1 flex w-full items-center justify-center gap-2 sm:order-2 sm:w-auto">
              <p className="text-xs font-medium text-slate-600">{weekLabel}</p>
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
              >
                Today
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                const d = parseDateKey(selectedDate);
                d.setDate(d.getDate() + 7);
                setSelectedDate(toDateKey(d));
              }}
              className="order-3 flex-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:flex-none sm:py-1.5"
            >
              Next week
            </button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-1">
            {weekDays.map((d) => {
              const key = toDateKey(d);
              const active = key === selectedDate;
              const isToday = key === today;
              const groups = groupsByDate.get(key) ?? [];
              const hasLogs = groups.length > 0;
              const groupsLabel =
                groups.length <= 2
                  ? groups.map((g) => EXERCISE_GROUP_LABELS[g]).join(", ")
                  : `${EXERCISE_GROUP_LABELS[groups[0]!]}, ${EXERCISE_GROUP_LABELS[groups[1]!]} +${
                      groups.length - 2
                    }`;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  className={`rounded-lg border px-1.5 py-2 text-center text-xs transition sm:px-1 ${
                    active
                      ? "border-emerald-400 bg-emerald-100 text-emerald-900"
                      : hasLogs
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="block uppercase">{format(d, "EEE")}</span>
                  <span className="block text-sm font-semibold">{format(d, "d")}</span>
                  <span className="block text-[10px]">{isToday ? "Today" : " "}</span>
                  <span className="block min-h-[10px] truncate text-[10px] leading-tight text-slate-500">
                    {groups.length > 0 ? groupsLabel : " "}
                  </span>
                </button>
              );
            })}
          </div>

          {logsForSelectedDay.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              No exercise logs for {format(parseDateKey(selectedDate), "MMM d, yyyy")}.
            </p>
          ) : (
            <ul className="mt-4 max-h-[min(24rem,50vh)] space-y-2 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/80 p-3">
              {logsForSelectedDay.map((row) => (
                <li key={row.id} className="rounded-md border border-slate-100 bg-white px-3 py-2 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{row.exerciseName}</p>
                    <p className="text-xs text-slate-500">
                      {EXERCISE_GROUP_LABELS[row.groupId]} · {format(parseDateKey(row.date), "EEE, MMM d, yyyy")}
                    </p>
                  </div>
                    <span className="shrink-0 font-medium tabular-nums text-slate-900">
                      {row.weightKg != null ? `${row.weightKg} lbs` : "—"}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => deleteLog(row.id)}
                      className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                    >
                      Delete log
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
