"use client";

import { useEffect, useState } from "react";

const COLORS = [
  "var(--accent)",
  "#ffffff",
  "#888888",
  "rgba(232, 255, 71, 0.6)",
  "rgba(255, 255, 255, 0.25)",
];

export function ConfettiEffect() {
  const [pieces, setPieces] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  useEffect(() => {
    const count = 40;
    const newPieces = Array.from({ length: count }, (_, i) => ({
      id: i,
      style: {
        position: "fixed" as const,
        top: -10,
        left: `${Math.random() * 100}%`,
        width: 4,
        height: 8,
        backgroundColor: COLORS[i % COLORS.length],
        borderRadius: 2,
        zIndex: 0,
        animation: `confetti-fall ${2 + Math.random() * 2}s ease-in ${Math.random() * 2}s forwards`,
        transform: `rotate(${Math.random() * 360}deg)`,
      },
    }));
    setPieces(newPieces);

    const t = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(t);
  }, []);

  if (pieces.length === 0) return null;

  return (
    <>
      {pieces.map(({ id, style }) => (
        <div key={id} style={style} aria-hidden />
      ))}
    </>
  );
}
