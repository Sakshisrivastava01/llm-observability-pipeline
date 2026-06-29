/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core brand palette
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5b9fc',
          400: '#8193f8',
          500: '#6470f3',
          600: '#4f54e7',
          700: '#4241cf',
          800: '#3637a7',
          900: '#303484',
        },
        // Surface tokens (dark theme)
        surface: {
          900: '#0a0a0f',
          800: '#0f0f17',
          700: '#15151f',
          600: '#1c1c28',
          500: '#232334',
          400: '#2d2d42',
          300: '#3a3a52',
        },
        // Accent tokens
        cyan:    { DEFAULT: '#22d3ee', dim: '#0e7490' },
        emerald: { DEFAULT: '#34d399', dim: '#065f46' },
        amber:   { DEFAULT: '#fbbf24', dim: '#92400e' },
        rose:    { DEFAULT: '#fb7185', dim: '#9f1239' },
        violet:  { DEFAULT: '#a78bfa', dim: '#4c1d95' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glow-brand': 'radial-gradient(ellipse at 50% 0%, rgba(100,112,243,0.15) 0%, transparent 70%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(100,112,243,0.2)',
        'glow': '0 0 20px rgba(100,112,243,0.3)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
