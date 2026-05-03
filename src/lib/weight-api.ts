import type { WeightLog } from "../types";
import { getSupabase } from "./supabase";

function rowToWeightLog(r: Record<string, unknown>): WeightLog {
  return {
    id: String(r.id),
    date: String(r.entry_date),
    weightKg: Number(r.weight_kg),
    note: r.note ? String(r.note) : undefined,
  };
}

export async function fetchWeightLogs(userId: string): Promise<WeightLog[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => rowToWeightLog(r as Record<string, unknown>));
}

export async function insertWeightLogCloud(userId: string, w: WeightLog): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("weight_logs").insert({
    id: w.id,
    user_id: userId,
    entry_date: w.date,
    weight_kg: w.weightKg,
    note: w.note ?? null,
  });
  if (error) throw error;
}

export async function deleteWeightLogCloud(userId: string, id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("weight_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
