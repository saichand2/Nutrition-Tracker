import { useMemo, useState } from "react";
import { useWeight } from "../context/WeightContext";
import { format, parseDateKey, todayKey } from "../lib/dates";
import type { WeightLog } from "../types";

const CHART_W = 600;
const CHART_H = 120;

function WeightChart({ logs }: { logs: WeightLog[] }) {
  if (logs.length < 2) return <p className="mt-2 text-sm text-slate-500">Log at least 2 entries to see the trend.</p>;

  const weights = logs.map((l) => l.weightKg);
  const minW = Math.min(...weights) * 0.98;
  const maxW = Math.max(...weights) * 1.02;
  const toY = (w: number) => CHART_H - ((w - minW) / (maxW - minW)) * CHART_H;
  const toX = (i: number) => (i / (logs.length - 1)) * CHART_W;

  const line = logs.map((l, i) => `${toX(i)},${toY(l.weightKg)}`).join(" ");
  const firstDate = logs[0]!.date.slice(5);
  const lastDate = logs[logs.length - 1]!.date.slice(5);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white p-3">
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H + 20}`} width="100%" preserveAspectRatio="none" role="img" aria-label="Weight trend" style={{ height: "7rem" }} className="block">
        <polyline points={line} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {logs.map((l, i) => (
          <circle key={l.id} cx={toX(i)} cy={toY(l.weightKg)} r={3} fill="#10b981" />
        ))}
        <text x={2} y={CHART_H + 16} fontSize={10} fill="#94a3b8">{firstDate}</text>
        <text x={CHART_W - 2} y={CHART_H + 16} textAnchor="end" fontSize={10} fill="#94a3b8">{lastDate}</text>
      </svg>
    </div>
  );
}

export function WeightPage() {
  const { weightLogs, addWeightLog, deleteWeightLog } = useWeight();
  const [date, setDate] = useState(todayKey());
  const [weightInput, setWeightInput] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sortedLogs = useMemo(
    () => [...weightLogs].sort((a, b) => a.date.localeCompare(b.date)),
    [weightLogs]
  );

  const handleAdd = async () => {
    const val = parseFloat(weightInput.replace(",", "."));
    if (!weightInput.trim() || isNaN(val) || val <= 0) {
      setError("Enter a valid weight in kg.");
      return;
    }
    setError(null);
    await addWeightLog(date, val, note.trim() || undefined);
    setWeightInput("");
    setNote("");
  };

  const latest = sortedLogs[sortedLogs.length - 1];
  const first = sortedLogs[0];
  const change = latest && first && latest !== first ? Math.round((latest.weightKg - first.weightKg) * 10) / 10 : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-5 sm:space-y-8 sm:py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Weight</h1>
        <p className="mt-1 text-slate-600">Track your daily body weight and visualise trends over time.</p>
      </header>

      {/* Stats */}
      {sortedLogs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-xs text-slate-500">Latest</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{latest?.weightKg} kg</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-xs text-slate-500">Entries</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{sortedLogs.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-xs text-slate-500">Change</p>
            <p className={`mt-1 text-lg font-semibold ${change === null ? "text-slate-400" : change > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {change === null ? "—" : `${change > 0 ? "+" : ""}${change} kg`}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900">Trend</h2>
        <div className="mt-3">
          <WeightChart logs={sortedLogs} />
        </div>
      </section>

      {/* Log form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Log weight</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Date</span>
            <input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Weight (kg)</span>
            <input type="number" min={0} step="0.1" inputMode="decimal" placeholder="e.g. 74.5" value={weightInput} onChange={(e) => { setWeightInput(e.target.value); setError(null); }} className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Note (optional)</span>
            <input type="text" placeholder="e.g. Morning, fasted" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          </label>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button type="button" onClick={() => void handleAdd()} className="mt-4 min-h-11 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white shadow hover:bg-emerald-700">
          Save entry
        </button>
      </section>

      {/* History */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">History</h2>
        {sortedLogs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No entries yet. Log your first weight above.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {[...sortedLogs].reverse().map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <div>
                  <p className="font-medium text-slate-900">{format(parseDateKey(l.date), "EEE, MMM d, yyyy")}</p>
                  <p className="text-sm text-slate-600">{l.weightKg} kg{l.note ? ` · ${l.note}` : ""}</p>
                </div>
                <button type="button" onClick={() => { if (confirm("Delete this entry?")) void deleteWeightLog(l.id); }} className="min-h-11 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
