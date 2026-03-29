import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

type AuthContextValue = {
  isConfigured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const isConfigured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isConfigured);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      setSession(null);
      return;
    }

    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isConfigured) return { error: new Error("Supabase not configured") };
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  }, [isConfigured]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isConfigured) return { error: new Error("Supabase not configured") };
    const { error } = await getSupabase().auth.signUp({ email, password });
    return { error: error ?? null };
  }, [isConfigured]);

  const signOut = useCallback(async () => {
    if (!isConfigured) return;
    await getSupabase().auth.signOut();
  }, [isConfigured]);

  const value = useMemo(
    () => ({
      isConfigured,
      loading,
      session,
      user: session?.user ?? null,
      signIn,
      signUp,
      signOut,
    }),
    [isConfigured, loading, session, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
