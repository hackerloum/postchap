export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(1.5rem, 5vw, 2rem)",
          fontWeight: 600,
          marginBottom: "0.75rem",
        }}
      >
        This site is under development
      </h1>
      <p
        style={{
          fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
          color: "#a1a1aa",
          maxWidth: "24rem",
        }}
      >
        Check back soon.
      </p>
    </main>
  );
}
