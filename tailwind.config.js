/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: {
          50: '#e2e8f0',
          100: '#cbd5e1',
          200: '#94a3b8',
          300: '#64748b',
          400: '#475569',
          500: '#334155',
          600: '#1e293b',
          700: '#0f172a',
          800: '#0b1120',
          900: '#070d17',
        },
        amber: {
          gold: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        }
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['LXGW WenKai', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
