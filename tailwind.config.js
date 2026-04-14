/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#09090d',
          secondary: '#0f0f16',
          tertiary: '#14141e',
          card: '#111119',
          hover: '#1a1a28',
          input: '#0b0b12',
        },
        border: {
          DEFAULT: '#1c1c2e',
          light: '#26263e',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
