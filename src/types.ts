export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type LogEntry = {
  id: string;
  date: string;
  mealName: string;
  nutrition: MacroTotals;
  customMealId?: string;
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
