/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        tactical: ['Teko', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        tactical: {
          gold: '#c59b27',
          goldHover: '#b38a1f',
          dark: '#0f1115',
          panel: '#171a21',
          card: '#1e232d',
          border: '#2a303d',
          accent: '#e6b32b'
        }
      }
    },
  },
  plugins: [],
}
