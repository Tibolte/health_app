import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing route
vi.mock("@/lib/prisma", () => ({
  prisma: {
    workout: {
      upsert: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({}),
    },
    fitnessMetric: {
      upsert: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
    powerPb: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Mock intervals fetch functions
vi.mock("@/lib/intervals", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/intervals")>();
  return {
    ...actual,
    fetchActivities: vi.fn(),
    fetchEvents: vi.fn(),
    fetchWellness: vi.fn(),
  };
});

// Mock date-utils to return deterministic values
vi.mock("@/lib/date-utils", () => ({
  getCurrentWeekRange: () => ({
    start: "2025-03-10",
    end: "2025-03-16",
  }),
  getNextWeekRange: () => ({
    start: "2025-03-17",
    end: "2025-03-23",
  }),
  getDateRange: (days: number) => ({
    start: `range-start-${days}`,
    end: `range-end-${days}`,
  }),
}));

import { POST, GET } from "../route";
import { prisma } from "@/lib/prisma";
import {
  fetchActivities,
  fetchEvents,
  fetchWellness,
} from "@/lib/intervals";

const mockFetchActivities = vi.mocked(fetchActivities);
const mockFetchEvents = vi.mocked(fetchEvents);
const mockFetchWellness = vi.mocked(fetchWellness);
const mockPrisma = vi.mocked(prisma, true);

describe("POST /api/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncs activities, events, and wellness successfully", async () => {
    mockFetchActivities.mockResolvedValue([
      {
        id: "a1",
        start_date_local: "2025-03-12T08:00:00",
        type: "Ride",
        name: "Morning Ride",
      },
    ]);
    mockFetchEvents
      .mockResolvedValueOnce([
        {
          id: 1,
          start_date_local: "2025-03-14T07:00:00",
          category: "WORKOUT",
          name: "Intervals",
          type: "Ride",
        },
      ])
      .mockResolvedValueOnce([]); // next week: empty
    mockFetchWellness.mockResolvedValue([
      { id: "2025-03-12", ctl: 60, atl: 70 },
    ]);

    const response = await POST();
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.synced.workouts).toBe(2); // 1 activity + 1 event
    expect(body.synced.fitnessMetrics).toBe(1);
    expect(mockPrisma.workout.upsert).toHaveBeenCalledTimes(2);
    expect(mockPrisma.fitnessMetric.upsert).toHaveBeenCalledTimes(1);
  });

  it("filters out non-WORKOUT events", async () => {
    mockFetchActivities.mockResolvedValue([]);
    mockFetchEvents
      .mockResolvedValueOnce([
        {
          id: 1,
          start_date_local: "2025-03-14T07:00:00",
          category: "WORKOUT",
          name: "Intervals",
          type: "Ride",
        },
        {
          id: 2,
          start_date_local: "2025-03-14T07:00:00",
          category: "NOTE",
          name: "Coach Note",
          type: "Note",
        },
      ])
      .mockResolvedValueOnce([]); // next week: empty
    mockFetchWellness.mockResolvedValue([]);

    const response = await POST();
    const body = await response.json();

    expect(body.synced.workouts).toBe(1);
    expect(mockPrisma.workout.upsert).toHaveBeenCalledTimes(1);
  });

  it("merges planned event title into completed activity", async () => {
    mockFetchActivities.mockResolvedValue([
      {
        id: "a1",
        start_date_local: "2025-03-12T08:00:00",
        type: "Ride",
        name: "Morning Ride",
      },
    ]);
    mockFetchEvents
      .mockResolvedValueOnce([
        {
          id: 1,
          start_date_local: "2025-03-12T07:00:00",
          category: "WORKOUT",
          name: "Sweet Spot Intervals",
          type: "Ride",
        },
      ])
      .mockResolvedValueOnce([]); // next week: empty
    mockFetchWellness.mockResolvedValue([]);

    await POST();

    expect(mockPrisma.workout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { externalId: "a1" },
        data: expect.objectContaining({
          title: "Sweet Spot Intervals",
        }),
      })
    );
  });

  it("handles partial fetch failures via Promise.allSettled", async () => {
    mockFetchActivities.mockRejectedValue(new Error("Network error"));
    mockFetchEvents
      .mockResolvedValueOnce([
        {
          id: 1,
          start_date_local: "2025-03-14T07:00:00",
          category: "WORKOUT",
          name: "Test",
          type: "Ride",
        },
      ])
      .mockResolvedValueOnce([]); // next week: empty
    mockFetchWellness.mockResolvedValue([]);

    const response = await POST();
    const body = await response.json();

    // Activities failed but events succeeded
    expect(body.success).toBe(true);
    expect(body.synced.workouts).toBe(1);
  });

  it("fetches wellness with 365-day range and next week events", async () => {
    mockFetchActivities.mockResolvedValue([]);
    mockFetchEvents.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockFetchWellness.mockResolvedValue([]);

    await POST();

    expect(mockFetchActivities).toHaveBeenCalledWith("2025-03-10", "2025-03-16");
    expect(mockFetchEvents).toHaveBeenCalledWith("2025-03-10", "2025-03-16");
    expect(mockFetchEvents).toHaveBeenCalledWith("2025-03-17", "2025-03-23");
    expect(mockFetchWellness).toHaveBeenCalledWith("range-start-365", "range-end-365");
  });

  it("upserts next week events as planned workouts", async () => {
    mockFetchActivities.mockResolvedValue([]);
    // First call: current week events (empty), Second call: next week events
    mockFetchEvents
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 10,
          start_date_local: "2025-03-19T07:00:00",
          category: "WORKOUT",
          name: "Long Ride",
          type: "Ride",
        },
        {
          id: 11,
          start_date_local: "2025-03-20T07:00:00",
          category: "NOTE",
          name: "Rest Day Note",
          type: "Note",
        },
      ]);
    mockFetchWellness.mockResolvedValue([]);

    const response = await POST();
    const body = await response.json();

    // Only 1 next-week workout (NOTE filtered out)
    expect(body.synced.workouts).toBe(1);
    expect(mockPrisma.workout.upsert).toHaveBeenCalledTimes(1);
  });

  it("returns 500 on Prisma error", async () => {
    mockFetchActivities.mockResolvedValue([
      {
        id: "a1",
        start_date_local: "2025-03-12T08:00:00",
        type: "Ride",
        name: "Ride",
      },
    ]);
    mockFetchEvents.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockFetchWellness.mockResolvedValue([]);
    mockPrisma.workout.upsert.mockRejectedValue(new Error("DB error"));

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe("DB error");
  });
});

describe("GET /api/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns workouts, nextWeekWorkouts, fitnessMetrics, and powerPbs", async () => {
    const mockWorkouts = [{ id: "w1", title: "Ride" }];
    const mockNextWeekWorkouts = [{ id: "w2", title: "Long Ride" }];
    const mockMetrics = [{ id: "m1", ctl: 60 }];
    const mockPbs = [{ id: "p1", duration: 20, power: 300 }];

    mockPrisma.workout.findMany
      .mockResolvedValueOnce(mockWorkouts as never)
      .mockResolvedValueOnce(mockNextWeekWorkouts as never);
    mockPrisma.fitnessMetric.findMany.mockResolvedValue(mockMetrics as never);
    mockPrisma.powerPb.findMany.mockResolvedValue(mockPbs as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.workouts).toEqual(mockWorkouts);
    expect(body.nextWeekWorkouts).toEqual(mockNextWeekWorkouts);
    expect(body.fitnessMetrics).toEqual(mockMetrics);
    expect(body.powerPbs).toEqual(mockPbs);
  });

  it("returns empty arrays when DB is empty", async () => {
    mockPrisma.workout.findMany.mockResolvedValue([]);
    mockPrisma.fitnessMetric.findMany.mockResolvedValue([]);
    mockPrisma.powerPb.findMany.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(body.workouts).toEqual([]);
    expect(body.nextWeekWorkouts).toEqual([]);
    expect(body.fitnessMetrics).toEqual([]);
    expect(body.powerPbs).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    mockPrisma.workout.findMany.mockRejectedValue(new Error("Connection lost"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to load dashboard data");
  });
});
