// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import StepsChart from "../StepsChart";

// Mock Recharts — renders children but doesn't need a real SVG/canvas
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar">{children}</div>
  ),
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

// Mock CountUp to render value immediately
vi.mock("../CountUp", () => ({
  default: ({ value, prefix }: { value: number; prefix?: string }) => (
    <span>{prefix}{value}</span>
  ),
}));

function mockFetch(steps: { date: string; steps: number }[]) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ steps }),
  });
}

function mockFetchError() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 500,
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("StepsChart", () => {
  it("shows skeleton shimmer while loading", () => {
    // Never-resolving fetch keeps component in loading state
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<StepsChart />);

    const shimmers = document.querySelectorAll(".skeleton-shimmer");
    expect(shimmers.length).toBeGreaterThanOrEqual(4); // 3 stat skeletons (2 each) + 1 chart
  });

  it("shows empty state when fetch fails", async () => {
    mockFetchError();
    render(<StepsChart />);

    await waitFor(() => {
      expect(
        screen.getByText(/No step data available/)
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when API returns no steps", async () => {
    mockFetch([]);
    render(<StepsChart />);

    await waitFor(() => {
      expect(
        screen.getByText(/No step data available/)
      ).toBeInTheDocument();
    });
  });

  it("renders stat cards with correct labels", async () => {
    const today = new Date().toISOString().substring(0, 10);
    mockFetch([
      { date: today, steps: 8000 },
    ]);
    render(<StepsChart />);

    await waitFor(() => {
      expect(screen.getByText("Today")).toBeInTheDocument();
    });
    expect(screen.getByText("7-Day Avg")).toBeInTheDocument();
    expect(screen.getByText("30-Day Avg")).toBeInTheDocument();
  });

  it("displays today's step count", async () => {
    const today = new Date().toISOString().substring(0, 10);
    mockFetch([{ date: today, steps: 12345 }]);
    render(<StepsChart />);

    await waitFor(() => {
      expect(screen.getByText("Today")).toBeInTheDocument();
    });
    const todayLabel = screen.getByText("Today");
    const todayValue = todayLabel.parentElement!.querySelector("div:last-child span");
    expect(todayValue!.textContent).toBe("12345");
  });

  it("computes 7-day average correctly", async () => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return { date: d.toISOString().substring(0, 10), steps: (i + 1) * 1000 };
    });
    // steps: 1000,2000,3000,4000,5000,6000,7000 → avg = 4000
    mockFetch(days);
    render(<StepsChart />);

    // Wait for data to render, then check 7-Day Avg label's sibling value
    await waitFor(() => {
      expect(screen.getByText("7-Day Avg")).toBeInTheDocument();
    });
    const avg7Label = screen.getByText("7-Day Avg");
    const avg7Value = avg7Label.parentElement!.querySelector("div:last-child span");
    expect(avg7Value!.textContent).toBe("4000");
  });

  it("computes 30-day average over all data", async () => {
    const today = new Date();
    // 3 days in the last week at 6000, 7 older days at 3000
    // 30-day avg = (3*6000 + 7*3000)/10 = 39000/10 = 3900
    // 7-day avg = (3*6000)/3 = 6000
    const days = [
      ...Array.from({ length: 3 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        return { date: d.toISOString().substring(0, 10), steps: 6000 };
      }),
      ...Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (i + 10));
        return { date: d.toISOString().substring(0, 10), steps: 3000 };
      }),
    ];
    mockFetch(days);
    render(<StepsChart />);

    await waitFor(() => {
      expect(screen.getByText("30-Day Avg")).toBeInTheDocument();
    });
    const avg30Label = screen.getByText("30-Day Avg");
    const avg30Value = avg30Label.parentElement!.querySelector("div:last-child span");
    expect(avg30Value!.textContent).toBe("3900");
  });

  it("renders Daily Steps chart title", async () => {
    const today = new Date().toISOString().substring(0, 10);
    mockFetch([{ date: today, steps: 1000 }]);
    render(<StepsChart />);

    await waitFor(() => {
      expect(screen.getByText("Daily Steps")).toBeInTheDocument();
    });
  });

  it("renders step-card class on stat cards", async () => {
    const today = new Date().toISOString().substring(0, 10);
    mockFetch([{ date: today, steps: 1000 }]);
    render(<StepsChart />);

    await waitFor(() => {
      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    const stepCards = document.querySelectorAll(".step-card");
    expect(stepCards).toHaveLength(3);
  });

  it("shows 0 for today when no entry matches today", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    mockFetch([{ date: yesterday.toISOString().substring(0, 10), steps: 9000 }]);
    render(<StepsChart />);

    await waitFor(() => {
      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    // Today value should be 0 since no entry for today
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
