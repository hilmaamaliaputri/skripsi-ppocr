/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#0b0f17',
          900: '#111827',
          850: '#172033',
          800: '#1f293d',
          700: '#334155',
          600: '#475569',
          400: '#94a3b8',
          200: '#e2e8f0',
        },
        status: {
          accept: '#10b981',
          reject: '#ef4444',
          confirm: '#f59e0b',
          cancel: '#64748b',
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
