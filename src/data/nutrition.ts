// Pure helpers for nutrition math and date handling. No side effects.

import type { FoodItem, ExtraEntry, Goals, Meal, MealLog, NutritionDoc } from './types';

export interface MacroTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

const ZERO: MacroTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

/** Sum the macros declared on a list of food items. */
export function itemsTotals(items: FoodItem[]): MacroTotals {
  return items.reduce<MacroTotals>(
    (acc, it) => ({
      calories: acc.calories + (it.calories ?? 0),
      protein_g: acc.protein_g + (it.protein_g ?? 0),
      carbs_g: acc.carbs_g + (it.carbs_g ?? 0),
      fat_g: acc.fat_g + (it.fat_g ?? 0),
    }),
    { ...ZERO },
  );
}

/** Sum the macros declared on a single meal's items. */
export function mealTotals(meal: Meal): MacroTotals {
  return itemsTotals(meal.items);
}

/** Sum macros across a list of meals. */
export function sumMeals(meals: Meal[]): MacroTotals {
  return meals.reduce<MacroTotals>((acc, m) => {
    const t = mealTotals(m);
    return {
      calories: acc.calories + t.calories,
      protein_g: acc.protein_g + t.protein_g,
      carbs_g: acc.carbs_g + t.carbs_g,
      fat_g: acc.fat_g + t.fat_g,
    };
  }, { ...ZERO });
}

/** Local date as "YYYY-MM-DD" (avoids UTC off-by-one from toISOString). */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function logsForDate(doc: NutritionDoc, date: string): MealLog[] {
  return doc.logs.meals.filter((l) => l.date === date);
}

export function mealStatus(
  doc: NutritionDoc,
  date: string,
  mealId: string,
): MealLog['status'] | null {
  // Last write wins if there are duplicates.
  const found = doc.logs.meals.filter((l) => l.date === date && l.mealId === mealId);
  return found.length ? found[found.length - 1].status : null;
}

/** Ad-hoc foods logged on `date`, newest first. */
export function extrasForDate(doc: NutritionDoc, date: string): ExtraEntry[] {
  return (doc.logs.extras ?? [])
    .filter((e) => e.date === date)
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

/**
 * Macros consumed on `date`: eaten (full) and partial (half) meals, plus any
 * ad-hoc extras (candy, coffee, …) logged that day.
 */
export function consumedTotals(doc: NutritionDoc, date: string): MacroTotals {
  const byId = new Map(doc.plan.meals.map((m) => [m.id, m]));
  const fromMeals = logsForDate(doc, date).reduce<MacroTotals>((acc, log) => {
    const meal = byId.get(log.mealId);
    if (!meal || log.status === 'skipped') return acc;
    const t = mealTotals(meal);
    const factor = log.status === 'partial' ? 0.5 : 1;
    return {
      calories: acc.calories + t.calories * factor,
      protein_g: acc.protein_g + t.protein_g * factor,
      carbs_g: acc.carbs_g + t.carbs_g * factor,
      fat_g: acc.fat_g + t.fat_g * factor,
    };
  }, { ...ZERO });

  return extrasForDate(doc, date).reduce<MacroTotals>((acc, e) => ({
    calories: acc.calories + (e.calories ?? 0),
    protein_g: acc.protein_g + (e.protein_g ?? 0),
    carbs_g: acc.carbs_g + (e.carbs_g ?? 0),
    fat_g: acc.fat_g + (e.fat_g ?? 0),
  }), fromMeals);
}

/** Water (ml) logged on `date`, summed from the day's measurement. */
export function waterForDate(doc: NutritionDoc, date: string): number {
  return doc.logs.measurements.find((m) => m.date === date)?.water_ml ?? 0;
}

export function goalsAsTotals(goals?: Goals): MacroTotals {
  return {
    calories: goals?.calories ?? 0,
    protein_g: goals?.protein_g ?? 0,
    carbs_g: goals?.carbs_g ?? 0,
    fat_g: goals?.fat_g ?? 0,
  };
}

export function round(n: number): number {
  return Math.round(n);
}

/** Aggregated metrics for a single tracked day. */
export interface DaySummary {
  date: string;
  totals: MacroTotals;
  water_ml: number;
  weight_kg?: number;
  /** Plan meals marked eaten or partial that day. */
  mealsAttended: number;
  /** Total meals in the plan (denominator for adherence). */
  planMeals: number;
}

/** Build a per-day history (ascending) from every kind of log in the doc. */
export function history(doc: NutritionDoc): DaySummary[] {
  const planMeals = doc.plan.meals.length;
  const dates = new Set<string>();
  doc.logs.meals.forEach((l) => dates.add(l.date));
  (doc.logs.extras ?? []).forEach((e) => dates.add(e.date));
  doc.logs.measurements.forEach((m) => dates.add(m.date));

  return [...dates]
    .sort((a, b) => a.localeCompare(b))
    .map((date) => {
      const attended = doc.logs.meals.filter(
        (l) => l.date === date && (l.status === 'eaten' || l.status === 'partial'),
      ).length;
      const measurement = doc.logs.measurements.find((m) => m.date === date);
      return {
        date,
        totals: consumedTotals(doc, date),
        water_ml: waterForDate(doc, date),
        weight_kg: measurement?.weight_kg,
        mealsAttended: attended,
        planMeals,
      };
    });
}
