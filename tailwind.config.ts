import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          '"SF Pro Display"',
          '"SF Pro Text"',
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: [
          "-apple-system",
          '"SF Pro Display"',
          '"SF Pro Text"',
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      colors: {
        accent: "#E8FF47",
        "accent-dim": "#B8CC38",
        "accent-muted": "#E8FF4715",
        "accent-border": "#E8FF4725",
        "bg-base": "#080808",
        "bg-surface": "#111111",
        "bg-elevated": "#181818",
        "bg-overlay": "#222222",
        "text-primary": "#fafafa",
        "text-secondary": "#a1a1aa",
        "text-muted": "#71717a",
        border: "#ffffff0f",
        "border-hover": "#ffffff18",
        "border-accent": "#E8FF4730",
        destructive: "#ef4444",
        success: "#4ade80",
        warning: "#fbbf24",
        /* Legacy / compatibility */
        "border-subtle": "#27272a",
        "border-default": "#3f3f46",
        "border-strong": "#52525b",
        error: "#ef4444",
        info: "#4D9EFF",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        pulse: "pulse 2s ease-in-out infinite",
        spin: "spin 0.8s linear infinite",
        "fade-up": "fade-up 0.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
