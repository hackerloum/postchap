import Link from "next/link";

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
        PosterChap
      </h1>
      <p
        style={{
          fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
          color: "#a1a1aa",
          maxWidth: "24rem",
          marginBottom: "2rem",
        }}
      >
        AI-powered daily poster generation for your brand.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: "20rem" }}>
        <Link
          href="/login"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "44px",
            borderRadius: "0.5rem",
            background: "#e8ff47",
            color: "#000",
            fontWeight: 500,
            fontSize: "0.875rem",
            textDecoration: "none",
          }}
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "44px",
            borderRadius: "0.5rem",
            border: "1px solid #3f3f46",
            color: "#fafafa",
            fontWeight: 500,
            fontSize: "0.875rem",
            textDecoration: "none",
          }}
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
