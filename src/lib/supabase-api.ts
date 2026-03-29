import type { CustomMeal, LogEntry, NutritionGoals } from "../types";
import { defaultGoals } from "../types";
import { getSupabase } from "./supabase";

function n(x: unknown): number {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  const p = Number(x);
  return Number.isFinite(p) ? p : 0;
}

function rowToEntry(r: Record<string, unknown>): LogEntry {
  return {
    id: String(r.id),
    date: String(r.entry_date),
    mealName: String(r.meal_name),
    nutrition: {
      calories: n(r.calories),
      protein: n(r.protein),
      carbs: n(r.carbs),
      fat: n(r.fat),
      fiber: n(r.fiber),
    },
    customMealId: r.custom_meal_id ? String(r.custom_meal_id) : undefined,
  };
}

function rowToMeal(r: Record<string, unknown>): CustomMeal {
  return {
    id: String(r.id),
    name: String(r.name),
    calories: n(r.calories),
    protein: n(r.protein),
    carbs: n(r.carbs),
    fat: n(r.fat),
    fiber: n(r.fiber),
  };
}

function rowToGoals(r: Record<string, unknown> | null): NutritionGoals {
  if (!r) return defaultGoals();
  return {
    calories: n(r.calories),
    protein: n(r.protein),
    carbs: n(r.carbs),
    fat: n(r.fat),
    fiber: n(r.fiber),
  };
}

export async function fetchUserData(userId: string): Promise<{
  entries: LogEntry[];
  customMeals: CustomMeal[];
  goals: NutritionGoals;
}> {
  const supabase = getSupabase();

  const [entriesRes, mealsRes, goalsRes] = await Promise.all([
    supabase.from("log_entries").select("*").eq("user_id", userId).order("entry_date", { ascending: true }),
    supabase.from("custom_meals").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("nutrition_goals").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (entriesRes.error) throw entriesRes.error;
  if (mealsRes.error) throw mealsRes.error;
  if (goalsRes.error) throw goalsRes.error;

  const entries = (entriesRes.data ?? []).map((r) => rowToEntry(r as Record<string, unknown>));
  const customMeals = (mealsRes.data ?? []).map((r) => rowToMeal(r as Record<string, unknown>));
  let goals = rowToGoals(goalsRes.data as Record<string, unknown> | null);
  if (!goalsRes.data) {
    goals = defaultGoals();
    await upsertGoalsCloud(userId, goals);
  }

  return { entries, customMeals, goals };
}

export async function upsertGoalsCloud(userId: string, g: NutritionGoals): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("nutrition_goals").upsert(
    {
      user_id: userId,
      calories: g.calories,
      protein: g.protein,
      carbs: g.carbs,
      fat: g.fat,
      fiber: g.fiber,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function insertLogEntryCloud(userId: string, e: LogEntry): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("log_entries").insert({
    id: e.id,
    user_id: userId,
    entry_date: e.date,
    meal_name: e.mealName,
    calories: e.nutrition.calories,
    protein: e.nutrition.protein,
    carbs: e.nutrition.carbs,
    fat: e.nutrition.fat,
    fiber: e.nutrition.fiber,
    custom_meal_id: e.customMealId ?? null,
  });
  if (error) throw error;
}

export async function updateLogEntryCloud(
  userId: string,
  id: string,
  patch: Partial<Pick<LogEntry, "mealName" | "nutrition">>
): Promise<void> {
  const supabase = getSupabase();
  const row: Record<string, unknown> = {};
  if (patch.mealName !== undefined) row.meal_name = patch.mealName;
  if (patch.nutrition) {
    const n0 = patch.nutrition;
    if (n0.calories !== undefined) row.calories = n0.calories;
    if (n0.protein !== undefined) row.protein = n0.protein;
    if (n0.carbs !== undefined) row.carbs = n0.carbs;
    if (n0.fat !== undefined) row.fat = n0.fat;
    if (n0.fiber !== undefined) row.fiber = n0.fiber;
  }
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("log_entries").update(row).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function deleteLogEntryCloud(userId: string, id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("log_entries").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function insertCustomMealCloud(userId: string, m: CustomMeal): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("custom_meals").insert({
    id: m.id,
    user_id: userId,
    name: m.name,
    calories: m.calories,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
    fiber: m.fiber,
  });
  if (error) throw error;
}

export async function updateCustomMealCloud(
  userId: string,
  id: string,
  patch: Partial<Omit<CustomMeal, "id">>
): Promise<void> {
  const supabase = getSupabase();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.calories !== undefined) row.calories = patch.calories;
  if (patch.protein !== undefined) row.protein = patch.protein;
  if (patch.carbs !== undefined) row.carbs = patch.carbs;
  if (patch.fat !== undefined) row.fat = patch.fat;
  if (patch.fiber !== undefined) row.fiber = patch.fiber;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("custom_meals").update(row).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function deleteCustomMealCloud(userId: string, id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("custom_meals").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function replaceAllUserDataCloud(
  userId: string,
  entries: LogEntry[],
  meals: CustomMeal[],
  goals: NutritionGoals
): Promise<void> {
  const supabase = getSupabase();

  const { error: d1 } = await supabase.from("log_entries").delete().eq("user_id", userId);
  if (d1) throw d1;
  const { error: d2 } = await supabase.from("custom_meals").delete().eq("user_id", userId);
  if (d2) throw d2;

  if (entries.length > 0) {
    const { error } = await supabase.from("log_entries").insert(
      entries.map((e) => ({
        id: e.id,
        user_id: userId,
        entry_date: e.date,
        meal_name: e.mealName,
        calories: e.nutrition.calories,
        protein: e.nutrition.protein,
        carbs: e.nutrition.carbs,
        fat: e.nutrition.fat,
        fiber: e.nutrition.fiber,
        custom_meal_id: e.customMealId ?? null,
      }))
    );
    if (error) throw error;
  }

  if (meals.length > 0) {
    const { error } = await supabase.from("custom_meals").insert(
      meals.map((m) => ({
        id: m.id,
        user_id: userId,
        name: m.name,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        fiber: m.fiber,
      }))
    );
    if (error) throw error;
  }

  await upsertGoalsCloud(userId, goals);
}
