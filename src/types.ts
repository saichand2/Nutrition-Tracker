export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type MealPeriodTag = "breakfast" | "lunch" | "dinner" | "snack";

export type LogEntry = {
  id: string;
  date: string;
  mealName: string;
  nutrition: MacroTotals;
  customMealId?: string;
  mealPeriod?: MealPeriodTag;
};

export type CustomMeal = {
  id: string;
  name: string;
} & MacroTotals;

export type NutritionGoals = MacroTotals;

export type BackupData = {
  version: 1;
  exportedAt: string;
  entries: LogEntry[];
  customMeals: CustomMeal[];
  goals: NutritionGoals;
};

export type WeightLog = {
  id: string;
  date: string;
  weightKg: number;
  note?: string;
};

export type PushReminderConfig = {
  breakfast: boolean;
  breakfastTime: string;
  lunch: boolean;
  lunchTime: string;
  dinner: boolean;
  dinnerTime: string;
};

export const emptyMacros = (): MacroTotals => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
});

export const defaultGoals = (): NutritionGoals => ({
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
  fiber: 30,
});

export const defaultPushConfig = (): PushReminderConfig => ({
  breakfast: false,
  breakfastTime: "08:00",
  lunch: false,
  lunchTime: "12:30",
  dinner: false,
  dinnerTime: "19:00",
});

export type ExerciseGroupId = "push" | "pull" | "legs";

export type ExerciseLogEntry = {
  id: string;
  date: string;
  groupId: ExerciseGroupId;
  exerciseName: string;
  weightKg: number | null;
};
