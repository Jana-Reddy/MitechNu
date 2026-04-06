import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        accent: "#0f766e",
        sunrise: "#f97316"
      },
      boxShadow: {
        panel: "0 20px 60px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;

