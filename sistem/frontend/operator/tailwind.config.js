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
          950: '#070a10',
          900: '#0d131f',
          850: '#141c2c',
          800: '#1c263c',
          700: '#2d3b55',
          600: '#435474',
          400: '#8ca0c2',
          200: '#dce5f4',
        },
        display: {
          bg: '#05080c',
          led: '#22c55e',
          amber: '#f59e0b',
          red: '#ef4444',
          dim: '#13281c',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: ['"Courier New"', 'Courier', 'monospace'],
      }
    },
  },
  plugins: [],
}
