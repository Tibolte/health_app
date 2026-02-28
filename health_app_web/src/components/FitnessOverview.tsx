import type { FitnessMetric } from "@/types";
import { COLORS } from "@/lib/constants";

interface FitnessOverviewProps {
  metric: FitnessMetric;
}

export default function FitnessOverview({ metric }: FitnessOverviewProps) {
  return (
    <div style={styles.statsGrid}>
      <div style={{ ...styles.statCard, borderLeft: `3px solid ${COLORS.blue}` }}>
        <div style={styles.statLabel}>CTL (Fitness)</div>
        <div style={styles.statValue}>{metric.ctl.toFixed(1)}</div>
      </div>
      <div style={{ ...styles.statCard, borderLeft: `3px solid ${COLORS.amber}` }}>
        <div style={styles.statLabel}>ATL (Fatigue)</div>
        <div style={styles.statValue}>{metric.atl.toFixed(1)}</div>
      </div>
      <div
        style={{
          ...styles.statCard,
          borderLeft: `3px solid ${metric.tsb >= 0 ? COLORS.green : COLORS.red}`,
        }}
      >
        <div style={styles.statLabel}>TSB (Form)</div>
        <div
          style={{
            ...styles.statValue,
            color: metric.tsb >= 0 ? COLORS.green : COLORS.red,
          }}
        >
          {metric.tsb > 0 ? "+" : ""}
          {metric.tsb.toFixed(1)}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
  },
  statCard: {
    background: COLORS.slate800,
    borderRadius: "8px",
    padding: "1rem",
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
    color: COLORS.slate100,
  },
};
