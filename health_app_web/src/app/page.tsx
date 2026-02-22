"use client";

import { useState, useEffect, useCallback } from "react";
import { Toast, useToast } from "@/components/Toast";
import FitnessTrendChart from "@/components/FitnessTrendChart";

interface Workout {
  id: string;
  externalId: string;
  date: string;
  title: string;
  sport: string;
  description?: string | null;
  coachNotes?: string | null;
  isCompleted: boolean;
  plannedDuration?: number | null;
  plannedTss?: number | null;
  duration?: number | null;
  distance?: number | null;
  tss?: number | null;
  intensityFactor?: number | null;
  normalizedPower?: number | null;
  averagePower?: number | null;
  maxPower?: number | null;
  averageHr?: number | null;
  maxHr?: number | null;
  calories?: number | null;
  elevationGain?: number | null;
}

interface FitnessMetric {
  id: string;
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
}

interface PowerPb {
  id: string;
  duration: number;
  power: number;
  recordedAt: string;
}

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [nextWeekWorkouts, setNextWeekWorkouts] = useState<Workout[]>([]);
  const [fitnessMetrics, setFitnessMetrics] = useState<FitnessMetric[]>([]);
  const [powerPbs, setPowerPbs] = useState<PowerPb[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/sync");
      if (!res.ok) throw new Error("Failed to load data");
      const data = await res.json();
      setWorkouts(data.workouts || []);
      setNextWeekWorkouts(data.nextWeekWorkouts || []);
      setFitnessMetrics(data.fitnessMetrics || []);
      setPowerPbs(data.powerPbs || []);
    } catch {
      showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Sync failed");
      showToast(
        `Synced ${data.synced.workouts} workouts, ${data.synced.fitnessMetrics} fitness metrics`,
        "success"
      );
      await loadData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Sync failed",
        "error"
      );
    } finally {
      setSyncing(false);
    }
  };

  const latestMetric = fitnessMetrics[0] ?? null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatPbDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.round(secs / 60)}min`;
    return `${Math.round(secs / 3600)}h`;
  };

  if (loading) {
    return (
      <main style={styles.main}>
        <p style={{ color: "#94a3b8" }}>Loading...</p>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Training Dashboard</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            ...styles.syncButton,
            opacity: syncing ? 0.6 : 1,
            cursor: syncing ? "not-allowed" : "pointer",
          }}
        >
          {syncing ? "Syncing..." : "Sync"}
        </button>
      </div>

      {/* Fitness Metrics */}
      {latestMetric && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fitness</h2>
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, borderLeft: "3px solid #3b82f6" }}>
              <div style={styles.statLabel}>CTL (Fitness)</div>
              <div style={styles.statValue}>{latestMetric.ctl.toFixed(1)}</div>
            </div>
            <div style={{ ...styles.statCard, borderLeft: "3px solid #f59e0b" }}>
              <div style={styles.statLabel}>ATL (Fatigue)</div>
              <div style={styles.statValue}>{latestMetric.atl.toFixed(1)}</div>
            </div>
            <div
              style={{
                ...styles.statCard,
                borderLeft: `3px solid ${latestMetric.tsb >= 0 ? "#10b981" : "#ef4444"}`,
              }}
            >
              <div style={styles.statLabel}>TSB (Form)</div>
              <div
                style={{
                  ...styles.statValue,
                  color: latestMetric.tsb >= 0 ? "#10b981" : "#ef4444",
                }}
              >
                {latestMetric.tsb > 0 ? "+" : ""}
                {latestMetric.tsb.toFixed(1)}
              </div>
            </div>
          </div>
          <FitnessTrendChart />
        </section>
      )}

      {/* Workouts */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          This Week{" "}
          <span style={{ color: "#64748b", fontWeight: 400, fontSize: "0.9rem" }}>
            ({workouts.length} workouts)
          </span>
        </h2>
        {workouts.length === 0 ? (
          <p style={{ color: "#64748b" }}>No workouts yet. Click Sync to load data.</p>
        ) : (
          <div style={styles.workoutGrid}>
            {workouts.map((w) => (
              <div
                key={w.id}
                style={{
                  ...styles.workoutCard,
                  border: w.isCompleted
                    ? "1px solid #334155"
                    : "1px dashed #475569",
                  borderLeft: w.isCompleted
                    ? "3px solid #10b981"
                    : "3px solid #f59e0b",
                }}
              >
                <div style={styles.workoutHeader}>
                  <span style={styles.workoutSport}>{w.sport}</span>
                  <span style={styles.workoutDate}>{formatDate(w.date)}</span>
                </div>
                <div style={styles.workoutTitle}>{w.title}</div>
                <div style={styles.workoutStats}>
                  {(w.duration || w.plannedDuration) && (
                    <span>{formatDuration(w.duration ?? w.plannedDuration!)}</span>
                  )}
                  {w.distance && <span>{w.distance.toFixed(1)} km</span>}
                  {(w.tss || w.plannedTss) && (
                    <span>TSS {Math.round(w.tss ?? w.plannedTss!)}</span>
                  )}
                  {w.normalizedPower && <span>NP {w.normalizedPower}w</span>}
                  {w.averageHr && <span>{w.averageHr} bpm</span>}
                </div>
                {w.isCompleted ? (
                  <div style={styles.completedBadge}>Completed</div>
                ) : (
                  <div style={styles.plannedBadge}>Planned</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Next Week */}
      {nextWeekWorkouts.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Next Week{" "}
            <span style={{ color: "#64748b", fontWeight: 400, fontSize: "0.9rem" }}>
              ({nextWeekWorkouts.length} workouts)
            </span>
          </h2>
          <div style={styles.workoutGrid}>
            {nextWeekWorkouts.map((w) => (
              <div
                key={w.id}
                style={{
                  ...styles.workoutCard,
                  border: "1px dashed #475569",
                  borderLeft: "3px solid #f59e0b",
                }}
              >
                <div style={styles.workoutHeader}>
                  <span style={styles.workoutSport}>{w.sport}</span>
                  <span style={styles.workoutDate}>{formatDate(w.date)}</span>
                </div>
                <div style={styles.workoutTitle}>{w.title}</div>
                <div style={styles.workoutStats}>
                  {w.plannedDuration && (
                    <span>{formatDuration(w.plannedDuration)}</span>
                  )}
                  {w.plannedTss && (
                    <span>TSS {Math.round(w.plannedTss)}</span>
                  )}
                </div>
                <div style={styles.plannedBadge}>Planned</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Power PBs */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Power PBs</h2>
        {powerPbs.length === 0 ? (
          <p style={{ color: "#64748b" }}>No power PBs recorded yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Duration</th>
                <th style={styles.th}>Power (W)</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {powerPbs.map((pb) => (
                <tr key={pb.id}>
                  <td style={styles.td}>{formatPbDuration(pb.duration)}</td>
                  <td style={styles.td}>{pb.power}</td>
                  <td style={styles.td}>{formatDate(pb.recordedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#e2e8f0",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#f1f5f9",
    margin: 0,
  },
  syncButton: {
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.5rem 1.25rem",
    fontSize: "0.875rem",
    fontWeight: 600,
  },
  section: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: "0.75rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
  },
  statCard: {
    background: "#1e293b",
    borderRadius: "8px",
    padding: "1rem",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    marginBottom: "0.25rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#f1f5f9",
  },
  workoutGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "0.75rem",
  },
  workoutCard: {
    background: "#1e293b",
    borderRadius: "8px",
    padding: "1rem",
    position: "relative" as const,
  },
  workoutHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  workoutSport: {
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    color: "#3b82f6",
    letterSpacing: "0.05em",
  },
  workoutDate: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  workoutTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#e2e8f0",
    marginBottom: "0.5rem",
  },
  workoutStats: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
    fontSize: "0.8rem",
    color: "#94a3b8",
  },
  completedBadge: {
    position: "absolute" as const,
    top: "0.5rem",
    right: "0.5rem",
    fontSize: "0.65rem",
    fontWeight: 600,
    color: "#10b981",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  plannedBadge: {
    position: "absolute" as const,
    top: "0.5rem",
    right: "0.5rem",
    fontSize: "0.65rem",
    fontWeight: 600,
    color: "#f59e0b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    background: "#1e293b",
    borderRadius: "8px",
    overflow: "hidden",
  },
  th: {
    textAlign: "left" as const,
    padding: "0.75rem 1rem",
    fontSize: "0.75rem",
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid #334155",
  },
  td: {
    padding: "0.6rem 1rem",
    fontSize: "0.875rem",
    borderBottom: "1px solid #1e293b",
  },
};
