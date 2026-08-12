/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          50: "#f4f7fb",
          100: "#e6edf6",
          200: "#c9d6e8",
          300: "#9aafcc",
          400: "#6b84a8",
          500: "#4a6286",
          600: "#364a68",
          700: "#25344b",
          800: "#161f30",
          900: "#0b1220",
          950: "#05070c",
        },
        mint: {
          300: "#8ff6d4",
          400: "#4eebc0",
          500: "#2ee9a6",
          600: "#14c48a",
        },
        gold: {
          400: "#f0d078",
          500: "#e8c36a",
          600: "#c9a04a",
        },
        iris: {
          400: "#9b8cff",
          500: "#7c6cff",
          600: "#6354e8",
        },
      },
      boxShadow: {
        glass: "0 8px 40px rgba(4, 8, 18, 0.28)",
        glow: "0 0 0 1px rgba(46, 233, 166, 0.25), 0 0 40px rgba(46, 233, 166, 0.12)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow": "pulse 5s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};
