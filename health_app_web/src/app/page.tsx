"use client";

import { Toast } from "@/components/Toast";
import FitnessTrendChart from "@/components/FitnessTrendChart";
import FitnessOverview from "@/components/FitnessOverview";
import WeekWorkouts from "@/components/WeekWorkouts";
import PowerPbs from "@/components/PowerPbs";
import StepsChart from "@/components/StepsChart";
import SkeletonDashboard from "@/components/SkeletonDashboard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { COLORS } from "@/lib/constants";

export default function Dashboard() {
  const {
    workouts,
    nextWeekWorkouts,
    latestMetric,
    powerPbs,
    syncing,
    loading,
    toast,
    hideToast,
    handleSync,
  } = useDashboardData();

  if (loading) {
    return (
      <main style={styles.main}>
        <SkeletonDashboard />
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.header}>
        <h1 style={styles.title}>Training Dashboard</h1>
        <button
          className="sync-button"
          onClick={handleSync}
          disabled={syncing}
          style={{
            ...styles.syncButton,
            opacity: syncing ? 0.6 : 1,
            cursor: syncing ? "not-allowed" : "pointer",
          }}
        >
          {syncing ? (
            <>
              <svg
                className="sync-spinner"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{ verticalAlign: "middle", marginRight: "0.4rem" }}
              >
                <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <path d="M14 8a6 6 0 0 0-6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Syncing
            </>
          ) : "Sync"}
        </button>
      </div>

      {latestMetric && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fitness</h2>
          <FitnessOverview metric={latestMetric} />
          <FitnessTrendChart />
        </section>
      )}

      <WeekWorkouts
        title="This Week"
        workouts={workouts}
        emptyMessage="No workouts yet. Click Sync to load data."
        showSummary
        showProgress
      />

      {nextWeekWorkouts.length > 0 && (
        <WeekWorkouts
          title="Next Week"
          workouts={nextWeekWorkouts}
          showCompletionStatus={false}
        />
      )}

      <PowerPbs powerPbs={powerPbs} />

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Steps</h2>
        <StepsChart />
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
    color: COLORS.slate200,
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
    color: COLORS.slate50,
    margin: 0,
  },
  syncButton: {
    background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.purple})`,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.5rem 1.25rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    boxShadow: `0 0 12px rgba(34,211,238,0.2)`,
  },
  section: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: COLORS.slate200,
    marginBottom: "0.75rem",
  },
};
