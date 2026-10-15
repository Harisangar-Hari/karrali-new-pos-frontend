/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // CRITICAL: disable preflight — AntD 5 supplies its own reset, and
  // Tailwind's preflight nukes AntD buttons/headings/inputs.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // Mirror the AntD primary so Tailwind + AntD stay visually aligned.
        brand: {
          DEFAULT: '#0d9488',
          dark: '#0f766e',
        },
      },
    },
  },
  plugins: [],
};