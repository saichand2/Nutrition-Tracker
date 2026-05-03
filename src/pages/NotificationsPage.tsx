import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  registerServiceWorker,
  requestPushPermission,
  unsubscribeFromPush,
} from "../lib/push-notifications";
import {
  fetchPushConfig,
  upsertPushSubscription,
  deletePushSubscription,
  loadPushConfigLocal,
  savePushConfigLocal,
} from "../lib/push-api";
import type { PushReminderConfig } from "../types";
import { defaultPushConfig } from "../types";

const REMINDER_FIELDS: { key: keyof Pick<PushReminderConfig, "breakfast" | "lunch" | "dinner">; label: string; timeKey: keyof Pick<PushReminderConfig, "breakfastTime" | "lunchTime" | "dinnerTime"> }[] = [
  { key: "breakfast", label: "Breakfast", timeKey: "breakfastTime" },
  { key: "lunch", label: "Lunch", timeKey: "lunchTime" },
  { key: "dinner", label: "Dinner", timeKey: "dinnerTime" },
];

export function NotificationsPage() {
  const { user } = useAuth();
  const cloud = isSupabaseConfigured() && !!user?.id;

  const [permission, setPermission] = useState<NotificationPermission>(() =>
    "Notification" in window ? Notification.permission : "denied"
  );
  const [subscribed, setSubscribed] = useState(false);
  const [config, setConfig] = useState<PushReminderConfig>(defaultPushConfig());
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => {
    setStatus({ msg, ok });
    setTimeout(() => setStatus(null), 4000);
  };

  useEffect(() => {
    (async () => {
      if (cloud) {
        const saved = await fetchPushConfig(user!.id);
        if (saved) setConfig(saved);
      } else {
        setConfig(loadPushConfigLocal());
      }
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          setSubscribed(!!sub);
        }
      }
    })();
  }, [cloud, user]);

  const handleEnable = async () => {
    notify("Registering…");
    const reg = await registerServiceWorker();
    if (!reg) { notify("Service worker not supported in this browser.", false); return; }
    const sub = await requestPushPermission(reg);
    setPermission(Notification.permission);
    if (!sub) { notify("Permission denied or VAPID key missing. Add VITE_VAPID_PUBLIC_KEY to .env.", false); return; }
    setSubscribed(true);
    const configWithTz = { ...config, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    setConfig(configWithTz);
    if (cloud) {
      await upsertPushSubscription(user!.id, sub, configWithTz);
    }
    notify("Push notifications enabled!");
  };

  const handleDisable = async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) await unsubscribeFromPush(reg);
    setSubscribed(false);
    if (cloud) await deletePushSubscription(user!.id);
    notify("Push notifications disabled.", false);
  };

  const handleSaveConfig = async (next: PushReminderConfig) => {
    const withTz = { ...next, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    setConfig(withTz);
    if (cloud) {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) await upsertPushSubscription(user!.id, sub, withTz);
    } else {
      savePushConfigLocal(withTz);
    }
    notify("Reminders saved.");
  };

  const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-5 sm:space-y-8 sm:py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Notifications</h1>
        <p className="mt-1 text-slate-600">Set push reminders so you never forget to log a meal.</p>
      </header>

      {/* Enable / disable */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Push notifications</h2>
        {!supported ? (
          <p className="mt-3 text-sm text-slate-500">Push notifications are not supported in this browser.</p>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${subscribed ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span className="text-sm text-slate-700">{subscribed ? "Notifications are enabled" : "Notifications are disabled"}</span>
            </div>
            {permission === "denied" && (
              <p className="text-sm text-amber-700">Browser permission denied. Open your browser settings to allow notifications for this site.</p>
            )}
            {!subscribed ? (
              <button type="button" onClick={() => void handleEnable()} className="min-h-11 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white shadow hover:bg-emerald-700">
                Enable push notifications
              </button>
            ) : (
              <button type="button" onClick={() => void handleDisable()} className="min-h-11 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 font-medium text-rose-700 hover:bg-rose-100">
                Disable push notifications
              </button>
            )}
            {status && (
              <p className={`text-sm ${status.ok ? "text-emerald-700" : "text-amber-700"}`}>{status.msg}</p>
            )}
            <p className="text-xs text-slate-400">
              Delivery requires the <code className="font-mono">send-reminders</code> Supabase Edge Function
              and VAPID keys. See <code className="font-mono">.env.example</code> and
              <code className="font-mono"> supabase/functions/send-reminders/</code> in the repo.
            </p>
          </div>
        )}
      </section>

      {/* Reminder config */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Meal reminders</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose which meals to be reminded about and at what time.{" "}
          <span className="text-slate-400">Times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</span>
        </p>
        <div className="mt-4 space-y-4">
          {REMINDER_FIELDS.map(({ key, label, timeKey }) => (
            <div key={key} className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  checked={config[key]}
                  onChange={(e) => handleSaveConfig({ ...config, [key]: e.target.checked })}
                />
                {label}
              </label>
              <input
                type="time"
                value={config[timeKey]}
                disabled={!config[key]}
                onChange={(e) => handleSaveConfig({ ...config, [timeKey]: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
