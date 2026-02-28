"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { StepsResponse } from "@/types";
import CountUp from "./CountUp";
import { COLORS } from "@/lib/constants";

interface ChartPoint {
  date: string;
  label: string;
  steps: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr.substring(0, 10) + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr.substring(0, 10) + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function todayStr(): string {
  return new Date().toISOString().substring(0, 10);
}

export default function StepsChart() {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/steps");
        if (!res.ok) throw new Error("Failed to fetch");
        const json: StepsResponse = await res.json();
        const points: ChartPoint[] = json.steps
          .map((s) => ({
            date: s.date.substring(0, 10),
            label: formatDate(s.date),
            steps: s.steps,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        setData(points);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: COLORS.slate400, margin: 0 }}>Loading steps...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={styles.container}>
        <p style={{ color: COLORS.slate500, margin: 0 }}>
          No step data available. Sync from the iOS app to load data.
        </p>
      </div>
    );
  }

  const today = todayStr();
  const todaySteps = data.find((d) => d.date === today)?.steps ?? 0;

  const last7 = data.filter((d) => {
    const diff = (new Date(today).getTime() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < 7;
  });
  const avg7 = last7.length > 0 ? Math.round(last7.reduce((s, d) => s + d.steps, 0) / last7.length) : 0;

  const avg30 = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.steps, 0) / data.length) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.statsGrid}>
        <div className="stat-card" style={{ ...styles.statCard, borderColor: `${COLORS.green}33` }}>
          <div style={styles.statLabel}>Today</div>
          <div style={{ ...styles.statValue, color: COLORS.green }}>
            <CountUp value={todaySteps} decimals={0} />
          </div>
        </div>
        <div className="stat-card" style={{ ...styles.statCard, borderColor: `${COLORS.green}33` }}>
          <div style={styles.statLabel}>7-Day Avg</div>
          <div style={{ ...styles.statValue, color: COLORS.green }}>
            <CountUp value={avg7} decimals={0} />
          </div>
        </div>
        <div className="stat-card" style={{ ...styles.statCard, borderColor: `${COLORS.green}33` }}>
          <div style={styles.statLabel}>30-Day Avg</div>
          <div style={{ ...styles.statValue, color: COLORS.green }}>
            <CountUp value={avg30} decimals={0} />
          </div>
        </div>
      </div>

      <div style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.slate700} />
            <XAxis
              dataKey="label"
              stroke={COLORS.slate600}
              tick={{ fill: COLORS.slate400, fontSize: 12 }}
            />
            <YAxis
              stroke={COLORS.slate600}
              tick={{ fill: COLORS.slate400, fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: COLORS.slate800,
                border: `1px solid ${COLORS.slate700}`,
                borderRadius: "8px",
                color: COLORS.slate200,
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}
              labelFormatter={(_, payload) => {
                if (payload && payload.length > 0 && payload[0]?.payload) {
                  return formatFullDate(payload[0].payload.date);
                }
                return "";
              }}
              formatter={(value: number | undefined) => [
                value != null ? value.toLocaleString() : "0",
                "Steps",
              ]}
            />
            <Bar
              dataKey="steps"
              fill={COLORS.green}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
  },
  statCard: {
    background: COLORS.slate800,
    borderRadius: "10px",
    padding: "1rem",
    border: "1px solid",
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: COLORS.slate400,
    marginBottom: "0.25rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  chartContainer: {
    background: COLORS.slate800,
    borderRadius: "10px",
    padding: "1rem",
    border: `1px solid ${COLORS.slate700}`,
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
  },
};
