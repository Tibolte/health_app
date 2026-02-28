import type { Workout } from "@/types";
import { formatDate, formatDuration } from "@/lib/format";
import { getSportIcon } from "@/lib/sport";
import { COLORS } from "@/lib/constants";

interface WorkoutCardProps {
  workout: Workout;
  showCompletionStatus?: boolean;
  index?: number;
}

export default function WorkoutCard({
  workout: w,
  showCompletionStatus = true,
  index = 0,
}: WorkoutCardProps) {
  const isPlannedOnly = !w.isCompleted;
  const accentColor = isPlannedOnly ? COLORS.amber : COLORS.green;

  return (
    <div
      className="workout-card"
      style={{
        ...styles.card,
        borderColor: `${accentColor}22`,
        borderLeft: `3px solid ${accentColor}`,
        "--card-index": index,
      } as React.CSSProperties}
    >
      <div style={styles.header}>
        <span style={styles.sport}>{getSportIcon(w.sport)} {w.sport}</span>
        <span style={styles.date}>{formatDate(w.date)}</span>
      </div>
      <div style={styles.title}>{w.title}</div>
      <div style={styles.stats}>
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
      {showCompletionStatus && (
        w.isCompleted ? (
          <div style={styles.completedBadge}>Completed</div>
        ) : (
          <div style={styles.plannedBadge}>Planned</div>
        )
      )}
      {!showCompletionStatus && (
        <div style={styles.plannedBadge}>Planned</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: COLORS.slate800,
    borderRadius: "10px",
    padding: "1rem",
    position: "relative" as const,
    border: "1px solid",
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  sport: {
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    color: COLORS.blue,
    letterSpacing: "0.05em",
  },
  date: {
    fontSize: "0.75rem",
    color: COLORS.slate400,
  },
  title: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: COLORS.slate100,
    marginBottom: "0.5rem",
  },
  stats: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
    fontSize: "0.8rem",
    color: COLORS.slate400,
  },
  completedBadge: {
    position: "absolute" as const,
    top: "0.5rem",
    right: "0.5rem",
    fontSize: "0.65rem",
    fontWeight: 600,
    color: COLORS.green,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  plannedBadge: {
    position: "absolute" as const,
    top: "0.5rem",
    right: "0.5rem",
    fontSize: "0.65rem",
    fontWeight: 600,
    color: COLORS.amber,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
};
