/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1440px" } },
    extend: {
      colors: {
        // Control-room navy scale
        navy: {
          950: "#050D1A",
          900: "#0A1628",
          800: "#0E1E33",
          700: "#132842",
          600: "#1B3A5C",
          500: "#24507D",
        },
        line: "#1C3454",
        ink: { DEFAULT: "#F1F5F9", muted: "#93A5BC", faint: "#5E7391" },
        // Status semantics, used consistently across map, chips and charts
        signal: {
          open: "#22C55E",
          partial: "#F59E0B",
          blocked: "#EF4444",
          info: "#3B82F6",
          route: "#8B5CF6",
        },
      },
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 20px 50px -30px rgba(0,0,0,0.9)",
        glow: "0 0 0 1px rgba(34,197,94,0.35), 0 12px 40px -12px rgba(34,197,94,0.45)",
      },
      keyframes: {
        ping2: { "75%,100%": { transform: "scale(2.2)", opacity: "0" } },
        rise: { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "none" } },
        sweep: { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(220%)" } },
      },
      animation: {
        ping2: "ping2 2.4s cubic-bezier(0,0,0.2,1) infinite",
        rise: "rise .6s cubic-bezier(.22,1,.36,1) both",
        sweep: "sweep 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
