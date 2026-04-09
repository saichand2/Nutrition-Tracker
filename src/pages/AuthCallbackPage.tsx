import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

/**
 * Handles Supabase email confirmation (and similar) redirects.
 * Dashboard must allow this exact URL: Site URL or Redirect URLs → …/auth/callback
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }

    const supabase = getSupabase();
    let cancelled = false;

    const finish = () => {
      if (!cancelled) navigate("/", { replace: true });
    };

    const verify = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error: ex } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (ex) throw ex;
        }

        const { data: first, error: e1 } = await supabase.auth.getSession();
        if (e1) throw e1;
        if (first.session) {
          finish();
          return;
        }

        await new Promise((r) => setTimeout(r, 150));
        const { data: second, error: e2 } = await supabase.auth.getSession();
        if (e2) throw e2;
        if (second.session) {
          finish();
          return;
        }

        const hash = url.hash.replace(/^#/, "");
        if (hash.includes("error=")) {
          const hp = new URLSearchParams(hash);
          throw new Error(hp.get("error_description") || hp.get("error") || "Email link failed.");
        }

        if (!cancelled) {
          setError(
            "No session from this link. It may have expired, or the redirect URL is not allowed in Supabase (Authentication → URL Configuration → Redirect URLs)."
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Verification failed.");
        }
      }
    };

    void verify();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || !session) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        finish();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.35),transparent)]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900" aria-hidden />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-bold text-emerald-800">
          N
        </div>
        <h1 className="mt-4 text-lg font-semibold text-slate-900">Email verification</h1>
        {error ? (
          <>
            <p className="mt-3 text-sm text-rose-700">{error}</p>
            <p className="mt-4 text-xs text-slate-500">
              In Supabase: Authentication → URL Configuration — add your app URL with path{" "}
              <code className="rounded bg-slate-100 px-1 font-mono">/auth/callback</code> under Redirect URLs (e.g.{" "}
              <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">http://localhost:5173/auth/callback</code>
              ).
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-600">Confirming your link…</p>
        )}
      </div>
    </div>
  );
}
