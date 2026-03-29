import { clampPct } from "../lib/macros";

type Props = {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color?: string;
};

export function ProgressBar({ label, current, goal, unit, color = "bg-emerald-500" }: Props) {
  const pct = clampPct(current, goal);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          {Math.round(current * 10) / 10} / {goal} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-0.5 text-right text-xs text-slate-400">{pct}% of goal</p>
    </div>
  );
}
