import { useState } from "react";
import { useAuth } from "../context/AuthContext";

type Feedback = { kind: "error" | "success"; text: string } | null;

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setFeedback(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setBusy(true);
    try {
      const fn = mode === "signin" ? signIn : signUp;
      const { error } = await fn(email.trim(), password);
      if (error) {
        setFeedback({ kind: "error", text: error.message });
        return;
      }
      if (mode === "signup") {
        setMode("signin");
        setFeedback({
          kind: "success",
          text: "Account created. If email confirmation is on, check your inbox—then sign in here.",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.35),transparent),radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(6,182,212,0.2),transparent),radial-gradient(ellipse_50%_30%_at_0%_80%,rgba(52,211,153,0.25),transparent)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900"
        aria-hidden
      />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-extrabold shadow-lg shadow-emerald-900/40">
            <span className="bg-gradient-to-br from-emerald-500 to-teal-600 bg-clip-text text-transparent">N</span>
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">Nutrition Tracker</h1>
          <p className="mt-2 text-sm text-emerald-100/80">
            Sign in to sync meals, goals, and progress across devices.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
          <div className="flex rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              className={`min-h-11 flex-1 rounded-xl text-sm font-semibold transition ${
                mode === "signin"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => switchMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`min-h-11 flex-1 rounded-xl text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => switchMode("signup")}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                placeholder="you@example.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">Password</span>
              <input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                placeholder="••••••••"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
              <span className="mt-1 block text-xs text-slate-500">At least 6 characters</span>
            </label>

            {feedback && (
              <div
                role="status"
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  feedback.kind === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
                }`}
              >
                {feedback.text}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="min-h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 font-semibold text-white shadow-md shadow-emerald-900/20 transition hover:from-emerald-600 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 border-t border-slate-100 pt-6 text-center text-xs leading-relaxed text-slate-500">
            No Supabase keys in <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">.env</code>
            ? The app uses this device only—add your project URL and anon key to enable cloud sync.
          </p>
        </div>
      </div>
    </div>
  );
}
