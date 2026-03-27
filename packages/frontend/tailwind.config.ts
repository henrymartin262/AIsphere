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
        background: "#ffffff",
        foreground: "#111827",
        surface: {
          DEFAULT: "rgba(255, 255, 255, 0.80)",
          dark: "rgba(15, 23, 42, 0.04)",
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          light: "#a78bfa",
          muted: "#f5f3ff",
        },
        ocean: {
          DEFAULT: "#06b6d4",
          light: "#67e8f9",
          muted: "#ecfeff",
        },
        mint: {
          DEFAULT: "#10b981",
          light: "#6ee7b7",
          muted: "#ecfdf5",
        },
        warm: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        rose: {
          DEFAULT: "#f43f5e",
          light: "#fb7185",
          muted: "#fff1f2",
        },
      },
      boxShadow: {
        glow: "0 4px 60px rgba(99, 102, 241, 0.1)",
        "glow-lg": "0 8px 100px rgba(99, 102, 241, 0.15)",
        "glow-purple": "0 4px 60px rgba(139, 92, 246, 0.1)",
        "glow-warm": "0 4px 40px rgba(249, 115, 22, 0.12)",
        "glow-multi": "0 4px 40px rgba(99,102,241,0.08), 0 8px 60px rgba(139,92,246,0.06)",
        card: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.02)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.06), 0 12px 48px rgba(99,102,241,0.06)",
        btn: "0 2px 12px rgba(0,0,0,0.08)",
        "btn-hover": "0 4px 24px rgba(0,0,0,0.12)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        mesh: "radial-gradient(at 40% 20%, rgba(99,102,241,0.04) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(139,92,246,0.03) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(249,115,22,0.02) 0px, transparent 50%)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "float-x": "float-x 12s ease-in-out infinite",
        "float-x-reverse": "float-x-reverse 14s ease-in-out infinite",
        "slide-up": "slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up-stagger": "slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.5s ease-out",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 2s linear infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "particle-float": "particle-float 10s ease-in-out infinite",
        "particle-drift": "particle-drift 20s linear infinite",
        typing: "typing 1.5s ease-in-out infinite",
        morph: "morph 15s ease-in-out infinite",
        orbit: "orbit 20s linear infinite",
        "orbit-reverse": "orbit 25s linear infinite reverse",
        "orbit-slow": "orbit 30s linear infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "cover-fade": "cover-fade 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "cover-slide": "cover-slide 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "logo-float": "logo-float 3s ease-in-out infinite",
        "scan-line": "scan-line 4s ease-in-out infinite",
        ripple: "ripple 3s ease-out infinite",
        "ripple-delayed": "ripple 3s ease-out 1s infinite",
        "ripple-delayed-2": "ripple 3s ease-out 2s infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "gradient-shift-fast": "gradient-shift 4s ease infinite",
        "text-reveal": "text-reveal 1s cubic-bezier(0.16, 1, 0.3, 1) both",
        "counter-spin": "counter-spin 40s linear infinite",
        meteor: "meteor 6s ease-in-out infinite",
        "meteor-delayed": "meteor 6s ease-in-out 2s infinite",
        "meteor-delayed-2": "meteor 6s ease-in-out 4s infinite",
        "wave-slow": "wave 8s ease-in-out infinite",
        "aurora": "aurora 10s ease-in-out infinite",
        "rotate-slow": "rotate-slow 60s linear infinite",
        "breathe": "breathe 6s ease-in-out infinite",
        "float-diagonal": "float-diagonal 25s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "float-x": {
          "0%, 100%": { transform: "translateX(0) translateY(0)" },
          "25%": { transform: "translateX(30px) translateY(-15px)" },
          "50%": { transform: "translateX(0px) translateY(-25px)" },
          "75%": { transform: "translateX(-30px) translateY(-10px)" },
        },
        "float-x-reverse": {
          "0%, 100%": { transform: "translateX(0) translateY(0)" },
          "25%": { transform: "translateX(-20px) translateY(-20px)" },
          "50%": { transform: "translateX(10px) translateY(-30px)" },
          "75%": { transform: "translateX(25px) translateY(-10px)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(28px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        "particle-float": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.4" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)", opacity: "0.7" },
          "66%": { transform: "translate(-20px, -20px) scale(0.9)", opacity: "0.5" },
        },
        "particle-drift": {
          "0%": { transform: "translate(0, 0) rotate(0deg)" },
          "25%": { transform: "translate(100px, -50px) rotate(90deg)" },
          "50%": { transform: "translate(50px, -100px) rotate(180deg)" },
          "75%": { transform: "translate(-50px, -50px) rotate(270deg)" },
          "100%": { transform: "translate(0, 0) rotate(360deg)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.5", boxShadow: "0 0 4px rgba(249, 115, 22, 0.3)" },
          "50%": { opacity: "1", boxShadow: "0 0 12px rgba(249, 115, 22, 0.6)" },
        },
        morph: {
          "0%, 100%": { borderRadius: "60% 40% 30% 70%/60% 30% 70% 40%" },
          "50%": { borderRadius: "30% 60% 70% 40%/50% 60% 30% 60%" },
        },
        orbit: {
          from: { transform: "rotate(0deg) translateX(140px) rotate(0deg)" },
          to: { transform: "rotate(360deg) translateX(140px) rotate(-360deg)" },
        },
        typing: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        "cover-fade": {
          from: { opacity: "1" },
          to: { opacity: "0", pointerEvents: "none" },
        },
        "cover-slide": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(-40px)", pointerEvents: "none" },
        },
        "logo-float": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-8px) scale(1.02)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        ripple: {
          "0%": { transform: "scale(0.8)", opacity: "0.6" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "text-reveal": {
          from: { opacity: "0", transform: "translateY(20px) blur(8px)" },
          to: { opacity: "1", transform: "translateY(0) blur(0)" },
        },
        "counter-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(-360deg)" },
        },
        meteor: {
          "0%": { transform: "translateX(-100%) translateY(-100%)", opacity: "0" },
          "20%": { opacity: "1" },
          "80%": { opacity: "1" },
          "100%": { transform: "translateX(200%) translateY(200%)", opacity: "0" },
        },
        wave: {
          "0%, 100%": { transform: "translateY(0) scaleX(1)" },
          "25%": { transform: "translateY(-5px) scaleX(1.02)" },
          "50%": { transform: "translateY(0) scaleX(0.98)" },
          "75%": { transform: "translateY(5px) scaleX(1.01)" },
        },
        aurora: {
          "0%, 100%": { transform: "translateX(-10%) skewX(-5deg)", opacity: "0.5" },
          "50%": { transform: "translateX(10%) skewX(5deg)", opacity: "0.8" },
        },
        "rotate-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.5" },
          "50%": { transform: "scale(1.1)", opacity: "0.8" },
        },
        "float-diagonal": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(60px, 40px)" },
          "50%": { transform: "translate(-30px, 80px)" },
          "75%": { transform: "translate(-60px, 20px)" },
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
