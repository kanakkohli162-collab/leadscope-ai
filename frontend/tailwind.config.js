/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Electric blue (from the reference design)
        primary: {
          50: '#F4F6FF',
          100: '#E4EAFF',
          200: '#C9D6FF',
          300: '#9FB7FF',
          400: '#6F92FF',
          500: '#4A7BFF',
          600: '#2F6BFF',
          700: '#1F55E6',
          800: '#1A3FB8',
          900: '#0E1550',
        },
        marigold: {
          50: '#FFF6E5',
          100: '#FDE3B0',
          400: '#F8B84A',
          500: '#F5A524',
          600: '#C9860B',
          700: '#9A6508',
        },
        sidebar: { DEFAULT: '#FFFFFF', light: '#F4F6FF' },
        ink: '#0B1033',
        mist: '#F4F6FF',
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