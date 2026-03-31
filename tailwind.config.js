/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#d4af37",
        background: "#121212",
        surface: "#1e1e1e",
        text: "#ffffff",
        textMuted: "#888888"
      }
    },
  },
  plugins: [],
}
