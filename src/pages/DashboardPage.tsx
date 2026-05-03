import { useCallback, useMemo, useRef, useState } from "react";
import { useTracker } from "../context/TrackerContext";
import { IntakeMacroGraphRow } from "../components/IntakeMacroGraphRow";
import { MacroFields } from "../components/MacroFields";
import { ProgressBar } from "../components/ProgressBar";
import { mealDisplayLabel } from "../lib/meal-display";
import { formatRemainingToGoal, sumMacros } from "../lib/macros";
import { format, parseDateKey, todayKey } from "../lib/dates";
import { hasAnyMacroValue, unrealisticMacroHints } from "../lib/validation";
import { emptyMacros, type LogEntry, type MacroTotals, type MealPeriodTag } from "../types";
import { computeStreak } from "../lib/streak";
import { MEAL_PERIOD_TAGS, MEAL_PERIOD_LABELS, MEAL_PERIOD_COLORS, groupEntriesByPeriod } from "../lib/meal-period";

const INTAKE_MACROS: { label: string; key: keyof MacroTotals; unit: string }[] = [
  { label: "Calories", key: "calories", unit: "kcal" },
  { label: "Protein", key: "protein", unit: "g" },
  { label: "Carbs", key: "carbs", unit: "g" },
  { label: "Fat", key: "fat", unit: "g" },
  { label: "Fiber", key: "fiber", unit: "g" },
];

function sortEntriesByMacro(entries: LogEntry[], key: keyof MacroTotals): LogEntry[] {
  return [...entries].sort((a, b) => b.nutrition[key] - a.nutrition[key]);
}

function sortEntriesForBreakdown(entries: LogEntry[], key: keyof MacroTotals): LogEntry[] {
  if (key === "calories") return [...entries];
  return sortEntriesByMacro(entries, key);
}

function remainingToneClass(remainingLabel: string): string {
  if (remainingLabel.includes("over")) return "text-amber-700";
  if (remainingLabel.includes("At goal")) return "text-emerald-600";
  if (remainingLabel === "Set a goal") return "text-slate-400";
  return "text-emerald-700";
}

export function DashboardPage() {
  const { entries, customMeals, goals, addEntry, updateEntry, deleteEntry, setGoals } = useTracker();
  const [mealName, setMealName] = useState("");
  const [selectedMealId, setSelectedMealId] = useState<string>("");
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [form, setForm] = useState<MacroTotals>(() => emptyMacros());
  const [mealPeriod, setMealPeriod] = useState<MealPeriodTag | "">("");
  const [goalsOpen, setGoalsOpen] = useState(true);
  const [breakdownKey, setBreakdownKey] = useState<keyof MacroTotals | null>(null);
  const [entriesListOpen, setEntriesListOpen] = useState(false);
  const [showOtherDay, setShowOtherDay] = useState(false);
  const [otherDay, setOtherDay] = useState(todayKey());

  // Inline edit state
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ mealName: string; nutrition: MacroTotals; mealPeriod?: MealPeriodTag } | null>(null);

  const addMealRef = useRef<HTMLElement>(null);

  const today = todayKey();
  const todayLabel = useMemo(() => format(parseDateKey(today), "EEEE, MMMM d, yyyy"), [today]);
  const todayEntries = useMemo(() => entries.filter((e) => e.date === today), [entries, today]);
  const totals = useMemo(() => sumMacros(todayEntries), [todayEntries]);
  const streak = useMemo(() => computeStreak(entries), [entries]);
  const groupedTodayEntries = useMemo(() => groupEntriesByPeriod(todayEntries), [todayEntries]);

  const resetAddForm = () => {
    setMealName("");
    setSelectedMealId("");
    setServingMultiplier(1);
    setForm(emptyMacros());
    setMealPeriod("");
    setShowOtherDay(false);
  };

  const applyCustomMeal = (id: string) => {
    setSelectedMealId(id);
    if (!id) { resetAddForm(); return; }
    const m = customMeals.find((x) => x.id === id);
    if (m) {
      setMealName(m.name);
      setServingMultiplier(1);
      setForm({ calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat, fiber: m.fiber });
    }
  };

  const applyMultiplier = (factor: number) => {
    if (!selectedMealId) return;
    const m = customMeals.find((x) => x.id === selectedMealId);
    if (!m) return;
    setServingMultiplier(factor);
    setForm({
      calories: Math.round(m.calories * factor * 10) / 10,
      protein: Math.round(m.protein * factor * 10) / 10,
      carbs: Math.round(m.carbs * factor * 10) / 10,
      fat: Math.round(m.fat * factor * 10) / 10,
      fiber: Math.round(m.fiber * factor * 10) / 10,
    });
  };

  const buildMealName = () => {
    const baseName = mealName.trim() || "Meal";
    return selectedMealId && servingMultiplier !== 1 ? `${baseName} (${servingMultiplier}× serving)` : baseName;
  };

  const handleAdd = async () => {
    if (!hasAnyMacroValue(form)) return;
    try {
      await addEntry({ date: today, mealName: buildMealName(), nutrition: { ...form }, customMealId: selectedMealId || undefined, mealPeriod: mealPeriod || undefined });
    } finally {
      resetAddForm();
    }
  };

  const handleAddToOtherDay = async () => {
    if (!hasAnyMacroValue(form) || !otherDay) return;
    try {
      await addEntry({ date: otherDay, mealName: buildMealName(), nutrition: { ...form }, customMealId: selectedMealId || undefined, mealPeriod: mealPeriod || undefined });
    } finally {
      resetAddForm();
    }
  };

  const prefillFromEntry = useCallback((e: LogEntry) => {
    setMealName(e.mealName);
    setForm({ ...e.nutrition });
    setSelectedMealId(e.customMealId ?? "");
    setServingMultiplier(1);
    setMealPeriod(e.mealPeriod ?? "");
    setEntriesListOpen(false);
    addMealRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const startEditEntry = (e: LogEntry) => {
    setEditingEntryId(e.id);
    setEditDraft({ mealName: e.mealName, nutrition: { ...e.nutrition }, mealPeriod: e.mealPeriod });
  };

  const saveEditEntry = async () => {
    if (!editingEntryId || !editDraft || !hasAnyMacroValue(editDraft.nutrition)) return;
    await updateEntry(editingEntryId, { mealName: editDraft.mealName, nutrition: editDraft.nutrition, mealPeriod: editDraft.mealPeriod });
    setEditingEntryId(null);
    setEditDraft(null);
  };

  const cancelEditEntry = () => { setEditingEntryId(null); setEditDraft(null); };

  const mealHints = unrealisticMacroHints(form);
  const canAdd = hasAnyMacroValue(form);

  const renderIntakeMacroButton = (meta: (typeof INTAKE_MACROS)[number]) => {
    const { label, key, unit } = meta;
    const val = totals[key];
    const goalVal = goals[key];
    const open = breakdownKey === key;
    const remainingLabel = formatRemainingToGoal(val, goalVal, unit);
    return (
      <IntakeMacroGraphRow
        label={label} unit={unit} current={val} goal={goalVal} selected={open}
        remainingLabel={remainingLabel} remainingToneClass={remainingToneClass(remainingLabel)}
        onToggle={() => { setEntriesListOpen(false); setBreakdownKey((k) => (k === key ? null : key)); }}
      />
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-5 sm:space-y-8 sm:py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">Log meals for today, set goals, and see your progress at a glance.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-emerald-800">
            Today: <time dateTime={today}>{todayLabel}</time>
          </p>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
              🔥 {streak} day{streak !== 1 ? "s" : ""} streak
            </span>
          )}
          {streak === 0 && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500">
              Start your streak today!
            </span>
          )}
        </div>
      </header>

      {/* Today's intake */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Today&apos;s intake</h2>
          <button
            type="button"
            onClick={() => { setBreakdownKey(null); setEntriesListOpen((v) => !v); }}
            aria-expanded={entriesListOpen}
            className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {todayEntries.length} {todayEntries.length === 1 ? "entry" : "entries"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Bar graph</span> — each row is logged vs goal. Colors: orange under 50%, amber 50–85%, green 85–100%, red over goal. Tap the entry count or a bar for meal breakdown.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5" role="group" aria-label="Today macro totals">
          {INTAKE_MACROS.map((meta) => (
            <div key={meta.key} className={`min-w-0 ${meta.key === "calories" ? "col-span-2 md:col-span-5" : ""}`}>
              {renderIntakeMacroButton(meta)}
            </div>
          ))}
        </div>

        {entriesListOpen && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-left" role="region" aria-label="Today's logged entries">
            <p className="text-sm font-semibold text-slate-800">Today&apos;s entries</p>
            <p className="mt-1 text-xs text-slate-600">Grouped by meal period. Tap &quot;Log again&quot; to pre-fill the form below.</p>
            {todayEntries.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No meals logged yet.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {[...groupedTodayEntries.entries()].map(([period, periodEntries]) => (
                  <div key={period}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {period === "untagged" ? "Untagged" : MEAL_PERIOD_LABELS[period as MealPeriodTag]}
                    </p>
                    <ul className="divide-y divide-emerald-200/70">
                      {periodEntries.map((e) => {
                        const n = e.nutrition;
                        const r = (x: number) => Math.round(x * 10) / 10;
                        if (editingEntryId === e.id && editDraft) {
                          return (
                            <li key={e.id} className="py-3 space-y-2">
                              <input
                                type="text"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                value={editDraft.mealName}
                                onChange={(ev) => setEditDraft({ ...editDraft, mealName: ev.target.value })}
                              />
                              <select
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                                value={editDraft.mealPeriod ?? ""}
                                onChange={(ev) => setEditDraft({ ...editDraft, mealPeriod: ev.target.value as MealPeriodTag || undefined })}
                              >
                                <option value="">— No period —</option>
                                {MEAL_PERIOD_TAGS.map((t) => <option key={t} value={t}>{MEAL_PERIOD_LABELS[t]}</option>)}
                              </select>
                              <MacroFields values={editDraft.nutrition} onChange={(n) => setEditDraft({ ...editDraft, nutrition: n })} idPrefix={`dedit-${e.id}`} />
                              <div className="flex gap-2">
                                <button type="button" onClick={() => void saveEditEntry()} disabled={!hasAnyMacroValue(editDraft.nutrition)} className="min-h-11 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-emerald-300">Save</button>
                                <button type="button" onClick={cancelEditEntry} className="min-h-11 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                              </div>
                            </li>
                          );
                        }
                        return (
                          <li key={e.id} className="py-3 first:pt-0 last:pb-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="font-medium text-slate-900">{mealDisplayLabel(e, customMeals)}</p>
                                  {e.mealPeriod && (
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${MEAL_PERIOD_COLORS[e.mealPeriod]}`}>
                                      {MEAL_PERIOD_LABELS[e.mealPeriod]}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-sm tabular-nums text-slate-600">
                                  {r(n.calories)} kcal · P {r(n.protein)}g · C {r(n.carbs)}g · F {r(n.fat)}g · Fiber {r(n.fiber)}g
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-wrap gap-1">
                                <button type="button" onClick={() => prefillFromEntry(e)} className="min-h-9 rounded-md px-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50">Log again</button>
                                <button type="button" onClick={() => startEditEntry(e)} className="min-h-9 rounded-md px-2 text-xs font-medium text-slate-600 hover:bg-slate-100">Edit</button>
                                <button type="button" onClick={() => { if (confirm("Remove this meal?")) void deleteEntry(e.id); }} className="min-h-9 rounded-md px-2 text-xs font-medium text-rose-600 hover:bg-rose-50">Delete</button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {breakdownKey !== null && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-left" role="region" aria-label={`${INTAKE_MACROS.find((m) => m.key === breakdownKey)?.label ?? ""} breakdown`}>
            <p className="text-sm font-semibold text-slate-800">{INTAKE_MACROS.find((m) => m.key === breakdownKey)?.label} from today&apos;s meals</p>
            {todayEntries.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No meals logged yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-emerald-200/70">
                {sortEntriesForBreakdown(todayEntries, breakdownKey).map((e) => {
                  const v = e.nutrition[breakdownKey];
                  const unit = INTAKE_MACROS.find((m) => m.key === breakdownKey)?.unit ?? "";
                  return (
                    <li key={e.id} className="flex justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                      <span className="min-w-0 font-medium text-slate-800">{mealDisplayLabel(e, customMeals)}</span>
                      <span className="shrink-0 tabular-nums text-slate-700">{Math.round(v * 10) / 10} {unit}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-500">Tap the row again to close.</p>
          </div>
        )}
      </section>

      {/* Add a meal */}
      <section ref={addMealRef} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Add a meal</h2>
        <p className="mt-1 text-sm text-slate-600">Pick a saved meal to fill macros automatically, or enter values manually.</p>
        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Saved meal</span>
            <select className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" value={selectedMealId} onChange={(e) => applyCustomMeal(e.target.value)}>
              <option value="">— Manual entry —</option>
              {customMeals.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>

          {selectedMealId && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-600">Serving size</p>
              <div className="grid grid-cols-2 gap-2">
                {[0.5, 1, 1.5, 2].map((factor) => (
                  <button key={factor} type="button" onClick={() => applyMultiplier(factor)} className={`min-h-11 rounded-full px-3 py-2 text-sm font-medium ${servingMultiplier === factor ? "bg-emerald-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                    {factor}x
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Meal name</span>
              <input type="text" placeholder="e.g. Breakfast, Snack" className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" value={mealName} onChange={(e) => setMealName(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Meal period</span>
              <select className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" value={mealPeriod} onChange={(e) => setMealPeriod(e.target.value as MealPeriodTag | "")}>
                <option value="">— Optional —</option>
                {MEAL_PERIOD_TAGS.map((t) => <option key={t} value={t}>{MEAL_PERIOD_LABELS[t]}</option>)}
              </select>
            </label>
          </div>

          <MacroFields values={form} onChange={setForm} idPrefix="dash" />

          {!canAdd && <p className="text-xs text-amber-700">Add at least one macro value before saving.</p>}
          {mealHints.length > 0 && (
            <ul className="space-y-1 text-xs text-amber-700">
              {mealHints.map((hint) => <li key={hint}>- {hint}</li>)}
            </ul>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => void handleAdd()} disabled={!canAdd} className="min-h-11 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-300">
              Add to today&apos;s log
            </button>
            <button type="button" onClick={() => setShowOtherDay((v) => !v)} disabled={!canAdd} className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400">
              Add to another day
            </button>
            {showOtherDay && (
              <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                <label className="text-sm font-medium text-slate-600">Select date</label>
                <input type="date" value={otherDay} max={todayKey()} onChange={(e) => setOtherDay(e.target.value)} className="min-h-11 w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => void handleAddToOtherDay()} disabled={!otherDay} className="min-h-11 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300">
                    Log for {otherDay}
                  </button>
                  <button type="button" onClick={() => setShowOtherDay(false)} className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Goals & progress */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <button type="button" onClick={() => setGoalsOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
          <h2 className="text-lg font-semibold text-slate-900">Goals &amp; progress</h2>
          <span className="text-slate-400">{goalsOpen ? "▼" : "▶"}</span>
        </button>
        <p className="mt-1 text-sm text-slate-600">Daily targets. Progress compares your logged totals for today against these goals.</p>
        {goalsOpen && (
          <>
            <div className="mt-4">
              <MacroFields values={goals} onChange={(g) => void setGoals(g)} idPrefix="goal" />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-5">
              <div className="col-span-2 md:col-span-1">
                <ProgressBar label="Calories" current={totals.calories} goal={goals.calories} unit="kcal" />
              </div>
              <ProgressBar label="Protein" current={totals.protein} goal={goals.protein} unit="g" color="bg-sky-500" />
              <ProgressBar label="Carbs" current={totals.carbs} goal={goals.carbs} unit="g" color="bg-amber-500" />
              <ProgressBar label="Fat" current={totals.fat} goal={goals.fat} unit="g" color="bg-rose-400" />
              <ProgressBar label="Fiber" current={totals.fiber} goal={goals.fiber} unit="g" color="bg-violet-500" />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
