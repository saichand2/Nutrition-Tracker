import { useMemo, useState } from "react";
import { useTracker } from "../context/TrackerContext";
import { MacroFields } from "../components/MacroFields";
import { ProgressBar } from "../components/ProgressBar";
import { formatRemainingToGoal, sumMacros } from "../lib/macros";
import { todayKey } from "../lib/dates";
import { hasAnyMacroValue, unrealisticMacroHints } from "../lib/validation";
import { emptyMacros, type LogEntry, type MacroTotals } from "../types";

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

function remainingToneClass(remainingLabel: string): string {
  if (remainingLabel.includes("over")) return "text-amber-700";
  if (remainingLabel.includes("At goal")) return "text-emerald-600";
  if (remainingLabel === "Set a goal") return "text-slate-400";
  return "text-emerald-700";
}

export function DashboardPage() {
  const { entries, customMeals, goals, addEntry, setGoals } = useTracker();
  const [mealName, setMealName] = useState("");
  const [selectedMealId, setSelectedMealId] = useState<string>("");
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [form, setForm] = useState<MacroTotals>(() => emptyMacros());
  const [goalsOpen, setGoalsOpen] = useState(true);
  const [breakdownKey, setBreakdownKey] = useState<keyof MacroTotals | null>(null);

  const today = todayKey();
  const todayEntries = useMemo(
    () => entries.filter((e) => e.date === today),
    [entries, today]
  );
  const totals = useMemo(() => sumMacros(todayEntries), [todayEntries]);

  const applyCustomMeal = (id: string) => {
    setSelectedMealId(id);
    if (!id) {
      setMealName("");
      setServingMultiplier(1);
      setForm(emptyMacros());
      return;
    }
    const m = customMeals.find((x) => x.id === id);
    if (m) {
      setMealName(m.name);
      setServingMultiplier(1);
      setForm({
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        fiber: m.fiber,
      });
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

  const handleAdd = async () => {
    const hasData = hasAnyMacroValue(form);
    if (!hasData) return;
    await addEntry({
      date: today,
      mealName: mealName.trim() || "Meal",
      nutrition: { ...form },
      customMealId: selectedMealId || undefined,
    });
    setMealName("");
    setSelectedMealId("");
    setServingMultiplier(1);
    setForm(emptyMacros());
  };

  const mealHints = unrealisticMacroHints(form);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-5 sm:space-y-8 sm:py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Log meals for today, set goals, and see your progress at a glance.
        </p>
        <p className="mt-2 text-sm font-medium text-emerald-800">
          Today: <time dateTime={today}>{today}</time>
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Today&apos;s intake</h2>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
            {todayEntries.length} {todayEntries.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Logged totals vs your daily goals. Tap a macro for a per-meal breakdown.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3" role="group" aria-label="Today macro totals">
          {INTAKE_MACROS.map(({ label, key, unit }, idx) => {
            const val = totals[key];
            const goalVal = goals[key];
            const open = breakdownKey === key;
            const remainingLabel = formatRemainingToGoal(val, goalVal, unit);
            return (
              <div
                key={key}
                className={`min-w-0 sm:col-span-1 ${idx === 4 ? "col-span-2 sm:col-span-1" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setBreakdownKey((k) => (k === key ? null : key))}
                  aria-pressed={open}
                  className={`w-full rounded-xl border-2 px-2 py-2 text-center shadow-sm ring-1 transition sm:px-4 sm:py-3 ${
                    open
                      ? "border-emerald-500 bg-emerald-50/90 ring-emerald-300"
                      : "border-slate-300 bg-white ring-slate-200/90 hover:border-slate-400 hover:bg-slate-50/80"
                  }`}
                >
                  <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold tabular-nums text-slate-900 sm:mt-1 sm:text-xl">
                    {Math.round(val * 10) / 10}
                    <span className="font-normal text-slate-500 sm:text-sm">{" "}{unit}</span>
                  </span>
                  <span
                    className={`mt-1 block text-[10px] font-semibold leading-tight sm:text-xs ${remainingToneClass(remainingLabel)}`}
                  >
                    {remainingLabel}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {breakdownKey !== null && (
          <div
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-left"
            role="region"
            aria-label={`${INTAKE_MACROS.find((m) => m.key === breakdownKey)?.label ?? ""} breakdown`}
          >
            <p className="text-sm font-semibold text-slate-800">
              {INTAKE_MACROS.find((m) => m.key === breakdownKey)?.label} from today&apos;s meals
            </p>
            {todayEntries.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No meals logged yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-emerald-200/70">
                {sortEntriesByMacro(todayEntries, breakdownKey).map((e) => {
                  const v = e.nutrition[breakdownKey];
                  const unit = INTAKE_MACROS.find((m) => m.key === breakdownKey)?.unit ?? "";
                  return (
                    <li key={e.id} className="flex justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                      <span className="min-w-0 font-medium text-slate-800">{e.mealName}</span>
                      <span className="shrink-0 tabular-nums text-slate-700">
                        {Math.round(v * 10) / 10} {unit}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-500">Tap the tile again to close.</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Add a meal</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pick a saved meal to fill macros automatically, or enter values manually.
        </p>

        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Saved meal</span>
            <select
              className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={selectedMealId}
              onChange={(e) => applyCustomMeal(e.target.value)}
            >
              <option value="">— Manual entry —</option>
              {customMeals.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          {selectedMealId && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-600">Serving size</p>
              <div className="grid grid-cols-2 gap-2">
                {[0.5, 1, 1.5, 2].map((factor) => (
                  <button
                    key={factor}
                    type="button"
                    onClick={() => applyMultiplier(factor)}
                    className={`min-h-11 rounded-full px-3 py-2 text-sm font-medium ${
                      servingMultiplier === factor
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {factor}x
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Meal name</span>
            <input
              type="text"
              placeholder="e.g. Breakfast, Snack"
              className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
            />
          </label>

          <MacroFields values={form} onChange={setForm} idPrefix="dash" />

          {!hasAnyMacroValue(form) && (
            <p className="text-xs text-amber-700">Add at least one macro value before saving.</p>
          )}
          {mealHints.length > 0 && (
            <ul className="space-y-1 text-xs text-amber-700">
              {mealHints.map((hint) => (
                <li key={hint}>- {hint}</li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={!hasAnyMacroValue(form)}
            className="min-h-11 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            Add to today&apos;s log
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={() => setGoalsOpen((o) => !o)}
          className="flex w-full items-center justify-between text-left"
        >
          <h2 className="text-lg font-semibold text-slate-900">Goals &amp; progress</h2>
          <span className="text-slate-400">{goalsOpen ? "▼" : "▶"}</span>
        </button>
        <p className="mt-1 text-sm text-slate-600">
          Daily targets. Progress compares your logged totals for today against these goals.
        </p>

        {goalsOpen && (
          <>
            <div className="mt-4">
              <MacroFields
                values={goals}
                onChange={(g) => void setGoals(g)}
                idPrefix="goal"
              />
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
