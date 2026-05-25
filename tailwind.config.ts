import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-dark": "#031D44",
        "brand-accent": "#D5896F",
        logo: "#2C446C",
        plumbing: "#70A288",
        electrical: "#DAB785",
        gas: "#b96a51",
      },
    },
  },
  plugins: [],
};

export default config;
