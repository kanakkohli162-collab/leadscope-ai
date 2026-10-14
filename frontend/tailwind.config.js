/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Purple-magenta (matches the landing page)
        primary: {
          50: '#FCF5FF',
          100: '#F6E6FD',
          200: '#EBCBFA',
          300: '#DDA4F5',
          400: '#CB6FEF',
          500: '#BE45EC',
          600: '#B526E8',
          700: '#9A1CC7',
          800: '#7A169E',
          900: '#310E50',
        },
        // Purple-tinted greys
        slate: {
          50: '#FAF4FF',
          100: '#F5ECFD',
          200: '#F0E3FB',
          300: '#DCC9EB',
          400: '#A891BD',
          500: '#715A86',
          600: '#5A4470',
          700: '#432E57',
          800: '#200B33',
          900: '#160524',
          950: '#0E0318',
        },
        marigold: {
          50: '#FFF6E5',
          100: '#FDE3B0',
          400: '#F8B84A',
          500: '#F5A524',
          600: '#C9860B',
          700: '#9A6508',
        },
        sidebar: { DEFAULT: '#160524', light: '#310E50' },
        ink: '#200B33',
        mist: '#FAF4FF',
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Figtree', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'chat-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: { 'chat-in': 'chat-in 180ms ease-out' },
    },
  },
  plugins: [],
}