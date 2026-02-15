import { describe, it, expect, vi, afterEach } from "vitest";
import { getCurrentWeekRange } from "../date-utils";

describe("getCurrentWeekRange", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns Mon–Sun range when today is Wednesday", () => {
    vi.useFakeTimers();
    // Wednesday 2025-03-12
    vi.setSystemTime(new Date(2025, 2, 12, 10, 0, 0));

    const { start, end } = getCurrentWeekRange();
    expect(start).toBe("2025-03-10"); // Monday
    expect(end).toBe("2025-03-16"); // Sunday
  });

  it("returns correct range when today is Monday", () => {
    vi.useFakeTimers();
    // Monday 2025-03-10
    vi.setSystemTime(new Date(2025, 2, 10, 10, 0, 0));

    const { start, end } = getCurrentWeekRange();
    expect(start).toBe("2025-03-10");
    expect(end).toBe("2025-03-16");
  });

  it("returns correct range when today is Sunday", () => {
    vi.useFakeTimers();
    // Sunday 2025-03-16
    vi.setSystemTime(new Date(2025, 2, 16, 10, 0, 0));

    const { start, end } = getCurrentWeekRange();
    expect(start).toBe("2025-03-10");
    expect(end).toBe("2025-03-16");
  });

  it("handles month boundary crossing", () => {
    vi.useFakeTimers();
    // Wednesday 2025-01-01 → Monday is Dec 30, 2024
    vi.setSystemTime(new Date(2025, 0, 1, 10, 0, 0));

    const { start, end } = getCurrentWeekRange();
    expect(start).toBe("2024-12-30");
    expect(end).toBe("2025-01-05");
  });

  it("handles year boundary crossing", () => {
    vi.useFakeTimers();
    // Tuesday 2024-12-31
    vi.setSystemTime(new Date(2024, 11, 31, 10, 0, 0));

    const { start, end } = getCurrentWeekRange();
    expect(start).toBe("2024-12-30");
    expect(end).toBe("2025-01-05");
  });
});
