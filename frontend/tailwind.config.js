/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dnd: {
          purple: '#7c3aed',
          'purple-dark': '#5b21b6',
          blue: '#3b82f6',
          'blue-dark': '#2563eb',
          green: '#10b981',
          'green-dark': '#059669',
          red: '#ef4444',
          'red-dark': '#dc2626',
          yellow: '#f59e0b',
          'yellow-dark': '#d97706',
        }
      }
    },
  },
  plugins: [],
}
