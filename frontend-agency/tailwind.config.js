/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-dark)",
          light: "var(--primary-light)",
        },
        accent: "var(--accent)",
        "accent-dark": "var(--accent-dark)",
        "gray-light": "var(--input-background)",
        "gray-border": "var(--border)",
        success: "#16a34a",
        warning: "#f59e0b",
        danger: "var(--destructive)",
      },
      fontFamily: {
        heading: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'Inter'", "'Nunito'", "'Lato'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
