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
import type { MetricPoint, FitnessTrendResponse } from "@/types";
import { DAY_MS, COLORS } from "@/lib/constants";

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
  { value: 7, label: "7 days" },
  { value: 30, label: "1 month" },
  { value: 42, label: "42 days" },
  { value: 90, label: "3 months" },
  { value: 180, label: "6 months" },
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
      const json: FitnessTrendResponse = await res.json();
      setData(
        json.metrics.map((m) => ({
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
        <p style={{ color: COLORS.slate400, margin: 0 }}>Loading chart...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={styles.container}>
        <p style={{ color: COLORS.slate500, margin: 0 }}>
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
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.slate700} />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={[Date.now() - days * DAY_MS, Date.now()]}
            stroke={COLORS.slate600}
            tick={{ fill: COLORS.slate400, fontSize: 12 }}
            tickFormatter={formatTick}
          />
          <YAxis stroke={COLORS.slate600} tick={{ fill: COLORS.slate400, fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.slate800,
              border: `1px solid ${COLORS.slate700}`,
              borderRadius: "8px",
              color: COLORS.slate200,
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            }}
            labelFormatter={(label) => formatTooltipLabel(Number(label))}
          />
          <Legend
            wrapperStyle={{ color: COLORS.slate400, fontSize: "0.8rem" }}
          />
          <Line
            type="monotone"
            dataKey="ctl"
            name="CTL (Fitness)"
            stroke={COLORS.blue}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="atl"
            name="ATL (Fatigue)"
            stroke={COLORS.purple}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="tsb"
            name="TSB (Form)"
            stroke={COLORS.green}
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
    background: COLORS.slate800,
    borderRadius: "10px",
    padding: "1rem",
    marginTop: "0.75rem",
    border: `1px solid ${COLORS.slate700}`,
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
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
    color: COLORS.slate200,
  },
  select: {
    background: COLORS.slate900,
    color: COLORS.slate200,
    border: `1px solid ${COLORS.slate700}`,
    borderRadius: "6px",
    padding: "0.25rem 0.5rem",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
};
