import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        foreground: "#ecf3ff",
        accent: {
          DEFAULT: "#6ee7f9",
          muted: "#1d4ed8"
        },
        surface: "rgba(15, 23, 42, 0.72)"
      },
      boxShadow: {
        glow: "0 0 120px rgba(59, 130, 246, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
