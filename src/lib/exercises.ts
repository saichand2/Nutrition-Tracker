import type { ExerciseGroupId } from "../types";

export const EXERCISE_GROUP_LABELS: Record<ExerciseGroupId, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
};

export const EXERCISES_BY_GROUP: Record<ExerciseGroupId, readonly string[]> = {
  push: [
    "Flat bench",
    "Incline bench",
    "Overhead shoulder",
    "Sideshoulder",
    "Pulldown tricep",
    "Overhead tricep",
  ],
  pull: [
    "Rowpull",
    "Latpull down wide grip",
    "Latpull down close grip",
    "Bicep curls",
    "Bicep curls side",
  ],
  legs: ["Squat", "Leg press", "Leg extension", "Leg curl"],
};

export const EXERCISE_GROUP_IDS: ExerciseGroupId[] = ["push", "pull", "legs"];
