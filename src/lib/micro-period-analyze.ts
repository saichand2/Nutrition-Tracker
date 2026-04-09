import type { MacroTotals } from "../types";
import { ESSENTIAL_NUTRIENTS_FOR_AI_PROMPT } from "./essential-nutrients-reference";
import type { PeriodMealLine } from "./period-meals";

const OPENAI_CHAT = "https://api.openai.com/v1/chat/completions";
const PROXY_CHAT = "/api/openai/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export type MicroEstimateStatus = "likely_adequate" | "possibly_low" | "unclear";

export type MicroEstimateRow = {
  name: string;
  status: MicroEstimateStatus;
  note: string;
};

export type MicroPeriodAnalysis = {
  overall: "likely_adequate" | "possibly_inadequate" | "unclear";
  summary: string;
  /** Logged P/C/F/fiber vs reference scaled to period_day_count */
  macros: MicroEstimateRow[];
  vitamins: MicroEstimateRow[];
  minerals: MicroEstimateRow[];
  other: MicroEstimateRow[];
  caveats: string[];
};

function stripJsonFence(s: string): string {
  const t = s.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/u, "");
  }
  return t;
}

function normalizeRowStatus(v: unknown): MicroEstimateStatus {
  if (v === "likely_adequate" || v === "possibly_low" || v === "unclear") return v;
  return "unclear";
}

function normalizeOverall(v: unknown): MicroPeriodAnalysis["overall"] {
  if (v === "likely_adequate" || v === "possibly_inadequate" || v === "unclear") return v;
  return "unclear";
}

function normalizeRows(v: unknown, fallbackPrefix: string): MicroEstimateRow[] {
  if (!Array.isArray(v)) return [];
  return v.map((item, i) => {
    if (!item || typeof item !== "object") {
      return { name: `${fallbackPrefix} ${i + 1}`, status: "unclear" as const, note: "" };
    }
    const r = item as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name : `${fallbackPrefix} ${i + 1}`;
    const note = typeof r.note === "string" ? r.note : "";
    return { name, status: normalizeRowStatus(r.status), note };
  });
}

function normalizeCaveats(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function parseAnalysisJson(content: string): MicroPeriodAnalysis {
  const cleaned = stripJsonFence(content);
  let raw: unknown;
  try {
    raw = JSON.parse(cleaned);
  } catch {
    throw new Error("The model did not return valid JSON.");
  }
  if (!raw || typeof raw !== "object") throw new Error("Invalid response shape.");
  const o = raw as Record<string, unknown>;
  const summary = typeof o.summary === "string" ? o.summary : "No summary provided.";
  return {
    overall: normalizeOverall(o.overall),
    summary,
    macros: normalizeRows(o.macros, "Macro"),
    vitamins: normalizeRows(o.vitamins, "Vitamin"),
    minerals: normalizeRows(o.minerals, "Mineral"),
    other: normalizeRows(o.other, "Other"),
    caveats: normalizeCaveats(o.caveats),
  };
}

const SYSTEM_PROMPT = `You are a careful nutrition assistant. The user logged meals with ONLY: meal name, date, calories, protein, carbs, fat, and fiber per item. There are NO measured vitamin or mineral amounts.

Task: For the given calendar period (7 or 30 days), give EDUCATIONAL ESTIMATES of whether needs in the REFERENCE below are LIKELY met, POSSIBLY LOW, or UNCLEAR.

Rules:
- For PROTEIN, FATS, CARBS, FIBER: compare period_totals (grams) to the reference bands scaled by period_day_count (e.g. daily min/max × days, or interpolate vs weekly/monthly bands). Say whether logged totals fall short, within range, or unclear if calories are inconsistent.
- For vitamins, minerals, omega-3: infer from meal NAMES and macro patterns; use the reference daily/weekly/monthly numbers as the mental model. Group items into vitamins / minerals / other in your JSON.
- Water is not logged; you may mention it only in caveats.

REFERENCE (targets for this analysis):
${ESSENTIAL_NUTRIENTS_FOR_AI_PROMPT}

Return ONLY valid JSON (no markdown) with this shape:
{
  "overall": "likely_adequate" | "possibly_inadequate" | "unclear",
  "summary": "string, 3-6 sentences referencing the period length and reference targets",
  "macros": [ { "name": "Protein|Carbohydrates|Fats|Fiber", "status": "likely_adequate" | "possibly_low" | "unclear", "note": "compare logged period total g to reference scaled by period_day_count" } ],
  "vitamins": [ { "name": "string", "status": "likely_adequate" | "possibly_low" | "unclear", "note": "one short sentence" } ],
  "minerals": [ same shape as vitamins ],
  "other": [ { "name": "string (e.g. Omega-3, water reminder)", "status": "likely_adequate" | "possibly_low" | "unclear", "note": "string" } ],
  "caveats": [ "string", ... ]
}

Always include one macros row each for protein, carbs, fat, and fiber when period_totals are present. Include a practical subset of vitamins/minerals from the reference. Be conservative; use "unclear" for vague meal names. Emphasize this is not medical advice.`;

/**
 * Sends displayed meals to OpenAI. Uses VITE_OPENAI_API_KEY in the browser, or `/api/openai` when proxied (OPENAI_API_KEY in .env + npm run dev).
 */
export async function analyzeMicroPeriodFromMeals(input: {
  meals: PeriodMealLine[];
  periodLabel: string;
  dateRange: string;
  periodDayCount: number;
  totals: MacroTotals;
}): Promise<MicroPeriodAnalysis> {
  const { meals, periodLabel, dateRange, periodDayCount, totals } = input;
  if (meals.length === 0) {
    throw new Error("No meals in this period to analyze.");
  }

  const viteKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();
  const url = viteKey ? OPENAI_CHAT : PROXY_CHAT;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (viteKey) {
    headers.Authorization = `Bearer ${viteKey}`;
  }

  const payload = {
    period_label: periodLabel,
    date_range: dateRange,
    period_day_count: periodDayCount,
    period_totals: {
      calories: Math.round(totals.calories),
      protein_g: totals.protein,
      carbs_g: totals.carbs,
      fat_g: totals.fat,
      fiber_g: totals.fiber,
    },
    meals: meals.map((m) => ({
      date: m.date,
      name: m.mealName,
      calories: m.nutrition.calories,
      protein_g: m.nutrition.protein,
      carbs_g: m.nutrition.carbs,
      fat_g: m.nutrition.fat,
      fiber_g: m.nutrition.fiber,
    })),
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Assess micronutrient adequacy for this ${periodDayCount}-day window (rolling, ending today). JSON payload:\n\n${JSON.stringify(payload)}`,
        },
      ],
      temperature: 0.25,
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 404) {
    throw new Error(
      "OpenAI proxy not found. For local dev, add OPENAI_API_KEY to .env (next to vite.config.ts), restart npm run dev, and use the proxy — or set VITE_OPENAI_API_KEY for a direct browser call (key is visible in the bundle)."
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const errBody = (await res.json()) as { error?: { message?: string } };
      detail = errBody.error?.message ?? "";
    } catch {
      detail = (await res.text()).slice(0, 280);
    }
    throw new Error(detail || `OpenAI request failed (${res.status}).`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty model response.");

  return parseAnalysisJson(content);
}
