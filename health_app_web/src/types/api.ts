import type { Workout, FitnessMetric, PowerPb, StepCount } from "./models";

export interface SyncGetResponse {
  workouts: Workout[];
  nextWeekWorkouts: Workout[];
  fitnessMetrics: FitnessMetric[];
  powerPbs: PowerPb[];
}

export interface SyncPostResponse {
  success: boolean;
  synced?: { workouts: number; fitnessMetrics: number; powerPbs: number };
  error?: string;
}

export interface FitnessTrendResponse {
  metrics: { date: string; ctl: number; atl: number; tsb: number }[];
}

export interface StepsResponse {
  steps: StepCount[];
}
