import type { FitnessMetric } from "@/types";
import CountUp from "./CountUp";
import { COLORS } from "@/lib/constants";

function getTsbZone(tsb: number): { label: string; color: string } {
  if (tsb > 15) return { label: "Fresh", color: COLORS.blue };
  if (tsb >= 5) return { label: "Optimal", color: COLORS.green };
  if (tsb >= -10) return { label: "Neutral", color: COLORS.slate400 };
  if (tsb >= -25) return { label: "Fatigued", color: COLORS.amber };
  return { label: "Overreached", color: COLORS.red };
}

interface FitnessOverviewProps {
  metric: FitnessMetric;
}

export default function FitnessOverview({ metric }: FitnessOverviewProps) {
  const tsbZone = getTsbZone(metric.tsb);

  return (
    <div style={styles.statsGrid}>
      <div className="stat-card" style={{ ...styles.statCard, borderColor: `${COLORS.blue}33` }}>
        <div style={styles.statLabel}>CTL (Fitness)</div>
        <div style={{ ...styles.statValue, color: COLORS.blue }}>
          <CountUp value={metric.ctl} />
        </div>
      </div>
      <div className="stat-card" style={{ ...styles.statCard, borderColor: `${COLORS.purple}33` }}>
        <div style={styles.statLabel}>ATL (Fatigue)</div>
        <div style={{ ...styles.statValue, color: COLORS.purple }}>
          <CountUp value={metric.atl} />
        </div>
      </div>
      <div
        className="stat-card"
        style={{
          ...styles.statCard,
          borderColor: `${tsbZone.color}33`,
        }}
      >
        <div style={styles.statLabel}>TSB (Form)</div>
        <div style={{ ...styles.statValue, color: tsbZone.color }}>
          <CountUp
            value={metric.tsb}
            prefix={metric.tsb > 0 ? "+" : ""}
          />
        </div>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: tsbZone.color, marginTop: "0.25rem" }}>
          {tsbZone.label}
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
    color: COLORS.slate50,
  },
};
