import type { Workout } from "@/types";
import WorkoutCard from "./WorkoutCard";
import { formatDuration } from "@/lib/format";
import { COLORS } from "@/lib/constants";

interface WeekWorkoutsProps {
  title: string;
  workouts: Workout[];
  emptyMessage?: string;
  showCompletionStatus?: boolean;
  showSummary?: boolean;
  showProgress?: boolean;
}

export default function WeekWorkouts({
  title,
  workouts,
  emptyMessage,
  showCompletionStatus = true,
  showSummary = false,
  showProgress = false,
}: WeekWorkoutsProps) {
  if (workouts.length === 0 && !emptyMessage) return null;

  const completed = workouts.filter((w) => w.isCompleted).length;
  const total = workouts.length;
  const progressPct = total > 0 ? (completed / total) * 100 : 0;

  const totalActualTss = workouts.reduce((sum, w) => sum + (w.tss ?? 0), 0);
  const totalPlannedTss = workouts.reduce((sum, w) => sum + (w.plannedTss ?? 0), 0);
  const totalDuration = workouts.reduce(
    (sum, w) => sum + (w.duration ?? w.plannedDuration ?? 0),
    0
  );

  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>
        {title}{" "}
        <span style={{ color: COLORS.slate500, fontWeight: 400, fontSize: "0.9rem" }}>
          ({workouts.length} workouts)
        </span>
      </h2>

      {showSummary && workouts.length > 0 && (
        <div style={styles.summaryBar}>
          <span>
            TSS {Math.round(totalActualTss)}
            {totalPlannedTss > 0 && (
              <span style={{ color: COLORS.slate500 }}> / {Math.round(totalPlannedTss)}</span>
            )}
          </span>
          <span>{formatDuration(totalDuration)}</span>
        </div>
      )}

      {showProgress && workouts.length > 0 && (
        <div style={styles.progressContainer}>
          <div style={styles.progressTrack}>
            <div
              className="progress-fill"
              style={{
                ...styles.progressFill,
                width: `${progressPct}%`,
              }}
            />
          </div>
          <span style={styles.progressLabel}>
            {completed}/{total} completed
          </span>
        </div>
      )}

      {workouts.length === 0 ? (
        <p style={{ color: COLORS.slate500 }}>{emptyMessage}</p>
      ) : (
        <div style={styles.workoutGrid}>
          {workouts.map((w, i) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              showCompletionStatus={showCompletionStatus}
              index={i}
            />
          ))}
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
  summaryBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: COLORS.slate800,
    border: `1px solid ${COLORS.slate700}`,
    borderRadius: "8px",
    padding: "0.5rem 0.75rem",
    fontSize: "0.8rem",
    color: COLORS.slate300,
    marginBottom: "0.75rem",
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.75rem",
  },
  progressTrack: {
    flex: 1,
    height: "6px",
    background: COLORS.slate700,
    borderRadius: "3px",
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%",
    background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.blue})`,
    borderRadius: "3px",
  },
  progressLabel: {
    fontSize: "0.75rem",
    color: COLORS.slate400,
    whiteSpace: "nowrap" as const,
  },
  workoutGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "0.75rem",
  },
};
