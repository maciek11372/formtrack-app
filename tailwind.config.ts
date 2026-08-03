import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { boxShadow: { glow: "0 0 30px rgba(106, 255, 147, .08)" } } },
  plugins: [],
};
export default config;
