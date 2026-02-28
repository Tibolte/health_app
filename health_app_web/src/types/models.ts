export interface Workout {
  id: string;
  externalId: string;
  date: string;
  title: string;
  sport: string;
  description?: string | null;
  coachNotes?: string | null;
  isCompleted: boolean;
  plannedDuration?: number | null;
  plannedTss?: number | null;
  duration?: number | null;
  distance?: number | null;
  tss?: number | null;
  intensityFactor?: number | null;
  normalizedPower?: number | null;
  averagePower?: number | null;
  maxPower?: number | null;
  averageHr?: number | null;
  maxHr?: number | null;
  calories?: number | null;
  elevationGain?: number | null;
}

export interface FitnessMetric {
  id: string;
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
}

export interface PowerPb {
  id: string;
  duration: number;
  power: number;
  recordedAt: string;
}

export interface MetricPoint {
  date: string;
  timestamp: number;
  ctl: number;
  atl: number;
  tsb: number;
}
