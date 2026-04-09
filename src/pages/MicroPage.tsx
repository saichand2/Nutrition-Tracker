import { useMemo, useState } from "react";
import { useTracker } from "../context/TrackerContext";
import { format, parseDateKey } from "../lib/dates";
import {
  analyzeMicroPeriodFromMeals,
  type MicroEstimateRow,
  type MicroEstimateStatus,
  type MicroPeriodAnalysis,
} from "../lib/micro-period-analyze";
import { ESSENTIAL_NUTRIENT_REFERENCE_SECTIONS } from "../lib/essential-nutrients-reference";
import { getMealsInRollingWindow, type MealPeriod, type PeriodMealLine, type PeriodMealsSnapshot } from "../lib/period-meals";

function fmtMacro(n: number): string {
  const r = Math.round(n * 10) / 10;
  return r % 1 === 0 ? String(r) : r.toFixed(1);
}

function mealRowDateLabel(dateKey: string): string {
  try {
    return format(parseDateKey(dateKey), "EEE, MMM d");
  } catch {
    return dateKey;
  }
}

function MealsTable({ meals }: { meals: PeriodMealLine[] }) {
  if (meals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-600">
        No meals logged in this date range.
      </div>
    );
  }

  return (
    <div className="max-h-[min(28rem,60vh)] overflow-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Meal</th>
            <th className="px-3 py-2 text-right">kcal</th>
            <th className="px-3 py-2 text-right">P</th>
            <th className="px-3 py-2 text-right">C</th>
            <th className="px-3 py-2 text-right">F</th>
            <th className="px-3 py-2 text-right">Fiber</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {meals.map((m) => (
            <tr key={m.id}>
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">{mealRowDateLabel(m.date)}</td>
              <td className="max-w-[12rem] truncate px-3 py-2 font-medium text-slate-900 sm:max-w-none sm:whitespace-normal">
                {m.mealName}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800">
                {Math.round(m.nutrition.calories)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-600">{fmtMacro(m.nutrition.protein)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-600">{fmtMacro(m.nutrition.carbs)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-600">{fmtMacro(m.nutrition.fat)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-600">{fmtMacro(m.nutrition.fiber)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function rowStatusClass(s: MicroEstimateStatus): string {
  switch (s) {
    case "likely_adequate":
      return "bg-emerald-100 text-emerald-900";
    case "possibly_low":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function overallClass(o: MicroPeriodAnalysis["overall"]): string {
  switch (o) {
    case "likely_adequate":
      return "border-emerald-200 bg-emerald-50/90 text-emerald-950";
    case "possibly_inadequate":
      return "border-amber-200 bg-amber-50/90 text-amber-950";
    default:
      return "border-slate-200 bg-slate-50 text-slate-800";
  }
}

function MicroNutrientSection({ title, rows }: { title: string; rows: MicroEstimateRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <ul className="mt-2 space-y-2">
        {rows.map((r, i) => (
          <li key={`${r.name}-${i}`} className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-900">{r.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${rowStatusClass(r.status)}`}>
                {r.status.replaceAll("_", " ")}
              </span>
            </div>
            {r.note ? <p className="mt-1 text-xs leading-relaxed text-slate-600">{r.note}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MicroAnalysisPanel({ analysis }: { analysis: MicroPeriodAnalysis }) {
  return (
    <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Nutrient estimate (AI)</h3>
      <p className="mt-1 text-xs text-slate-600">
        Uses the essential-nutrient reference on this page. Logged macros vs scaled targets; vitamins/minerals inferred from names — not lab data. Not medical advice.
      </p>
      <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${overallClass(analysis.overall)}`}>
        <span className="font-semibold">Overall (this period): </span>
        <span className="capitalize">{analysis.overall.replaceAll("_", " ")}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">{analysis.summary}</p>
      <MicroNutrientSection title="Macronutrients (vs reference for this window)" rows={analysis.macros} />
      <MicroNutrientSection title="Vitamins" rows={analysis.vitamins} />
      <MicroNutrientSection title="Minerals" rows={analysis.minerals} />
      <MicroNutrientSection title="Other (e.g. omega-3, water)" rows={analysis.other} />
      {analysis.caveats.length > 0 ? (
        <div className="mt-4 border-t border-violet-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Caveats</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-600">
            {analysis.caveats.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function EssentialNutrientsReference() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Essential nutrient targets</h2>
      <p className="mt-1 text-sm text-slate-600">
        Daily → weekly → monthly bands used by <span className="font-medium text-slate-800">Analyze micronutrients (AI)</span>. Educational only; not tailored to you without a clinician.
      </p>
      <div className="mt-4 space-y-2">
        {ESSENTIAL_NUTRIENT_REFERENCE_SECTIONS.map((sec) => (
          <details
            key={sec.id}
            className="group rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 open:bg-white open:pb-3 open:shadow-sm"
          >
            <summary className="cursor-pointer list-none py-1 text-sm font-medium text-slate-900 marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="inline-flex w-full items-center justify-between gap-2">
                {sec.title}
                <span className="text-xs font-normal text-slate-400 group-open:rotate-180">▼</span>
              </span>
            </summary>
            <ul className="mt-2 space-y-2 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
              {sec.lines.map((line, i) => (
                <li key={i} className="pl-1">
                  {line}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}

function PeriodTotalsBar({ snapshot }: { snapshot: PeriodMealsSnapshot }) {
  const meals = snapshot.loggedMeals;
  const totals = snapshot.totals;
  if (meals.length === 0) return null;
  return (
    <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
      <span className="font-semibold">Period total</span> ({meals.length} {meals.length === 1 ? "meal" : "meals"}):{" "}
      <span className="tabular-nums">{Math.round(totals.calories)}</span> kcal · P{" "}
      <span className="tabular-nums">{fmtMacro(totals.protein)}</span> · C{" "}
      <span className="tabular-nums">{fmtMacro(totals.carbs)}</span> · F{" "}
      <span className="tabular-nums">{fmtMacro(totals.fat)}</span> · Fiber{" "}
      <span className="tabular-nums">{fmtMacro(totals.fiber)}</span> g
    </p>
  );
}

export function MicroPage() {
  const { entries } = useTracker();
  const [period, setPeriod] = useState<MealPeriod>("7d");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<MicroPeriodAnalysis | null>(null);

  const snapshot = useMemo(() => getMealsInRollingWindow(entries, period), [entries, period]);

  const rangeTitle = period === "7d" ? "Past 7 days" : "Past 30 days";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-5 sm:space-y-8 sm:py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Micro</h1>
        <p className="mt-1 text-slate-600">
          All logged meals in a rolling window ending today. Targets below define what “micro” means for AI analysis.
        </p>
      </header>

      <EssentialNutrientsReference />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{rangeTitle}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              <span className="font-mono text-slate-700">{snapshot.firstDay}</span>
              {" → "}
              <span className="font-mono text-slate-700">{snapshot.lastDay}</span>
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => {
                setPeriod("7d");
                setAiError(null);
                setAiResult(null);
              }}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                period === "7d" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Last 7 days
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod("30d");
                setAiError(null);
                setAiResult(null);
              }}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                period === "30d" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Last 30 days
            </button>
          </div>
        </div>

        <div className="mt-6">
          <MealsTable meals={snapshot.loggedMeals} />
          <PeriodTotalsBar snapshot={snapshot} />

          <div className="mt-4 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={aiLoading || snapshot.loggedMeals.length === 0}
              onClick={async () => {
                if (snapshot.loggedMeals.length === 0) return;
                setAiLoading(true);
                setAiError(null);
                setAiResult(null);
                try {
                  const label = period === "7d" ? "Past 7 days" : "Past 30 days";
                  const data = await analyzeMicroPeriodFromMeals({
                    meals: snapshot.loggedMeals,
                    periodLabel: label,
                    dateRange: `${snapshot.firstDay} → ${snapshot.lastDay}`,
                    periodDayCount: snapshot.periodDayCount,
                    totals: snapshot.totals,
                  });
                  setAiResult(data);
                } catch (e) {
                  setAiError(e instanceof Error ? e.message : "Analysis failed.");
                } finally {
                  setAiLoading(false);
                }
              }}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-violet-400 bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {aiLoading ? "Analyzing…" : "Analyze micronutrients (AI)"}
            </button>
            <p className="mt-2 text-xs text-slate-500">
              Sends every meal in the table above to OpenAI vs the essential nutrient reference (macros scaled to this {snapshot.periodDayCount}-day window; vitamins/minerals from meal names). Use{" "}
              <code className="rounded bg-slate-100 px-1 font-mono">OPENAI_API_KEY</code> with{" "}
              <code className="rounded bg-slate-100 px-1 font-mono">npm run dev</code> (proxied), or{" "}
              <code className="rounded bg-slate-100 px-1 font-mono">VITE_OPENAI_API_KEY</code> (direct from browser).
            </p>
            {aiError ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{aiError}</div>
            ) : null}
            {aiResult ? <MicroAnalysisPanel analysis={aiResult} /> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
