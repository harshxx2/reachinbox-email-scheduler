/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#141414',
        panel: '#ffffff',
        muted: '#71717a',
        line: '#e7e7e7',
        soft: '#f7f7f8',
        purple: '#6d48ff'
      },
      boxShadow: {
        soft: '0 12px 35px rgba(15, 23, 42, 0.06)'
      }
    }
  },
  plugins: []
};
