import type { PowerPb } from "@/types";
import { formatDate, formatPbDuration } from "@/lib/format";
import { COLORS } from "@/lib/constants";

interface PowerPbsProps {
  powerPbs: PowerPb[];
}

export default function PowerPbs({ powerPbs }: PowerPbsProps) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>Power PBs</h2>
      {powerPbs.length === 0 ? (
        <p style={{ color: COLORS.slate500 }}>No power PBs recorded yet.</p>
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
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    background: COLORS.slate800,
    borderRadius: "10px",
    overflow: "hidden",
    border: `1px solid ${COLORS.slate700}`,
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
  },
  th: {
    textAlign: "left" as const,
    padding: "0.75rem 1rem",
    fontSize: "0.75rem",
    color: COLORS.slate400,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: `1px solid ${COLORS.slate700}`,
  },
  td: {
    padding: "0.6rem 1rem",
    fontSize: "0.875rem",
    borderBottom: `1px solid ${COLORS.slate700}`,
    color: COLORS.slate200,
  },
};
