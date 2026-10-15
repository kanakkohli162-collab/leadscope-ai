/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Azure (matches the landing page "deep ocean" theme)
        primary: {
          50: '#E6F5FE',
          100: '#CDEBFD',
          200: '#9BD7FB',
          300: '#68C2F9',
          400: '#3FB2F8',
          500: '#22A6F7',
          600: '#0497F6',
          700: '#0080DD',
          800: '#0067B3',
          900: '#004E88',
        },
        // Remapped for a DARK UI: low numbers = dark surfaces, high numbers = light text
        slate: {
          50: '#01081A',
          100: '#001C36',
          200: '#1B4C74',
          300: '#2A5F8A',
          400: '#6F8FAA',
          500: '#9DB8CF',
          600: '#B5CBDD',
          700: '#CFDEEA',
          800: '#E6F1F7',
          900: '#F3F8FB',
          950: '#FFFFFF',
        },
        marigold: {
          50: '#FFF6E5',
          100: '#FDE3B0',
          400: '#F8B84A',
          500: '#F5A524',
          600: '#C9860B',
          700: '#9A6508',
        },
        abyss: '#01081A',   // page background
        deepsea: '#001C36', // sidebar, topbar, panels
        card: '#113E62',    // cards, tables, inputs, menus, modals
        inset: '#0B3354',   // boxes inside cards
        line: '#1B4C74',    // borders, dividers, chart grid
        aqua: { DEFAULT: '#4EB9E5', light: '#75DFFF' }, // glow, accents, active states
        sidebar: { DEFAULT: '#001C36', light: '#113E62' },
        ink: '#E6F1F7',
        mist: '#0B3354',
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
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: { 'chat-in': 'chat-in 180ms ease-out', 'fade-up': 'fade-up 450ms ease-out backwards' },
    },
  },
  plugins: [],
}