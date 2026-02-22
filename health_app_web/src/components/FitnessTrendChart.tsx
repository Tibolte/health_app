"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MetricPoint {
  date: string;
  timestamp: number;
  ctl: number;
  atl: number;
  tsb: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toTimestamp(dateStr: string): number {
  return new Date(dateStr.substring(0, 10) + "T00:00:00").getTime();
}

function formatTick(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTooltipLabel(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const RANGE_OPTIONS = [
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 365, label: "1 year" },
] as const;

export default function FitnessTrendChart() {
  const [days, setDays] = useState<number>(90);
  const [data, setData] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fitness-trend?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(
        json.metrics.map((m: { date: string; ctl: number; atl: number; tsb: number }) => ({
          ...m,
          date: m.date.substring(0, 10),
          timestamp: toTimestamp(m.date),
        }))
      );
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: "#94a3b8", margin: 0 }}>Loading chart...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={styles.container}>
        <p style={{ color: "#64748b", margin: 0 }}>
          No fitness data available. Sync to load historical data.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.chartTitle}>Fitness Trend</span>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={styles.select}
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={[Date.now() - days * DAY_MS, Date.now()]}
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={formatTick}
          />
          <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "6px",
              color: "#e2e8f0",
            }}
            labelFormatter={(label) => formatTooltipLabel(Number(label))}
          />
          <Legend
            wrapperStyle={{ color: "#94a3b8", fontSize: "0.8rem" }}
          />
          <Line
            type="monotone"
            dataKey="ctl"
            name="CTL (Fitness)"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="atl"
            name="ATL (Fatigue)"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="tsb"
            name="TSB (Form)"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "#1e293b",
    borderRadius: "8px",
    padding: "1rem",
    marginTop: "0.75rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  chartTitle: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#cbd5e1",
  },
  select: {
    background: "#0f172a",
    color: "#e2e8f0",
    border: "1px solid #334155",
    borderRadius: "4px",
    padding: "0.25rem 0.5rem",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
};
