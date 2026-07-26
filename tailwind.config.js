/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#106675',
          dark: '#0a4550',
          light: '#f4f9fa',
        }
      }
    },
  },
  plugins: [],
}
