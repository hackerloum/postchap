import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        border: {
          default: "var(--border-default)",
          strong: "var(--border-strong)",
          subtle: "var(--border-subtle)",
        },
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        error: "var(--error)",
        warning: "var(--warning)",
        success: "var(--success)",
      },
    },
  },
  plugins: [],
};
export default config;
