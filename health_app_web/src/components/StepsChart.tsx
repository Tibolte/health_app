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
  Cell,
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

function SkeletonBlock({ width, height, style }: {
  width: string;
  height: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        background: `linear-gradient(135deg, ${COLORS.slate700}, ${COLORS.slate800})`,
        borderRadius: "8px",
        ...style,
      }}
    />
  );
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
        <div style={styles.statsGrid}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ ...styles.statCard, borderColor: `${COLORS.green}33` }}>
              <SkeletonBlock width="80px" height="12px" style={{ marginBottom: "0.5rem" }} />
              <SkeletonBlock width="60px" height="28px" />
            </div>
          ))}
        </div>
        <div style={styles.chartContainer}>
          <SkeletonBlock width="100%" height="300px" />
        </div>
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

  const statCards = [
    { label: "Today", value: todaySteps },
    { label: "7-Day Avg", value: avg7 },
    { label: "30-Day Avg", value: avg30 },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.statsGrid}>
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="step-card"
            style={{ ...styles.statCard, borderColor: `${COLORS.green}33`, "--card-index": i } as React.CSSProperties}
          >
            <div style={styles.statLabel}>{card.label}</div>
            <div style={{ ...styles.statValue, color: COLORS.green }}>
              <CountUp value={card.value} decimals={0} />
            </div>
          </div>
        ))}
      </div>

      <div style={styles.chartContainer}>
        <div style={styles.chartHeader}>
          <span style={styles.chartTitle}>Daily Steps</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.green} stopOpacity={1} />
                <stop offset="100%" stopColor={COLORS.green} stopOpacity={0.3} />
              </linearGradient>
            </defs>
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
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={entry.date === today ? COLORS.green : "url(#stepsGradient)"}
                />
              ))}
            </Bar>
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
  chartHeader: {
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
};
