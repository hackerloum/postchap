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
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "SF Pro Text", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "SF Pro Text", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        "bg-base": "#080808",
        "bg-surface": "#111111",
        "bg-elevated": "#181818",
        "bg-overlay": "#222222",
        "border-subtle": "#27272a",
        "border-default": "#3f3f46",
        "border-strong": "#52525b",
        "text-primary": "#fafafa",
        "text-secondary": "#a1a1aa",
        "text-muted": "#71717a",
        accent: "#e8ff47",
        "accent-dim": "#b8cc38",
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
