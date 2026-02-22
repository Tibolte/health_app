import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    fitnessMetric: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { GET } from "../route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const mockPrisma = vi.mocked(prisma, true);

function makeRequest(days?: string): NextRequest {
  const url = days
    ? `http://localhost/api/fitness-trend?days=${days}`
    : "http://localhost/api/fitness-trend";
  return new NextRequest(url);
}

describe("GET /api/fitness-trend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to 90 days when no param provided", async () => {
    mockPrisma.fitnessMetric.findMany.mockResolvedValue([]);

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics).toEqual([]);
    expect(mockPrisma.fitnessMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { date: "asc" },
      })
    );
  });

  it("returns metrics for valid days=30", async () => {
    const mockMetrics = [
      { date: new Date("2025-03-01"), ctl: 55.2, atl: 60.1, tsb: -4.9 },
      { date: new Date("2025-03-02"), ctl: 55.5, atl: 59.8, tsb: -4.3 },
    ];
    mockPrisma.fitnessMetric.findMany.mockResolvedValue(mockMetrics as never);

    const response = await GET(makeRequest("30"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics).toHaveLength(2);
    expect(body.metrics[0].ctl).toBe(55.2);
  });

  it("accepts days=365", async () => {
    mockPrisma.fitnessMetric.findMany.mockResolvedValue([]);

    const response = await GET(makeRequest("365"));

    expect(response.status).toBe(200);
  });

  it("accepts days=7", async () => {
    mockPrisma.fitnessMetric.findMany.mockResolvedValue([]);

    const response = await GET(makeRequest("7"));

    expect(response.status).toBe(200);
  });

  it("returns 400 for invalid days param", async () => {
    const response = await GET(makeRequest("15"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid days parameter");
  });

  it("returns 400 for non-numeric days param", async () => {
    const response = await GET(makeRequest("abc"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid days parameter");
  });

  it("returns 500 on database error", async () => {
    mockPrisma.fitnessMetric.findMany.mockRejectedValue(
      new Error("Connection refused")
    );

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to load fitness trend data");
  });
});
