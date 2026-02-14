export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Backend API Running ✓
      </h1>
      <a
        href="/api/health"
        style={{ color: "#0070f3", textDecoration: "underline" }}
      >
        /api/health
      </a>
    </main>
  );
}
