import type { MacroTotals } from "../types";

type Props = {
  values: MacroTotals;
  onChange: (next: MacroTotals) => void;
  disabled?: boolean;
  idPrefix?: string;
};

const fields: { key: keyof MacroTotals; label: string; unit: string; step?: string }[] = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g", step: "0.1" },
  { key: "carbs", label: "Carbs", unit: "g", step: "0.1" },
  { key: "fat", label: "Fat", unit: "g", step: "0.1" },
  { key: "fiber", label: "Fiber", unit: "g", step: "0.1" },
];

export function MacroFields({ values, onChange, disabled, idPrefix = "m" }: Props) {
  const set = (key: keyof MacroTotals, raw: string) => {
    const n = parseFloat(raw);
    onChange({ ...values, [key]: Number.isFinite(n) ? n : 0 });
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
      {fields.map(({ key, label, unit, step }, idx) => (
        <label
          key={key}
          className={`block min-w-0 text-sm ${idx === fields.length - 1 ? "col-span-2 lg:col-span-1" : ""}`}
        >
          <span className="mb-1 block font-medium text-slate-600">
            {label}{" "}
            <span className="font-normal text-slate-400">({unit})</span>
          </span>
          <input
            id={`${idPrefix}-${key}`}
            type="number"
            min={0}
            step={step ?? "1"}
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:bg-slate-50"
            value={values[key] === 0 ? "" : values[key]}
            onChange={(e) => set(key, e.target.value)}
            disabled={disabled}
          />
        </label>
      ))}
    </div>
  );
}
