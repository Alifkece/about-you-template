/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/dashboard/**/*.{ts,tsx}', './components/dashboard/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        db: {
          bg: '#08070c',
          surface: 'rgba(20,18,28,0.55)',
          border: 'rgba(255,255,255,0.09)',
          violet: 'hsl(280, 60%, 65%)',
          amber: 'hsl(28, 85%, 62%)',
          good: 'hsl(150, 60%, 50%)',
          bad: 'hsl(0, 70%, 62%)',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
