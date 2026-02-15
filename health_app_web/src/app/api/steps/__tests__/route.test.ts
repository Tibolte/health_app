import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing route
vi.mock("@/lib/prisma", () => ({
  prisma: {
    stepCount: {
      upsert: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { POST, GET, OPTIONS } from "../route";
import { prisma } from "@/lib/prisma";

const mockPrisma = vi.mocked(prisma, true);

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/steps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("OPTIONS /api/steps", () => {
  it("returns 204 with CORS headers", async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, POST, OPTIONS"
    );
  });
});

describe("POST /api/steps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts a single step entry", async () => {
    const request = makeRequest({ date: "2025-03-12", steps: 8500 });

    const response = await POST(request as never);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.upserted).toBe(1);
    expect(mockPrisma.stepCount.upsert).toHaveBeenCalledTimes(1);
    expect(mockPrisma.stepCount.upsert).toHaveBeenCalledWith({
      where: { date: new Date("2025-03-12") },
      create: {
        date: new Date("2025-03-12"),
        steps: 8500,
        source: "healthkit",
      },
      update: {
        steps: 8500,
        source: "healthkit",
      },
    });
  });

  it("upserts an array of step entries", async () => {
    const request = makeRequest([
      { date: "2025-03-12", steps: 8500 },
      { date: "2025-03-13", steps: 12000 },
    ]);

    const response = await POST(request as never);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.upserted).toBe(2);
    expect(mockPrisma.stepCount.upsert).toHaveBeenCalledTimes(2);
  });

  it("returns 400 when date is missing", async () => {
    const request = makeRequest({ steps: 8500 });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Each entry requires 'date' and 'steps'");
  });

  it("returns 400 when steps is missing", async () => {
    const request = makeRequest({ date: "2025-03-12" });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Each entry requires 'date' and 'steps'");
  });

  it("returns 500 on database error", async () => {
    mockPrisma.stepCount.upsert.mockRejectedValue(new Error("DB error"));

    const request = makeRequest({ date: "2025-03-12", steps: 8500 });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe("DB error");
  });
});

describe("GET /api/steps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns step data", async () => {
    const mockSteps = [
      { id: "s1", date: "2025-03-12", steps: 8500, source: "healthkit" },
    ];
    mockPrisma.stepCount.findMany.mockResolvedValue(mockSteps as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.steps).toEqual(mockSteps);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("returns 500 on database error", async () => {
    mockPrisma.stepCount.findMany.mockRejectedValue(
      new Error("Connection lost")
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to load step data");
  });
});
