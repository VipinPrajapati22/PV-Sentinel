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
        navy: {
          50: '#f4f6fa',
          100: '#e8eef5',
          200: '#cbdbe9',
          300: '#9fbcd4',
          400: '#6d97b9',
          500: '#4a799d',
          600: '#3a6081',
          700: '#2f4e6b',
          800: '#1a365d', // Primary Navy
          950: '#0b1329'  // Dark Mode Background
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Primary Teal
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a'
        }
      }
    },
  },
  plugins: [],
}
