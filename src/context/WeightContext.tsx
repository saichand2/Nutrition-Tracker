import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { WeightLog } from "../types";
import { createId } from "../lib/id";
import { loadWeightLogs, saveWeightLogs } from "../lib/weight-storage";
import { fetchWeightLogs, insertWeightLogCloud, deleteWeightLogCloud } from "../lib/weight-api";
import { useAuth } from "./AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";

type WeightContextValue = {
  weightLogs: WeightLog[];
  addWeightLog: (date: string, weightKg: number, note?: string) => Promise<void>;
  deleteWeightLog: (id: string) => Promise<void>;
};

const WeightContext = createContext<WeightContextValue | null>(null);

export function WeightProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const cloud = isSupabaseConfigured() && !!userId;

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

  useEffect(() => {
    if (!cloud) {
      setWeightLogs(loadWeightLogs());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const logs = await fetchWeightLogs(userId!);
        if (!cancelled) setWeightLogs(logs);
      } catch {
        if (!cancelled) setWeightLogs(loadWeightLogs());
      }
    })();
    return () => { cancelled = true; };
  }, [cloud, userId]);

  const addWeightLog = useCallback(
    async (date: string, weightKg: number, note?: string) => {
      const entry: WeightLog = { id: createId(), date, weightKg, note };
      const next = [...weightLogs, entry].sort((a, b) => a.date.localeCompare(b.date));
      setWeightLogs(next);
      if (cloud) {
        await insertWeightLogCloud(userId!, entry);
      } else {
        saveWeightLogs(next);
      }
    },
    [weightLogs, cloud, userId]
  );

  const deleteWeightLog = useCallback(
    async (id: string) => {
      const next = weightLogs.filter((w) => w.id !== id);
      setWeightLogs(next);
      if (cloud) {
        await deleteWeightLogCloud(userId!, id);
      } else {
        saveWeightLogs(next);
      }
    },
    [weightLogs, cloud, userId]
  );

  const value = useMemo(
    (): WeightContextValue => ({ weightLogs, addWeightLog, deleteWeightLog }),
    [weightLogs, addWeightLog, deleteWeightLog]
  );

  return <WeightContext.Provider value={value}>{children}</WeightContext.Provider>;
}

export function useWeight(): WeightContextValue {
  const ctx = useContext(WeightContext);
  if (!ctx) throw new Error("useWeight must be used within WeightProvider");
  return ctx;
}
