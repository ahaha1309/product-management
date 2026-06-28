/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.pug",
    "./public/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Inter', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981', // Emerald accent
          600: '#059669',
          900: '#064e3b',
          950: '#022c22',
        },
        surface: {
          50: '#f9fafb',
          100: '#f3f4f6',
          900: '#111827',
          950: '#030712',
        }
      },
      boxShadow: {
        'diffusion': '0 20px 40px -15px rgba(0,0,0,0.05)',
        'glass-inner': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      }
    },
  },
  plugins: [],
}
