import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseDateKey,
  startOfMonth,
  startOfWeek,
  subMonths,
  toDateKey,
} from "../lib/dates";
import { useTracker } from "../context/TrackerContext";
import { allGoalsHitAbove95Percent, sumMacros } from "../lib/macros";
import { MacroFields } from "../components/MacroFields";
import type { LogEntry, MacroTotals } from "../types";
import { emptyMacros } from "../types";
import { hasAnyMacroValue, unrealisticMacroHints } from "../lib/validation";

function DayModal({
  dateKey,
  onClose,
}: {
  dateKey: string;
  onClose: () => void;
}) {
  const { entries, goals, addEntry, updateEntry, deleteEntry } = useTracker();
  const dayEntries = useMemo(
    () => entries.filter((e) => e.date === dateKey).sort((a, b) => a.id.localeCompare(b.id)),
    [entries, dateKey]
  );
  const totals = useMemo(() => sumMacros(dayEntries), [dayEntries]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ mealName: string; nutrition: MacroTotals } | null>(null);
  const [newMealName, setNewMealName] = useState("");
  const [newNutrition, setNewNutrition] = useState<MacroTotals>(() => emptyMacros());

  const startEdit = (e: LogEntry) => {
    setEditingId(e.id);
    setDraft({ mealName: e.mealName, nutrition: { ...e.nutrition } });
  };

  const saveEdit = async () => {
    if (!editingId || !draft || !hasAnyMacroValue(draft.nutrition)) return;
    await updateEntry(editingId, { mealName: draft.mealName, nutrition: draft.nutrition });
    setEditingId(null);
    setDraft(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const addMealForSelectedDay = async () => {
    if (!hasAnyMacroValue(newNutrition)) return;
    await addEntry({
      date: dateKey,
      mealName: newMealName.trim() || "Meal",
      nutrition: { ...newNutrition },
    });
    setNewMealName("");
    setNewNutrition(emptyMacros());
  };

  const pretty = format(parseDateKey(dateKey), "EEEE, MMMM d, yyyy");
  const goalsMet95 = allGoalsHitAbove95Percent(totals, goals);
  const canAddNew = hasAnyMacroValue(newNutrition);
  const canSaveEdit = draft ? hasAnyMacroValue(draft.nutrition) : false;
  const newEntryHints = unrealisticMacroHints(newNutrition);
  const editHints = draft ? unrealisticMacroHints(draft.nutrition) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-2 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 sm:px-5 sm:py-4">
          <h2 id="day-modal-title" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            {pretty}
            {goalsMet95 && (
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white"
                title="All goals above 95%"
                aria-label="All daily goals above 95 percent"
              >
                ✓
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 p-3 sm:p-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-slate-600">Day totals</h3>
              {goalsMet95 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                  All goals &gt;95%
                </span>
              )}
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">Calories</dt>
                <dd className="font-semibold tabular-nums text-slate-900">{Math.round(totals.calories * 10) / 10}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Protein</dt>
                <dd className="font-semibold tabular-nums text-slate-900">{Math.round(totals.protein * 10) / 10} g</dd>
              </div>
              <div>
                <dt className="text-slate-500">Carbs</dt>
                <dd className="font-semibold tabular-nums text-slate-900">{Math.round(totals.carbs * 10) / 10} g</dd>
              </div>
              <div>
                <dt className="text-slate-500">Fat</dt>
                <dd className="font-semibold tabular-nums text-slate-900">{Math.round(totals.fat * 10) / 10} g</dd>
              </div>
              <div>
                <dt className="text-slate-500">Fiber</dt>
                <dd className="font-semibold tabular-nums text-slate-900">{Math.round(totals.fiber * 10) / 10} g</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-medium text-slate-700">Add meal for this day</h3>
            <p className="mt-1 text-xs text-slate-500">This saves a new log entry for {dateKey}.</p>
            <div className="mt-3 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-600">Meal name</span>
                <input
                  type="text"
                  className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-3"
                  placeholder="e.g. Lunch"
                  value={newMealName}
                  onChange={(ev) => setNewMealName(ev.target.value)}
                />
              </label>
              <MacroFields values={newNutrition} onChange={setNewNutrition} idPrefix={`new-${dateKey}`} />
              {!canAddNew && <p className="text-xs text-amber-700">Add at least one macro value before saving.</p>}
              {newEntryHints.length > 0 && (
                <ul className="space-y-1 text-xs text-amber-700">
                  {newEntryHints.map((hint) => (
                    <li key={hint}>- {hint}</li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={addMealForSelectedDay}
                disabled={!canAddNew}
                className="min-h-11 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                Add meal
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700">Meals logged</h3>
            {dayEntries.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No meals for this day.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {dayEntries.map((e) => (
                  <li key={e.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    {editingId === e.id && draft ? (
                      <div className="space-y-3">
                        <label className="block text-sm">
                          <span className="mb-1 block font-medium text-slate-600">Meal name</span>
                          <input
                            type="text"
                            className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-3"
                            value={draft.mealName}
                            onChange={(ev) => setDraft({ ...draft, mealName: ev.target.value })}
                          />
                        </label>
                        <MacroFields
                          values={draft.nutrition}
                          onChange={(n) => setDraft({ ...draft, nutrition: n })}
                          idPrefix={`edit-${e.id}`}
                        />
                        {!canSaveEdit && (
                          <p className="text-xs text-amber-700">Add at least one macro value before saving.</p>
                        )}
                        {editHints.length > 0 && (
                          <ul className="space-y-1 text-xs text-amber-700">
                            {editHints.map((hint) => (
                              <li key={hint}>- {hint}</li>
                            ))}
                          </ul>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={!canSaveEdit}
                            className="min-h-11 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="min-h-11 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-medium text-slate-900">{e.mealName}</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(e)}
                              className="min-h-11 rounded-md px-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Remove this meal from the log?")) void deleteEntry(e.id);
                              }}
                              className="min-h-11 rounded-md px-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {Math.round(e.nutrition.calories * 10) / 10} kcal · P{" "}
                          {Math.round(e.nutrition.protein * 10) / 10} · C {Math.round(e.nutrition.carbs * 10) / 10}
                          · F {Math.round(e.nutrition.fat * 10) / 10} · Fiber{" "}
                          {Math.round(e.nutrition.fiber * 10) / 10}
                        </p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarPage() {
  const { entries, goals } = useTracker();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<string | null>(null);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const caloriesByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const c = e.nutrition.calories;
      map.set(e.date, (map.get(e.date) ?? 0) + c);
    }
    return map;
  }, [entries]);

  const totalsByDate = useMemo(() => {
    const map = new Map<string, MacroTotals>();
    for (const e of entries) {
      const t = map.get(e.date) ?? emptyMacros();
      map.set(e.date, {
        calories: t.calories + e.nutrition.calories,
        protein: t.protein + e.nutrition.protein,
        carbs: t.carbs + e.nutrition.carbs,
        fat: t.fat + e.nutrition.fat,
        fiber: t.fiber + e.nutrition.fiber,
      });
    }
    return map;
  }, [entries]);

  const maxCal = useMemo(() => {
    let m = 1;
    for (const v of caloriesByDate.values()) if (v > m) m = v;
    return m;
  }, [caloriesByDate]);

  const heat = (cal: number) => {
    if (cal <= 0) return "bg-slate-50";
    const t = Math.min(1, cal / maxCal);
    if (t < 0.25) return "bg-emerald-100";
    if (t < 0.5) return "bg-emerald-200";
    if (t < 0.75) return "bg-emerald-400 text-white";
    return "bg-emerald-600 text-white";
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-5 sm:py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Calendar</h1>
        <p className="mt-1 text-slate-600">
          Tap a day to see calories, protein, carbs, fat, and fiber. You can edit or delete logged meals for any date.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setCursor((c) => subMonths(c, 1))}
          className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Prev
        </button>
        <h2 className="text-lg font-semibold text-slate-900">{format(cursor, "MMMM yyyy")}</h2>
        <button
          type="button"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Next →
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const key = toDateKey(d);
            const inMonth = isSameMonth(d, cursor);
            const cal = caloriesByDate.get(key) ?? 0;
            const dayTotals = totalsByDate.get(key) ?? emptyMacros();
            const goalsTick = inMonth && allGoalsHitAbove95Percent(dayTotals, goals);
            const isTodayCell = isSameDay(d, new Date());
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={`relative flex min-h-[4.5rem] flex-col items-center justify-center rounded-lg border p-1 text-sm transition hover:ring-2 hover:ring-emerald-400/50 ${
                  inMonth ? heat(cal) : "bg-slate-100/80 text-slate-400"
                } ${isTodayCell ? "ring-2 ring-emerald-600" : "border-transparent"}`}
              >
                {goalsTick && (
                  <span
                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold leading-none text-white shadow-sm"
                    title="All goals above 95%"
                    aria-hidden
                  >
                    ✓
                  </span>
                )}
                <span className="font-medium">{format(d, "d")}</span>
                {inMonth && cal > 0 && (
                  <span className="mt-0.5 text-[10px] font-medium opacity-90">{Math.round(cal)} kcal</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Darker green = higher calories that month. Ring highlights today. Green ✓ means logged intake is above 95%
          of every goal set on the Dashboard.
        </p>
      </div>

      {selected && <DayModal dateKey={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
