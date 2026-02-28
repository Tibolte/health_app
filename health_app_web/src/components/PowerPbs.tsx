"use client";

import { useState } from "react";
import type { PowerPb } from "@/types";
import { formatDate, formatPbDuration } from "@/lib/format";
import { COLORS } from "@/lib/constants";
import CountUp from "./CountUp";

interface PowerPbsProps {
  powerPbs: PowerPb[];
}

export default function PowerPbs({ powerPbs }: PowerPbsProps) {
  const maxPower = Math.max(...powerPbs.map((pb) => pb.power), 1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>Power PBs</h2>
      {powerPbs.length === 0 ? (
        <p style={{ color: COLORS.slate500 }}>No power PBs recorded yet.</p>
      ) : (
        <div style={styles.grid}>
          {powerPbs.map((pb, i) => {
            const pct = (pb.power / maxPower) * 100;
            const hasPrev = pb.previousPower != null;
            const delta = hasPrev ? pb.power - pb.previousPower! : 0;
            return (
              <div
                key={pb.id}
                className="pb-card"
                style={{
                  ...styles.card,
                  "--card-index": i,
                  position: "relative" as const,
                } as React.CSSProperties}
                onMouseEnter={() => setHoveredId(pb.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.durationBadge}>
                    {formatPbDuration(pb.duration)}
                  </span>
                  <span style={styles.date}>{formatDate(pb.recordedAt)}</span>
                </div>
                <div style={styles.powerValue}>
                  <CountUp value={pb.power} decimals={0} duration={1400} />
                  <span style={styles.unit}>W</span>
                </div>
                <div style={styles.barTrack}>
                  {hasPrev && (
                    <div
                      className="pb-bar-fill"
                      style={{
                        ...styles.barPrev,
                        width: `${(pb.previousPower! / pb.power) * 100}%`,
                        animationDelay: `${0.2 + i * 0.1}s`,
                      }}
                    />
                  )}
                  <div
                    className="pb-bar-fill"
                    style={{
                      ...styles.barFill,
                      width: "100%",
                      animationDelay: `${0.3 + i * 0.1}s`,
                    }}
                  />
                </div>
                {hoveredId === pb.id && (
                  <div className="pb-tooltip" style={styles.tooltip}>
                    <div style={styles.tooltipHeader}>Previous PB</div>
                    {hasPrev ? (
                      <>
                        <div style={styles.tooltipPower}>
                          {pb.previousPower}W
                        </div>
                        {pb.previousRecordedAt && (
                          <div style={styles.tooltipDate}>
                            {formatDate(pb.previousRecordedAt)}
                          </div>
                        )}
                        <div style={{
                          ...styles.tooltipDelta,
                          color: delta > 0 ? COLORS.green : COLORS.red,
                        }}>
                          {delta > 0 ? "+" : ""}{delta}W
                        </div>
                      </>
                    ) : (
                      <div style={styles.tooltipDate}>No previous record</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: COLORS.slate200,
    marginBottom: "0.75rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
  },
  card: {
    background: COLORS.slate800,
    borderRadius: "10px",
    padding: "1rem",
    border: `1px solid ${COLORS.blue}22`,
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  durationBadge: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: COLORS.blue,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    background: `${COLORS.blue}15`,
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
  },
  date: {
    fontSize: "0.7rem",
    color: COLORS.slate400,
  },
  powerValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: COLORS.slate50,
    marginBottom: "0.5rem",
  },
  unit: {
    fontSize: "0.85rem",
    fontWeight: 500,
    color: COLORS.slate400,
    marginLeft: "0.2rem",
  },
  barTrack: {
    position: "relative" as const,
    height: "4px",
    borderRadius: "2px",
    background: COLORS.slate700,
    overflow: "hidden",
  },
  barPrev: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    height: "100%",
    borderRadius: "2px",
    background: `${COLORS.slate500}66`,
    zIndex: 1,
  },
  barFill: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    height: "100%",
    borderRadius: "2px",
    background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.purple})`,
    zIndex: 2,
  },
  tooltip: {
    position: "absolute" as const,
    bottom: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)",
    background: COLORS.slate700,
    border: `1px solid ${COLORS.slate600}`,
    borderRadius: "8px",
    padding: "0.6rem 0.8rem",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    whiteSpace: "nowrap" as const,
    zIndex: 10,
    textAlign: "center" as const,
  },
  tooltipHeader: {
    fontSize: "0.65rem",
    fontWeight: 600,
    color: COLORS.slate400,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "0.25rem",
  },
  tooltipPower: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: COLORS.slate200,
  },
  tooltipDate: {
    fontSize: "0.65rem",
    color: COLORS.slate400,
    marginTop: "0.15rem",
  },
  tooltipDelta: {
    fontSize: "0.75rem",
    fontWeight: 600,
    marginTop: "0.3rem",
  },
};
