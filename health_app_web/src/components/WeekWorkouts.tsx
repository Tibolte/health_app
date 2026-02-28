import type { Workout } from "@/types";
import WorkoutCard from "./WorkoutCard";
import { COLORS } from "@/lib/constants";

interface WeekWorkoutsProps {
  title: string;
  workouts: Workout[];
  emptyMessage?: string;
  showCompletionStatus?: boolean;
}

export default function WeekWorkouts({
  title,
  workouts,
  emptyMessage,
  showCompletionStatus = true,
}: WeekWorkoutsProps) {
  if (workouts.length === 0 && !emptyMessage) return null;

  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>
        {title}{" "}
        <span style={{ color: COLORS.slate500, fontWeight: 400, fontSize: "0.9rem" }}>
          ({workouts.length} workouts)
        </span>
      </h2>
      {workouts.length === 0 ? (
        <p style={{ color: COLORS.slate500 }}>{emptyMessage}</p>
      ) : (
        <div style={styles.workoutGrid}>
          {workouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              showCompletionStatus={showCompletionStatus}
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
    color: COLORS.slate300,
    marginBottom: "0.75rem",
  },
  workoutGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "0.75rem",
  },
};
