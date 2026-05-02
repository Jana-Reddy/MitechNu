import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', '"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        ink: "#080808",
        mist: "#F5F5EF",
        surface: "#FFFFFF",
        accent: "#E63946",
        teal: "#5BADAF",
        "teal-light": "#A8D5D7",
        border: "#E0E0D8",
        "border-dark": "#C8C8C0",
        muted: "#6B6B65",
        sunrise: "#E63946",
      },
      boxShadow: {
        panel: "4px 4px 0px 0px #080808",
        card: "3px 3px 0px 0px #E0E0D8",
        "card-dark": "4px 4px 0px 0px #080808",
        btn: "3px 3px 0px 0px rgba(8,8,8,0.8)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.35s ease forwards",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    }
  },
  plugins: []
};

export default config;
