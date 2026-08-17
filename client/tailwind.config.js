/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F5F1FB",
          100: "#EAE1F7",
          200: "#D3C1EF",
          300: "#B497E0",
          400: "#9269CD",
          500: "#6D3FB5",
          600: "#5A2F9C",
          700: "#48257E",
          800: "#361C5F",
          900: "#241340",
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
