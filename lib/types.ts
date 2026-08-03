export type Goal = "redukcja" | "utrzymanie" | "masa";
export type Measurement = { id: string; date: string; weight?: number; waist?: number; chest?: number; arm?: number; thigh?: number; bodyFat?: number };
export type WorkoutSet = { weight: number; reps: number; rir?: number };
export type WorkoutExercise = { name: string; muscle: string; sets: WorkoutSet[] };
export type Workout = { id: string; date: string; name: string; duration: number; exercises: WorkoutExercise[] };
