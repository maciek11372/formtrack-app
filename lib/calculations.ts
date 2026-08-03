import type { Goal, Workout } from "./types";
export function bmi(weight: number, heightCm: number) { return weight / Math.pow(heightCm / 100, 2); }
export function bmr(weight: number, heightCm: number, age: number, sex: "male" | "female") { return 10 * weight + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161); }
export function nutrition(weight: number, heightCm: number, age: number, sex: "male" | "female", activity: number, goal: Goal) {
  const base = bmr(weight, heightCm, age, sex); const tdee = base * activity;
  const kcal = goal === "redukcja" ? tdee * .85 : goal === "masa" ? tdee * 1.1 : tdee;
  const protein = weight * (goal === "masa" ? 2 : 1.8); const fat = weight * .9; const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
  return { bmi: bmi(weight, heightCm), bmr: base, tdee, kcal, protein, fat, carbs };
}
export function workoutVolume(workout: Workout) { return workout.exercises.flatMap(e => e.sets).reduce((sum, s) => sum + s.weight * s.reps, 0); }
