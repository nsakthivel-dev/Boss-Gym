/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        'background-soft': '#f8f7f3',
        card: '#ffffff',
        surface: '#ffffff',
        'surface-muted': '#f7f6f2',
        'surface-dark': '#151515',
        'surface-card-dark': '#1c1c1c',
        charcoal: {
          DEFAULT: '#171717',
          50: '#262626',
          100: '#1f1f1f',
          200: '#171717',
          300: '#121212',
          400: '#0d0d0d',
        },
        black: '#0d0d0d',
        border: '#e7e2d5',
        'border-light': '#f0ece2',
        'border-dark': '#2a2a2a',
        primary: 'var(--color-primary, #c9a227)',
        gold: {
          50: '#fbf9f1',
          100: '#f6f0db',
          200: '#ede0b8',
          300: '#e5cf76',
          400: '#d4b45a',
          500: '#c9a227',
          600: '#b8911d',
          700: '#9f7d16',
          800: '#664f10',
          900: '#42320a',
        },
        'text-primary': '#111111',
        'text-secondary': '#666666',
        'text-muted': '#8a8a8a',
        success: '#16a34a',
        error: '#dc2626',
        warning: '#d97706',
        info: '#2563eb',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Montserrat', 'Inter', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'gold-sm': '0 2px 8px -1px rgba(201, 162, 39, 0.2)',
        'gold-md': '0 4px 20px -2px rgba(201, 162, 39, 0.25)',
        'gold-lg': '0 10px 30px -4px rgba(201, 162, 39, 0.35)',
        'dark-card': '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 4px 20px -2px rgba(180, 150, 60, 0.07), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'modal': '0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 0 1px 1px rgba(232, 228, 216, 0.8)',
      },
      letterSpacing: {
        'widest-plus': '0.25em',
        'athletic': '0.15em',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      }
    },
  },
  plugins: [],
}
