import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BackupData, CustomMeal, ExerciseLogEntry, LogEntry, MacroTotals, MealPeriodTag, NutritionGoals } from "../types";
import { createId } from "../lib/id";
import {
  loadCustomMeals,
  loadExerciseLogs,
  loadEntries,
  loadGoals,
  saveCustomMeals,
  saveExerciseLogs,
  saveEntries,
  saveGoals,
} from "../lib/storage";
import { useAuth } from "./AuthContext";
import {
  deleteCustomMealCloud,
  deleteExerciseLogCloud,
  deleteLogEntryCloud,
  fetchUserData,
  insertCustomMealCloud,
  insertExerciseLogCloud,
  insertLogEntryCloud,
  replaceAllUserDataCloud,
  updateCustomMealCloud,
  updateLogEntryCloud,
  upsertGoalsCloud,
} from "../lib/supabase-api";

type TrackerContextValue = {
  ready: boolean;
  storageMode: "local" | "cloud";
  entries: LogEntry[];
  customMeals: CustomMeal[];
  exerciseLogs: ExerciseLogEntry[];
  goals: NutritionGoals;
  addEntry: (input: {
    date: string;
    mealName: string;
    nutrition: MacroTotals;
    customMealId?: string;
    mealPeriod?: MealPeriodTag;
  }) => Promise<void>;
  updateEntry: (id: string, patch: Partial<Pick<LogEntry, "mealName" | "nutrition" | "mealPeriod">>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addCustomMeal: (meal: Omit<CustomMeal, "id">) => Promise<void>;
  updateCustomMeal: (id: string, patch: Partial<Omit<CustomMeal, "id">>) => Promise<void>;
  deleteCustomMeal: (id: string) => Promise<void>;
  addExerciseLog: (input: Omit<ExerciseLogEntry, "id">) => Promise<void>;
  deleteExerciseLog: (id: string) => Promise<void>;
  setGoals: (g: NutritionGoals) => Promise<void>;
  getBackupData: () => BackupData;
  importBackupData: (payload: BackupData) => Promise<void>;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
  const { isConfigured, user } = useAuth();
  const userId = user?.id;
  const cloud = isConfigured && !!userId;

  const [ready, setReady] = useState(!cloud);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogEntry[]>([]);
  const [goals, setGoalsState] = useState<NutritionGoals>(() => loadGoals());

  useEffect(() => {
    if (!cloud) {
      setEntries(loadEntries());
      setCustomMeals(loadCustomMeals());
      setExerciseLogs(loadExerciseLogs());
      setGoalsState(loadGoals());
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    (async () => {
      try {
        const data = await fetchUserData(userId!);
        if (!cancelled) {
          setEntries(data.entries);
          setCustomMeals(data.customMeals);
          setExerciseLogs(data.exerciseLogs);
          setGoalsState(data.goals);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setEntries([]);
          setCustomMeals([]);
          setExerciseLogs(loadExerciseLogs());
          setGoalsState(loadGoals());
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cloud, userId]);

  const setGoals = useCallback(
    async (g: NutritionGoals) => {
      setGoalsState(g);
      if (cloud) {
        await upsertGoalsCloud(userId!, g);
      } else {
        saveGoals(g);
      }
    },
    [cloud, userId]
  );

  const addEntry = useCallback(
    async (input: {
      date: string;
      mealName: string;
      nutrition: MacroTotals;
      customMealId?: string;
      mealPeriod?: MealPeriodTag;
    }) => {
      const entry: LogEntry = {
        id: createId(),
        date: input.date,
        mealName: input.mealName.trim() || "Meal",
        nutrition: { ...input.nutrition },
        customMealId: input.customMealId,
        mealPeriod: input.mealPeriod,
      };
      const next = [...entries, entry];
      setEntries(next);
      if (cloud) {
        await insertLogEntryCloud(userId!, entry);
      } else {
        saveEntries(next);
      }
    },
    [entries, cloud, userId]
  );

  const updateEntry = useCallback(
    async (id: string, patch: Partial<Pick<LogEntry, "mealName" | "nutrition" | "mealPeriod">>) => {
      const next = entries.map((e) =>
        e.id === id
          ? {
              ...e,
              ...patch,
              nutrition: patch.nutrition ? { ...e.nutrition, ...patch.nutrition } : e.nutrition,
            }
          : e
      );
      const updated = next.find((e) => e.id === id);
      setEntries(next);
      if (cloud && updated) {
        await updateLogEntryCloud(userId!, id, { mealName: updated.mealName, nutrition: updated.nutrition, mealPeriod: updated.mealPeriod });
      } else if (!cloud) {
        saveEntries(next);
      }
    },
    [entries, cloud, userId]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const next = entries.filter((e) => e.id !== id);
      setEntries(next);
      if (cloud) {
        await deleteLogEntryCloud(userId!, id);
      } else {
        saveEntries(next);
      }
    },
    [entries, cloud, userId]
  );

  const addCustomMeal = useCallback(
    async (meal: Omit<CustomMeal, "id">) => {
      const m: CustomMeal = { ...meal, id: createId(), name: meal.name.trim() || "Meal" };
      const next = [...customMeals, m];
      setCustomMeals(next);
      if (cloud) {
        await insertCustomMealCloud(userId!, m);
      } else {
        saveCustomMeals(next);
      }
    },
    [customMeals, cloud, userId]
  );

  const updateCustomMeal = useCallback(
    async (id: string, patch: Partial<Omit<CustomMeal, "id">>) => {
      const next = customMeals.map((m) =>
        m.id === id
          ? {
              ...m,
              ...patch,
              name: patch.name !== undefined ? patch.name.trim() || m.name : m.name,
            }
          : m
      );
      const updated = next.find((m) => m.id === id);
      setCustomMeals(next);
      if (cloud && updated) {
        await updateCustomMealCloud(userId!, id, {
          name: updated.name,
          calories: updated.calories,
          protein: updated.protein,
          carbs: updated.carbs,
          fat: updated.fat,
          fiber: updated.fiber,
        });
      } else if (!cloud) {
        saveCustomMeals(next);
      }
    },
    [customMeals, cloud, userId]
  );

  const deleteCustomMeal = useCallback(
    async (id: string) => {
      const next = customMeals.filter((m) => m.id !== id);
      setCustomMeals(next);
      if (cloud) {
        await deleteCustomMealCloud(userId!, id);
      } else {
        saveCustomMeals(next);
      }
    },
    [customMeals, cloud, userId]
  );

  const addExerciseLog = useCallback(
    async (input: Omit<ExerciseLogEntry, "id">) => {
      const entry: ExerciseLogEntry = { ...input, id: createId() };
      const next = [...exerciseLogs, entry];
      setExerciseLogs(next);
      if (cloud) {
        await insertExerciseLogCloud(userId!, entry);
      } else {
        saveExerciseLogs(next);
      }
    },
    [exerciseLogs, cloud, userId]
  );

  const deleteExerciseLog = useCallback(
    async (id: string) => {
      const next = exerciseLogs.filter((e) => e.id !== id);
      setExerciseLogs(next);
      if (cloud) {
        await deleteExerciseLogCloud(userId!, id);
      } else {
        saveExerciseLogs(next);
      }
    },
    [exerciseLogs, cloud, userId]
  );

  const getBackupData = useCallback(
    (): BackupData => ({
      version: 1,
      exportedAt: new Date().toISOString(),
      entries,
      customMeals,
      goals,
    }),
    [entries, customMeals, goals]
  );

  const importBackupData = useCallback(
    async (payload: BackupData) => {
      const nextEntries = Array.isArray(payload.entries) ? payload.entries : [];
      const nextMeals = Array.isArray(payload.customMeals) ? payload.customMeals : [];
      const nextGoals = payload.goals ?? goals;
      setEntries(nextEntries);
      setCustomMeals(nextMeals);
      setExerciseLogs([]);
      setGoalsState(nextGoals);
      if (cloud) {
        await replaceAllUserDataCloud(userId!, nextEntries, nextMeals, nextGoals, []);
      } else {
        saveEntries(nextEntries);
        saveCustomMeals(nextMeals);
        saveExerciseLogs([]);
        saveGoals(nextGoals);
      }
    },
    [goals, cloud, userId]
  );

  const value = useMemo(
    (): TrackerContextValue => ({
      ready,
      storageMode: cloud ? "cloud" : "local",
      entries,
      customMeals,
      exerciseLogs,
      goals,
      addEntry,
      updateEntry,
      deleteEntry,
      addCustomMeal,
      updateCustomMeal,
      deleteCustomMeal,
      addExerciseLog,
      deleteExerciseLog,
      setGoals,
      getBackupData,
      importBackupData,
    }),
    [
      ready,
      cloud,
      entries,
      customMeals,
      exerciseLogs,
      goals,
      addEntry,
      updateEntry,
      deleteEntry,
      addCustomMeal,
      updateCustomMeal,
      deleteCustomMeal,
      addExerciseLog,
      deleteExerciseLog,
      setGoals,
      getBackupData,
      importBackupData,
    ]
  );

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker(): TrackerContextValue {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error("useTracker must be used within TrackerProvider");
  return ctx;
}
