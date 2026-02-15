import { describe, it, expect, vi, afterEach } from "vitest";
import { GET } from "../route";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns status ok with timestamp", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-12T10:00:00.000Z"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBe("2025-03-12T10:00:00.000Z");
  });
});
