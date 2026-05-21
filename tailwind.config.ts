import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111322",
        muted: "#666b87",
        line: "#deddf5",
        brand: {
          50: "#f5f2ff",
          100: "#ece7ff",
          500: "#5b3df5",
          600: "#4930d9"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(91, 61, 245, 0.10)",
        panel: "0 26px 80px rgba(22, 19, 60, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
