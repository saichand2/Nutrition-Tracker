import { useCallback, useState } from "react";
import { useTracker } from "../context/TrackerContext";
import { MacroFields } from "../components/MacroFields";
import type { BackupData, CustomMeal, MacroTotals } from "../types";
import { emptyMacros } from "../types";
import { hasAnyMacroValue, unrealisticMacroHints } from "../lib/validation";

type AiNutritionResult = {
  mealName: string;
  nutrition: MacroTotals;
};

function normalizeMacro(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 10) / 10);
}

function extractFirstJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return raw.slice(start, end + 1);
}

function collectResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: unknown; type?: unknown }> }>;
  };

  const parts: string[] = [];
  if (typeof data.output_text === "string") {
    parts.push(data.output_text);
  }
  if (Array.isArray(data.output)) {
    for (const item of data.output) {
      if (!item || !Array.isArray(item.content)) continue;
      for (const contentItem of item.content) {
        if (typeof contentItem?.text === "string") {
          parts.push(contentItem.text);
        }
      }
    }
  }
  return parts.join("\n").trim();
}

async function fetchAiNutritionEstimate(mealDescription: string): Promise<AiNutritionResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("AI is not configured. Add VITE_OPENAI_API_KEY to your .env file.");
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "Estimate nutrition for a meal description. Return only one JSON object with keys: mealName, calories, protein, carbs, fat, fiber. No markdown.",
        },
        {
          role: "user",
          content: `Meal description: ${mealDescription}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error("AI request failed. Check API key and try again.");
  }

  const data = (await res.json()) as unknown;
  const rawText = collectResponseText(data);
  const jsonPayload = extractFirstJsonObject(rawText);
  if (!jsonPayload) {
    throw new Error("AI response could not be parsed. Try again.");
  }

  const parsed = JSON.parse(jsonPayload) as {
    mealName?: unknown;
    calories?: unknown;
    protein?: unknown;
    carbs?: unknown;
    fat?: unknown;
    fiber?: unknown;
  };

  const mealName =
    typeof parsed.mealName === "string" && parsed.mealName.trim().length > 0
      ? parsed.mealName.trim()
      : mealDescription.trim().slice(0, 80) || "AI meal";

  return {
    mealName,
    nutrition: {
      calories: normalizeMacro(parsed.calories),
      protein: normalizeMacro(parsed.protein),
      carbs: normalizeMacro(parsed.carbs),
      fat: normalizeMacro(parsed.fat),
      fiber: normalizeMacro(parsed.fiber),
    },
  };
}

function toCsvRow(cols: Array<string | number>): string {
  return cols
    .map((c) => {
      const s = String(c);
      return s.includes(",") || s.includes("\"") ? `"${s.replaceAll("\"", "\"\"")}"` : s;
    })
    .join(",");
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

export function CustomMealsPage() {
  const {
    customMeals,
    addCustomMeal,
    updateCustomMeal,
    deleteCustomMeal,
    getBackupData,
    importBackupData,
  } = useTracker();
  const [form, setForm] = useState<{ name: string; nutrition: MacroTotals }>({
    name: "",
    nutrition: emptyMacros(),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [lastAiPrompt, setLastAiPrompt] = useState("");

  const resetForm = () => {
    setForm({ name: "", nutrition: emptyMacros() });
    setEditingId(null);
  };

  const startEdit = (m: CustomMeal) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      nutrition: {
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        fiber: m.fiber,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name || !hasAnyMacroValue(form.nutrition)) return;
    if (editingId) {
      await updateCustomMeal(editingId, { name, ...form.nutrition });
    } else {
      await addCustomMeal({ name, ...form.nutrition });
    }
    resetForm();
  };

  const runAiEstimate = useCallback(
    async (description: string) => {
      const prompt = description.trim();
      if (!prompt) {
        setAiMessage("Enter a meal description first.");
        return;
      }
      setAiLoading(true);
      setAiMessage("");
      try {
        const estimate = await fetchAiNutritionEstimate(prompt);
        setForm({ name: estimate.mealName, nutrition: estimate.nutrition });
        setLastAiPrompt(prompt);
        setAiMessage("Nutrition facts loaded. Review and click Add meal to save.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI estimate failed. Try again.";
        setAiMessage(message);
      } finally {
        setAiLoading(false);
      }
    },
    []
  );

  const exportJson = () => {
    const data = getBackupData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nutrition-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportCsv = () => {
    const data = getBackupData();
    const rows: string[] = [];
    rows.push(toCsvRow(["section", "id", "date", "name", "calories", "protein", "carbs", "fat", "fiber"]));
    for (const e of data.entries) {
      rows.push(
        toCsvRow([
          "entry",
          e.id,
          e.date,
          e.mealName,
          e.nutrition.calories,
          e.nutrition.protein,
          e.nutrition.carbs,
          e.nutrition.fat,
          e.nutrition.fiber,
        ])
      );
    }
    for (const m of data.customMeals) {
      rows.push(
        toCsvRow(["custom_meal", m.id, "", m.name, m.calories, m.protein, m.carbs, m.fat, m.fiber])
      );
    }
    rows.push(toCsvRow(["goals", "", "", "daily_goals", data.goals.calories, data.goals.protein, data.goals.carbs, data.goals.fat, data.goals.fiber]));
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nutrition-backup-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImportJson: React.ChangeEventHandler<HTMLInputElement> = async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as BackupData;
      if (parsed.version !== 1 || !Array.isArray(parsed.entries) || !Array.isArray(parsed.customMeals) || !parsed.goals) {
        setBackupMessage("Import failed: unsupported or invalid backup format.");
      } else {
        await importBackupData(parsed);
        setBackupMessage("Backup imported successfully.");
      }
    } catch {
      setBackupMessage("Import failed: file is not valid JSON.");
    } finally {
      ev.target.value = "";
    }
  };

  const onImportCsv: React.ChangeEventHandler<HTMLInputElement> = async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const lines = raw.split(/\r?\n/).filter(Boolean);
      const entries: BackupData["entries"] = [];
      const customMeals: BackupData["customMeals"] = [];
      let goals: BackupData["goals"] | null = null;
      for (let i = 1; i < lines.length; i += 1) {
        const cols = parseCsvLine(lines[i]);
        const section = cols[0];
        if (section === "entry") {
          entries.push({
            id: cols[1],
            date: cols[2],
            mealName: cols[3],
            nutrition: {
              calories: Number(cols[4]) || 0,
              protein: Number(cols[5]) || 0,
              carbs: Number(cols[6]) || 0,
              fat: Number(cols[7]) || 0,
              fiber: Number(cols[8]) || 0,
            },
          });
        } else if (section === "custom_meal") {
          customMeals.push({
            id: cols[1],
            name: cols[3],
            calories: Number(cols[4]) || 0,
            protein: Number(cols[5]) || 0,
            carbs: Number(cols[6]) || 0,
            fat: Number(cols[7]) || 0,
            fiber: Number(cols[8]) || 0,
          });
        } else if (section === "goals") {
          goals = {
            calories: Number(cols[4]) || 0,
            protein: Number(cols[5]) || 0,
            carbs: Number(cols[6]) || 0,
            fat: Number(cols[7]) || 0,
            fiber: Number(cols[8]) || 0,
          };
        }
      }
      if (!goals) {
        setBackupMessage("Import failed: CSV goals row missing.");
      } else {
        await importBackupData({
          version: 1,
          exportedAt: new Date().toISOString(),
          entries,
          customMeals,
          goals,
        });
        setBackupMessage("CSV imported successfully.");
      }
    } catch {
      setBackupMessage("Import failed: CSV format invalid.");
    } finally {
      ev.target.value = "";
    }
  };

  const mealHints = unrealisticMacroHints(form.nutrition);
  const canSaveMeal = form.name.trim().length > 0 && hasAnyMacroValue(form.nutrition);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-5 sm:space-y-8 sm:py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Custom meals</h1>
        <p className="mt-1 text-slate-600">
          Save meals you eat often so you can add them quickly from the dashboard.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Get nutrition facts with AI</h2>
        <p className="mt-1 text-sm text-slate-600">
          Describe your meal (ingredients/portion). AI fills the form below so you can save to custom meals.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Meal description</span>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="e.g. 2 eggs, 2 slices whole wheat toast, 1 tbsp butter"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void runAiEstimate(aiPrompt)}
              disabled={aiLoading}
              className="min-h-11 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {aiLoading ? "Fetching..." : "Fetch with AI"}
            </button>
            <button
              type="button"
              onClick={() => void runAiEstimate(lastAiPrompt || aiPrompt)}
              disabled={aiLoading || (!lastAiPrompt && !aiPrompt.trim())}
              className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Try again
            </button>
          </div>
          {aiMessage && <p className="text-sm text-slate-600">{aiMessage}</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {editingId ? "Edit meal" : "Add a meal"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Name</span>
            <input
              required
              type="text"
              className="min-h-11 w-full max-w-md rounded-lg border border-slate-200 px-3 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="e.g. Oatmeal bowl"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <MacroFields
            values={form.nutrition}
            onChange={(nutrition) => setForm((f) => ({ ...f, nutrition }))}
            idPrefix="custom"
          />
          {!hasAnyMacroValue(form.nutrition) && (
            <p className="text-xs text-amber-700">Add at least one macro value before saving this meal template.</p>
          )}
          {mealHints.length > 0 && (
            <ul className="space-y-1 text-xs text-amber-700">
              {mealHints.map((hint) => (
                <li key={hint}>- {hint}</li>
              ))}
            </ul>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="submit"
              disabled={!canSaveMeal}
              className={`min-h-11 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 ${
                !editingId ? "col-span-2" : ""
              }`}
            >
              {editingId ? "Save changes" : "Add meal"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Backup &amp; restore</h2>
        <p className="mt-1 text-sm text-slate-600">
          Export your data and import it later if browser storage is cleared.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={exportJson}
            className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100">
            Import JSON
            <input type="file" accept="application/json,.json" className="hidden" onChange={onImportJson} />
          </label>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100">
            Import CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onImportCsv} />
          </label>
        </div>
        {backupMessage && <p className="mt-3 text-sm text-slate-600">{backupMessage}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Your meals</h2>
        {customMeals.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No custom meals yet. Add one above.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {customMeals.map((m) => (
              <li key={m.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{m.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {m.calories} kcal · P {m.protein}g · C {m.carbs}g · F {m.fat}g · Fiber {m.fiber}g
                  </p>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto">
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    className="min-h-11 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete “${m.name}”?`)) void deleteCustomMeal(m.id);
                    }}
                    className="min-h-11 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
