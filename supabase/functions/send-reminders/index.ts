// Supabase Edge Function — sends push notifications for meal reminders.
// Called every minute via a cron trigger (configured in supabase/config.toml).
//
// Required Edge Function secrets (set in Supabase dashboard → Project Settings → Edge Functions):
//   VAPID_PUBLIC_KEY   — from scripts/generate-vapid-keys.mjs
//   VAPID_PRIVATE_KEY  — from scripts/generate-vapid-keys.mjs
//   VAPID_SUBJECT      — e.g. mailto:you@example.com

import { createClient } from "jsr:@supabase/supabase-js@2";
// @ts-ignore — npm:web-push is supported in Supabase Edge Runtime
import webpush from "npm:web-push";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

type ReminderConfig = {
  breakfast: boolean;
  breakfastTime: string;
  lunch: boolean;
  lunchTime: string;
  dinner: boolean;
  dinnerTime: string;
  timezone: string;
};

type Subscription = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  reminder_config: ReminderConfig;
};

/** Returns current HH:MM in the given IANA timezone. */
function localTimeIn(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
  } catch {
    // Fall back to UTC if timezone is invalid
    const now = new Date();
    return `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
  }
}

Deno.serve(async () => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(
      JSON.stringify({ error: "VAPID keys not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth, reminder_config");

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const reminders = [
    { enabledKey: "breakfast" as const, timeKey: "breakfastTime" as const, label: "Breakfast" },
    { enabledKey: "lunch" as const, timeKey: "lunchTime" as const, label: "Lunch" },
    { enabledKey: "dinner" as const, timeKey: "dinnerTime" as const, label: "Dinner" },
  ];

  let sent = 0;
  let skipped = 0;

  await Promise.allSettled(
    (subs as Subscription[]).map(async (sub) => {
      const cfg = sub.reminder_config;
      const localNow = localTimeIn(cfg.timezone ?? "UTC");

      const match = reminders.find(
        (r) => cfg[r.enabledKey] && cfg[r.timeKey] === localNow
      );

      if (!match) { skipped++; return; }

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: "Nutrition Tracker",
            body: `Time to log your ${match.label}!`,
            tag: `reminder-${match.label.toLowerCase()}`,
          })
        );
        sent++;
      } catch (err) {
        // 410 Gone = subscription expired; clean it up
        if ((err as { statusCode?: number }).statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", sub.user_id);
        }
        console.error("Push failed for", sub.user_id, err);
      }
    })
  );

  return new Response(
    JSON.stringify({ total: subs.length, sent, skipped }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
