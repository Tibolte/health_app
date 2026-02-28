import { COLORS } from "@/lib/constants";

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

export default function SkeletonDashboard() {
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <SkeletonBlock width="220px" height="32px" />
        <SkeletonBlock width="80px" height="36px" style={{ borderRadius: "8px" }} />
      </div>

      {/* Section title */}
      <SkeletonBlock width="100px" height="18px" style={{ marginBottom: "0.75rem" }} />

      {/* 3 stat cards */}
      <div style={styles.statsGrid}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={styles.statCard}>
            <SkeletonBlock width="100px" height="12px" style={{ marginBottom: "0.5rem" }} />
            <SkeletonBlock width="60px" height="28px" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <SkeletonBlock width="100%" height="200px" style={{ marginBottom: "2rem" }} />

      {/* Section title */}
      <SkeletonBlock width="160px" height="18px" style={{ marginBottom: "0.75rem" }} />

      {/* 4 workout cards */}
      <div style={styles.workoutGrid}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={styles.workoutCard}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <SkeletonBlock width="50px" height="12px" />
              <SkeletonBlock width="70px" height="12px" />
            </div>
            <SkeletonBlock width="80%" height="16px" style={{ marginBottom: "0.5rem" }} />
            <SkeletonBlock width="60%" height="12px" />
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  statCard: {
    background: COLORS.slate800,
    borderRadius: "10px",
    padding: "1rem",
    border: `1px solid ${COLORS.slate700}`,
  },
  workoutGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "0.75rem",
  },
  workoutCard: {
    background: COLORS.slate800,
    borderRadius: "10px",
    padding: "1rem",
    border: `1px solid ${COLORS.slate700}`,
  },
};
