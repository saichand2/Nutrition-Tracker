type Props = {
  label: string;
  unit: string;
  current: number;
  goal: number;
  selected: boolean;
  onToggle: () => void;
  remainingLabel: string;
  remainingToneClass: string;
};

/**
 * Progress bar fill vs goal (when there is a positive goal):
 * Under 50% orange; 50%–85% (exclusive of 85%) amber; 85%–100% emerald; over 100% red.
 */
function intakeBarFillClass(ratio: number): string {
  if (ratio > 1) return "bg-red-500";
  if (ratio >= 0.85) return "bg-emerald-500";
  if (ratio < 0.5) return "bg-orange-500";
  return "bg-amber-400";
}

export function IntakeMacroGraphRow({
  label,
  unit,
  current,
  goal,
  selected,
  onToggle,
  remainingLabel,
  remainingToneClass,
}: Props) {
  const rounded = Math.round(current * 10) / 10;
  const hasGoal = goal > 0;
  const ratio = hasGoal ? current / goal : 0;
  const pctLabel = hasGoal ? Math.round(ratio * 100) : 0;
  const barWidthPct = hasGoal ? Math.min(100, Math.round(ratio * 100)) : 0;
  const fillClass = hasGoal ? intakeBarFillClass(ratio) : "bg-emerald-200";
  const progressNow = hasGoal ? Math.min(100, Math.max(0, pctLabel)) : 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`${label}: ${hasGoal ? `${pctLabel}% of goal, ${remainingLabel}` : remainingLabel}`}
      className={`h-full min-w-0 w-full rounded-lg border px-2 py-1.5 text-left shadow-sm ring-1 transition sm:px-3 sm:py-2 ${
        selected
          ? "border-emerald-500 bg-emerald-50/90 ring-emerald-300"
          : "border-slate-200 bg-white ring-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-1.5 gap-y-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[11px]">
          {label}
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-slate-800 sm:text-xs">
          {rounded} {unit}
          {hasGoal ? (
            <span className="font-normal text-slate-500">
              {" "}
              / {goal} {unit}
            </span>
          ) : null}
        </span>
      </div>
      <div
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-transparent ring-1 ring-slate-200/70 ring-inset sm:mt-1.5 sm:h-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressNow}
        aria-valuetext={hasGoal ? `${pctLabel}% of daily goal` : "No goal set"}
      >
        <div
          className={`h-full rounded-full shadow-sm transition-[width] duration-300 ${fillClass}`}
          style={{ width: hasGoal ? `${barWidthPct}%` : "0%" }}
        />
      </div>
      <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-1.5 gap-y-0 text-[9px] sm:text-[10px]">
        {hasGoal ? (
          <span className="tabular-nums text-slate-400">{pctLabel}% of goal</span>
        ) : (
          <span className="text-slate-400">No goal set</span>
        )}
        <span className={`font-semibold ${remainingToneClass}`}>{remainingLabel}</span>
      </div>
    </button>
  );
}
