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
        background: 'var(--color-bg, #2b0e18)',
        surface: 'var(--color-surface, #3c1422)',
        card: 'var(--color-card, #6f4c56)',
        pill: 'var(--color-pill, #6f4c56)',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        fraunces: ['"Fraunces"', 'serif'],
        salsa: ['"Salsa BT"', '"Salsa"', 'cursive', 'sans-serif'],
        dmsans: ['"DM Sans"', 'sans-serif'],
        space: ['"Space Grotesk"', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
