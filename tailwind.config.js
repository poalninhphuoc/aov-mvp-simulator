/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#0B0F19', 900: '#111827' },
        gold: { 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706' },
        neon: '#8B5CF6',
        cyanx: '#06B6D4',
      },
      fontFamily: { display: ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
