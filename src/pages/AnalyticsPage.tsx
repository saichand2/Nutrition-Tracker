import { useMemo, useState } from "react";
import { useTracker } from "../context/TrackerContext";
import { buildDailyPoints, rollingAverage, daysLogged, averageOf, type DailyMacroPoint } from "../lib/analytics";

type MacroKey = keyof Omit<DailyMacroPoint, "date">;

const CHART_W = 600;
const CHART_H = 120;

function MacroLineChart({
  points,
  avgPoints,
  macroKey,
  color,
  goal,
  unit,
}: {
  points: DailyMacroPoint[];
  avgPoints: DailyMacroPoint[];
  macroKey: MacroKey;
  color: string;
  goal: number;
  unit: string;
}) {
  if (points.length < 2) return null;
  const allVals = [...points.map((p) => p[macroKey]), goal];
  const maxVal = Math.max(...allVals, 1) * 1.1;
  const toY = (v: number) => CHART_H - (v / maxVal) * CHART_H;
  const toX = (i: number) => (i / (points.length - 1)) * CHART_W;

  const rawLine = points.map((p, i) => `${toX(i)},${toY(p[macroKey])}`).join(" ");
  const avgLine = avgPoints.map((p, i) => `${toX(i)},${toY(p[macroKey])}`).join(" ");
  const goalY = toY(goal);
  const firstDate = points[0]!.date.slice(5);
  const lastDate = points[points.length - 1]!.date.slice(5);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white p-3">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H + 20}`}
        width="100%"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${macroKey} trend chart`}
        className="block"
        style={{ height: "7rem" }}
      >
        {goal > 0 && (
          <>
            <line x1={0} y1={goalY} x2={CHART_W} y2={goalY} stroke="#94a3b8" strokeWidth={1} strokeDasharray="6 3" />
            <text x={CHART_W - 2} y={goalY - 3} textAnchor="end" fontSize={10} fill="#94a3b8">
              goal {goal}{unit}
            </text>
          </>
        )}
        <polyline points={rawLine} fill="none" stroke={color} strokeWidth={1.5} opacity={0.35} />
        <polyline points={avgLine} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <text x={2} y={CHART_H + 16} fontSize={10} fill="#94a3b8">{firstDate}</text>
        <text x={CHART_W - 2} y={CHART_H + 16} textAnchor="end" fontSize={10} fill="#94a3b8">{lastDate}</text>
      </svg>
    </div>
  );
}

const MACROS: { key: MacroKey; label: string; unit: string; color: string; goalKey: keyof ReturnType<typeof useTracker>["goals"] }[] = [
  { key: "calories", label: "Calories", unit: "kcal", color: "#10b981", goalKey: "calories" },
  { key: "protein", label: "Protein", unit: "g", color: "#0ea5e9", goalKey: "protein" },
  { key: "carbs", label: "Carbs", unit: "g", color: "#f59e0b", goalKey: "carbs" },
  { key: "fat", label: "Fat", unit: "g", color: "#f87171", goalKey: "fat" },
  { key: "fiber", label: "Fiber", unit: "g", color: "#a78bfa", goalKey: "fiber" },
];

type Range = 7 | 30 | 90;

export function AnalyticsPage() {
  const { entries, goals } = useTracker();
  const [range, setRange] = useState<Range>(7);

  const points = useMemo(() => buildDailyPoints(entries, range), [entries, range]);
  const avgPoints = useMemo(() => rollingAverage(points, 7), [points]);
  const logged = useMemo(() => daysLogged(points), [points]);
  const avgCal = useMemo(() => averageOf(points, "calories"), [points]);
  const avgProtein = useMemo(() => averageOf(points, "protein"), [points]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-5 sm:space-y-8 sm:py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Analytics</h1>
        <p className="mt-1 text-slate-600">Macro trends over time. Bold line = 7-day rolling average. Faint line = daily values.</p>
      </header>

      {/* Range toggle */}
      <div className="flex gap-2">
        {([7, 30, 90] as Range[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${range === r ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {r}d
          </button>
        ))}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Days logged", value: `${logged} / ${range}` },
          { label: "Avg calories", value: `${avgCal} kcal` },
          { label: "Avg protein", value: `${avgProtein} g` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="space-y-5">
        {MACROS.map(({ key, label, unit, color, goalKey }) => (
          <section key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">{label}</h2>
              <span className="text-xs text-slate-500">avg {averageOf(points, key)} {unit} / day</span>
            </div>
            <MacroLineChart points={points} avgPoints={avgPoints} macroKey={key} color={color} goal={goals[goalKey]} unit={unit} />
          </section>
        ))}
      </div>
    </div>
  );
}
