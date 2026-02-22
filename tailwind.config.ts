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
        "bg-base": "#0a0a0a",
        "bg-surface": "#141414",
        "bg-elevated": "#1a1a1a",
        "bg-overlay": "#222222",
        "border-subtle": "#27272a",
        "border-default": "#3f3f46",
        "border-strong": "#52525b",
        "text-primary": "#fafafa",
        "text-secondary": "#a1a1aa",
        "text-muted": "#71717a",
        accent: "#e8ff47",
        "accent-dim": "#d4f03a",
        success: "#3ddc84",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#4D9EFF",
      },
    },
  },
  plugins: [],
};
export default config;
