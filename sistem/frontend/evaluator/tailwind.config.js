/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        signal: {
          orange: '#F47721',
          'orange-hover': '#FF974D',
          'orange-subtle': 'rgba(244, 119, 33, 0.12)',
          'orange-border': 'rgba(244, 119, 33, 0.35)',
        },
        graphite: {
          950: '#111820', // dark mode page bg
          900: '#171F28', // dark mode sidebar
          850: '#202832', // light mode sidebar & dark text
          800: '#222D38', // dark mode card surface
          700: '#2E3A47', // dark mode borders
          600: '#475569',
          400: '#94A3B8',
          200: '#E2E8F0',
          100: '#F1F5F9', // dark mode primary text
          50: '#F3F5F7',  // light mode page bg
        },
        industrial: {
          950: '#111820',
          900: '#222D38',
          850: '#1C252F',
          800: '#2E3A47',
          700: '#3D4D5E',
          600: '#475569',
          400: '#94A3B8',
          200: '#E2E8F0',
          100: '#F1F5F9',
        },
        status: {
          success: '#16A36A',
          'success-dark': '#38C98A',
          warning: '#F59E0B',
          danger: '#EF4444',
          cloud: '#3B82F6',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
