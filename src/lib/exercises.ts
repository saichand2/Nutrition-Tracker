import type { ExerciseGroupId } from "../types";

export const EXERCISE_GROUP_LABELS: Record<ExerciseGroupId, string> = {
  push: "Push",
  pull: "Pull",
  biceps: "Biceps",
  legs: "Legs",
};

export const EXERCISES_BY_GROUP: Record<ExerciseGroupId, readonly string[]> = {
  push: ["Chest", "Tricep", "Shoulder"],
  pull: ["Lat pulldown (close grip)", "Lat pulldown (wide grip)", "Row pull"],
  biceps: ["Bicep curls", "Bicep side way"],
  legs: ["Squat", "Leg press", "Leg extension", "Leg curl"],
};

export const EXERCISE_GROUP_IDS: ExerciseGroupId[] = ["push", "pull", "biceps", "legs"];
