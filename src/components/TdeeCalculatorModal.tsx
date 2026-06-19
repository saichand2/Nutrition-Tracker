import { useState } from "react";
import type { NutritionGoals } from "../types";

type Sex = "male" | "female";
type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";

const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary: "Sedentary (desk job, no exercise)",
  light: "Light (1–3 days/week)",
  moderate: "Moderate (3–5 days/week)",
  active: "Active (6–7 days/week)",
  very_active: "Very active (athlete / physical job)",
};

const ACTIVITY_MULTIPLIERS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function calcTdee(sex: Sex, age: number, heightCm: number, weightKg: number, activity: Activity): number {
  const bmr =
    sex === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
}

function suggestMacros(tdee: number, weightKg: number): NutritionGoals {
  const protein = Math.round(weightKg * 2.0);
  const fat = Math.round((tdee * 0.25) / 9);
  const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4);
  const fiber = Math.round((tdee / 1000) * 14);
  return { calories: tdee, protein, fat, carbs: Math.max(carbs, 0), fiber };
}

type Props = {
  onApply: (goals: NutritionGoals) => void;
  onClose: () => void;
};

export function TdeeCalculatorModal({ onApply, onClose }: Props) {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activity, setActivity] = useState<Activity>("moderate");

  const ageN = parseInt(age);
  const heightN = parseFloat(heightCm);
  const weightN = parseFloat(weightKg);
  const valid = ageN > 0 && ageN < 120 && heightN > 0 && weightN > 0;

  const result = valid ? suggestMacros(calcTdee(sex, ageN, heightN, weightN, activity), weightN) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Calculate calorie target</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-400 hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">Uses the Mifflin-St Jeor formula to estimate your TDEE and suggest macro targets.</p>

        <div className="mt-4 space-y-4">
          {/* Sex */}
          <div className="flex gap-3">
            {(["male", "female"] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition ${sex === s ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Age / Height / Weight */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Age", value: age, setValue: setAge, placeholder: "30", unit: "yrs" },
              { label: "Height", value: heightCm, setValue: setHeightCm, placeholder: "175", unit: "cm" },
              { label: "Weight", value: weightKg, setValue: setWeightKg, placeholder: "75", unit: "kg" },
            ].map(({ label, value, setValue, placeholder, unit }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-slate-600">{label} ({unit})</label>
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            ))}
          </div>

          {/* Activity */}
          <div>
            <label className="block text-xs font-medium text-slate-600">Activity level</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as Activity)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((k) => (
                <option key={k} value={k}>{ACTIVITY_LABELS[k]}</option>
              ))}
            </select>
          </div>

          {/* Result */}
          {result && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Suggested daily targets</p>
              <div className="mt-2 grid grid-cols-5 gap-2 text-center">
                {[
                  { label: "Calories", value: result.calories, unit: "kcal" },
                  { label: "Protein", value: result.protein, unit: "g" },
                  { label: "Carbs", value: result.carbs, unit: "g" },
                  { label: "Fat", value: result.fat, unit: "g" },
                  { label: "Fiber", value: result.fiber, unit: "g" },
                ].map(({ label, value, unit }) => (
                  <div key={label}>
                    <p className="text-lg font-bold text-emerald-900">{value}</p>
                    <p className="text-[10px] text-emerald-600">{unit}</p>
                    <p className="text-[10px] text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-emerald-600">Protein: 2g/kg · Fat: 25% of calories · Carbs: remainder · Fiber: 14g/1000 kcal</p>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            disabled={!result}
            onClick={() => { if (result) { onApply(result); onClose(); } }}
            className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            Apply as goals
          </button>
        </div>
      </div>
    </div>
  );
}
