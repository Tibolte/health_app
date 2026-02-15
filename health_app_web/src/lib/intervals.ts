const BASE_URL = "https://intervals.icu/api/v1";

function getAuth() {
  const apiKey = process.env.INTERVALS_API_KEY;
  const athleteId = process.env.INTERVALS_ATHLETE_ID;
  if (!apiKey || !athleteId) {
    throw new Error("Missing INTERVALS_API_KEY or INTERVALS_ATHLETE_ID");
  }
  const token = Buffer.from(`API_KEY:${apiKey}`).toString("base64");
  return { athleteId, headers: { Authorization: `Basic ${token}` } };
}

// --- Types for Intervals.icu API responses ---

export interface IntervalsActivity {
  id: string;
  start_date_local: string;
  type: string;
  name: string;
  description?: string;
  moving_time?: number; // seconds
  distance?: number; // meters
  icu_training_load?: number;
  icu_intensity?: number;
  weighted_average_watts?: number;
  average_watts?: number;
  max_watts?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  total_elevation_gain?: number;
}

export interface IntervalsEvent {
  id: number;
  start_date_local: string;
  category: string;
  name: string;
  description?: string;
  coach_notes?: string;
  type: string;
  moving_time?: number; // seconds
  icu_training_load?: number;
}

export interface IntervalsWellness {
  id: string;
  ctl?: number;
  atl?: number;
  ctlLoad?: number;
  atlLoad?: number;
}

// --- Fetch functions ---

export async function fetchActivities(
  oldest: string,
  newest: string
): Promise<IntervalsActivity[]> {
  const { athleteId, headers } = getAuth();
  const url = `${BASE_URL}/athlete/${athleteId}/activities?oldest=${oldest}&newest=${newest}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Activities fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchEvents(
  oldest: string,
  newest: string
): Promise<IntervalsEvent[]> {
  const { athleteId, headers } = getAuth();
  const url = `${BASE_URL}/athlete/${athleteId}/events?oldest=${oldest}&newest=${newest}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Events fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchWellness(
  oldest: string,
  newest: string
): Promise<IntervalsWellness[]> {
  const { athleteId, headers } = getAuth();
  const url = `${BASE_URL}/athlete/${athleteId}/wellness?oldest=${oldest}&newest=${newest}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Wellness fetch failed: ${res.status}`);
  return res.json();
}

// --- Mapping helpers ---

export function mapActivity(a: IntervalsActivity) {
  return {
    externalId: String(a.id),
    date: new Date(a.start_date_local),
    title: a.name || "Untitled",
    sport: a.type || "Unknown",
    description: a.description ?? null,
    isCompleted: true,
    duration: a.moving_time ? Math.round(a.moving_time / 60) : null,
    distance: a.distance ? +(a.distance / 1000).toFixed(2) : null,
    tss: a.icu_training_load ?? null,
    intensityFactor: a.icu_intensity ?? null,
    normalizedPower: a.weighted_average_watts ?? null,
    averagePower: a.average_watts ?? null,
    maxPower: a.max_watts ?? null,
    averageHr: a.average_heartrate ? Math.round(a.average_heartrate) : null,
    maxHr: a.max_heartrate ? Math.round(a.max_heartrate) : null,
    calories: a.calories ?? null,
    elevationGain: a.total_elevation_gain ?? null,
  };
}

export function mapEvent(e: IntervalsEvent) {
  return {
    externalId: `event-${e.id}`,
    date: new Date(e.start_date_local),
    title: e.name || "Planned workout",
    sport: e.type || e.category || "Unknown",
    description: e.description ?? null,
    coachNotes: e.coach_notes ?? null,
    isCompleted: false,
    plannedDuration: e.moving_time ? Math.round(e.moving_time / 60) : null,
    plannedTss: e.icu_training_load ?? null,
  };
}

export function mapWellness(w: IntervalsWellness) {
  const ctl = w.ctl ?? w.ctlLoad ?? 0;
  const atl = w.atl ?? w.atlLoad ?? 0;
  return {
    date: new Date(w.id), // wellness id is the date string
    ctl,
    atl,
    tsb: +(ctl - atl).toFixed(1),
  };
}
