import { describe, it, expect, vi, afterEach } from "vitest";
import { getCurrentWeekRange, getNextWeekRange, getDateRange } from "../date-utils";

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

describe("getNextWeekRange", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns next Mon–Sun range when today is Wednesday", () => {
    vi.useFakeTimers();
    // Wednesday 2025-03-12
    vi.setSystemTime(new Date(2025, 2, 12, 10, 0, 0));

    const { start, end } = getNextWeekRange();
    expect(start).toBe("2025-03-17"); // Next Monday
    expect(end).toBe("2025-03-23"); // Next Sunday
  });

  it("returns next Mon–Sun range when today is Monday", () => {
    vi.useFakeTimers();
    // Monday 2025-03-10
    vi.setSystemTime(new Date(2025, 2, 10, 10, 0, 0));

    const { start, end } = getNextWeekRange();
    expect(start).toBe("2025-03-17");
    expect(end).toBe("2025-03-23");
  });

  it("returns next Mon–Sun range when today is Sunday", () => {
    vi.useFakeTimers();
    // Sunday 2025-03-16
    vi.setSystemTime(new Date(2025, 2, 16, 10, 0, 0));

    const { start, end } = getNextWeekRange();
    expect(start).toBe("2025-03-17");
    expect(end).toBe("2025-03-23");
  });

  it("handles month boundary crossing", () => {
    vi.useFakeTimers();
    // Thursday 2025-03-27 → next Monday is March 31, next Sunday is April 6
    vi.setSystemTime(new Date(2025, 2, 27, 10, 0, 0));

    const { start, end } = getNextWeekRange();
    expect(start).toBe("2025-03-31");
    expect(end).toBe("2025-04-06");
  });

  it("handles year boundary crossing", () => {
    vi.useFakeTimers();
    // Friday 2024-12-27 → next Monday is Dec 30, next Sunday is Jan 5
    vi.setSystemTime(new Date(2024, 11, 27, 10, 0, 0));

    const { start, end } = getNextWeekRange();
    expect(start).toBe("2024-12-30");
    expect(end).toBe("2025-01-05");
  });
});

describe("getDateRange", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a range of 30 days ending today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 2, 15, 10, 0, 0));

    const { start, end } = getDateRange(30);
    expect(end).toBe("2025-03-15");
    expect(start).toBe("2025-02-13");
  });

  it("returns a range of 90 days ending today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 2, 15, 10, 0, 0));

    const { start, end } = getDateRange(90);
    expect(end).toBe("2025-03-15");
    expect(start).toBe("2024-12-15");
  });

  it("returns a range of 365 days ending today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 2, 15, 10, 0, 0));

    const { start, end } = getDateRange(365);
    expect(end).toBe("2025-03-15");
    expect(start).toBe("2024-03-15");
  });

  it("handles year boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 10, 10, 0, 0));

    const { start, end } = getDateRange(30);
    expect(end).toBe("2025-01-10");
    expect(start).toBe("2024-12-11");
  });
});
