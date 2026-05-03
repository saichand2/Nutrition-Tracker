import type { PushReminderConfig } from "../types";
import { defaultPushConfig } from "../types";
import { getSupabase } from "./supabase";

const LOCAL_KEY = "nt-push-config-v1";

export function loadPushConfigLocal(): PushReminderConfig {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return defaultPushConfig();
    return JSON.parse(raw) as PushReminderConfig;
  } catch {
    return defaultPushConfig();
  }
}

export function savePushConfigLocal(config: PushReminderConfig): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(config));
}

export async function upsertPushSubscription(
  userId: string,
  subscription: PushSubscription,
  config: PushReminderConfig
): Promise<void> {
  const supabase = getSupabase();
  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
      reminder_config: config,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function deletePushSubscription(userId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}

export async function fetchPushConfig(userId: string): Promise<PushReminderConfig | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("reminder_config")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return (data?.reminder_config as PushReminderConfig) ?? null;
}
