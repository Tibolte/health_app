import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mapActivity,
  mapEvent,
  mapWellness,
  fetchActivities,
  fetchEvents,
  fetchWellness,
  type IntervalsActivity,
  type IntervalsEvent,
  type IntervalsWellness,
} from "../intervals";

// --- Mapping function tests (pure, no mocks) ---

describe("mapActivity", () => {
  it("maps a full activity object", () => {
    const input: IntervalsActivity = {
      id: "i123",
      start_date_local: "2025-03-12T08:00:00",
      type: "Ride",
      name: "Morning Ride",
      description: "Easy spin",
      moving_time: 3600,
      distance: 35000,
      icu_training_load: 75,
      icu_intensity: 0.85,
      weighted_average_watts: 220,
      average_watts: 200,
      max_watts: 450,
      average_heartrate: 145.6,
      max_heartrate: 172.3,
      calories: 800,
      total_elevation_gain: 350,
    };

    const result = mapActivity(input);

    expect(result).toEqual({
      externalId: "i123",
      date: new Date("2025-03-12T08:00:00"),
      title: "Morning Ride",
      sport: "Ride",
      description: "Easy spin",
      isCompleted: true,
      duration: 60,
      distance: 35,
      tss: 75,
      intensityFactor: 0.85,
      normalizedPower: 220,
      averagePower: 200,
      maxPower: 450,
      averageHr: 146,
      maxHr: 172,
      calories: 800,
      elevationGain: 350,
    });
  });

  it("maps a minimal activity with null optionals", () => {
    const input: IntervalsActivity = {
      id: "i456",
      start_date_local: "2025-03-12T08:00:00",
      type: "Run",
      name: "Jog",
    };

    const result = mapActivity(input);

    expect(result.externalId).toBe("i456");
    expect(result.title).toBe("Jog");
    expect(result.duration).toBeNull();
    expect(result.distance).toBeNull();
    expect(result.tss).toBeNull();
    expect(result.averageHr).toBeNull();
    expect(result.maxHr).toBeNull();
    expect(result.calories).toBeNull();
    expect(result.elevationGain).toBeNull();
  });

  it("uses 'Untitled' for empty name", () => {
    const input: IntervalsActivity = {
      id: "i789",
      start_date_local: "2025-03-12T08:00:00",
      type: "Ride",
      name: "",
    };

    expect(mapActivity(input).title).toBe("Untitled");
  });
});

describe("mapEvent", () => {
  it("maps a full event object", () => {
    const input: IntervalsEvent = {
      id: 42,
      start_date_local: "2025-03-14T07:00:00",
      category: "WORKOUT",
      name: "Intervals",
      description: "4x4min VO2max",
      coach_notes: "Keep cadence high",
      type: "Ride",
      moving_time: 5400,
      icu_training_load: 90,
    };

    const result = mapEvent(input);

    expect(result).toEqual({
      externalId: "event-42",
      date: new Date("2025-03-14T07:00:00"),
      title: "Intervals",
      sport: "Ride",
      description: "4x4min VO2max",
      coachNotes: "Keep cadence high",
      isCompleted: false,
      plannedDuration: 90,
      plannedTss: 90,
    });
  });

  it("uses 'Planned workout' for empty name", () => {
    const input: IntervalsEvent = {
      id: 99,
      start_date_local: "2025-03-14T07:00:00",
      category: "WORKOUT",
      name: "",
      type: "Ride",
    };

    expect(mapEvent(input).title).toBe("Planned workout");
  });

  it("falls back to category when type is missing", () => {
    const input: IntervalsEvent = {
      id: 100,
      start_date_local: "2025-03-14T07:00:00",
      category: "WORKOUT",
      name: "Test",
      type: "",
    };

    expect(mapEvent(input).sport).toBe("WORKOUT");
  });
});

describe("mapWellness", () => {
  it("maps wellness with ctl/atl fields", () => {
    const input: IntervalsWellness = {
      id: "2025-03-12",
      ctl: 65.3,
      atl: 72.1,
    };

    const result = mapWellness(input);

    expect(result.date).toEqual(new Date("2025-03-12"));
    expect(result.ctl).toBe(65.3);
    expect(result.atl).toBe(72.1);
    expect(result.tsb).toBe(-6.8);
  });

  it("falls back to ctlLoad/atlLoad", () => {
    const input: IntervalsWellness = {
      id: "2025-03-12",
      ctlLoad: 50,
      atlLoad: 40,
    };

    const result = mapWellness(input);

    expect(result.ctl).toBe(50);
    expect(result.atl).toBe(40);
    expect(result.tsb).toBe(10);
  });

  it("defaults to 0 when all fields missing", () => {
    const input: IntervalsWellness = {
      id: "2025-03-12",
    };

    const result = mapWellness(input);

    expect(result.ctl).toBe(0);
    expect(result.atl).toBe(0);
    expect(result.tsb).toBe(0);
  });
});

// --- Fetch function tests (mock global.fetch) ---

describe("fetchActivities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      INTERVALS_API_KEY: "test-key",
      INTERVALS_ATHLETE_ID: "i123",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("calls correct URL with auth header", async () => {
    await fetchActivities("2025-03-10", "2025-03-16");

    expect(fetch).toHaveBeenCalledWith(
      "https://intervals.icu/api/v1/athlete/i123/activities?oldest=2025-03-10&newest=2025-03-16",
      {
        headers: {
          Authorization: `Basic ${Buffer.from("API_KEY:test-key").toString("base64")}`,
        },
      }
    );
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 })
    );

    await expect(fetchActivities("2025-03-10", "2025-03-16")).rejects.toThrow(
      "Activities fetch failed: 401"
    );
  });

  it("throws when env vars are missing", async () => {
    delete process.env.INTERVALS_API_KEY;

    await expect(fetchActivities("2025-03-10", "2025-03-16")).rejects.toThrow(
      "Missing INTERVALS_API_KEY or INTERVALS_ATHLETE_ID"
    );
  });
});

describe("fetchEvents", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      INTERVALS_API_KEY: "test-key",
      INTERVALS_ATHLETE_ID: "i123",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("calls correct URL with auth header", async () => {
    await fetchEvents("2025-03-10", "2025-03-16");

    expect(fetch).toHaveBeenCalledWith(
      "https://intervals.icu/api/v1/athlete/i123/events?oldest=2025-03-10&newest=2025-03-16",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("Basic "),
        }),
      })
    );
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );

    await expect(fetchEvents("2025-03-10", "2025-03-16")).rejects.toThrow(
      "Events fetch failed: 500"
    );
  });
});

describe("fetchWellness", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      INTERVALS_API_KEY: "test-key",
      INTERVALS_ATHLETE_ID: "i123",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("calls correct URL with auth header", async () => {
    await fetchWellness("2025-03-10", "2025-03-16");

    expect(fetch).toHaveBeenCalledWith(
      "https://intervals.icu/api/v1/athlete/i123/wellness?oldest=2025-03-10&newest=2025-03-16",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("Basic "),
        }),
      })
    );
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403 })
    );

    await expect(fetchWellness("2025-03-10", "2025-03-16")).rejects.toThrow(
      "Wellness fetch failed: 403"
    );
  });
});
